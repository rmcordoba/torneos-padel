import { prisma } from "@/lib/prisma";
import { sendSubscriptionEmail } from "@/lib/email";

/** Asegura que exista una Subscription para el organizer; si no, la crea con el plan default. */
export async function ensureSubscription(organizerId: string) {
  const existing = await prisma.subscription.findUnique({ where: { organizerId } });
  if (existing) return existing;
  const plan =
    (await prisma.plan.findFirst({ where: { isDefault: true } })) ??
    (await prisma.plan.findFirst({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }));
  if (!plan) throw new Error("No hay planes configurados");
  return prisma.subscription.create({
    data: { organizerId, planId: plan.id, status: "TRIALING", trialEndsAt: new Date() },
  });
}

export type ApplyPaymentInput = {
  organizerId: string;
  planId?: string;
  amount: number;
  months: number;
  method: string; // "manual" | "transferencia" | "efectivo" | "mercadopago"
  mpPaymentId?: string;
  notes?: string | null;
  recordedByUserId?: string | null;
};

/**
 * Aplica un pago a la suscripción de un club: extiende el período (a partir del
 * mayor entre el período actual vigente y ahora), deja la suscripción ACTIVE y
 * registra el SubscriptionPayment. Idempotente por `mpPaymentId` (reintentos de
 * webhook). Lo usan tanto el cobro manual (admin) como el webhook de Mercado Pago.
 */
export async function applyPayment(input: ApplyPaymentInput): Promise<{ applied: boolean }> {
  const { organizerId, planId, amount, months, method, mpPaymentId, notes, recordedByUserId } = input;

  // Idempotencia: si ya procesamos este pago de MP, no hacer nada.
  if (mpPaymentId) {
    const dup = await prisma.subscriptionPayment.findUnique({ where: { mpPaymentId } });
    if (dup) return { applied: false };
  }

  const sub = await ensureSubscription(organizerId);

  const now = new Date();
  const base = sub.currentPeriodEnd && sub.currentPeriodEnd > now ? sub.currentPeriodEnd : now;
  const periodStart = base;
  const periodEnd = new Date(base);
  periodEnd.setMonth(periodEnd.getMonth() + Math.max(1, months));

  await prisma.$transaction([
    prisma.subscriptionPayment.create({
      data: {
        subscriptionId: sub.id,
        amount,
        periodStart,
        periodEnd,
        method,
        mpPaymentId: mpPaymentId ?? null,
        notes: notes ?? null,
        recordedByUserId: recordedByUserId ?? null,
      },
    }),
    prisma.subscription.update({
      where: { organizerId },
      data: {
        status: "ACTIVE",
        currentPeriodEnd: periodEnd,
        canceledAt: null,
        ...(planId ? { planId } : {}),
      },
    }),
  ]);

  // Confirmación de pago a los OWNER del club (best-effort, no bloquea).
  try {
    const org = await prisma.organizer.findUnique({
      where: { id: organizerId },
      select: { name: true, members: { where: { role: "OWNER", isActive: true }, select: { user: { select: { email: true } } } } },
    });
    const to = org?.members.map((m) => m.user.email).filter(Boolean) ?? [];
    if (org && to.length > 0) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      await sendSubscriptionEmail({
        to,
        organizerName: org.name,
        variant: "payment_ok",
        periodEndLabel: periodEnd.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }),
        billingUrl: `${appUrl}/dashboard/facturacion`,
      });
    }
  } catch (e) {
    console.error("[billing] payment confirmation email failed:", e);
  }

  return { applied: true };
}
