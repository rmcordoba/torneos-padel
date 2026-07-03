"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X, Check, Loader2, Ban, Clock, DollarSign, Calendar, CalendarClock, TrendingUp, AlertCircle, Lock } from "lucide-react";
import {
  createBooking, createCourtBlock, cancelBooking, setBookingPayment, markNoShow,
  type BookingActionState,
} from "@/modules/bookings/actions";
import type { VenueAvailability, AvailabilitySlot, CourtAvailability } from "@/modules/bookings/queries";
import { computeBookingPrice } from "@/modules/bookings/pricing";

const ACCENT = "#a3e635";
const MONTHS = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const DAYS   = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];

interface Props {
  venues:        { id: string; name: string }[];
  activeVenueId: string | null;
  date:          string;
  availability:  VenueAvailability | null;
  stats:         { totalBookings: number; revenuePaid: number };
}

// Estado visual de cada celda
const STATE_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  free:    { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.06)", color: "#475569" },
  booked:  { bg: "rgba(163,230,53,0.12)",  border: "rgba(163,230,53,0.3)",   color: ACCENT },
  fixed:   { bg: "rgba(167,139,250,0.14)", border: "rgba(167,139,250,0.32)", color: "#a78bfa" },
  match:   { bg: "rgba(56,189,248,0.12)",  border: "rgba(56,189,248,0.3)",   color: "#38bdf8" },
  blocked: { bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.25)", color: "#64748b" },
  past:    { bg: "rgba(255,255,255,0.01)", border: "rgba(255,255,255,0.04)", color: "#334155" },
};

function fmtDateHuman(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS[dt.getDay()]} ${d} de ${MONTHS[m - 1]}`;
}
function shiftDate(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export function TurnosGrid({ venues, activeVenueId, date, availability, stats }: Props) {
  const router = useRouter();
  const [createTarget, setCreateTarget] = useState<{
    court: CourtAvailability; startMinute: number; endMinute: number; startLabel: string; endLabel: string; defaultPrice: number | null;
  } | null>(null);
  const [manageTarget, setManageTarget] = useState<{ court: CourtAvailability; slot: AvailabilitySlot } | null>(null);
  // Selección por arrastre del mouse: cancha + rango de celdas (índices de fila)
  const [drag, setDrag] = useState<{ courtId: string; startIdx: number; endIdx: number } | null>(null);

  // Mientras se arrastra, escuchamos el mouseup global para finalizar la selección
  // aunque el cursor termine fuera de la grilla.
  useEffect(() => {
    if (!drag) return;
    const courtsNow = availability?.courts ?? [];
    const onUp = () => {
      const c = courtsNow.find((x) => x.courtId === drag.courtId);
      setDrag(null);
      if (!c) return;
      let lo = Math.min(drag.startIdx, drag.endIdx);
      let hi = Math.max(drag.startIdx, drag.endIdx);
      // Mínimo 1 hora: si el rango quedó corto, lo estiramos sobre celdas libres contiguas.
      const span = () => c.slots[hi].endMinute - c.slots[lo].startMinute;
      while (span() < 60) {
        if (c.slots[hi + 1]?.state === "free") hi++;
        else if (c.slots[lo - 1]?.state === "free") lo--;
        else break;
      }
      if (span() < 60) return; // no hay una hora libre contigua disponible
      const startMinute = c.slots[lo].startMinute;
      const endMinute = c.slots[hi].endMinute;
      // Precio por defecto prorrateado según las franjas de la sede
      const bands = availability?.priceBands ?? [];
      const defaultPrice = bands.length
        ? computeBookingPrice(bands, startMinute, endMinute, c.bookingPrice)
        : c.bookingPrice;
      setCreateTarget({
        court: c, startMinute, endMinute,
        startLabel: c.slots[lo].startLabel,
        endLabel: c.slots[hi].endLabel,
        defaultPrice,
      });
    };
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, [drag, availability]);

  // Inicia/extiende la selección sobre celdas libres de UNA sola cancha
  const onCellDown = (courtId: string, idx: number) => {
    const c = (availability?.courts ?? []).find((x) => x.courtId === courtId);
    if (c?.slots[idx]?.state !== "free") return;
    setDrag({ courtId, startIdx: idx, endIdx: idx });
  };
  const onCellEnter = (courtId: string, idx: number) => {
    setDrag((d) => {
      if (!d || d.courtId !== courtId) return d;
      const c = (availability?.courts ?? []).find((x) => x.courtId === courtId);
      if (!c) return d;
      const lo = Math.min(d.startIdx, idx);
      const hi = Math.max(d.startIdx, idx);
      for (let i = lo; i <= hi; i++) if (c.slots[i]?.state !== "free") return d; // no cruzar ocupados
      return { ...d, endIdx: idx };
    });
  };
  const inSelection = (courtId: string, idx: number) =>
    !!drag && drag.courtId === courtId &&
    idx >= Math.min(drag.startIdx, drag.endIdx) && idx <= Math.max(drag.startIdx, drag.endIdx);

  const go = (params: { venue?: string; date?: string }) => {
    const v = params.venue ?? activeVenueId ?? "";
    const d = params.date ?? date;
    router.push(`/dashboard/turnos?venue=${v}&date=${d}`);
  };

  // Sin sedes
  if (venues.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}>🎾</div>
        <h2 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 20, fontWeight: 800, color: "#f8fafc", marginBottom: 8 }}>
          Primero creá una sede y sus canchas
        </h2>
        <p style={{ fontSize: 14, color: "#475569", marginBottom: 24 }}>
          Los turnos se cargan sobre las canchas de cada sede.
        </p>
        <Link href="/dashboard/sedes/nueva" style={{ display: "inline-flex", padding: "10px 22px", borderRadius: 10, background: ACCENT, color: "#080e1a", fontWeight: 800, fontSize: 14, textDecoration: "none", boxShadow: "0 0 20px rgba(163,230,53,0.3)" }}>
          + Nueva sede
        </Link>
      </div>
    );
  }

  const courts = availability?.courts ?? [];
  // Todas las canchas comparten la misma grilla horaria (mismo horario de sede)
  const rowCount = courts[0]?.slots.length ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 28, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.02em", marginBottom: 6 }}>
            Turnos
          </h1>
          <p style={{ fontSize: 13, color: "#475569", textTransform: "capitalize" }}>{fmtDateHuman(date)}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/dashboard/turnos/reportes" style={{
            display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10,
            background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)",
            color: "#38bdf8", fontSize: 13, fontWeight: 700, textDecoration: "none",
          }}>
            <TrendingUp size={15} /> Reportes
          </Link>
          <Link href="/dashboard/turnos/horarios" style={{
            display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#94a3b8", fontSize: 13, fontWeight: 700, textDecoration: "none",
          }}>
            <Clock size={15} /> Horarios
          </Link>
          <Link href="/dashboard/turnos/precios" style={{
            display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10,
            background: "rgba(163,230,53,0.1)", border: "1px solid rgba(163,230,53,0.25)",
            color: ACCENT, fontSize: 13, fontWeight: 700, textDecoration: "none",
          }}>
            <DollarSign size={15} /> Precios
          </Link>
          <Link href="/dashboard/turnos/fijos" style={{
            display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10,
            background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.28)",
            color: "#a78bfa", fontSize: 13, fontWeight: 700, textDecoration: "none",
          }}>
            <CalendarClock size={15} /> Turnos fijos
          </Link>
          <StatPill icon={<Clock size={14} />} label="Reservas hoy" value={String(stats.totalBookings)} color={ACCENT} />
          <StatPill icon={<DollarSign size={14} />} label="Cobrado" value={`$${stats.revenuePaid.toLocaleString("es-AR")}`} color="#38bdf8" />
        </div>
      </div>

      {/* Controls: venue selector + date nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        {/* Venues */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {venues.map((v) => {
            const active = v.id === activeVenueId;
            return (
              <button key={v.id} onClick={() => go({ venue: v.id })} style={{
                padding: "8px 16px", borderRadius: 100, fontSize: 13, fontWeight: 700,
                border: "none", cursor: "pointer", fontFamily: "inherit",
                background: active ? ACCENT : "rgba(255,255,255,0.05)",
                color: active ? "#080e1a" : "#64748b",
                boxShadow: active ? "0 0 16px rgba(163,230,53,0.25)" : "none",
              }}>{v.name}</button>
            );
          })}
        </div>
        {/* Date nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => go({ date: shiftDate(date, -1) })} style={navBtn}>‹</button>
          <button onClick={() => go({ date: todayStr() })} style={{ ...navBtn, width: "auto", padding: "0 14px", fontSize: 12, fontWeight: 800, color: ACCENT, background: "rgba(163,230,53,0.1)", borderColor: "rgba(163,230,53,0.25)" }}>HOY</button>
          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && go({ date: e.target.value })}
            style={{ height: 38, padding: "0 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", colorScheme: "dark", outline: "none" }}
          />
          <button onClick={() => go({ date: shiftDate(date, 1) })} style={navBtn}>›</button>
        </div>
      </div>

      {/* Leyenda */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {[
          { s: "free", l: "Libre" }, { s: "booked", l: "Reservado" }, { s: "fixed", l: "Turno fijo" },
          { s: "match", l: "Partido torneo" }, { s: "blocked", l: "Bloqueado" },
        ].map(({ s, l }) => (
          <span key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: STATE_STYLE[s].bg, border: `1px solid ${STATE_STYLE[s].border}` }} />
            {l}
          </span>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#475569", display: "flex", alignItems: "center", gap: 5 }}>
          <Plus size={11} style={{ color: ACCENT }} /> Arrastrá sobre los cuadritos libres para reservar (mínimo 1 hora)
        </span>
      </div>

      {/* Grilla */}
      {availability?.isClosed ? (
        <div style={{ borderRadius: 18, border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", padding: "64px 24px", textAlign: "center" }}>
          <Lock size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          <p style={{ fontSize: 14, color: "#94a3b8", fontWeight: 700, fontFamily: "var(--font-space), sans-serif" }}>Sede cerrada este día</p>
          <p style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>No hay horario de apertura configurado para {DAYS[availability.weekday]}.</p>
        </div>
      ) : courts.length === 0 ? (
        <div style={{ borderRadius: 18, border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", padding: "64px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#64748b" }}>Esta sede no tiene canchas activas.</p>
        </div>
      ) : (
        <div style={{
          borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(10,18,38,0.7)", backdropFilter: "blur(16px)",
          overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
        }}>
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 80 + courts.length * 140, display: "grid", gridTemplateColumns: `72px repeat(${courts.length}, minmax(130px, 1fr))`, userSelect: drag ? "none" : "auto" }}>

              {/* Header row: corner + court names */}
              <div style={{ ...headerCell, borderRight: "1px solid rgba(255,255,255,0.06)" }} />
              {courts.map((c) => (
                <div key={c.courtId} style={{ ...headerCell, borderLeft: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 13, fontWeight: 800, color: "#f1f5f9" }}>{c.courtName}</div>
                  <div style={{ fontSize: 10, color: "#475569" }}>
                    {c.isIndoor ? "Cubierta" : "Aire libre"}{c.bookingPrice ? ` · $${c.bookingPrice.toLocaleString("es-AR")}` : ""}
                  </div>
                </div>
              ))}

              {/* Time rows */}
              {Array.from({ length: rowCount }).map((_, ri) => {
                const ref = courts[0].slots[ri];
                return (
                  <RowFragment
                    key={ri}
                    ri={ri}
                    timeLabel={ref.startLabel}
                    courts={courts}
                    onCellDown={onCellDown}
                    onCellEnter={onCellEnter}
                    inSelection={inSelection}
                    onOccupied={(court, slot) => setManageTarget({ court, slot })}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      {createTarget && availability && (
        <CreateModal
          court={createTarget.court}
          startMinute={createTarget.startMinute}
          endMinute={createTarget.endMinute}
          startLabel={createTarget.startLabel}
          endLabel={createTarget.endLabel}
          defaultPrice={createTarget.defaultPrice}
          date={date}
          onClose={() => setCreateTarget(null)}
          onDone={() => { setCreateTarget(null); router.refresh(); }}
        />
      )}
      {manageTarget && availability && (
        <ManageModal
          court={manageTarget.court}
          slot={manageTarget.slot}
          date={date}
          venueName={availability.venueName}
          onClose={() => setManageTarget(null)}
          onDone={() => { setManageTarget(null); router.refresh(); }}
        />
      )}
    </div>
  );
}

// ── Fila de la grilla ────────────────────────────────────────────────────────

function RowFragment({
  ri, timeLabel, courts, onCellDown, onCellEnter, inSelection, onOccupied,
}: {
  ri: number; timeLabel: string; courts: CourtAvailability[];
  onCellDown: (courtId: string, idx: number) => void;
  onCellEnter: (courtId: string, idx: number) => void;
  inSelection: (courtId: string, idx: number) => boolean;
  onOccupied: (c: CourtAvailability, s: AvailabilitySlot) => void;
}) {
  return (
    <>
      {/* Time label */}
      <div style={{
        padding: "0 8px", height: 56, display: "flex", alignItems: "center", justifyContent: "flex-end",
        borderTop: "1px solid rgba(255,255,255,0.05)", borderRight: "1px solid rgba(255,255,255,0.06)",
        fontFamily: "var(--font-space), sans-serif", fontSize: 12, fontWeight: 700, color: "#64748b",
      }}>
        {timeLabel}
      </div>
      {/* Court cells */}
      {courts.map((court) => {
        const slot = court.slots[ri];
        const st = STATE_STYLE[slot.state] ?? STATE_STYLE.free;
        const clickableFree = slot.state === "free";
        const clickableOcc = slot.state === "booked" || slot.state === "fixed";
        const isMatch = slot.state === "match";
        const selected = clickableFree && inSelection(court.courtId, ri);

        return (
          <button
            key={court.courtId}
            disabled={!clickableFree && !clickableOcc}
            draggable={false}
            onMouseDown={clickableFree ? (e) => { e.preventDefault(); onCellDown(court.courtId, ri); } : undefined}
            onMouseEnter={clickableFree ? () => onCellEnter(court.courtId, ri) : undefined}
            onClick={clickableOcc ? () => onOccupied(court, slot) : undefined}
            style={{
              height: 56, padding: "5px 8px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              borderLeft: "1px solid rgba(255,255,255,0.04)",
              background: selected ? "rgba(163,230,53,0.28)" : st.bg,
              boxShadow: selected ? "inset 0 0 0 1px rgba(163,230,53,0.6)" : "none",
              cursor: clickableFree || clickableOcc ? "pointer" : "default",
              display: "flex", flexDirection: "column", justifyContent: "center", gap: 2,
              textAlign: "left", fontFamily: "inherit",
              opacity: slot.state === "past" ? 0.5 : 1,
              transition: "background .1s, box-shadow .1s",
            }}
            className={clickableFree && !selected ? "turno-free" : undefined}
            title={slot.matchLabel || slot.customerLabel || slot.blockReason || ""}
          >
            {slot.state === "free" && (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: 16 }}>
                <Plus size={14} />
              </span>
            )}
            {(slot.state === "booked" || slot.state === "fixed") && (
              <>
                <span style={{ fontSize: 11, fontWeight: 800, color: st.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {slot.customerLabel}
                </span>
                <span style={{ fontSize: 9, color: st.color, opacity: 0.8 }}>
                  {slot.state === "fixed" ? "TURNO FIJO" : (slot.price != null ? `$${slot.price.toLocaleString("es-AR")}` : "Reservado")}
                </span>
              </>
            )}
            {isMatch && (
              <>
                <span style={{ fontSize: 10, fontWeight: 800, color: st.color }}>PARTIDO</span>
                <span style={{ fontSize: 9, color: st.color, opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{slot.matchLabel}</span>
              </>
            )}
            {slot.state === "blocked" && (
              <span style={{ fontSize: 10, fontWeight: 700, color: st.color, display: "flex", alignItems: "center", gap: 4 }}>
                <Ban size={11} /> {slot.blockReason}
              </span>
            )}
          </button>
        );
      })}
      <style>{`.turno-free:hover { background: rgba(163,230,53,0.07) !important; }`}</style>
    </>
  );
}

// ── Modal: crear reserva / bloquear ──────────────────────────────────────────

function CreateModal({
  court, startMinute, endMinute, startLabel, endLabel, defaultPrice, date, onClose, onDone,
}: {
  court: CourtAvailability; startMinute: number; endMinute: number; startLabel: string; endLabel: string;
  defaultPrice: number | null; date: string; onClose: () => void; onDone: () => void;
}) {
  const durationMin = endMinute - startMinute;
  const [mode, setMode] = useState<"reserva" | "bloqueo">("reserva");
  const [bookState, bookAction, bookPending] = useActionState<BookingActionState, FormData>(createBooking, null);
  const [blockState, blockAction, blockPending] = useActionState<BookingActionState, FormData>(createCourtBlock, null);
  const state = mode === "reserva" ? bookState : blockState;

  useEffect(() => {
    if (state && "ok" in state) onDone();
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const action = mode === "reserva" ? bookAction : blockAction;
  const pending = mode === "reserva" ? bookPending : blockPending;
  const err = state && "error" in state ? state.error : null;

  return (
    <Overlay onClose={onClose}>
      {/* Header */}
      <div style={{ padding: "20px 24px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 18, fontWeight: 900, color: "#f8fafc" }}>
              {court.courtName}
            </h2>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
              <Calendar size={12} /> {fmtDateHuman(date)} · <Clock size={12} /> {startLabel}–{endLabel}
              <span style={{ color: ACCENT, fontWeight: 700 }}>· {durationMin >= 60 ? `${Math.floor(durationMin / 60)}h${durationMin % 60 ? ` ${durationMin % 60}m` : ""}` : `${durationMin}m`}</span>
            </p>
          </div>
          <button onClick={onClose} style={closeBtn}><X size={16} /></button>
        </div>
        {/* Tabs reserva / bloqueo */}
        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          {(["reserva", "bloqueo"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "8px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit",
              fontSize: 12, fontWeight: 800,
              background: mode === m ? (m === "reserva" ? "rgba(163,230,53,0.15)" : "rgba(100,116,139,0.18)") : "rgba(255,255,255,0.04)",
              color: mode === m ? (m === "reserva" ? ACCENT : "#94a3b8") : "#475569",
            }}>
              {m === "reserva" ? "Reservar" : "Bloquear"}
            </button>
          ))}
        </div>
      </div>

      <form action={action} style={{ padding: "16px 24px 24px" }}>
        <input type="hidden" name="courtId" value={court.courtId} />
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="startMinute" value={startMinute} />
        <input type="hidden" name="endMinute" value={endMinute} />

        {err && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#fb7185", marginBottom: 14 }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} /> {err}
          </div>
        )}

        {mode === "reserva" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Cliente">
              <input name="customerName" placeholder="Nombre y apellido" style={inp} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Teléfono">
                <input name="customerPhone" placeholder="Opcional" style={inp} />
              </Field>
              <Field label="Precio">
                <input name="price" type="number" min={0} step="100" defaultValue={defaultPrice ?? court.bookingPrice ?? ""} placeholder="0" style={inp} />
              </Field>
            </div>
            <Field label="Notas">
              <input name="notes" placeholder="Opcional" style={inp} />
            </Field>
          </div>
        ) : (
          <Field label="Motivo del bloqueo">
            <input name="reason" placeholder="Mantenimiento, clase, evento..." style={inp} />
          </Field>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button type="button" onClick={onClose} style={ghostBtn}>Cancelar</button>
          <button type="submit" disabled={pending} style={{
            display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 10, border: "none",
            background: mode === "reserva" ? ACCENT : "#64748b", color: mode === "reserva" ? "#080e1a" : "#fff",
            fontSize: 13, fontWeight: 800, cursor: pending ? "not-allowed" : "pointer", fontFamily: "inherit",
            boxShadow: mode === "reserva" ? "0 0 18px rgba(163,230,53,0.3)" : "none", opacity: pending ? 0.6 : 1,
          }}>
            {pending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {mode === "reserva" ? "Confirmar reserva" : "Bloquear horario"}
          </button>
        </div>
      </form>
    </Overlay>
  );
}

// ── Modal: gestionar reserva existente ───────────────────────────────────────

function ManageModal({
  court, slot, date, venueName, onClose, onDone,
}: {
  court: CourtAvailability; slot: AvailabilitySlot; date: string; venueName: string; onClose: () => void; onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const bookingId = slot.bookingId!;

  const run = (fn: () => Promise<{ error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if (r?.error) setError(r.error);
      else onDone();
    });
  };

  // Link wa.me para recordatorio manual por WhatsApp (gratis, sin API)
  const phoneDigits = (slot.customerPhone ?? "").replace(/\D/g, "");
  const waMessage = `Hola ${slot.customerLabel}! Te recordamos tu turno en ${court.courtName} (${venueName}) el ${fmtDateHuman(date)} a las ${slot.startLabel}. Te esperamos 🎾`;
  const waLink = phoneDigits ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(waMessage)}` : null;

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: "20px 24px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 800, color: slot.state === "fixed" ? "#a78bfa" : ACCENT, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {slot.state === "fixed" ? "Turno fijo" : "Reserva"}
            </span>
            <h2 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 18, fontWeight: 900, color: "#f8fafc", marginTop: 2 }}>
              {slot.customerLabel}
            </h2>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
              {court.courtName} · <Clock size={12} /> {slot.startLabel}–{slot.endLabel}
              {slot.price != null && <> · <DollarSign size={11} /> ${slot.price.toLocaleString("es-AR")}</>}
            </p>
          </div>
          <button onClick={onClose} style={closeBtn}><X size={16} /></button>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#fb7185", marginBottom: 14 }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Recordatorio por WhatsApp (link wa.me, gratis) */}
          {waLink ? (
            <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ ...actBtn("#25D366", "rgba(37,211,102,0.12)"), textDecoration: "none" }}>
              <WhatsappIcon /> Recordar por WhatsApp
            </a>
          ) : (
            <div style={{ ...actBtn("#475569", "rgba(255,255,255,0.03)"), cursor: "default" }} title="Esta reserva no tiene teléfono cargado">
              <WhatsappIcon /> Sin teléfono para WhatsApp
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button disabled={pending} onClick={() => run(() => setBookingPayment(bookingId, "PAID"))} style={actBtn(ACCENT, "rgba(163,230,53,0.12)")}>
              <DollarSign size={14} /> Marcar pagado
            </button>
            <button disabled={pending} onClick={() => run(() => setBookingPayment(bookingId, "UNPAID"))} style={actBtn("#94a3b8", "rgba(255,255,255,0.05)")}>
              Marcar impago
            </button>
          </div>
          <button disabled={pending} onClick={() => run(() => markNoShow(bookingId))} style={actBtn("#fb923c", "rgba(251,146,60,0.12)")}>
            <Ban size={14} /> No se presentó (no-show)
          </button>
          <button disabled={pending} onClick={() => run(() => cancelBooking(bookingId))} style={actBtn("#fb7185", "rgba(244,63,94,0.12)")}>
            <X size={14} /> Cancelar reserva
          </button>
        </div>

        {pending && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, fontSize: 12, color: "#64748b" }}>
            <Loader2 size={14} className="animate-spin" /> Guardando...
          </div>
        )}
      </div>
    </Overlay>
  );
}

// ── UI helpers ───────────────────────────────────────────────────────────────

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(2,6,18,0.75)", backdropFilter: "blur(8px)" }}>
      <div style={{ width: "100%", maxWidth: 440, borderRadius: 20, background: "rgba(8,16,36,0.97)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)", overflow: "hidden", animation: "slideUpModal .25s cubic-bezier(.22,1,.36,1)" }}>
        {children}
      </div>
      <style>{`@keyframes slideUpModal { from { opacity:0; transform: translateY(16px) scale(.98) } to { opacity:1; transform:none } }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      {children}
    </label>
  );
}

function WhatsappIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
    </svg>
  );
}

function StatPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <span style={{ color }}>{icon}</span>
      <div>
        <div style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 18, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
  color: "#94a3b8", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit",
};
const headerCell: React.CSSProperties = {
  padding: "12px 10px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)",
  display: "flex", flexDirection: "column", justifyContent: "center", gap: 2,
};
const closeBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
  color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};
const ghostBtn: React.CSSProperties = {
  padding: "9px 16px", borderRadius: 10, background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
  color: "#94a3b8", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
};
const inp: React.CSSProperties = {
  width: "100%", height: 40, padding: "0 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.05)", color: "#f1f5f9", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};
function actBtn(color: string, bg: string): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px", borderRadius: 10,
    border: `1px solid ${color}33`, background: bg, color, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", width: "100%",
  };
}
