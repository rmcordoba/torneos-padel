"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AssignScheduleModal } from "./assign-schedule-modal";
import type { getVenuesWithCourts, getUnscheduledMatches } from "@/modules/scheduling/queries";

type CalSlot = {
  id: string;
  day: number;
  startTime: string;
  endTime: string | null;
  matchLabel: string;
  category: string;
  tournamentName: string;
  venueName: string;
  courtName: string | null;
  status: string;
};

type UnscheduledMatch = Awaited<ReturnType<typeof getUnscheduledMatches>>[number];
type Venues          = Awaited<ReturnType<typeof getVenuesWithCourts>>;

interface Props {
  slots:        CalSlot[];
  unscheduled:  UnscheduledMatch[];
  venues:       Venues;
  initialYear:  number;
  initialMonth: number;
  initialDay:   number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS    = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_ABBR = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

// ─── Temporal state ───────────────────────────────────────────────────────────

type Temporal = "completed" | "live" | "today" | "past_unplayed" | "future";

function getTemporalN(): number {
  const n = new Date();
  return n.getFullYear() * 10000 + (n.getMonth() + 1) * 100 + n.getDate();
}

function slotTemporal(slotDay: number, month: number, year: number, status: string): Temporal {
  if (["COMPLETED","WALKOVER","RETIRED","CANCELLED"].includes(status)) return "completed";
  if (status === "IN_PROGRESS") return "live";
  const todayN = getTemporalN();
  const slotN  = year * 10000 + month * 100 + slotDay;
  if (slotN < todayN) return "past_unplayed";
  if (slotN === todayN) return "today";
  return "future";
}

const T_COLOR: Record<Temporal, string> = {
  completed:     "#6b7280",
  live:          "#fbbf24",
  today:         "#a3e635",
  past_unplayed: "#fb923c",
  future:        "#3b82f6",
};
const T_LABEL: Record<Temporal, string> = {
  completed:     "Jugado",
  live:          "En curso",
  today:         "Hoy",
  past_unplayed: "Sin resultado",
  future:        "Programado",
};
const T_ORDER: Temporal[] = ["live","today","future","past_unplayed","completed"];

// ─── Category color ───────────────────────────────────────────────────────────

const CAT_PAL = ["#a3e635","#f472b6","#60a5fa","#fb923c","#a78bfa","#34d399","#fbbf24"];
function catColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return CAT_PAL[Math.abs(h) % CAT_PAL.length];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CalendarioClient({ slots, unscheduled, venues, initialYear, initialMonth, initialDay }: Props) {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<number>(initialDay);
  const [filterCat,   setFilterCat]   = useState("todas");

  const currentYear  = initialYear;
  const currentMonth = initialMonth;
  const todayN       = getTemporalN();

  const now   = new Date();
  const todayY = now.getFullYear();
  const todayM = now.getMonth() + 1;
  const todayD = now.getDate();

  const isToday = (d: number) => d === todayD && currentMonth === todayM && currentYear === todayY;

  const slotsByDay = useMemo(() => {
    const map: Record<number, CalSlot[]> = {};
    slots.forEach((s) => {
      if (!map[s.day]) map[s.day] = [];
      map[s.day].push(s);
    });
    return map;
  }, [slots]);

  const categories = useMemo(() => Array.from(new Set(slots.map((s) => s.category).filter(Boolean))).sort(), [slots]);

  const daysInMonth    = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();

  const goMonth  = (y: number, m: number, d = 1) => router.push(`/dashboard/calendario?year=${y}&month=${m}&day=${d}`);
  const prevMonth = () => currentMonth === 1 ? goMonth(currentYear - 1, 12) : goMonth(currentYear, currentMonth - 1);
  const nextMonth = () => currentMonth === 12 ? goMonth(currentYear + 1, 1) : goMonth(currentYear, currentMonth + 1);
  const goToday  = () => goMonth(todayY, todayM, todayD);

  const daySlots = useMemo(() =>
    (slotsByDay[selectedDay] ?? [])
      .filter((s) => filterCat === "todas" || s.category === filterCat)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [slotsByDay, selectedDay, filterCat]);

  const dayTemporalCounts = useMemo(() => {
    const acc: Partial<Record<Temporal, number>> = {};
    daySlots.forEach((s) => {
      const t = slotTemporal(s.day, currentMonth, currentYear, s.status);
      acc[t] = (acc[t] ?? 0) + 1;
    });
    return acc;
  }, [daySlots, currentMonth, currentYear]);

  // Week containing selectedDay (Mon→Sun)
  const weekDays = useMemo(() => {
    const base = new Date(currentYear, currentMonth - 1, selectedDay || 1);
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
        sameMonth: d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear,
      };
    });
  }, [selectedDay, currentMonth, currentYear]);

  const selectedDateStr = selectedDay
    ? `${currentYear}-${String(currentMonth).padStart(2,"0")}-${String(selectedDay).padStart(2,"0")}`
    : new Date().toISOString().split("T")[0];

  function dayDots(day: number) {
    const dsf = (slotsByDay[day] ?? []).filter((s) => filterCat === "todas" || s.category === filterCat);
    const counts: Partial<Record<Temporal, number>> = {};
    dsf.forEach((s) => {
      const t = slotTemporal(s.day, currentMonth, currentYear, s.status);
      counts[t] = (counts[t] ?? 0) + 1;
    });
    return T_ORDER.filter((t) => counts[t]).map((t) => ({ color: T_COLOR[t], count: counts[t]! }));
  }

  const selectedDayLabel = selectedDay
    ? `${DAYS_ABBR[new Date(currentYear, currentMonth - 1, selectedDay).getDay()]} ${selectedDay} ${MONTHS[currentMonth - 1]}`
    : "Seleccioná un día";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            Calendario de partidos
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-faint)" }}>
            {MONTHS[currentMonth - 1]} {currentYear}
          </p>
        </div>
        <button style={{ padding: "9px 18px", borderRadius: 9, background: "var(--accent)", border: "none", color: "#0f172a", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + Agendar partido
        </button>
      </div>

      {/* Temporal legend + category filter */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {T_ORDER.map((t) => (
          <span key={t} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 20, background: T_COLOR[t] + "14", border: `1px solid ${T_COLOR[t]}30`, fontSize: 11, fontWeight: 600, color: T_COLOR[t] }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T_COLOR[t] }} />
            {T_LABEL[t]}
          </span>
        ))}
        {categories.length > 0 && (
          <>
            <span style={{ width: 1, height: 16, background: "var(--border-subtle)", margin: "0 4px" }} />
            {["todas", ...categories].map((c) => {
              const active = filterCat === c;
              const col    = c === "todas" ? "#a3e635" : catColor(c);
              return (
                <button key={c} onClick={() => setFilterCat(c)} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 11px", borderRadius: 20,
                  border: `1px solid ${active ? col + "55" : "var(--border-default)"}`,
                  background: active ? col + "18" : "transparent",
                  color: active ? col : "var(--text-faint)",
                  fontFamily: "inherit", fontSize: 11, fontWeight: 600, cursor: "pointer",
                }}>
                  {c !== "todas" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: catColor(c), flexShrink: 0 }} />}
                  {c === "todas" ? "Todas" : c}
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* 2-col: calendar | summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 270px", gap: 16, alignItems: "start" }}>

        {/* Calendar grid */}
        <div style={{ background: "oklch(16% 0.012 250)", borderRadius: 14, border: "1px solid var(--border-default)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: 8, background: "oklch(22% 0.012 250)", border: "1px solid var(--border-default)", color: "var(--text-faint)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                {MONTHS[currentMonth - 1]} {currentYear}
              </span>
              <button onClick={goToday} style={{ padding: "3px 10px", borderRadius: 6, background: "oklch(22% 0.012 250)", border: "1px solid var(--border-default)", color: "var(--text-faint)", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>
                Hoy
              </button>
            </div>
            <button onClick={nextMonth} style={{ width: 32, height: 32, borderRadius: 8, background: "oklch(22% 0.012 250)", border: "1px solid var(--border-default)", color: "var(--text-faint)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "10px 14px 6px" }}>
            {DAYS_ABBR.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "var(--text-darkest)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{d}</div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, padding: "4px 14px 16px" }}>
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day      = i + 1;
              const dots     = dayDots(day);
              const hasMtch  = dots.length > 0;
              const isSel    = day === selectedDay;
              const isTdy    = isToday(day);
              const dayN     = currentYear * 10000 + currentMonth * 100 + day;
              const isPast   = dayN < todayN && !isTdy;

              return (
                <button key={day} onClick={() => setSelectedDay(day)} style={{
                  position: "relative", padding: "8px 4px 6px", borderRadius: 9, minHeight: 62,
                  border: `1px solid ${isSel ? "rgba(163,230,53,.5)" : isTdy ? "rgba(163,230,53,.25)" : "transparent"}`,
                  background: isSel ? "rgba(163,230,53,.15)" : isTdy ? "rgba(163,230,53,.06)" : hasMtch ? (isPast ? "oklch(18% 0.008 250)" : "oklch(20% 0.012 250)") : "transparent",
                  cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  transition: "all .1s", fontFamily: "inherit",
                  opacity: isPast && !hasMtch ? 0.45 : 1,
                }}>
                  <span style={{
                    fontSize: 13, fontWeight: isSel || isTdy ? 800 : 400,
                    color: isSel || isTdy ? "#a3e635" : isPast ? "var(--text-darkest)" : "var(--text-muted)",
                    fontFamily: "Space Grotesk, sans-serif",
                    width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "50%",
                    background: isTdy && !isSel ? "rgba(163,230,53,.2)" : "transparent",
                  }}>
                    {day}
                  </span>
                  {dots.length > 0 && (
                    <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", maxWidth: 44 }}>
                      {dots.map(({ color, count }) => (
                        <span key={color} style={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
                          {count > 1 && <span style={{ fontSize: 8, color, fontWeight: 800, lineHeight: 1 }}>{count}</span>}
                        </span>
                      ))}
                    </div>
                  )}
                  {hasMtch && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-darkest)" }}>
                      {dots.reduce((a, d) => a + d.count, 0)}p
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Day summary */}
          <div style={{ background: "oklch(16% 0.012 250)", borderRadius: 14, border: "1px solid var(--border-default)", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 6 }}>
                {selectedDayLabel}
              </div>
              {daySlots.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {T_ORDER.map((t) => {
                    const cnt = dayTemporalCounts[t];
                    if (!cnt) return null;
                    return (
                      <span key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: T_COLOR[t] }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: T_COLOR[t], flexShrink: 0 }} />
                        {cnt} {T_LABEL[t].toLowerCase()}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "var(--text-faint)" }}>Sin partidos</div>
              )}
            </div>
            {selectedDay && (
              <div style={{ padding: "10px 12px" }}>
                <button style={{ width: "100%", padding: "9px", borderRadius: 9, background: "rgba(163,230,53,.12)", border: "1px solid rgba(163,230,53,.25)", color: "#a3e635", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  + Agendar en este día
                </button>
              </div>
            )}
          </div>

          {/* Unscheduled */}
          {unscheduled.length > 0 && (
            <div style={{ background: "oklch(16% 0.012 250)", borderRadius: 14, border: "1px solid var(--border-default)", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Sin horario</span>
                <span style={{ marginLeft: "auto", minWidth: 20, height: 20, borderRadius: 10, background: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#0f172a", padding: "0 6px" }}>
                  {unscheduled.length}
                </span>
              </div>
              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {unscheduled.map((match) => {
                  const tc    = match.stage.tournamentCategory;
                  const names = match.teams.map((mt) =>
                    mt.team.players.map((p) => p.playerProfile.lastName).join("/")
                  );
                  return (
                    <div key={match.id} style={{ padding: "10px 14px", borderBottom: "1px solid oklch(20% 0.01 250)" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 2 }}>
                        {names[0] ?? "TBD"} vs {names[1] ?? "TBD"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 6 }}>
                        {tc.tournament.name} · {tc.category.name}
                      </div>
                      <AssignScheduleModal match={match} venues={venues} selectedDate={selectedDateStr} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Week strip */}
      <div style={{ background: "oklch(16% 0.012 250)", borderRadius: 14, border: "1px solid var(--border-default)", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
          {weekDays.map(({ label, day, month, year, sameMonth }, i) => {
            const dsf      = sameMonth ? (slotsByDay[day] ?? []).filter((s) => filterCat === "todas" || s.category === filterCat) : [];
            const isActive = sameMonth && day === selectedDay;
            const isTdyW   = isToday(day) && sameMonth;
            const wDayN    = year * 10000 + month * 100 + day;
            const isPastW  = wDayN < todayN && !isTdyW;
            const wDots    = (() => {
              const counts: Partial<Record<Temporal, number>> = {};
              dsf.forEach((s) => {
                const t = slotTemporal(s.day, currentMonth, currentYear, s.status);
                counts[t] = (counts[t] ?? 0) + 1;
              });
              return T_ORDER.filter((t) => counts[t]).map((t) => ({ color: T_COLOR[t], count: counts[t]! }));
            })();

            return (
              <button
                key={i}
                onClick={() => { if (sameMonth) setSelectedDay(day); else goMonth(year, month, day); }}
                style={{
                  padding: "12px 8px", border: "none",
                  borderRight: i < 6 ? "1px solid oklch(22% 0.01 250)" : "none",
                  background: isActive ? "rgba(163,230,53,.1)" : isTdyW ? "rgba(163,230,53,.04)" : "transparent",
                  cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  transition: "background .12s", fontFamily: "inherit",
                  opacity: isPastW && dsf.length === 0 ? 0.4 : 1,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: isTdyW ? "#a3e635" : isPastW ? "var(--text-darkest)" : "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {label} {day}
                </span>
                {isTdyW && <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 10, background: "rgba(163,230,53,.2)", color: "#a3e635", fontWeight: 800 }}>HOY</span>}
                <span style={{ fontSize: 20, fontWeight: 800, color: isActive ? "#a3e635" : isPastW ? "var(--text-darkest)" : "var(--text-faint)", fontFamily: "Space Grotesk, sans-serif" }}>
                  {dsf.length}
                </span>
                <span style={{ fontSize: 10, color: "var(--text-darkest)" }}>partido{dsf.length !== 1 ? "s" : ""}</span>
                {wDots.length > 0 && (
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center" }}>
                    {wDots.map(({ color, count }) => (
                      <span key={color} style={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                        {count > 1 && <span style={{ fontSize: 8, color, fontWeight: 800 }}>{count}</span>}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Agenda del día — tabla completa ── */}
      <div style={{ background: "oklch(16% 0.012 250)", borderRadius: 14, border: "1px solid var(--border-default)", overflow: "hidden" }}>

        {/* Section header */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
              Agenda · {selectedDayLabel}
            </span>
            {daySlots.length > 0 && (
              <span style={{ marginLeft: 10, fontSize: 12, color: "var(--text-dimmer)" }}>
                {daySlots.length} partido{daySlots.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {/* Temporal summary chips */}
          <div style={{ display: "flex", gap: 8 }}>
            {T_ORDER.map((t) => {
              const cnt = dayTemporalCounts[t];
              if (!cnt) return null;
              return (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: T_COLOR[t], background: T_COLOR[t] + "18", padding: "3px 10px", borderRadius: 20 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: T_COLOR[t] }} />
                  {cnt} {T_LABEL[t].toLowerCase()}
                </span>
              );
            })}
          </div>
        </div>

        {daySlots.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10, opacity: .35 }}>📅</div>
            <div style={{ fontSize: 14, color: "var(--text-dimmer)" }}>
              {selectedDay ? "Sin partidos este día" : "Seleccioná un día del calendario"}
            </div>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "80px 160px 1fr 150px 160px", gap: 12, padding: "8px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
              {["Hora","Cancha","Partido","Categoría","Estado"].map((h) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-darkest)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
              ))}
            </div>

            {/* Table rows */}
            {daySlots.map((s, i) => {
              const t        = slotTemporal(s.day, currentMonth, currentYear, s.status);
              const tc       = T_COLOR[t];
              const tl       = T_LABEL[t];
              const cc       = catColor(s.category);
              const isPlayed = t === "completed";
              const isLive   = t === "live";
              const isWarn   = t === "past_unplayed";

              return (
                <div
                  key={s.id}
                  style={{
                    display: "grid", gridTemplateColumns: "80px 160px 1fr 150px 160px",
                    gap: 12, padding: "14px 20px", alignItems: "center",
                    background: isLive ? `${tc}08` : isPlayed ? "oklch(17% 0.007 250)" : "transparent",
                    borderLeft: `3px solid ${tc}`,
                    borderBottom: i < daySlots.length - 1 ? "1px solid oklch(20% 0.01 250)" : "none",
                    opacity: isPlayed ? 0.72 : 1,
                    transition: "background .15s",
                  }}
                  onMouseEnter={(e) => { if (!isPlayed) e.currentTarget.style.background = `${tc}06`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isLive ? `${tc}08` : isPlayed ? "oklch(17% 0.007 250)" : "transparent"; }}
                >
                  {/* Hora */}
                  <span style={{ fontSize: 16, fontWeight: 800, color: isLive ? tc : isPlayed ? "var(--text-faint)" : "var(--text-primary)", fontFamily: "Space Grotesk, sans-serif" }}>
                    {s.startTime}
                  </span>

                  {/* Cancha */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isPlayed ? "var(--text-faint)" : "var(--text-secondary)" }}>
                      {s.courtName ?? s.venueName}
                    </div>
                    {s.courtName && (
                      <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{s.venueName}</div>
                    )}
                  </div>

                  {/* Partido */}
                  <span style={{ fontSize: 13, fontWeight: 600, color: isPlayed ? "var(--text-faint)" : "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.matchLabel}
                  </span>

                  {/* Categoría */}
                  <span style={{ fontSize: 11, fontWeight: 700, color: cc, background: cc + "18", padding: "3px 9px", borderRadius: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                    {s.category}
                  </span>

                  {/* Estado */}
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 11, fontWeight: 700, color: tc,
                    background: tc + "18", padding: "4px 10px", borderRadius: 20,
                    width: "fit-content",
                  }}>
                    {isLive && <span style={{ width: 5, height: 5, borderRadius: "50%", background: tc, animation: "pulse-dot 1.2s infinite", flexShrink: 0 }} />}
                    {isWarn && "⚠ "}
                    {tl}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
