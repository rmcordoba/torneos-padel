"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type AgendaSlot = {
  id: string;
  day: number;
  startTime: string;
  endTime: string | null;
  matchLabel: string;
  score: string | null;
  category: string;
  tournamentName: string;
  venueName: string;
  courtName: string | null;
  status: string;
};

interface Props {
  slots:        AgendaSlot[];
  initialYear:  number;
  initialMonth: number;
  initialDay:   number;
  basePath?:    string;
}

const MONTHS    = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_ABBR = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

const ACCENT = "#a3e635";
const GLASS_BD = "rgba(255,255,255,0.08)";

// Vibrant status palette
const STATUS_STYLE: Record<string, { color: string; label: string; live?: boolean }> = {
  SCHEDULED:   { color: "#38bdf8", label: "Programado" },
  IN_PROGRESS: { color: "#f43f5e", label: "EN VIVO", live: true },
  COMPLETED:   { color: "#64748b", label: "Finalizado" },
  WALKOVER:    { color: "#64748b", label: "W/O" },
  CANCELLED:   { color: "#f87171", label: "Cancelado" },
  POSTPONED:   { color: "#fb923c", label: "Postergado" },
};

// Vibrant category palette
const CAT_PAL = ["#a3e635", "#38bdf8", "#f43f5e", "#fb923c", "#a78bfa", "#22d3ee", "#facc15", "#ec4899"];
function catColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return CAT_PAL[Math.abs(h) % CAT_PAL.length];
}

function getStatusColor(status: string) {
  return (STATUS_STYLE[status] ?? STATUS_STYLE.SCHEDULED).color;
}

function splitTeams(label: string): [string, string] {
  const parts = label.split(/\s+vs\s+/i);
  return [parts[0] ?? label, parts[1] ?? "—"];
}

function teamInitials(team: string): string {
  return team
    .split("/")
    .map((p) => {
      const words = p.replace(/\./g, "").trim().split(/\s+/);
      const last = words[words.length - 1] ?? "";
      return last[0]?.toUpperCase() ?? "";
    })
    .join("");
}

export function AgendaClient({ slots, initialYear, initialMonth, initialDay, basePath = "" }: Props) {
  const router      = useRouter();
  const [selectedDay, setSelectedDay] = useState<number>(initialDay);
  const [filterCat,   setFilterCat]   = useState("todas");

  const now    = new Date();
  const todayY = now.getFullYear();
  const todayM = now.getMonth() + 1;
  const todayD = now.getDate();
  const todayN = todayY * 10000 + todayM * 100 + todayD;

  const isToday = (d: number) => d === todayD && initialMonth === todayM && initialYear === todayY;

  const slotsByDay = useMemo(() => {
    const map: Record<number, AgendaSlot[]> = {};
    slots.forEach((s) => {
      if (!map[s.day]) map[s.day] = [];
      map[s.day].push(s);
    });
    return map;
  }, [slots]);

  const categories = useMemo(
    () => Array.from(new Set(slots.map((s) => s.category).filter(Boolean))).sort(),
    [slots]
  );

  const totalThisMonth = slots.length;
  const liveCount      = useMemo(() => slots.filter((s) => s.status === "IN_PROGRESS").length, [slots]);

  const daysInMonth     = new Date(initialYear, initialMonth, 0).getDate();
  const firstDayOfMonth = new Date(initialYear, initialMonth - 1, 1).getDay();

  const goMonth   = (y: number, m: number, d = 1) => router.push(`${basePath}/agenda?year=${y}&month=${m}&day=${d}`);
  const prevMonth = () => initialMonth === 1 ? goMonth(initialYear - 1, 12) : goMonth(initialYear, initialMonth - 1);
  const nextMonth = () => initialMonth === 12 ? goMonth(initialYear + 1, 1) : goMonth(initialYear, initialMonth + 1);
  const goToday   = () => goMonth(todayY, todayM, todayD);

  const daySlots = useMemo(() =>
    (slotsByDay[selectedDay] ?? [])
      .filter((s) => filterCat === "todas" || s.category === filterCat)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [slotsByDay, selectedDay, filterCat]
  );

  function dayCount(day: number) {
    return (slotsByDay[day] ?? []).filter((s) => filterCat === "todas" || s.category === filterCat).length;
  }
  function dayHasLive(day: number) {
    return (slotsByDay[day] ?? []).some((s) => s.status === "IN_PROGRESS" && (filterCat === "todas" || s.category === filterCat));
  }

  const weekDays = useMemo(() => {
    const base = new Date(initialYear, initialMonth - 1, selectedDay || 1);
    const dow  = base.getDay();
    const mon  = new Date(base);
    mon.setDate(base.getDate() - ((dow + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      return {
        label:     ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"][i],
        day:       d.getDate(),
        month:     d.getMonth() + 1,
        year:      d.getFullYear(),
        sameMonth: d.getMonth() + 1 === initialMonth && d.getFullYear() === initialYear,
      };
    });
  }, [selectedDay, initialMonth, initialYear]);

  const selectedDayLabel = selectedDay
    ? `${DAYS_ABBR[new Date(initialYear, initialMonth - 1, selectedDay).getDay()]} ${selectedDay} ${MONTHS[initialMonth - 1]}`
    : "Seleccioná un día";

  const panel: React.CSSProperties = {
    background: "rgba(10,18,38,0.7)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: `1px solid ${GLASS_BD}`,
    borderRadius: 18,
    overflow: "hidden",
  };

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px 48px", display: "flex", flexDirection: "column", gap: 18 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: "32px 0 22px",
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <h1 style={{
              fontFamily: "var(--font-space), sans-serif",
              fontSize: 32, fontWeight: 900, color: "#f8fafc",
              letterSpacing: "-0.03em", lineHeight: 1,
            }}>
              Agenda
            </h1>
            {liveCount > 0 && (
              <span className="vib-live-card" style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "6px 14px", borderRadius: 8,
                background: "#f43f5e", color: "#fff",
                fontSize: 12, fontWeight: 900, letterSpacing: "0.08em",
              }}>
                <span className="vib-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />
                {liveCount} EN VIVO
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "#475569" }}>
            {MONTHS[initialMonth - 1]} {initialYear} · {totalThisMonth} partido{totalThisMonth !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={prevMonth} style={navBtn}>‹</button>
          <button onClick={goToday} style={{ ...navBtn, width: "auto", padding: "0 16px", fontSize: 12, fontWeight: 800, color: ACCENT, background: "rgba(163,230,53,0.1)", borderColor: "rgba(163,230,53,0.25)" }}>HOY</button>
          <button onClick={nextMonth} style={navBtn}>›</button>
        </div>
      </div>

      {/* ── Category filter chips ──────────────────────────────────────────── */}
      {categories.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["todas", ...categories].map((c) => {
            const active = filterCat === c;
            const col    = c === "todas" ? ACCENT : catColor(c);
            return (
              <button key={c} onClick={() => setFilterCat(c)} style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "8px 16px", borderRadius: 100, fontSize: 13, fontWeight: 800,
                border: "none", cursor: "pointer", fontFamily: "inherit",
                background: active ? col : "rgba(255,255,255,0.05)",
                color: active ? "#080e1a" : "#94a3b8",
                boxShadow: active ? `0 0 20px ${col}55` : "none",
                transition: "all .15s", letterSpacing: "-0.01em",
              }}>
                {c !== "todas" && <span style={{ width: 7, height: 7, borderRadius: "50%", background: active ? "#080e1a" : catColor(c) }} />}
                {c === "todas" ? "Todas" : c}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Week strip (vibrant) ───────────────────────────────────────────── */}
      <div style={panel}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
          {weekDays.map(({ label, day, month, year, sameMonth }, i) => {
            const count    = sameMonth ? dayCount(day) : 0;
            const live     = sameMonth && dayHasLive(day);
            const isActive = sameMonth && day === selectedDay;
            const isTdyW   = isToday(day) && sameMonth;
            const wDayN    = year * 10000 + month * 100 + day;
            const isPastW  = wDayN < todayN && !isTdyW;

            return (
              <button
                key={i}
                onClick={() => { if (sameMonth) setSelectedDay(day); else goMonth(year, month, day); }}
                style={{
                  padding: "16px 8px 14px", border: "none",
                  borderRight: i < 6 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  background: isActive ? "linear-gradient(180deg, rgba(163,230,53,0.14), rgba(163,230,53,0.02))" : "transparent",
                  cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  transition: "background .15s", fontFamily: "inherit", position: "relative",
                  opacity: isPastW && count === 0 ? 0.32 : 1,
                }}
              >
                {isActive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: ACCENT, boxShadow: `0 0 10px ${ACCENT}` }} />}
                <span style={{ fontSize: 10, fontWeight: 800, color: isTdyW ? ACCENT : "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {label}
                </span>
                <span className="vib-score" style={{ fontSize: 28, color: isActive ? ACCENT : count > 0 ? "#f1f5f9" : "#334155" }}>
                  {sameMonth ? day : "·"}
                </span>
                {count > 0 ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: live ? "#f43f5e" : "#64748b" }}>
                    {live && <span className="vib-dot" style={{ width: 5, height: 5, borderRadius: "50%", background: "#f43f5e" }} />}
                    {count} {count === 1 ? "part." : "part."}
                  </span>
                ) : (
                  <span style={{ fontSize: 10, color: "#334155" }}>—</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Day label + count ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        <h2 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 18, fontWeight: 900, color: "#f8fafc", textTransform: "capitalize" }}>
          {selectedDayLabel}
        </h2>
        {daySlots.length > 0 && (
          <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>{daySlots.length} partido{daySlots.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* ── Match cards (livescore) ────────────────────────────────────────── */}
      {daySlots.length === 0 ? (
        <div style={{ ...panel, padding: "64px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 12, opacity: 0.15 }}>📅</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#94a3b8", fontFamily: "var(--font-space), sans-serif", marginBottom: 4 }}>
            Sin partidos este día
          </div>
          <div style={{ fontSize: 12, color: "#475569" }}>Los horarios se publican 24h antes.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {daySlots.map((s, idx) => {
            const ss      = STATUS_STYLE[s.status] ?? STATUS_STYLE.SCHEDULED;
            const cc      = catColor(s.category);
            const isLive  = s.status === "IN_PROGRESS";
            const isDone  = s.status === "COMPLETED" || s.status === "WALKOVER";
            const [teamA, teamB] = splitTeams(s.matchLabel);
            const sets    = s.score ? s.score.split(",").map((x) => x.trim()) : [];

            // Determine which team won (more sets)
            let winsA = 0, winsB = 0;
            sets.forEach((set) => {
              const [a, b] = set.split("-").map((n) => parseInt(n.trim()));
              if (!isNaN(a) && !isNaN(b)) { if (a > b) winsA++; else if (b > a) winsB++; }
            });

            return (
              <div
                key={s.id}
                className={`vib-card vib-in card-d${Math.min(idx, 5)}`}
                style={{
                  ["--vib-glow" as string]: isLive ? "rgba(244,63,94,0.25)" : `${cc}33`,
                  position: "relative", overflow: "hidden",
                  borderRadius: 16,
                  background: isLive
                    ? "linear-gradient(100deg, rgba(244,63,94,0.1) 0%, rgba(10,18,38,0.85) 45%)"
                    : "rgba(10,18,38,0.7)",
                  backdropFilter: "blur(16px)",
                  border: `1px solid ${isLive ? "rgba(244,63,94,0.3)" : "rgba(255,255,255,0.07)"}`,
                  display: "flex", alignItems: "stretch",
                  opacity: isDone ? 0.82 : 1,
                }}
              >
                {/* Live sheen */}
                {isLive && <div className="vib-sheen" />}

                {/* Category color bar */}
                <div style={{ width: 5, flexShrink: 0, background: cc, boxShadow: `0 0 12px ${cc}` }} />

                {/* Time block */}
                <div style={{
                  flexShrink: 0, width: 92, padding: "16px 0",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  borderRight: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <span className="vib-score" style={{ fontSize: 22, color: isLive ? "#f43f5e" : isDone ? "#64748b" : "#f8fafc" }}>
                    {s.startTime}
                  </span>
                  {s.endTime && <span style={{ fontSize: 10, color: "#475569", marginTop: 3 }}>→ {s.endTime}</span>}
                </div>

                {/* Teams + scores */}
                <div style={{ flex: 1, minWidth: 0, padding: "14px 18px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
                  {[{ name: teamA, wins: winsA, ti: 0 }, { name: teamB, wins: winsB, ti: 1 }].map(({ name, wins, ti }) => {
                    const isWinner = isDone && ((ti === 0 && winsA > winsB) || (ti === 1 && winsB > winsA));
                    return (
                      <div key={ti} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {/* Avatar */}
                        <div style={{
                          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                          background: isWinner ? cc : "rgba(255,255,255,0.06)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 900,
                          color: isWinner ? "#080e1a" : "#94a3b8",
                          fontFamily: "var(--font-space), sans-serif",
                          border: isWinner ? "none" : "1px solid rgba(255,255,255,0.08)",
                        }}>
                          {teamInitials(name)}
                        </div>
                        {/* Name */}
                        <span style={{
                          flex: 1, minWidth: 0, fontSize: 15,
                          fontWeight: isWinner ? 800 : 600,
                          color: isDone && !isWinner ? "#64748b" : "#f1f5f9",
                          fontFamily: "var(--font-space), sans-serif",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {name}
                        </span>
                        {/* Set scores */}
                        {(isDone || isLive) && sets.length > 0 && (
                          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                            {sets.map((set, si) => {
                              const [a, b] = set.split("-").map((n) => parseInt(n.trim()));
                              const mine = ti === 0 ? a : b;
                              const opp  = ti === 0 ? b : a;
                              const won  = mine > opp;
                              return (
                                <span key={si} className="vib-score" style={{
                                  width: 30, height: 34, borderRadius: 8,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 17,
                                  background: won ? cc : "rgba(255,255,255,0.05)",
                                  color: won ? "#080e1a" : "#475569",
                                }}>
                                  {isNaN(mine) ? "–" : mine}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {/* Winner trophy */}
                        {isWinner && <span style={{ fontSize: 16, flexShrink: 0 }}>🏆</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Right meta column */}
                <div style={{
                  flexShrink: 0, width: 150, padding: "14px 16px",
                  borderLeft: "1px solid rgba(255,255,255,0.06)",
                  display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", gap: 8,
                }}>
                  {/* Status badge */}
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "4px 11px", borderRadius: 7,
                    background: isLive ? "#f43f5e" : `${ss.color}1f`,
                    color: isLive ? "#fff" : ss.color,
                    fontSize: 11, fontWeight: 900, letterSpacing: "0.05em",
                    border: isLive ? "none" : `1px solid ${ss.color}40`,
                  }}>
                    {ss.live && <span className="vib-dot" style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }} />}
                    {ss.label}
                  </span>
                  {/* Category chip */}
                  <span style={{ fontSize: 11, fontWeight: 800, color: cc }}>{s.category}</span>
                  {/* Court */}
                  <span style={{ fontSize: 10, color: "#475569", textAlign: "right", lineHeight: 1.3 }}>
                    📍 {s.courtName ?? s.venueName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Mini month calendar (collapsible feel, secondary) ──────────────── */}
      <details style={{ ...panel, marginTop: 6 }}>
        <summary style={{
          padding: "14px 20px", cursor: "pointer", listStyle: "none",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontFamily: "var(--font-space), sans-serif", fontSize: 14, fontWeight: 800, color: "#94a3b8",
        }}>
          <span>📆 Ver mes completo · {MONTHS[initialMonth - 1]} {initialYear}</span>
          <span style={{ fontSize: 12, color: "#475569" }}>▾</span>
        </summary>
        <div style={{ padding: "0 16px 18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "8px 0 6px" }}>
            {DAYS_ABBR.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em" }}>{d}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day    = i + 1;
              const count  = dayCount(day);
              const live   = dayHasLive(day);
              const isSel  = day === selectedDay;
              const isTdy  = isToday(day);
              const dayN   = initialYear * 10000 + initialMonth * 100 + day;
              const isPast = dayN < todayN && !isTdy;
              return (
                <button key={day} onClick={() => setSelectedDay(day)} style={{
                  position: "relative", padding: "8px 2px", borderRadius: 10, minHeight: 52,
                  border: `1px solid ${isSel ? "rgba(163,230,53,0.4)" : "transparent"}`,
                  background: isSel ? "rgba(163,230,53,0.12)" : count > 0 ? "rgba(255,255,255,0.03)" : "transparent",
                  cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  transition: "all .12s", fontFamily: "inherit",
                  opacity: isPast && count === 0 ? 0.3 : 1,
                }}>
                  <span className="vib-score" style={{
                    fontSize: 14,
                    color: isSel ? ACCENT : isTdy ? ACCENT : count > 0 ? "#cbd5e1" : "#334155",
                  }}>{day}</span>
                  {count > 0 && (
                    <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, fontWeight: 800, color: live ? "#f43f5e" : "#64748b" }}>
                      {live && <span className="vib-dot" style={{ width: 4, height: 4, borderRadius: "50%", background: "#f43f5e" }} />}
                      {count}
                    </span>
                  )}
                  {isTdy && <div style={{ position: "absolute", bottom: 3, width: 4, height: 4, borderRadius: "50%", background: ACCENT }} />}
                </button>
              );
            })}
          </div>
        </div>
      </details>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 10,
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
  color: "#94a3b8", cursor: "pointer", fontSize: 18,
  display: "flex", alignItems: "center", justifyContent: "center",
  fontFamily: "inherit",
};
