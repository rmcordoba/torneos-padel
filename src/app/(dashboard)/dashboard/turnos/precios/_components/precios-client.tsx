"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, DollarSign, Check, Loader2, AlertCircle, CheckCircle2, Plus, Trash2, Clock } from "lucide-react";
import { savePriceRules, type PriceRulesState } from "@/modules/bookings/actions";

const ACCENT = "#a3e635";

interface Band { startMinute: number; endMinute: number; pricePerHour: number }
interface Venue { id: string; name: string; priceRules: Band[] }

// Opciones de hora cada 30 min (00:00 .. 24:00)
const TIME_OPTS = Array.from({ length: 24 * 2 + 1 }, (_, i) => i * 30);

function labelTime(min: number) {
  if (min >= 1440) return "24:00";
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}
function money(n: number) {
  return `$${Math.round(n).toLocaleString("es-AR")}`;
}

export function PreciosClient({ venues, activeVenueId }: { venues: Venue[]; activeVenueId: string | null }) {
  const router = useRouter();

  if (venues.length === 0) {
    return (
      <div style={{ maxWidth: 560, margin: "60px auto", textAlign: "center" }}>
        <DollarSign size={36} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
        <h2 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 20, fontWeight: 800, color: "#f8fafc", marginBottom: 8 }}>Sin sedes</h2>
        <p style={{ fontSize: 14, color: "#475569", marginBottom: 20 }}>Creá una sede para configurar sus precios.</p>
        <Link href="/dashboard/sedes/nueva" style={{ color: ACCENT, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>+ Nueva sede</Link>
      </div>
    );
  }

  const venue = venues.find((v) => v.id === activeVenueId) ?? venues[0];

  return (
    <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <Link href="/dashboard/turnos" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#475569", textDecoration: "none", marginBottom: 12 }}>
          <ChevronLeft size={14} /> Turnos
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <DollarSign size={24} color={ACCENT} />
          <h1 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 28, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.02em", lineHeight: 1 }}>
            Precios por franja
          </h1>
        </div>
        <p style={{ fontSize: 13, color: "#475569" }}>
          Definí una tarifa <strong style={{ color: "#94a3b8" }}>por hora</strong> para cada franja horaria. El turno se cobra prorrateado:
          media hora vale la mitad, y si cruza dos franjas se suma la porción de cada una. Aplica a todas las canchas de la sede.
        </p>
      </div>

      {/* Selector de sede */}
      {venues.length > 1 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {venues.map((v) => {
            const active = v.id === venue.id;
            return (
              <button key={v.id} onClick={() => router.push(`/dashboard/turnos/precios?venue=${v.id}`)} style={{
                padding: "8px 16px", borderRadius: 100, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit",
                background: active ? ACCENT : "rgba(255,255,255,0.05)", color: active ? "#080e1a" : "#64748b",
                boxShadow: active ? "0 0 16px rgba(163,230,53,0.25)" : "none",
              }}>{v.name}</button>
            );
          })}
        </div>
      )}

      <PriceForm key={venue.id} venue={venue} onSaved={() => router.refresh()} />
    </div>
  );
}

function PriceForm({ venue, onSaved }: { venue: Venue; onSaved: () => void }) {
  const [state, action, pending] = useActionState<PriceRulesState, FormData>(savePriceRules, null);
  const [rows, setRows] = useState<Band[]>(
    venue.priceRules.length
      ? venue.priceRules.map((r) => ({ ...r }))
      : [{ startMinute: 8 * 60, endMinute: 18 * 60, pricePerHour: 0 }],
  );

  useEffect(() => {
    if (state && "ok" in state) onSaved();
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (i: number, patch: Partial<Band>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));
  const add = () => setRows((rs) => {
    const last = rs[rs.length - 1];
    const start = last ? Math.min(last.endMinute, 23 * 60) : 8 * 60;
    return [...rs, { startMinute: start, endMinute: Math.min(start + 4 * 60, 24 * 60), pricePerHour: last?.pricePerHour ?? 0 }];
  });

  const err = state && "error" in state ? state.error : null;
  const ok = state && "ok" in state;

  return (
    <form action={action} style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(12,20,40,0.7)", backdropFilter: "blur(16px)", overflow: "hidden" }}>
      <input type="hidden" name="venueId" value={venue.id} />
      <input type="hidden" name="bands" value={JSON.stringify(rows)} />

      {(err || ok) && (
        <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {err ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#fb7185" }}>
              <AlertCircle size={15} /> {err}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: ACCENT }}>
              <CheckCircle2 size={15} /> Precios guardados.
            </div>
          )}
        </div>
      )}

      {/* Encabezado de columnas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr 150px 40px", gap: 12, padding: "12px 20px 6px", alignItems: "center" }}>
        {["Desde", "Hasta", "Precio por hora", "Media hora", ""].map((h, i) => (
          <span key={i} style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
        ))}
      </div>

      {/* Filas de franjas */}
      <div>
        {rows.length === 0 && (
          <div style={{ padding: "24px 20px", textAlign: "center", fontSize: 13, color: "#475569" }}>
            Sin franjas. Agregá una para definir el precio.
          </div>
        )}
        {rows.map((row, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr 150px 40px", gap: 12, alignItems: "center",
            padding: "10px 20px", borderTop: "1px solid rgba(255,255,255,0.05)",
          }}>
            <TimeSelect value={row.startMinute} onChange={(v) => set(i, { startMinute: v })} />
            <TimeSelect value={row.endMinute} onChange={(v) => set(i, { endMinute: v })} />
            <div style={{ position: "relative" }}>
              <DollarSign size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
              <input
                type="number" min={0} step="500" value={row.pricePerHour || ""}
                onChange={(e) => set(i, { pricePerHour: Number(e.target.value) })}
                placeholder="0"
                style={{ width: "100%", height: 36, padding: "0 10px 0 26px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", color: "#e2e8f0", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
            <span style={{ fontSize: 12, color: row.pricePerHour ? ACCENT : "#334155", fontWeight: 700, fontFamily: "var(--font-space), sans-serif" }}>
              {row.pricePerHour ? money(row.pricePerHour / 2) : "—"}
            </span>
            <button type="button" onClick={() => remove(i)} title="Eliminar franja" style={{
              width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 8, cursor: "pointer",
              border: "1px solid rgba(244,63,94,0.2)", background: "rgba(244,63,94,0.08)", color: "#fb7185",
            }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button type="button" onClick={add} style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, cursor: "pointer",
          border: "1px dashed rgba(163,230,53,0.4)", background: "rgba(163,230,53,0.08)", color: ACCENT, fontSize: 12, fontWeight: 800, fontFamily: "inherit",
        }}>
          <Plus size={14} /> Agregar franja
        </button>
      </div>

      <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontSize: 11, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
          <Clock size={12} /> Los minutos sin franja usan el precio base de cada cancha.
        </span>
        <button type="submit" disabled={pending} style={{
          display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 22px", borderRadius: 10, border: "none",
          background: ACCENT, color: "#080e1a", fontSize: 13, fontWeight: 800, cursor: pending ? "not-allowed" : "pointer",
          fontFamily: "inherit", boxShadow: "0 0 18px rgba(163,230,53,0.3)", opacity: pending ? 0.6 : 1,
        }}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Guardar precios
        </button>
      </div>
    </form>
  );
}

function TimeSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        height: 36, padding: "0 8px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.05)", color: "#e2e8f0", fontSize: 13, outline: "none",
        fontFamily: "inherit", cursor: "pointer", colorScheme: "dark", width: "100%",
      }}
    >
      {TIME_OPTS.map((m) => <option key={m} value={m} style={{ background: "#0f172a", color: "#e2e8f0" }}>{labelTime(m)}</option>)}
    </select>
  );
}
