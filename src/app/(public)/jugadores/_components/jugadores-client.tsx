"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  teamPlayers: Array<{
    team: {
      registrations: Array<{
        tournamentCategory: {
          tournament: { name: string; startDate: Date; endDate: Date };
          category: { name: string };
        };
      }>;
    };
  }>;
  rankingEntries: Array<{
    position: number;
    points: number;
    tournamentsPlayed: number;
    rankingTable: { name: string };
  }>;
};

const ACCENT        = "#a3e635";
const ACCENT_BG     = "rgba(163,230,53,0.10)";
const ACCENT_BORDER = "rgba(163,230,53,0.22)";
const GLASS         = "rgba(12,22,45,0.72)";
const GLASS_BD      = "rgba(255,255,255,0.08)";

function initials(p: Player) {
  return ((p.firstName[0] ?? "") + (p.lastName[0] ?? "")).toUpperCase();
}

function playerCategories(p: Player): string[] {
  const cats = new Set<string>();
  for (const tp of p.teamPlayers)
    for (const reg of tp.team.registrations)
      cats.add(reg.tournamentCategory.category.name);
  return Array.from(cats);
}

function playerTournaments(p: Player) {
  const map = new Map<string, { name: string; cat: string; date: Date }>();
  for (const tp of p.teamPlayers)
    for (const reg of tp.team.registrations) {
      const key = reg.tournamentCategory.tournament.name;
      map.set(key, {
        name: reg.tournamentCategory.tournament.name,
        cat:  reg.tournamentCategory.category.name,
        date: new Date(reg.tournamentCategory.tournament.startDate),
      });
    }
  return Array.from(map.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
}

function PlayerModal({ player, onClose }: { player: Player; onClose: () => void }) {
  const cats        = playerCategories(player);
  const tournaments = playerTournaments(player);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(2,6,18,0.75)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: "100%", maxWidth: 440, borderRadius: 24,
        background: "rgba(8,16,36,0.96)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
        overflow: "hidden",
        animation: "slideUpModal .28s cubic-bezier(.22,1,.36,1)",
      }}>
        {/* Header gradient */}
        <div style={{
          position: "relative",
          background: "linear-gradient(135deg, rgba(6,14,30,1) 0%, rgba(12,22,45,1) 60%, rgba(163,230,53,0.08) 100%)",
          borderBottom: "1px solid rgba(163,230,53,0.12)",
          padding: "28px 24px 22px",
        }}>
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", color: "#64748b" }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: ACCENT_BG,
              border: `2px solid ${ACCENT_BORDER}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 800, color: ACCENT,
              fontFamily: "var(--font-space), sans-serif", flexShrink: 0,
              boxShadow: "0 0 20px rgba(163,230,53,0.15)",
            }}>
              {initials(player)}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", fontFamily: "var(--font-space), sans-serif" }}>
              {player.firstName} {player.lastName}
            </div>
          </div>
          {player.rankingEntries.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
              {player.rankingEntries.map((r, i) => (
                <span key={i} style={{
                  fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                  background: r.position === 1 ? "rgba(251,191,36,0.12)" : ACCENT_BG,
                  color: r.position === 1 ? "#fbbf24" : ACCENT,
                  border: `1px solid ${r.position === 1 ? "rgba(251,191,36,0.25)" : ACCENT_BORDER}`,
                }}>
                  #{r.position} {r.rankingTable.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats bar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {[
            { label: "Torneos",    value: tournaments.length,                                          color: "#60a5fa" },
            { label: "Categorías", value: cats.length,                                                 color: ACCENT   },
            { label: "Puntos",     value: player.rankingEntries.reduce((a, r) => a + r.points, 0),    color: "#f1f5f9" },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: "16px 0", textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "var(--font-space), sans-serif" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Categories */}
        {cats.length > 0 && (
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Categorías</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {cats.map((c) => (
                <span key={c} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: ACCENT_BG, color: ACCENT, border: `1px solid ${ACCENT_BORDER}`, fontWeight: 500 }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        <div style={{ padding: "16px 20px", maxHeight: 200, overflowY: "auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Historial de torneos</div>
          {tournaments.length === 0 ? (
            <p style={{ fontSize: 13, color: "#475569", textAlign: "center", padding: "16px 0" }}>Sin historial aún</p>
          ) : (
            <div>
              {tournaments.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < tournaments.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{t.cat}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#475569", flexShrink: 0, marginLeft: 12 }}>
                    {t.date.toLocaleDateString("es-AR", { month: "short", year: "numeric" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          <button
            onClick={onClose}
            style={{ width: "100%", padding: "10px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", fontSize: 13, fontWeight: 600, color: "#94a3b8", cursor: "pointer", fontFamily: "inherit" }}
          >
            Cerrar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUpModal {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

export function JugadoresGrid({ players }: { players: Player[] }) {
  const [selected, setSelected] = useState<Player | null>(null);

  if (players.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 0", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.12 }}>👤</div>
        <p style={{ fontSize: 13, color: "#64748b" }}>No se encontraron jugadores con ese criterio.</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(248px, 1fr))", gap: 16 }}>
        {players.map((p, idx) => {
          const cats           = playerCategories(p);
          const tournamentCount = new Set(
            p.teamPlayers.flatMap((tp) => tp.team.registrations.map((r) => r.tournamentCategory.tournament.name))
          ).size;
          const topRanking  = p.rankingEntries[0];
          const bestPos     = topRanking?.position;
          const totalPoints = p.rankingEntries.reduce((a, r) => a + r.points, 0);

          // Tier color by best ranking position (FIFA-card vibe)
          const tier =
            bestPos === 1 ? { c: "#fbbf24", glow: "rgba(251,191,36,0.3)", label: "TOP 1", grad: "linear-gradient(135deg, rgba(251,191,36,0.22) 0%, rgba(251,146,60,0.06) 55%, transparent 100%)" } :
            bestPos === 2 ? { c: "#cbd5e1", glow: "rgba(203,213,225,0.25)", label: "TOP 2", grad: "linear-gradient(135deg, rgba(203,213,225,0.18) 0%, transparent 60%)" } :
            bestPos === 3 ? { c: "#fb923c", glow: "rgba(251,146,60,0.25)", label: "TOP 3", grad: "linear-gradient(135deg, rgba(251,146,60,0.18) 0%, transparent 60%)" } :
            bestPos && bestPos <= 10 ? { c: "#38bdf8", glow: "rgba(56,189,248,0.22)", label: `#${bestPos}`, grad: "linear-gradient(135deg, rgba(56,189,248,0.15) 0%, transparent 60%)" } :
            { c: "#a3e635", glow: "rgba(163,230,53,0.18)", label: cats[0] ?? "Jugador", grad: "linear-gradient(135deg, rgba(163,230,53,0.12) 0%, transparent 60%)" };

          return (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`vib-card vib-in card-d${Math.min(idx, 5)}`}
              style={{
                ["--vib-glow" as string]: tier.glow,
                position: "relative", overflow: "hidden",
                textAlign: "left", borderRadius: 18,
                border: `1px solid ${bestPos && bestPos <= 3 ? tier.c + "44" : GLASS_BD}`,
                background: "rgba(10,18,38,0.7)",
                backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                cursor: "pointer", fontFamily: "inherit", padding: 0,
              }}
            >
              {/* Tier gradient header */}
              <div style={{
                position: "relative",
                padding: "18px 18px 16px",
                background: tier.grad,
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}>
                {/* Tier badge top-right */}
                <span style={{
                  position: "absolute", top: 16, right: 16,
                  fontSize: 10, fontWeight: 900, letterSpacing: "0.06em",
                  color: bestPos && bestPos <= 3 ? "#080e1a" : tier.c,
                  background: bestPos && bestPos <= 3 ? tier.c : `${tier.c}1f`,
                  border: bestPos && bestPos <= 3 ? "none" : `1px solid ${tier.c}40`,
                  padding: "4px 10px", borderRadius: 7,
                  textTransform: "uppercase",
                  boxShadow: bestPos && bestPos <= 3 ? `0 0 16px ${tier.glow}` : "none",
                  maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {bestPos === 1 ? "👑 " : ""}{tier.label}
                </span>

                {/* Avatar */}
                <div style={{
                  width: 60, height: 60, borderRadius: 16, marginBottom: 12,
                  background: `${tier.c}1f`,
                  border: `2px solid ${tier.c}55`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 900,
                  color: tier.c,
                  fontFamily: "var(--font-space), sans-serif",
                  boxShadow: `0 0 24px ${tier.glow}`,
                }}>
                  {initials(p)}
                </div>

                {/* Name */}
                <div style={{ fontSize: 17, fontWeight: 900, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.firstName} {p.lastName}
                </div>
                {cats.length > 0 && (
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {cats.slice(0, 2).join(" · ")}
                  </div>
                )}
              </div>

              {/* Stats row — bold sports numbers */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "14px 0" }}>
                {[
                  { label: "Torneos", value: tournamentCount, color: "#38bdf8" },
                  { label: "Cats",    value: cats.length,     color: "#a3e635" },
                  { label: "Puntos",  value: totalPoints,     color: tier.c    },
                ].map((s, i) => (
                  <div key={s.label} style={{ textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <div className="vib-score" style={{ fontSize: 24, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4, fontWeight: 700 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {selected && <PlayerModal player={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
