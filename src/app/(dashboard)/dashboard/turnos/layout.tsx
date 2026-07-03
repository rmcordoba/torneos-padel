import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActiveMembership } from "@/lib/active-organizer";
import { hasBookings } from "@/lib/subscription";

const ACCENT = "#a3e635";

export default async function TurnosLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await getActiveMembership(session.user.id);
  if (!membership) redirect("/dashboard");

  // Feature flag: el módulo de reservas requiere un plan que lo incluya.
  if (!(await hasBookings(membership.organizerId))) {
    return (
      <div style={{ maxWidth: 560, margin: "48px auto", textAlign: "center" }}>
        <div style={{
          borderRadius: 18, padding: "40px 32px",
          background: "rgba(163,230,53,0.06)",
          border: "1px solid rgba(163,230,53,0.2)",
        }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🎾</div>
          <h1 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 22, fontWeight: 800, color: "#f8fafc", marginBottom: 8 }}>
            Reservas de canchas
          </h1>
          <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 24, lineHeight: 1.6 }}>
            El módulo de turnos para alquiler de canchas está disponible en el plan <strong style={{ color: ACCENT }}>Pro</strong>.
            Mejorá tu plan para gestionar reservas, turnos fijos, precios por franja y reportes de ocupación.
          </p>
          <Link
            href="/dashboard/facturacion"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              height: 44, padding: "0 24px", borderRadius: 12,
              background: ACCENT, color: "#0a0f0a", fontSize: 14, fontWeight: 800,
              textDecoration: "none", fontFamily: "var(--font-space), sans-serif",
            }}
          >
            Ver planes y facturación →
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
