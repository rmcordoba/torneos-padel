import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const TRIAL_DAYS = 14;
export const GRACE_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Suscripción del club con su plan. Cacheado por request. */
export const getSubscription = cache(async (organizerId: string) => {
  return prisma.subscription.findUnique({
    where: { organizerId },
    include: { plan: true },
  });
});

export type BillingDisplay = "trialing" | "active" | "grace" | "expired" | "canceled" | "none";

export type BillingState = {
  writable: boolean;
  display: BillingDisplay;
  expiresAt: Date | null;
  inGrace: boolean;
  daysLeft: number | null; // días hasta expiresAt (negativo si ya venció)
  hasBookings: boolean;
  planName: string | null;
};

type SubWithPlan = NonNullable<Awaited<ReturnType<typeof getSubscription>>>;

/**
 * Estado "efectivo" calculado por fechas (sin cron). Determina si el club puede
 * escribir (dashboard) y qué mostrar en banners/página de facturación.
 */
export function effectiveState(sub: SubWithPlan | null): BillingState {
  // Defensivo: sin suscripción no se bloquea la escritura (no lockear por error),
  // pero tampoco se habilita el módulo premium.
  if (!sub) {
    return { writable: true, display: "none", expiresAt: null, inGrace: false, daysLeft: null, hasBookings: false, planName: null };
  }

  const hasBookings = sub.plan.hasBookingsModule;
  const planName = sub.plan.name;
  const now = Date.now();

  if (sub.status === "CANCELED") {
    return { writable: false, display: "canceled", expiresAt: sub.canceledAt, inGrace: false, daysLeft: null, hasBookings, planName };
  }

  const expiresAt = sub.status === "TRIALING" ? sub.trialEndsAt : sub.currentPeriodEnd;

  // Sin fecha de vencimiento → tratar como vigente (defensivo).
  if (!expiresAt) {
    return { writable: true, display: sub.status === "TRIALING" ? "trialing" : "active", expiresAt: null, inGrace: false, daysLeft: null, hasBookings, planName };
  }

  const exp = expiresAt.getTime();
  const graceEnd = exp + GRACE_DAYS * DAY_MS;
  const daysLeft = Math.ceil((exp - now) / DAY_MS);

  if (now <= exp) {
    return { writable: true, display: sub.status === "TRIALING" ? "trialing" : "active", expiresAt, inGrace: false, daysLeft, hasBookings, planName };
  }
  if (now <= graceEnd) {
    return { writable: true, display: "grace", expiresAt, inGrace: true, daysLeft, hasBookings, planName };
  }
  return { writable: false, display: "expired", expiresAt, inGrace: false, daysLeft, hasBookings, planName };
}

/** Estado de facturación del club (para banners y página de facturación). */
export async function getBillingState(organizerId: string): Promise<BillingState> {
  return effectiveState(await getSubscription(organizerId));
}

/** ¿El club puede realizar escrituras en el dashboard? */
export async function canWrite(organizerId: string): Promise<boolean> {
  return (await getBillingState(organizerId)).writable;
}

/** ¿El plan del club incluye el módulo de reservas/turnos? */
export async function hasBookings(organizerId: string): Promise<boolean> {
  return (await getBillingState(organizerId)).hasBookings;
}
