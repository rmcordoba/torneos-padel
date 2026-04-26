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

const G  = "#16a34a";
const GL = "#f0fdf4";

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
  const cats       = playerCategories(player);
  const tournaments = playerTournaments(player);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(15,23,42,0.7)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: "100%", maxWidth: 440, borderRadius: 24, background: "#fff", boxShadow: "0 32px 80px rgba(0,0,0,0.25)", overflow: "hidden", animation: "slideUpModal .28s cubic-bezier(.22,1,.36,1)" }}>
        {/* Header */}
        <div style={{ position: "relative", background: "linear-gradient(135deg,#0f172a,#1a2744 60%,#14532d)", padding: "28px 24px 22px" }}>
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", color: "#94a3b8" }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(163,230,53,0.2)", border: "2px solid rgba(163,230,53,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#a3e635", fontFamily: "Space Grotesk, sans-serif", flexShrink: 0 }}>
              {initials(player)}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}>
              {player.firstName} {player.lastName}
            </div>
          </div>
          {player.rankingEntries.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
              {player.rankingEntries.map((r, i) => (
                <span key={i} style={{
                  fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                  background: r.position === 1 ? "rgba(251,191,36,0.2)" : "rgba(163,230,53,0.12)",
                  color: r.position === 1 ? "#fbbf24" : "#a3e635",
                  border: `1px solid ${r.position === 1 ? "rgba(251,191,36,0.3)" : "rgba(163,230,53,0.25)"}`,
                }}>
                  #{r.position} {r.rankingTable.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats bar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #f1f5f9" }}>
          {[
            { label: "Torneos",    value: tournaments.length, color: "#3b82f6" },
            { label: "Categorías", value: cats.length,        color: G        },
            { label: "Puntos",     value: player.rankingEntries.reduce((a, r) => a + r.points, 0), color: "#0f172a" },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: "16px 0", textAlign: "center", borderRight: i < 2 ? "1px solid #f1f5f9" : "none" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "Space Grotesk, sans-serif" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Categories */}
        {cats.length > 0 && (
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Categorías</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {cats.map((c) => (
                <span key={c} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: GL, color: "#15803d", border: "1px solid #bbf7d0", fontWeight: 500 }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        <div style={{ padding: "16px 20px", maxHeight: 200, overflowY: "auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Historial de torneos</div>
          {tournaments.length === 0 ? (
            <p style={{ fontSize: 13, color: "#cbd5e1", textAlign: "center", padding: "16px 0" }}>Sin historial aún</p>
          ) : (
            <div>
              {tournaments.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < tournaments.length - 1 ? "1px solid #f8fafc" : "none" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{t.cat}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0, marginLeft: 12 }}>
                    {t.date.toLocaleDateString("es-AR", { month: "short", year: "numeric" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>
          <button
            onClick={onClose}
            style={{ width: "100%", padding: "10px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}
          >
            Cerrar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUpModal {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
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
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}>👤</div>
        <p style={{ fontSize: 13, color: "#94a3b8" }}>No se encontraron jugadores con ese criterio.</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
        {players.map((p) => {
          const cats          = playerCategories(p);
          const tournamentCount = new Set(
            p.teamPlayers.flatMap((tp) => tp.team.registrations.map((r) => r.tournamentCategory.tournament.name))
          ).size;
          const topRanking = p.rankingEntries[0];
          const isTop      = topRanking?.position === 1;

          return (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              style={{
                textAlign: "left", borderRadius: 16, border: "1px solid #e2e8f0",
                background: "#fff", padding: 16,
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                cursor: "pointer", fontFamily: "inherit",
                transition: "box-shadow .15s, transform .15s",
              }}
            >
              {/* Avatar + name */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: isTop ? "rgba(251,191,36,0.15)" : GL,
                  border: `1.5px solid ${isTop ? "#fbbf24" : "#bbf7d0"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 800, color: isTop ? "#92400e" : "#15803d",
                  fontFamily: "Space Grotesk, sans-serif",
                }}>
                  {initials(p)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.firstName} {p.lastName}
                  </div>
                  {cats.length > 0 && (
                    <div style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {cats[0]}
                    </div>
                  )}
                </div>
              </div>

              {/* Ranking badges */}
              {p.rankingEntries.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                  {p.rankingEntries.slice(0, 2).map((r, i) => (
                    <span key={i} style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700,
                      background: r.position === 1 ? "#fef9c3" : GL,
                      color: r.position === 1 ? "#92400e" : "#15803d",
                      border: `1px solid ${r.position === 1 ? "#fde68a" : "#bbf7d0"}`,
                    }}>
                      #{r.position} {r.rankingTable.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                {[
                  { label: "Torneos",    value: tournamentCount, color: "#3b82f6" },
                  { label: "Cats.",      value: cats.length,     color: G        },
                  { label: "Puntos",     value: p.rankingEntries.reduce((a, r) => a + r.points, 0), color: "#0f172a" },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: "Space Grotesk, sans-serif" }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
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
