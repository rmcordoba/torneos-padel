import { getPublicRankingTables } from "@/modules/public/queries";
import { scopedOrg, plink } from "@/lib/portal-scope";
import type { Metadata } from "next";
import Link from "next/link";

const DEFAULT_RULES = [
  { placement: 1, points: 100, description: "Campeón" },
  { placement: 2, points: 60,  description: "Finalista" },
  { placement: 3, points: 40,  description: "Semifinalista" },
  { placement: 4, points: 20,  description: "Cuartofinalista" },
  { placement: 99, points: 10, description: "Participación" },
];

const PLACEMENT_LABELS: Record<number, string> = { 1: "1° lugar", 2: "2° lugar", 3: "3° lugar", 4: "4° lugar", 99: "Participación" };
const PLACEMENT_MEDALS: Record<number, string>  = { 1: "🥇", 2: "🥈", 3: "🥉", 4: "🏅", 99: "🎾" };

export const metadata: Metadata = { title: "Ranking — PádelPro" };

const MAX       = 1140;
const ACCENT    = "#a3e635";
const PAGE_SIZE = 8;

// Podium visual order: [silver, gold, bronze] — gold in center (index 1)
const PODIUM = [
  { emoji: "🥈", className: "podium-silver", accentColor: "#94a3b8", height: 200, mt: 60, rank: "2°"  },
  { emoji: "🥇", className: "podium-gold",   accentColor: "#fbbf24", height: 260, mt: 0,  rank: "1°"  },
  { emoji: "🥉", className: "podium-bronze", accentColor: "#cd7c2f", height: 180, mt: 80, rank: "3°"  },
];

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ tabla?: string; pagina?: string }>;
}) {
  const { tabla: tablaParam, pagina: paginaParam } = await searchParams;
  const tables = await getPublicRankingTables(scopedOrg());

  if (tables.length === 0) {
    return (
      <div style={{ maxWidth: MAX, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.1 }}>🏆</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#94a3b8", fontFamily: "var(--font-space), sans-serif", marginBottom: 8 }}>Sin rankings publicados</h2>
        <p style={{ fontSize: 14, color: "#475569" }}>Los rankings estarán disponibles cuando el organizador los configure.</p>
      </div>
    );
  }

  const activeTableId = tablaParam ?? tables[0]?.id;
  const activeTable   = tables.find((t) => t.id === activeTableId) ?? tables[0];
  const entries       = activeTable?.entries ?? [];

  const currentPage      = Math.max(1, parseInt(paginaParam ?? "1", 10));
  const totalPages       = Math.ceil(entries.length / PAGE_SIZE);
  const safePage         = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedEntries = entries.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const top3             = entries.slice(0, 3);
  const showPodium       = safePage === 1 && top3.length >= 2;

  function playerName(entry: (typeof entries)[number]) {
    if (entry.team) return entry.team.players.map((p) => `${p.playerProfile.firstName} ${p.playerProfile.lastName}`).join(" / ");
    return `${entry.playerProfile.firstName} ${entry.playerProfile.lastName}`;
  }

  function playerInitials(entry: (typeof entries)[number]) {
    if (entry.team && entry.team.players.length > 0) return entry.team.players.map((p) => p.playerProfile.lastName[0] ?? "?").join("");
    const p = entry.playerProfile;
    return (p.firstName[0] ?? "") + (p.lastName[0] ?? "");
  }

  // Silver, Gold, Bronze visual order
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <div style={{ maxWidth: MAX, margin: "0 auto", padding: "40px 24px" }}>

      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 4 }}
          className="grad-text">
          Ranking
        </h1>
        <p style={{ fontSize: 14, color: "#475569" }}>Temporada 2026</p>
      </div>

      {/* Table selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 40, flexWrap: "wrap" }}>
        {tables.map((t) => {
          const active = t.id === activeTableId;
          return (
            <Link
              key={t.id}
              href={plink(`/ranking?tabla=${t.id}`)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 20px", borderRadius: 100, fontSize: 14, fontWeight: 700,
                textDecoration: "none", transition: "all .15s",
                border: `1px solid ${active ? "rgba(163,230,53,0.3)" : "rgba(255,255,255,0.08)"}`,
                background: active ? "rgba(163,230,53,0.12)" : "rgba(255,255,255,0.04)",
                color: active ? ACCENT : "#64748b",
                boxShadow: active ? "0 0 20px rgba(163,230,53,0.12), 0 0 0 4px rgba(163,230,53,0.05)" : "none",
              }}
            >
              {t.name}
              {t.season && <span style={{ fontSize: 11, opacity: 0.5, fontWeight: 500 }}>{t.season}</span>}
            </Link>
          );
        })}
      </div>

      {entries.length === 0 ? (
        <div style={{ borderRadius: 20, border: "2px dashed rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", padding: "64px 0", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
          <p style={{ fontSize: 14, color: "#64748b" }}>Sin entradas en este ranking todavía.</p>
        </div>
      ) : (
        <>
          {/* ── Dramatic podium ── */}
          {showPodium && (
            <div style={{ marginBottom: 48 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 24, textAlign: "center" }}>
                Top 3
              </p>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 12, maxWidth: 580, margin: "0 auto" }}>
                {podiumOrder.map((entry, pIdx) => {
                  const cfg = PODIUM[pIdx];
                  return (
                    <div
                      key={entry.id}
                      className={`${cfg.className} card-animate card-d${pIdx}`}
                      style={{
                        flex: 1, maxWidth: 180,
                        borderRadius: 20,
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        height: cfg.height,
                        marginTop: cfg.mt,
                        display: "flex", flexDirection: "column", alignItems: "center",
                        justifyContent: "center", gap: 10, padding: 20,
                        textAlign: "center", position: "relative", overflow: "hidden",
                      }}
                    >
                      {/* Rank label — top */}
                      <div style={{
                        position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
                        fontSize: 11, fontWeight: 800, color: cfg.accentColor, letterSpacing: "0.04em",
                        opacity: 0.7,
                      }}>
                        {cfg.rank}
                      </div>

                      {/* Big emoji */}
                      <div style={{ fontSize: 32 }}>{cfg.emoji}</div>

                      {/* Avatar initials */}
                      <div style={{
                        width: 52, height: 52, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, fontWeight: 800, color: cfg.accentColor,
                        fontFamily: "var(--font-space), sans-serif",
                        background: `${cfg.accentColor}18`,
                        border: `2px solid ${cfg.accentColor}40`,
                        boxShadow: `0 0 20px ${cfg.accentColor}20`,
                      }}>
                        {playerInitials(entry).toUpperCase().slice(0, 2)}
                      </div>

                      {/* Name */}
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.3, maxWidth: "100%" }}>
                        {playerName(entry)}
                      </div>

                      {/* Points — large */}
                      <div style={{
                        fontFamily: "var(--font-space), sans-serif",
                        fontSize: pIdx === 1 ? 28 : 22,
                        fontWeight: 900,
                        color: cfg.accentColor,
                        lineHeight: 1,
                      }}>
                        {entry.points}
                        <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.6, marginLeft: 4 }}>pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Full table ── */}
          <div className="glass" style={{ borderRadius: 20, overflow: "hidden" }}>
            {/* Header row */}
            <div style={{
              display: "grid", gridTemplateColumns: "52px 1fr 100px 80px", gap: 12,
              padding: "12px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.03)",
            }}>
              {["#", "Pareja / Jugador", "Puntos", "Torneos"].map((h) => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
              ))}
            </div>

            {paginatedEntries.map((entry, idx) => {
              const globalIdx = (safePage - 1) * PAGE_SIZE + idx;
              const isFirst   = globalIdx === 0;
              const isTop3    = globalIdx < 3;
              const accentCol = isFirst ? "#fbbf24" : globalIdx === 1 ? "#94a3b8" : globalIdx === 2 ? "#cd7c2f" : ACCENT;
              return (
                <div
                  key={entry.id}
                  style={{
                    display: "grid", gridTemplateColumns: "52px 1fr 100px 80px", gap: 12,
                    padding: "16px 24px",
                    borderBottom: idx < paginatedEntries.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    alignItems: "center",
                    background: isFirst ? "rgba(251,191,36,0.04)" : "transparent",
                    transition: "background .15s",
                  }}
                >
                  <span style={{
                    fontSize: isTop3 ? 16 : 14, fontWeight: 900,
                    fontFamily: "var(--font-space), sans-serif", textAlign: "center",
                    color: isTop3 ? accentCol : "#334155",
                  }}>
                    {entry.position}
                  </span>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 800, fontFamily: "var(--font-space), sans-serif",
                      background: isFirst ? "rgba(251,191,36,0.12)" : "rgba(163,230,53,0.08)",
                      color: isFirst ? "#fbbf24" : ACCENT,
                      border: `1.5px solid ${isFirst ? "rgba(251,191,36,0.25)" : "rgba(163,230,53,0.2)"}`,
                    }}>
                      {playerInitials(entry).toUpperCase().slice(0, 2)}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {playerName(entry)}
                    </span>
                  </div>

                  <span style={{ fontSize: isTop3 ? 18 : 15, fontWeight: 900, fontFamily: "var(--font-space), sans-serif", textAlign: "center", color: isTop3 ? accentCol : "#94a3b8" }}>
                    {entry.points}
                  </span>

                  <span style={{ fontSize: 13, color: "#475569", textAlign: "center" }}>{entry.tournamentsPlayed}</span>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20 }}>
              {safePage > 1 ? (
                <Link href={plink(`/ranking?tabla=${activeTableId}&pagina=${safePage - 1}`)} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "8px 18px", borderRadius: 100, fontSize: 13, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#94a3b8" }}>← Anterior</Link>
              ) : (
                <span style={{ padding: "8px 18px", borderRadius: 100, fontSize: 13, fontWeight: 600, border: "1px solid rgba(255,255,255,0.04)", color: "#334155", background: "rgba(255,255,255,0.02)" }}>← Anterior</span>
              )}
              <span style={{ fontSize: 13, color: "#475569", padding: "0 8px" }}>Pág. {safePage} / {totalPages}</span>
              {safePage < totalPages ? (
                <Link href={plink(`/ranking?tabla=${activeTableId}&pagina=${safePage + 1}`)} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "8px 18px", borderRadius: 100, fontSize: 13, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#94a3b8" }}>Siguiente →</Link>
              ) : (
                <span style={{ padding: "8px 18px", borderRadius: 100, fontSize: 13, fontWeight: 600, border: "1px solid rgba(255,255,255,0.04)", color: "#334155", background: "rgba(255,255,255,0.02)" }}>Siguiente →</span>
              )}
            </div>
          )}
        </>
      )}

      {/* Points criteria */}
      {activeTable && (
        <div style={{ marginTop: 48, paddingTop: 40, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9", fontFamily: "var(--font-space), sans-serif", marginBottom: 6 }}>
            Criterio de puntuación
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>
            Puntos por posición final en cada torneo{activeTable.rules.length === 0 && " (valores por defecto)"}.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {(activeTable.rules.length > 0 ? activeTable.rules : DEFAULT_RULES).map((rule) => {
              const isGold = rule.placement === 1;
              const isPart = rule.placement === 99;
              return (
                <div key={rule.placement} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 20px", borderRadius: 14,
                  background: isGold ? "rgba(251,191,36,0.08)" : isPart ? "rgba(255,255,255,0.03)" : "rgba(163,230,53,0.06)",
                  border: `1px solid ${isGold ? "rgba(251,191,36,0.22)" : isPart ? "rgba(255,255,255,0.07)" : "rgba(163,230,53,0.15)"}`,
                  minWidth: 140,
                }}>
                  <span style={{ fontSize: 24 }}>{PLACEMENT_MEDALS[rule.placement] ?? "🏅"}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {rule.description || PLACEMENT_LABELS[rule.placement] || `${rule.placement}° lugar`}
                    </p>
                    <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: isGold ? "#fbbf24" : isPart ? "#64748b" : ACCENT, fontFamily: "var(--font-space), sans-serif" }}>
                      {rule.points}<span style={{ fontSize: 11, fontWeight: 500, marginLeft: 4 }}>pts</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 12, color: "#334155", marginTop: 16 }}>
            Los puntos se acumulan a lo largo de la temporada. El ranking se actualiza al finalizar cada torneo.
          </p>
        </div>
      )}
    </div>
  );
}
