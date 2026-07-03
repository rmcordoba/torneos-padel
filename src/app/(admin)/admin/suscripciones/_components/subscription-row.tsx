"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignPlan, setTrial, cancelSubscription, registerPayment } from "@/modules/admin/actions";

const ACCENT = "#a3e635";

const BADGE: Record<string, { label: string; color: string; bg: string }> = {
  trialing: { label: "En prueba",        color: "#7dd3fc", bg: "rgba(56,189,248,0.12)" },
  active:   { label: "Activa",           color: ACCENT,    bg: "rgba(163,230,53,0.12)" },
  grace:    { label: "Vencida (gracia)", color: "#fdba74", bg: "rgba(249,115,22,0.12)" },
  expired:  { label: "Vencida",          color: "#fca5a5", bg: "rgba(239,68,68,0.12)" },
  canceled: { label: "Cancelada",        color: "#fca5a5", bg: "rgba(239,68,68,0.12)" },
  none:     { label: "Sin suscripción",  color: "#94a3b8", bg: "rgba(255,255,255,0.06)" },
};

type PlanOption = { id: string; name: string; hasBookingsModule: boolean };

export function SubscriptionRow({
  organizerId, organizerName, planId, planName, display, writable, expiresAt, plans,
}: {
  organizerId: string;
  organizerName: string;
  planId: string | null;
  planName: string | null;
  display: string;
  writable: boolean;
  expiresAt: string | null;
  plans: PlanOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const badge = BADGE[display] ?? BADGE.none;
  const fmt = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const run = (fn: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      const r = await fn();
      if (r?.error) alert(r.error);
      router.refresh();
    });

  const onPayment = (formData: FormData) =>
    startTransition(async () => {
      const r = await registerPayment(organizerId, formData);
      if (r?.error) alert(r.error);
      else setOpen(false);
      router.refresh();
    });

  const inputStyle: React.CSSProperties = {
    height: 34, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)", color: "#e2e8f0", fontSize: 13, padding: "0 10px", boxSizing: "border-box",
  };

  return (
    <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(10,20,42,0.5)", padding: 16, opacity: isPending ? 0.6 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>{organizerName}</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            {planName ?? "—"} · vence {fmt(expiresAt)} · {writable ? "editable" : "solo lectura"}
          </div>
        </div>

        <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 100, background: badge.bg, color: badge.color }}>
          {badge.label}
        </span>

        {/* Asignar plan */}
        <select
          value={planId ?? ""}
          onChange={(e) => run(() => assignPlan(organizerId, e.target.value))}
          disabled={isPending}
          style={{ ...inputStyle, minWidth: 130 }}
        >
          <option value="" disabled>Plan…</option>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <button onClick={() => setOpen((o) => !o)} disabled={isPending}
          style={{ height: 34, padding: "0 14px", borderRadius: 8, border: "none", background: ACCENT, color: "#0a0f0a", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Registrar pago
        </button>
        <button onClick={() => run(() => setTrial(organizerId, 14))} disabled={isPending}
          style={{ height: 34, padding: "0 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#94a3b8", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Trial 14d
        </button>
        <button onClick={() => { if (confirm("¿Cancelar la suscripción de este club?")) run(() => cancelSubscription(organizerId)); }} disabled={isPending}
          style={{ height: 34, padding: "0 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#fca5a5", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Cancelar
        </button>
      </div>

      {open && (
        <form action={onPayment} style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap", alignItems: "flex-end" }}>
          <label style={{ fontSize: 11, color: "#64748b", display: "flex", flexDirection: "column", gap: 4 }}>
            Monto (ARS)
            <input name="amount" type="number" min="0" step="any" required style={{ ...inputStyle, width: 120 }} />
          </label>
          <label style={{ fontSize: 11, color: "#64748b", display: "flex", flexDirection: "column", gap: 4 }}>
            Meses
            <input name="months" type="number" min="1" defaultValue={1} required style={{ ...inputStyle, width: 80 }} />
          </label>
          <label style={{ fontSize: 11, color: "#64748b", display: "flex", flexDirection: "column", gap: 4 }}>
            Método
            <input name="method" defaultValue="transferencia" style={{ ...inputStyle, width: 140 }} />
          </label>
          <label style={{ fontSize: 11, color: "#64748b", display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 160 }}>
            Notas
            <input name="notes" style={{ ...inputStyle, width: "100%" }} />
          </label>
          <button type="submit" disabled={isPending}
            style={{ height: 34, padding: "0 16px", borderRadius: 8, border: "none", background: ACCENT, color: "#0a0f0a", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Confirmar pago
          </button>
        </form>
      )}
    </div>
  );
}
