"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/active-organizer";
import { mpConfigured, createPreference } from "@/lib/mercadopago";

/**
 * Crea una preferencia de Checkout Pro para que el club pague N meses de su plan.
 * Devuelve el link de pago de Mercado Pago. El monto se calcula en el servidor.
 */
export async function createCheckoutPreference(
  planId: string,
  months: number
): Promise<{ url?: string; error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };
  if (!mpConfigured()) return { error: "Mercado Pago no está configurado" };

  const membership = await getActiveMembership(session.user.id);
  if (!membership) return { error: "Sin organización" };

  const plan = await prisma.plan.findFirst({ where: { id: planId, isActive: true } });
  if (!plan) return { error: "Plan inválido" };

  const safeMonths = Math.max(1, Math.min(12, Math.floor(months) || 1));
  const amount = Number(plan.priceMonthly) * safeMonths;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const pref = await createPreference({
      title: `Suscripción ${plan.name} — ${safeMonths} ${safeMonths === 1 ? "mes" : "meses"}`,
      amount,
      externalReference: `${membership.organizerId}:${plan.id}:${safeMonths}`,
      notificationUrl: `${appUrl}/api/webhooks/mercadopago`,
      successUrl: `${appUrl}/dashboard/facturacion?pago=ok`,
      failureUrl: `${appUrl}/dashboard/facturacion?pago=fail`,
    });
    return { url: pref.init_point };
  } catch {
    return { error: "No se pudo iniciar el pago. Intentá de nuevo en unos minutos." };
  }
}
