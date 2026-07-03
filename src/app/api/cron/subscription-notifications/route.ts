import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { effectiveState, GRACE_DAYS } from "@/lib/subscription";
import { sendSubscriptionEmail, type SubscriptionEmailVariant } from "@/lib/email";
import { isCronAuthorized } from "@/lib/cron-auth";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Dunning de suscripciones — corre UNA vez por día (cron diario).
 * Envía avisos por email a los OWNER de cada club según el estado de su suscripción:
 *  - trial por vencer (3 y 1 día antes)
 *  - vencido en gracia (1 día después del vencimiento)
 *  - modo solo lectura (primer día pasada la gracia)
 *
 * Programar (ej. Vercel Cron en vercel.json):
 *   { "path": "/api/cron/subscription-notifications", "schedule": "0 13 * * *" }  // 10:00 ART
 * Protegido con CRON_SECRET vía header  Authorization: Bearer <CRON_SECRET>
 * (obligatorio en producción; ver src/lib/cron-auth.ts).
 */
export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const billingUrl = `${appUrl}/dashboard/facturacion`;

  const subs = await prisma.subscription.findMany({
    include: {
      plan: true,
      organizer: {
        select: {
          name: true,
          members: { where: { role: "OWNER", isActive: true }, select: { user: { select: { email: true } } } },
        },
      },
    },
  });

  let sent = 0;
  const results: { organizer: string; variant: string }[] = [];

  for (const sub of subs) {
    const state = effectiveState(sub);
    const d = state.daysLeft; // ceil((vencimiento - hoy)/día): negativo si ya venció
    if (d === null) continue;

    let variant: SubscriptionEmailVariant | null = null;
    let days = 0;

    if (state.display === "trialing" && (d === 3 || d === 1)) {
      variant = "trial_ending";
      days = d;
    } else if (state.display === "grace" && d === -1) {
      variant = "grace";
      days = GRACE_DAYS + d; // días de gracia restantes
    } else if (state.display === "expired" && d === -(GRACE_DAYS + 1)) {
      variant = "read_only";
    }

    if (!variant) continue;

    const to = sub.organizer.members.map((m) => m.user.email).filter(Boolean);
    if (to.length === 0) continue;

    // Un email que falla no aborta el resto de los avisos
    try {
      await sendSubscriptionEmail({ to, organizerName: sub.organizer.name, variant, days, billingUrl });
      sent++;
      results.push({ organizer: sub.organizer.name, variant });
    } catch (e) {
      logError("cron:subscription-notifications", e, { organizer: sub.organizer.name, variant });
    }
  }

  return NextResponse.json({ ok: true, sent, results });
}
