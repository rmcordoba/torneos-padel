import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectiveState } from "@/lib/subscription";
import { SubscriptionRow } from "./_components/subscription-row";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Suscripciones · Admin" };

export default async function AdminSuscripcionesPage() {
  const session = await auth();
  if (session?.user?.systemRole !== "SUPER_ADMIN") redirect("/dashboard");

  const [organizers, plans] = await Promise.all([
    prisma.organizer.findMany({
      orderBy: { name: "asc" },
      include: { subscription: { include: { plan: true } } },
    }),
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const planOptions = plans.map((p) => ({ id: p.id, name: p.name, hasBookingsModule: p.hasBookingsModule }));

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 24, fontWeight: 900, color: "#f8fafc" }}>
          Suscripciones
        </h1>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
          Cobro manual: asigná plan, registrá pagos y gestioná el estado de cada club.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {organizers.map((org) => {
          const sub = org.subscription;
          const state = effectiveState(sub ?? null);
          return (
            <SubscriptionRow
              key={org.id}
              organizerId={org.id}
              organizerName={org.name}
              planId={sub?.planId ?? null}
              planName={state.planName}
              display={state.display}
              writable={state.writable}
              expiresAt={state.expiresAt ? state.expiresAt.toISOString() : null}
              plans={planOptions}
            />
          );
        })}
      </div>
    </div>
  );
}
