"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Calendar, X, Check, Loader2, AlertCircle, CheckCircle2, MapPin, Lock, LogIn } from "lucide-react";
import { createPublicBooking, type BookingActionState } from "@/modules/bookings/actions";
import type { VenueAvailability, CourtAvailability, AvailabilitySlot } from "@/modules/bookings/queries";

const ACCENT = "#a3e635";
const MAX = 1140;
const MONTHS = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const DAYS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];

interface Props {
  clubs:         { id: string; name: string }[];
  activeClubId:  string | null;
  venues:        { id: string; name: string }[];
  activeVenueId: string | null;
  date:          string;
  availability:  VenueAvailability | null;
  isLoggedIn:    boolean;
  canBook:       boolean;
  basePath?:     string;
}

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

export function ReservasClient({ clubs, activeClubId, venues, activeVenueId, date, availability, isLoggedIn, canBook, basePath = "" }: Props) {
  const router = useRouter();
  const [target, setTarget] = useState<{ court: CourtAvailability; slot: AvailabilitySlot } | null>(null);

  const go = (params: { org?: string; venue?: string; date?: string }) => {
    const o = params.org ?? activeClubId ?? "";
    const v = params.org ? "" : (params.venue ?? activeVenueId ?? "");
    const d = params.date ?? date;
    router.push(`${basePath}/reservas?org=${o}${v ? `&venue=${v}` : ""}&date=${d}`);
  };

  if (clubs.length === 0) {
    return (
      <div style={{ maxWidth: MAX, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.15 }}>🎾</div>
        <h2 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 20, fontWeight: 800, color: "#f8fafc" }}>Todavía no hay canchas para reservar</h2>
        <p style={{ fontSize: 14, color: "#475569", marginTop: 8 }}>Pronto vas a poder reservar tu turno acá.</p>
      </div>
    );
  }

  const courts = availability?.courts ?? [];
  const rowCount = courts[0]?.slots.length ?? 0;

  return (
    <div style={{ maxWidth: MAX, margin: "0 auto", padding: "32px 24px 56px", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 4 }} className="grad-text">
          Reservá tu cancha
        </h1>
        <p style={{ fontSize: 13, color: "#475569", textTransform: "capitalize" }}>{fmtDateHuman(date)}</p>
      </div>

      {/* Club selector */}
      {clubs.length > 1 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Club</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {clubs.map((c) => {
              const active = c.id === activeClubId;
              return (
                <button key={c.id} onClick={() => go({ org: c.id })} style={pill(active)}>{c.name}</button>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls: venue + date */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Sede</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {venues.map((v) => (
              <button key={v.id} onClick={() => go({ venue: v.id })} style={pill(v.id === activeVenueId)}>{v.name}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => go({ date: shiftDate(date, -1) })} style={navBtn} disabled={date <= todayStr()}>‹</button>
          <button onClick={() => go({ date: todayStr() })} style={{ ...navBtn, width: "auto", padding: "0 14px", fontSize: 12, fontWeight: 800, color: ACCENT, background: "rgba(163,230,53,0.1)", borderColor: "rgba(163,230,53,0.25)" }}>HOY</button>
          <input type="date" value={date} min={todayStr()} onChange={(e) => e.target.value && go({ date: e.target.value })}
            style={{ height: 38, padding: "0 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", colorScheme: "dark", outline: "none" }} />
          <button onClick={() => go({ date: shiftDate(date, 1) })} style={navBtn}>›</button>
        </div>
      </div>

      {/* Aviso login */}
      {!canBook && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.22)" }}>
          <LogIn size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#94a3b8" }}>
            {isLoggedIn ? "Necesitás un perfil de jugador para reservar. Contactá al club." : <>Para reservar, <Link href={`/login?callbackUrl=${encodeURIComponent(`${basePath}/reservas`)}`} style={{ color: "#38bdf8", fontWeight: 700 }}>iniciá sesión</Link>.</>}
          </span>
        </div>
      )}

      {/* Grilla */}
      {availability?.isClosed ? (
        <Empty icon={<Lock size={30} />} title="Sede cerrada este día" sub={`Sin horario de atención para ${DAYS[availability.weekday]}.`} />
      ) : courts.length === 0 ? (
        <Empty title="Esta sede no tiene canchas disponibles." />
      ) : (
        <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(10,18,38,0.7)", backdropFilter: "blur(16px)", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}>
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 80 + courts.length * 140, display: "grid", gridTemplateColumns: `72px repeat(${courts.length}, minmax(130px, 1fr))` }}>
              {/* Header */}
              <div style={{ ...headerCell, borderRight: "1px solid rgba(255,255,255,0.06)" }} />
              {courts.map((c) => (
                <div key={c.courtId} style={{ ...headerCell, borderLeft: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 13, fontWeight: 800, color: "#f1f5f9" }}>{c.courtName}</div>
                  <div style={{ fontSize: 10, color: "#475569" }}>{c.isIndoor ? "Cubierta" : "Aire libre"}{c.bookingPrice ? ` · $${c.bookingPrice.toLocaleString("es-AR")}` : ""}</div>
                </div>
              ))}
              {/* Rows */}
              {Array.from({ length: rowCount }).map((_, ri) => {
                const ref = courts[0].slots[ri];
                return (
                  <div key={ri} style={{ display: "contents" }}>
                    <div style={{ padding: "0 8px", height: 54, display: "flex", alignItems: "center", justifyContent: "flex-end", borderTop: "1px solid rgba(255,255,255,0.05)", borderRight: "1px solid rgba(255,255,255,0.06)", fontFamily: "var(--font-space), sans-serif", fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                      {ref.startLabel}
                    </div>
                    {courts.map((court) => {
                      const slot = court.slots[ri];
                      const free = slot.state === "free";
                      return (
                        <button
                          key={court.courtId}
                          disabled={!free || !canBook}
                          onClick={() => free && canBook && setTarget({ court, slot })}
                          className={free && canBook ? "turno-free" : undefined}
                          style={{
                            height: 54, padding: "5px 8px", borderTop: "1px solid rgba(255,255,255,0.05)", borderLeft: "1px solid rgba(255,255,255,0.04)",
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, fontFamily: "inherit",
                            background: free ? "rgba(163,230,53,0.06)" : "rgba(255,255,255,0.015)",
                            cursor: free && canBook ? "pointer" : "default",
                            opacity: slot.state === "past" ? 0.4 : 1,
                          }}
                        >
                          {free ? (
                            <>
                              <span style={{ fontSize: 11, fontWeight: 800, color: ACCENT }}>Libre</span>
                              {slot.price != null && <span style={{ fontSize: 10, color: "#64748b" }}>${slot.price.toLocaleString("es-AR")}</span>}
                            </>
                          ) : slot.state === "past" ? (
                            <span style={{ fontSize: 10, color: "#334155" }}>—</span>
                          ) : (
                            <span style={{ fontSize: 10, color: "#475569", fontWeight: 600 }}>Ocupado</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
          <style>{`.turno-free:hover { background: rgba(163,230,53,0.14) !important; }`}</style>
        </div>
      )}

      {/* Leyenda */}
      <div style={{ display: "flex", gap: 14 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}>
          <span style={{ width: 11, height: 11, borderRadius: 3, background: "rgba(163,230,53,0.14)", border: "1px solid rgba(163,230,53,0.3)" }} /> Libre
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}>
          <span style={{ width: 11, height: 11, borderRadius: 3, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }} /> Ocupado
        </span>
      </div>

      {target && availability && (
        <ConfirmModal court={target.court} slot={target.slot} date={date} venueName={availability.venueName}
          onClose={() => setTarget(null)} onDone={() => { setTarget(null); router.refresh(); }} />
      )}
    </div>
  );
}

function ConfirmModal({ court, slot, date, venueName, onClose, onDone }: {
  court: CourtAvailability; slot: AvailabilitySlot; date: string; venueName: string; onClose: () => void; onDone: () => void;
}) {
  const [state, action, pending] = useActionState<BookingActionState, FormData>(createPublicBooking, null);

  useEffect(() => {
    if (state && "ok" in state) { const t = setTimeout(onDone, 1400); return () => clearTimeout(t); }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const ok = state && "ok" in state;
  const err = state && "error" in state ? state.error : null;

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(2,6,18,0.75)", backdropFilter: "blur(8px)" }}>
      <div style={{ width: "100%", maxWidth: 400, borderRadius: 20, background: "rgba(8,16,36,0.97)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)", overflow: "hidden", animation: "slideUpModal .25s cubic-bezier(.22,1,.36,1)" }}>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <h2 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 18, fontWeight: 900, color: "#f8fafc" }}>Confirmar reserva</h2>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={15} /></button>
          </div>

          {ok ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <CheckCircle2 size={44} color={ACCENT} style={{ margin: "0 auto 12px" }} />
              <p style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 16, fontWeight: 800, color: "#f8fafc" }}>¡Reserva confirmada!</p>
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Te esperamos. El pago se realiza en el club.</p>
            </div>
          ) : (
            <form action={action}>
              <input type="hidden" name="courtId" value={court.courtId} />
              <input type="hidden" name="date" value={date} />
              <input type="hidden" name="startMinute" value={slot.startMinute} />
              <input type="hidden" name="endMinute" value={slot.endMinute} />

              {/* Resumen */}
              <div style={{ borderRadius: 12, background: "rgba(163,230,53,0.06)", border: "1px solid rgba(163,230,53,0.18)", padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 16, fontWeight: 800, color: "#f8fafc", marginBottom: 8 }}>{court.courtName}</div>
                <Row icon={<MapPin size={13} />} text={venueName} />
                <Row icon={<Calendar size={13} />} text={fmtDateHuman(date)} />
                <Row icon={<Clock size={13} />} text={`${slot.startLabel} – ${slot.endLabel}`} />
                {slot.price != null && <Row icon={<span style={{ fontSize: 13, fontWeight: 800, color: ACCENT }}>$</span>} text={`${slot.price.toLocaleString("es-AR")} · se paga en el club`} />}
              </div>

              {err && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#fb7185", marginBottom: 14 }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} /> {err}
                </div>
              )}

              <button type="submit" disabled={pending} className={pending ? undefined : "btn-lime"} style={{
                width: "100%", height: 46, borderRadius: 12, border: "none", background: pending ? "rgba(163,230,53,0.4)" : ACCENT,
                color: "#080e1a", fontSize: 14, fontWeight: 800, cursor: pending ? "not-allowed" : "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: pending ? "none" : "0 0 20px rgba(163,230,53,0.3)",
              }}>
                {pending ? <><Loader2 size={16} className="animate-spin" /> Reservando…</> : <><Check size={16} /> Confirmar reserva</>}
              </button>
            </form>
          )}
        </div>
        <style>{`@keyframes slideUpModal { from { opacity:0; transform: translateY(16px) scale(.98) } to { opacity:1; transform:none } }`}</style>
      </div>
    </div>
  );
}

function Row({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
      <span style={{ color: "#64748b", display: "flex" }}>{icon}</span> {text}
    </div>
  );
}
function Empty({ icon, title, sub }: { icon?: React.ReactNode; title: string; sub?: string }) {
  return (
    <div style={{ borderRadius: 18, border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", padding: "64px 24px", textAlign: "center" }}>
      {icon && <div style={{ margin: "0 auto 12px", opacity: 0.3, display: "flex", justifyContent: "center" }}>{icon}</div>}
      <p style={{ fontSize: 14, color: "#94a3b8", fontWeight: 700, fontFamily: "var(--font-space), sans-serif" }}>{title}</p>
      {sub && <p style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

function pill(active: boolean): React.CSSProperties {
  return {
    padding: "8px 16px", borderRadius: 100, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit",
    background: active ? ACCENT : "rgba(255,255,255,0.05)", color: active ? "#080e1a" : "#64748b",
    boxShadow: active ? "0 0 16px rgba(163,230,53,0.25)" : "none",
  };
}
const navBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
  color: "#94a3b8", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit",
};
const headerCell: React.CSSProperties = {
  padding: "12px 10px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)",
  display: "flex", flexDirection: "column", justifyContent: "center", gap: 2,
};
