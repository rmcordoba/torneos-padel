import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/active-organizer";
import { getSubscription, getBillingState } from "@/lib/subscription";
import { mpConfigured } from "@/lib/mercadopago";
import { MpCheckout } from "./_components/mp-checkout";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Facturación" };

const ACCENT = "#a3e635";

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  trialing: { label: "En prueba",        color: "#7dd3fc", bg: "rgba(56,189,248,0.12)" },
  active:   { label: "Activa",           color: ACCENT,    bg: "rgba(163,230,53,0.12)" },
  grace:    { label: "Vencida (gracia)", color: "#fdba74", bg: "rgba(249,115,22,0.12)" },
  expired:  { label: "Vencida",          color: "#fca5a5", bg: "rgba(239,68,68,0.12)" },
  canceled: { label: "Cancelada",        color: "#fca5a5", bg: "rgba(239,68,68,0.12)" },
  none:     { label: "Sin suscripción",  color: "#94a3b8", bg: "rgba(255,255,255,0.06)" },
};

const fmtDate = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) : "—";
const fmtMoney = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

const card: React.CSSProperties = {
  borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(10,20,42,0.5)", padding: 24,
};

export default async function FacturacionPage({
  searchParams,
}: {
  searchParams: Promise<{ pago?: string }>;
}) {
  const { pago } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await getActiveMembership(session.user.id);
  if (!membership) redirect("/dashboard");

  const orgId = membership.organizerId;
  const [sub, state, plans] = await Promise.all([
    getSubscription(orgId),
    getBillingState(orgId),
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const payments = sub
    ? await prisma.subscriptionPayment.findMany({
        where: { subscriptionId: sub.id },
        orderBy: { paidAt: "desc" },
        take: 24,
      })
    : [];

  const badge = STATUS_BADGE[state.display] ?? STATUS_BADGE.none;
  const transferInfo = process.env.BILLING_TRANSFER_INFO
    ?? "Coordiná el pago con el administrador de la plataforma (transferencia bancaria). Una vez acreditado, tu suscripción se renueva.";

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 26, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.02em" }}>
          Facturación
        </h1>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Plan, estado de la suscripción y pagos de tu club.</p>
      </div>

      {pago === "ok" && (
        <div style={{ borderRadius: 12, background: "rgba(163,230,53,0.1)", border: "1px solid rgba(163,230,53,0.25)", padding: "12px 16px", fontSize: 13, fontWeight: 600, color: ACCENT }}>
          ✅ Pago recibido. La acreditación puede tardar unos minutos; tu suscripción se renueva automáticamente al confirmarse.
        </div>
      )}
      {pago === "fail" && (
        <div style={{ borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", padding: "12px 16px", fontSize: 13, fontWeight: 600, color: "#fca5a5" }}>
          El pago no se completó. Podés intentar de nuevo abajo.
        </div>
      )}

      {/* Estado actual */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Plan actual</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif" }}>
              {state.planName ?? "—"}
            </p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, padding: "5px 12px", borderRadius: 100, background: badge.bg, color: badge.color }}>
            {badge.label}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 20 }}>
          <div>
            <p style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>{state.display === "trialing" ? "Fin de la prueba" : "Vence"}</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#cbd5e1" }}>{fmtDate(state.expiresAt)}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>Módulo de reservas</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: state.hasBookings ? ACCENT : "#64748b" }}>
              {state.hasBookings ? "Incluido" : "No incluido"}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>Edición del panel</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: state.writable ? ACCENT : "#fca5a5" }}>
              {state.writable ? "Habilitada" : "Solo lectura"}
            </p>
          </div>
        </div>
      </div>

      {/* Cómo pagar */}
      <div style={{ ...card, background: "rgba(163,230,53,0.05)", border: "1px solid rgba(163,230,53,0.18)" }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: ACCENT, marginBottom: 8 }}>Cómo renovar tu suscripción</p>
        <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, whiteSpace: "pre-line" }}>{transferInfo}</p>
      </div>

      {/* Pago online (Mercado Pago) */}
      <MpCheckout
        configured={mpConfigured()}
        currentPlanId={sub?.planId ?? null}
        plans={plans.map((p) => ({ id: p.id, name: p.name, priceMonthly: Number(p.priceMonthly) }))}
      />

      {/* Planes */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 800, color: "#f1f5f9", marginBottom: 12 }}>Planes disponibles</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {plans.map((p) => {
            const current = sub?.planId === p.id;
            return (
              <div key={p.id} style={{
                ...card, padding: 20,
                border: current ? `1px solid ${ACCENT}` : "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif" }}>{p.name}</span>
                  {current && <span style={{ fontSize: 10, fontWeight: 800, color: ACCENT }}>TU PLAN</span>}
                </div>
                <p style={{ fontSize: 22, fontWeight: 900, color: ACCENT, fontFamily: "var(--font-space), sans-serif" }}>
                  {fmtMoney(Number(p.priceMonthly))}<span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>/mes</span>
                </p>
                <p style={{ fontSize: 12, color: p.hasBookingsModule ? "#cbd5e1" : "#64748b", marginTop: 10 }}>
                  {p.hasBookingsModule ? "✓ Incluye reservas de canchas" : "✗ Sin módulo de reservas"}
                </p>
                <p style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4 }}>✓ Torneos, inscripciones, ranking, sitio público</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historial de pagos */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 800, color: "#f1f5f9", marginBottom: 12 }}>Historial de pagos</p>
        {payments.length === 0 ? (
          <div style={{ ...card, textAlign: "center", color: "#64748b", fontSize: 13 }}>Todavía no hay pagos registrados.</div>
        ) : (
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  {["Fecha", "Período", "Monto", "Método"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "10px 16px", color: "#cbd5e1" }}>{fmtDate(p.paidAt)}</td>
                    <td style={{ padding: "10px 16px", color: "#94a3b8" }}>{fmtDate(p.periodStart)} → {fmtDate(p.periodEnd)}</td>
                    <td style={{ padding: "10px 16px", color: "#f1f5f9", fontWeight: 700 }}>{fmtMoney(Number(p.amount))}</td>
                    <td style={{ padding: "10px 16px", color: "#64748b" }}>{p.method ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
