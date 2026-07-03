"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Clock, Check, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { saveVenueSchedules, type ScheduleConfigState } from "@/modules/bookings/actions";

const ACCENT = "#a3e635";
const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
// Orden de visualización: lunes → domingo
const ORDER = [1, 2, 3, 4, 5, 6, 0];

interface ScheduleRow { weekday: number; openMinute: number; closeMinute: number; slotMinutes: number; isClosed: boolean }
interface Venue { id: string; name: string; schedules: ScheduleRow[] }

const DEFAULT_ROW = { openMinute: 8 * 60, closeMinute: 23 * 60, slotMinutes: 90, isClosed: false };

// Opciones de hora de 06:00 a 24:00 cada 30 min
const OPEN_OPTS = Array.from({ length: (23 - 6) * 2 + 1 }, (_, i) => 6 * 60 + i * 30);     // 06:00 .. 23:00
const CLOSE_OPTS = Array.from({ length: (24 - 7) * 2 + 1 }, (_, i) => 7 * 60 + i * 30);    // 07:00 .. 24:00

export function HorariosClient({ venues, activeVenueId }: { venues: Venue[]; activeVenueId: string | null }) {
  const router = useRouter();

  if (venues.length === 0) {
    return (
      <div style={{ maxWidth: 560, margin: "60px auto", textAlign: "center" }}>
        <Clock size={36} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
        <h2 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 20, fontWeight: 800, color: "#f8fafc", marginBottom: 8 }}>Sin sedes</h2>
        <p style={{ fontSize: 14, color: "#475569", marginBottom: 20 }}>Creá una sede para configurar sus horarios.</p>
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
          <Clock size={24} color={ACCENT} />
          <h1 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 28, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.02em", lineHeight: 1 }}>
            Horarios de atención
          </h1>
        </div>
        <p style={{ fontSize: 13, color: "#475569" }}>Definen qué turnos se generan en la grilla. Sin configurar, se usa 08:00–23:00 en turnos de 90 min.</p>
      </div>

      {/* Selector de sede */}
      {venues.length > 1 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {venues.map((v) => {
            const active = v.id === venue.id;
            return (
              <button key={v.id} onClick={() => router.push(`/dashboard/turnos/horarios?venue=${v.id}`)} style={{
                padding: "8px 16px", borderRadius: 100, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit",
                background: active ? ACCENT : "rgba(255,255,255,0.05)", color: active ? "#080e1a" : "#64748b",
                boxShadow: active ? "0 0 16px rgba(163,230,53,0.25)" : "none",
              }}>{v.name}</button>
            );
          })}
        </div>
      )}

      <ScheduleForm key={venue.id} venue={venue} onSaved={() => router.refresh()} />
    </div>
  );
}

function ScheduleForm({ venue, onSaved }: { venue: Venue; onSaved: () => void }) {
  const [state, action, pending] = useActionState<ScheduleConfigState, FormData>(saveVenueSchedules, null);

  // Estado por día (controlado), con fallback a default
  const initial: Record<number, ScheduleRow> = {};
  for (let wd = 0; wd < 7; wd++) {
    const found = venue.schedules.find((s) => s.weekday === wd);
    initial[wd] = found ?? { weekday: wd, ...DEFAULT_ROW };
  }
  const [rows, setRows] = useState<Record<number, ScheduleRow>>(initial);

  useEffect(() => {
    if (state && "ok" in state) onSaved();
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (wd: number, patch: Partial<ScheduleRow>) =>
    setRows((r) => ({ ...r, [wd]: { ...r[wd], ...patch } }));

  const err = state && "error" in state ? state.error : null;
  const ok = state && "ok" in state;

  return (
    <form action={action} style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(12,20,40,0.7)", backdropFilter: "blur(16px)", overflow: "hidden" }}>
      <input type="hidden" name="venueId" value={venue.id} />

      {(err || ok) && (
        <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {err ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#fb7185" }}>
              <AlertCircle size={15} /> {err}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: ACCENT }}>
              <CheckCircle2 size={15} /> Horarios guardados.
            </div>
          )}
        </div>
      )}

      {/* Filas por día */}
      <div>
        {ORDER.map((wd, i) => {
          const row = rows[wd];
          return (
            <div key={wd} style={{
              display: "grid", gridTemplateColumns: "120px 100px 1fr 1fr 1fr", gap: 12, alignItems: "center",
              padding: "12px 20px", borderBottom: i < 6 ? "1px solid rgba(255,255,255,0.05)" : "none",
              opacity: row.isClosed ? 0.55 : 1,
            }}>
              {/* hidden inputs para el action */}
              {row.isClosed && <input type="hidden" name={`d${wd}_closed`} value="on" />}
              <input type="hidden" name={`d${wd}_open`} value={row.openMinute} />
              <input type="hidden" name={`d${wd}_close`} value={row.closeMinute} />
              <input type="hidden" name={`d${wd}_slot`} value={row.slotMinutes} />

              {/* Día */}
              <span style={{ fontSize: 14, fontWeight: 800, color: "#f1f5f9", fontFamily: "var(--font-space), sans-serif" }}>{DAYS[wd]}</span>

              {/* Abierto/cerrado */}
              <button type="button" onClick={() => set(wd, { isClosed: !row.isClosed })} style={{
                padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
                border: `1px solid ${row.isClosed ? "rgba(244,63,94,0.3)" : "rgba(163,230,53,0.3)"}`,
                background: row.isClosed ? "rgba(244,63,94,0.12)" : "rgba(163,230,53,0.12)",
                color: row.isClosed ? "#fb7185" : ACCENT,
              }}>
                {row.isClosed ? "Cerrado" : "Abierto"}
              </button>

              {/* Apertura */}
              <SelectField label="Abre" disabled={row.isClosed} value={row.openMinute} onChange={(v) => set(wd, { openMinute: v })} opts={OPEN_OPTS} />
              {/* Cierre */}
              <SelectField label="Cierra" disabled={row.isClosed} value={row.closeMinute} onChange={(v) => set(wd, { closeMinute: v })} opts={CLOSE_OPTS} />
              {/* Turno */}
              <SelectField label="Turno" disabled={row.isClosed} value={row.slotMinutes} onChange={(v) => set(wd, { slotMinutes: v })} opts={[60, 90, 120]} fmt={(m) => `${m} min`} />
            </div>
          );
        })}
      </div>

      <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" disabled={pending} style={{
          display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 22px", borderRadius: 10, border: "none",
          background: ACCENT, color: "#080e1a", fontSize: 13, fontWeight: 800, cursor: pending ? "not-allowed" : "pointer",
          fontFamily: "inherit", boxShadow: "0 0 18px rgba(163,230,53,0.3)", opacity: pending ? 0.6 : 1,
        }}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Guardar horarios
        </button>
      </div>
    </form>
  );
}

function SelectField({
  label, value, onChange, opts, disabled, fmt,
}: {
  label: string; value: number; onChange: (v: number) => void; opts: number[]; disabled?: boolean; fmt?: (m: number) => string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          height: 34, padding: "0 8px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.05)", color: disabled ? "#334155" : "#e2e8f0", fontSize: 12, outline: "none",
          fontFamily: "inherit", cursor: disabled ? "not-allowed" : "pointer", colorScheme: "dark",
        }}
      >
        {opts.map((m) => <option key={m} value={m} style={{ background: "#0f172a", color: "#e2e8f0" }}>{fmt ? fmt(m) : labelTime(m)}</option>)}
      </select>
    </label>
  );
}
function labelTime(min: number) {
  if (min >= 1440) return "00:00 (medianoche)";
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}
