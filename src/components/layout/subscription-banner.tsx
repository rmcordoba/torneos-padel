import Link from "next/link";
import type { BillingState } from "@/lib/subscription";

/** Barra de aviso de estado de suscripción. No renderiza nada si todo está al día. */
export function SubscriptionBanner({ state }: { state: BillingState }) {
  const { display, daysLeft } = state;

  let cfg: { bg: string; border: string; color: string; text: string } | null = null;

  if (display === "trialing") {
    const d = daysLeft ?? 0;
    // Solo avisar cuando el trial está por terminar (<= 7 días).
    if (d <= 7) {
      cfg = {
        bg: "rgba(56,189,248,0.10)", border: "rgba(56,189,248,0.25)", color: "#7dd3fc",
        text: `Prueba gratis: te queda${d === 1 ? "" : "n"} ${Math.max(d, 0)} día${d === 1 ? "" : "s"}. Activá un plan para no perder el acceso.`,
      };
    }
  } else if (display === "grace") {
    const overdue = Math.abs(Math.min(daysLeft ?? 0, 0));
    cfg = {
      bg: "rgba(249,115,22,0.10)", border: "rgba(249,115,22,0.28)", color: "#fdba74",
      text: `Tu suscripción venció hace ${overdue} día${overdue === 1 ? "" : "s"}. Regularizá el pago para no entrar en modo solo lectura.`,
    };
  } else if (display === "expired") {
    cfg = {
      bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.30)", color: "#fca5a5",
      text: "Suscripción vencida — el panel está en modo solo lectura. Renová el pago para volver a editar.",
    };
  } else if (display === "canceled") {
    cfg = {
      bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.30)", color: "#fca5a5",
      text: "Suscripción cancelada — el panel está en modo solo lectura.",
    };
  }

  if (!cfg) return null;

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      padding: "10px 32px", background: cfg.bg, borderBottom: `1px solid ${cfg.border}`,
      flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{cfg.text}</span>
      <Link
        href="/dashboard/facturacion"
        style={{
          fontSize: 12, fontWeight: 800, color: cfg.color, textDecoration: "none",
          border: `1px solid ${cfg.border}`, padding: "5px 12px", borderRadius: 100, whiteSpace: "nowrap",
        }}
      >
        Ver facturación →
      </Link>
    </div>
  );
}
