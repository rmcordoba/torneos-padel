import { getPublicRankingTables } from "@/modules/public/queries";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Ranking — PádelPro" };

const MAX = 1140;
const G   = "#16a34a";

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ tabla?: string }>;
}) {
  const { tabla: tablaParam } = await searchParams;
  const tables = await getPublicRankingTables();

  if (tables.length === 0) {
    return (
      <div style={{ maxWidth: MAX, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif", marginBottom: 8 }}>Sin rankings publicados</h2>
        <p style={{ fontSize: 13, color: "#94a3b8" }}>Los rankings estarán disponibles cuando el organizador los configure.</p>
      </div>
    );
  }

  const activeTableId = tablaParam ?? tables[0]?.id;
  const activeTable   = tables.find((t) => t.id === activeTableId) ?? tables[0];
  const entries = activeTable?.entries ?? [];
  const top3    = entries.slice(0, 3);
  const rest    = entries.slice(3);

  function playerName(entry: (typeof entries)[number]) {
    if (entry.team) {
      return entry.team.players
        .map((p) => `${p.playerProfile.firstName} ${p.playerProfile.lastName}`)
        .join(" / ");
    }
    return `${entry.playerProfile.firstName} ${entry.playerProfile.lastName}`;
  }

  function playerInitials(entry: (typeof entries)[number]) {
    if (entry.team && entry.team.players.length > 0) {
      return entry.team.players.map((p) => p.playerProfile.lastName[0] ?? "?").join("");
    }
    const p = entry.playerProfile;
    return (p.firstName[0] ?? "") + (p.lastName[0] ?? "");
  }

  const podiumOrder  = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumEmojis = ["🥈", "🥇", "🥉"];
  const podiumStyles = [
    { bg: "#f8fafc",                                      border: "#e2e8f0" },
    { bg: "linear-gradient(145deg,#fef9c3,#fef08a)",      border: "#fbbf24" },
    { bg: "#fff",                                         border: "#fde68a" },
  ];

  return (
    <div style={{ maxWidth: MAX, margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif", marginBottom: 4 }}>
          Ranking
        </h1>
        <p style={{ fontSize: 13, color: "#94a3b8" }}>Temporada 2026</p>
      </div>

      {/* Table selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
        {tables.map((t) => {
          const active = t.id === activeTableId;
          return (
            <Link
              key={t.id}
              href={`/ranking?tabla=${t.id}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "8px 16px", borderRadius: 40, fontSize: 13, fontWeight: 600,
                textDecoration: "none",
                border: `1px solid ${active ? G : "#e2e8f0"}`,
                background: active ? "#f0fdf4" : "#fff",
                color: active ? "#15803d" : "#64748b",
                boxShadow: active ? "0 0 0 3px #d1fae5" : "none",
              }}
            >
              {t.name}
              {t.season && <span style={{ fontSize: 10, opacity: 0.6 }}>{t.season}</span>}
            </Link>
          );
        })}
      </div>

      {entries.length === 0 ? (
        <div style={{ borderRadius: 16, border: "2px dashed #e2e8f0", background: "#fff", padding: "56px 0", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div>
          <p style={{ fontSize: 13, color: "#94a3b8" }}>Sin entradas en este ranking todavía.</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length >= 2 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28, maxWidth: 560 }}>
              {podiumOrder.map((entry, pIdx) => (
                <div
                  key={entry.id}
                  style={{
                    borderRadius: 16, border: `2px solid ${podiumStyles[pIdx].border}`,
                    padding: "20px 12px", textAlign: "center",
                    background: podiumStyles[pIdx].bg,
                    boxShadow: pIdx === 1 ? "0 6px 24px rgba(251,191,36,.2)" : "0 1px 4px rgba(0,0,0,.05)",
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{podiumEmojis[pIdx]}</div>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, margin: "0 auto 8px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 800, fontFamily: "Space Grotesk, sans-serif",
                    background: pIdx === 1 ? "rgba(251,191,36,0.2)" : "#f0fdf4",
                    color: pIdx === 1 ? "#92400e" : "#15803d",
                  }}>
                    {playerInitials(entry).toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif", marginBottom: 4, lineHeight: 1.3 }}>
                    {playerName(entry)}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: G, fontFamily: "Space Grotesk, sans-serif" }}>{entry.points}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>puntos</div>
                </div>
              ))}
            </div>
          )}

          {/* Full table */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            {/* Header row */}
            <div style={{ display: "grid", gridTemplateColumns: "50px 1fr 100px 80px", gap: 12, padding: "12px 20px", borderBottom: "1px solid #f1f5f9" }}>
              {["#", "Pareja / Jugador", "Puntos", "Torneos"].map((h) => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
              ))}
            </div>

            {entries.map((entry, idx) => (
              <div
                key={entry.id}
                style={{
                  display: "grid", gridTemplateColumns: "50px 1fr 100px 80px", gap: 12,
                  padding: "14px 20px", borderBottom: idx < entries.length - 1 ? "1px solid #f8fafc" : "none",
                  alignItems: "center",
                  background: idx === 0 ? "#f0fdf4" : undefined,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 800, textAlign: "center", fontFamily: "Space Grotesk, sans-serif", color: idx < 3 ? G : "#94a3b8" }}>
                  {entry.position}
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif",
                    background: idx === 0 ? "#fef9c3" : "#f0fdf4",
                    color: idx === 0 ? "#92400e" : "#15803d",
                  }}>
                    {playerInitials(entry).toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {playerName(entry)}
                  </div>
                </div>

                <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "Space Grotesk, sans-serif", textAlign: "center", color: idx === 0 ? G : "#334155" }}>
                  {entry.points}
                </span>

                <span style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>{entry.tournamentsPlayed}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
