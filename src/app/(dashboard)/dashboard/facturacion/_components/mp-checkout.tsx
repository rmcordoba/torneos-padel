"use client";

import { useState, useTransition } from "react";
import { createCheckoutPreference } from "@/modules/billing/actions";

const ACCENT = "#a3e635";

type PlanOption = { id: string; name: string; priceMonthly: number };

const MONTH_OPTIONS = [1, 3, 6, 12];

export function MpCheckout({ plans, configured, currentPlanId }: {
  plans: PlanOption[];
  configured: boolean;
  currentPlanId: string | null;
}) {
  const [planId, setPlanId] = useState(currentPlanId ?? plans[0]?.id ?? "");
  const [months, setMonths] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const plan = plans.find((p) => p.id === planId);
  const total = plan ? plan.priceMonthly * months : 0;
  const fmt = (n: number) => n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

  if (!configured) {
    return (
      <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(10,20,42,0.5)", padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: "#94a3b8", marginBottom: 6 }}>Pago online con Mercado Pago</p>
        <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
          El pago online todavía no está habilitado. Por ahora coordiná el pago por transferencia (ver arriba).
        </p>
      </div>
    );
  }

  const select: React.CSSProperties = {
    height: 40, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)", color: "#e2e8f0", fontSize: 14, padding: "0 12px", boxSizing: "border-box",
  };

  function pay() {
    setError(null);
    startTransition(async () => {
      const r = await createCheckoutPreference(planId, months);
      if (r.url) window.location.href = r.url;
      else setError(r.error ?? "No se pudo iniciar el pago.");
    });
  }

  return (
    <div style={{ borderRadius: 16, border: "1px solid rgba(56,189,248,0.22)", background: "rgba(56,189,248,0.05)", padding: 20 }}>
      <p style={{ fontSize: 13, fontWeight: 800, color: "#38bdf8", marginBottom: 14 }}>Pagar online con Mercado Pago</p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <label style={{ fontSize: 11, color: "#64748b", display: "flex", flexDirection: "column", gap: 6 }}>
          Plan
          <select value={planId} onChange={(e) => setPlanId(e.target.value)} style={{ ...select, minWidth: 140 }}>
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — {fmt(p.priceMonthly)}/mes</option>)}
          </select>
        </label>
        <label style={{ fontSize: 11, color: "#64748b", display: "flex", flexDirection: "column", gap: 6 }}>
          Período
          <select value={months} onChange={(e) => setMonths(Number(e.target.value))} style={{ ...select, minWidth: 110 }}>
            {MONTH_OPTIONS.map((m) => <option key={m} value={m}>{m} {m === 1 ? "mes" : "meses"}</option>)}
          </select>
        </label>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 11, color: "#64748b" }}>Total</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif" }}>{fmt(total)}</div>
        </div>
        <button
          onClick={pay}
          disabled={isPending || !plan}
          style={{
            height: 40, padding: "0 20px", borderRadius: 10, border: "none",
            background: ACCENT, color: "#0a0f0a", fontSize: 14, fontWeight: 800,
            cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.6 : 1,
            fontFamily: "var(--font-space), sans-serif",
          }}
        >
          {isPending ? "Redirigiendo…" : "Pagar con Mercado Pago"}
        </button>
      </div>

      {error && <p style={{ fontSize: 12, color: "#f87171", marginTop: 10 }}>{error}</p>}
    </div>
  );
}
