import Link from "next/link";
import { getPublicScheduleForDate, getPublicScheduleDays, getPublicFeaturedTournament } from "@/modules/public/queries";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Agenda — PádelPro" };

const MAX = 1140;
const G   = "#16a34a";

const MATCH_STATUS_STYLE: Record<string, { bg: string; border: string; color: string; dot?: boolean; label: string }> = {
  SCHEDULED:   { bg: "#fff",    border: "#e2e8f0", color: "#64748b", label: "Programado" },
  IN_PROGRESS: { bg: "#f0fdf4", border: "#bbf7d0", color: G,         dot: true, label: "En curso" },
  COMPLETED:   { bg: "#fff",    border: "#e2e8f0", color: "#94a3b8", label: "Jugado" },
  WALKOVER:    { bg: "#fff",    border: "#e2e8f0", color: "#94a3b8", label: "W/O" },
  CANCELLED:   { bg: "#fff",    border: "#fecaca", color: "#ef4444", label: "Cancelado" },
  POSTPONED:   { bg: "#fffbeb", border: "#fde68a", color: "#92400e", label: "Postergado" },
};

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date: dateParam } = await searchParams;
  const [scheduleDays, featured] = await Promise.all([
    getPublicScheduleDays(),
    getPublicFeaturedTournament(),
  ]);

  const today    = new Date();
  const todayISO = today.toISOString().split("T")[0];
  const allDays  = Array.from(
    new Set([todayISO, ...scheduleDays.map((d) => new Date(d).toISOString().split("T")[0])])
  ).slice(0, 10);

  const activeDateISO = dateParam ?? todayISO;
  const slots = await getPublicScheduleForDate(activeDateISO);

  function dayLabel(iso: string) {
    return new Date(`${iso}T12:00:00Z`).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
  }
  function timeLabel(dt: Date | string) {
    return new Date(dt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div style={{ maxWidth: MAX, margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif", marginBottom: 4 }}>
          Agenda de partidos
        </h1>
        <p style={{ fontSize: 13, color: "#94a3b8" }}>
          {featured ? `${featured.name} · ` : ""}Horarios en tiempo real
        </p>
      </div>

      {/* Day selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, overflowX: "auto", paddingBottom: 4 }}>
        {allDays.map((iso) => {
          const active  = iso === activeDateISO;
          const isToday = iso === todayISO;
          return (
            <Link
              key={iso}
              href={`/agenda?date=${iso}`}
              style={{
                flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 8,
                padding: "8px 16px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                textDecoration: "none",
                borderColor: active ? G : "#e2e8f0",
                border: `1px solid ${active ? G : "#e2e8f0"}`,
                background: active ? "#f0fdf4" : "#fff",
                color: active ? "#15803d" : "#64748b",
                boxShadow: active ? "0 0 0 3px #d1fae5" : "none",
              }}
            >
              {dayLabel(iso)}
              {isToday && (
                <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", padding: "1px 6px", borderRadius: 20, background: G, color: "#fff" }}>
                  HOY
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Schedule list */}
      {slots.length === 0 ? (
        <div style={{ borderRadius: 16, border: "2px dashed #e2e8f0", background: "#fff", padding: "64px 0", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#334155", fontFamily: "Space Grotesk, sans-serif", marginBottom: 4 }}>
            Sin partidos programados
          </h3>
          <p style={{ fontSize: 13, color: "#94a3b8" }}>Los horarios del {dayLabel(activeDateISO)} no están disponibles aún.</p>
          <p style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4 }}>Los horarios se publican 24h antes.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {slots.map((slot) => {
            const match  = slot.match;
            const status = match?.status ?? "SCHEDULED";
            const ss     = MATCH_STATUS_STYLE[status] ?? MATCH_STATUS_STYLE.SCHEDULED;
            const t1     = match?.teams.find((t) => t.side === 1);
            const t2     = match?.teams.find((t) => t.side === 2);
            const names1 = t1?.team.players.map((p) => `${p.playerProfile.firstName[0]}. ${p.playerProfile.lastName}`).join(" / ") ?? "—";
            const names2 = t2?.team.players.map((p) => `${p.playerProfile.firstName[0]}. ${p.playerProfile.lastName}`).join(" / ") ?? "—";
            const cat    = match?.stage.tournamentCategory.category.name;
            const court  = slot.courtAssignment?.court.name;
            const done   = status === "COMPLETED" || status === "WALKOVER";
            const score  = match?.sets.map((s) => `${s.games1}-${s.games2}`).join(", ");
            const winner = match?.result?.winnerId;

            return (
              <div
                key={slot.id}
                style={{ display: "flex", alignItems: "center", gap: 16, borderRadius: 16, border: `1px solid ${ss.border}`, padding: "16px 20px", background: ss.bg }}
              >
                {/* Time */}
                <div style={{ flexShrink: 0, textAlign: "center", width: 64, color: status === "IN_PROGRESS" ? G : "#0f172a" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "Space Grotesk, sans-serif", lineHeight: 1.1 }}>
                    {timeLabel(slot.startTime)}
                  </div>
                  {slot.endTime && (
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{timeLabel(slot.endTime)}</div>
                  )}
                </div>

                {/* Match info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {match ? (
                    <>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span style={{ fontWeight: done && winner === t1?.teamId ? 800 : 600, color: done && winner === t1?.teamId ? "#15803d" : "#1e293b" }}>{names1}</span>
                        <span style={{ color: "#94a3b8", margin: "0 6px", fontWeight: 400 }}>vs</span>
                        <span style={{ fontWeight: done && winner === t2?.teamId ? 800 : 600, color: done && winner === t2?.teamId ? "#15803d" : "#1e293b" }}>{names2}</span>
                      </div>
                      {done && score && <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>{score}</div>}
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        {court && <span>📍 {court}</span>}
                        {cat && <span style={{ marginLeft: 8 }}>{cat}</span>}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 14, color: "#94a3b8", fontStyle: "italic" }}>Partido sin asignar</div>
                  )}
                </div>

                {/* Status badge */}
                <div style={{ flexShrink: 0 }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                    padding: "4px 10px", borderRadius: 20,
                    background: ss.color + "18", color: ss.color,
                  }}>
                    {ss.dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: ss.color, animation: "pulse 1.4s infinite", display: "inline-block" }} />}
                    {ss.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
