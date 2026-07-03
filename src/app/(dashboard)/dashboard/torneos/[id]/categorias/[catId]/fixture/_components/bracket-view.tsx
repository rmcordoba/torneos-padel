"use client";

import { useState } from "react";
import type { getFixtureByCategory } from "@/modules/matches/queries";
import { RecordResultModal } from "./record-result-modal";

type Stage      = Awaited<ReturnType<typeof getFixtureByCategory>>[number];
type BracketNode = Stage["bracketNodes"][number];
type BracketMatch = NonNullable<BracketNode["match"]>;
type MatchTeam   = BracketMatch["teams"][number];

const A = "#a3e635";

// Vibrant surfaces
const PANEL   = "rgba(10,18,38,0.7)";
const CARD    = "rgba(8,16,36,0.92)";
const BD      = "rgba(255,255,255,0.07)";
const BD_SOFT = "rgba(255,255,255,0.05)";

function buildRoundLabels(n: number): string[] {
  if (n === 1) return ["Final"];
  if (n === 2) return ["Semifinal", "Final"];
  if (n === 3) return ["Cuartos", "Semifinal", "Final"];
  if (n === 4) return ["Octavos", "Cuartos", "Semifinal", "Final"];
  const labels: string[] = [];
  for (let i = 0; i < n - 3; i++) labels.push(`R${i + 1}`);
  labels.push("Cuartos", "Semifinal", "Final");
  return labels;
}

export function BracketView({ stage, returnPath }: { stage: Stage; returnPath: string }) {
  const nodes = stage.bracketNodes;

  if (nodes.length === 0) {
    return (
      <div style={{ background: PANEL, borderRadius: 16, border: `1px solid ${BD}`, padding: "48px 24px", textAlign: "center", backdropFilter: "blur(16px)" }}>
        <p style={{ color: "#475569", fontSize: 14 }}>El cuadro aún no tiene partidos asignados.</p>
      </div>
    );
  }

  const roundMap = new Map<number, BracketNode[]>();
  for (const node of nodes) {
    if (!roundMap.has(node.round)) roundMap.set(node.round, []);
    roundMap.get(node.round)!.push(node);
  }
  const rounds     = Array.from(roundMap.keys()).sort((a, b) => b - a);
  const numRounds  = rounds.length;
  const roundLabels = buildRoundLabels(numRounds);

  const progress = rounds.map((r, i) => {
    const rNodes    = roundMap.get(r) ?? [];
    const withMatch = rNodes.filter((n) => n.match);
    const done    = withMatch.length > 0 && withMatch.every((n) => n.match!.status === "COMPLETED" || n.match!.status === "WALKOVER");
    const partial = !done && withMatch.some((n) => ["COMPLETED","WALKOVER","IN_PROGRESS"].includes(n.match!.status));
    return { label: roundLabels[i], done, partial, count: withMatch.length };
  });

  const finalNode = (roundMap.get(1) ?? [])[0];
  const champion  = finalNode?.team;

  return (
    <div style={{ background: PANEL, borderRadius: 18, border: `1px solid ${BD}`, overflow: "hidden", backdropFilter: "blur(16px)", boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}>

      {/* Header */}
      <div style={{ padding: "16px 22px", borderBottom: `1px solid ${BD}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-space), sans-serif", fontWeight: 800, fontSize: 16, color: "#f8fafc" }}>
          {stage.name}
        </span>
        <div style={{ display: "flex", gap: 14 }}>
          {[
            { color: A,          label: "Jugado"     },
            { color: "#fbbf24",  label: "En curso"   },
            { color: "#38bdf8",  label: "Programado" },
            { color: "#334155",  label: "Pendiente"  },
          ].map((s) => (
            <span key={s.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${BD}` }}>
        {progress.map((r, i) => (
          <div key={i} style={{
            flex: 1, padding: "12px 16px",
            borderRight: i < progress.length - 1 ? `1px solid ${BD_SOFT}` : "none",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8, flexShrink: 0,
              background: r.done ? "rgba(163,230,53,.18)" : r.partial ? "rgba(251,191,36,.14)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${r.done ? "rgba(163,230,53,.4)" : r.partial ? "rgba(251,191,36,.3)" : "rgba(255,255,255,0.08)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 900, fontFamily: "var(--font-space), sans-serif",
              color: r.done ? A : r.partial ? "#fbbf24" : "#334155",
            }}>
              {r.done ? "✓" : i + 1}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: r.done ? A : r.partial ? "#fbbf24" : "#64748b" }}>{r.label}</div>
              <div style={{ fontSize: 10, color: "#334155" }}>{r.count} partido{r.count !== 1 ? "s" : ""}</div>
            </div>
          </div>
        ))}
        <div style={{ width: 96, padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: champion ? "rgba(251,191,36,.15)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${champion ? "rgba(251,191,36,.3)" : "rgba(255,255,255,0.08)"}`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
          }}>🏆</div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b" }}>Campeón</div>
        </div>
      </div>

      {/* Bracket + champion */}
      <div style={{ overflowX: "auto", padding: "20px 16px" }}>
        <div style={{ display: "flex", minWidth: `${numRounds * 270 + 108}px`, alignItems: "stretch" }}>
          {rounds.map((round, colIdx) => {
            const colNodes   = (roundMap.get(round) ?? []).sort((a, b) => a.position - b.position);
            const totalSlots = Math.pow(2, numRounds - colIdx - 1);
            const colGap     = Math.pow(2, colIdx) * 88 - 88;

            return (
              <div key={round} style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "8px 14px 14px", textAlign: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: colIdx === rounds.length - 1 ? A : "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {roundLabels[colIdx]}
                  </span>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-around", gap: colGap > 0 ? colGap : 10, padding: "0 8px 8px" }}>
                  {colNodes.map((node) => (
                    <BracketNodeCard key={node.id} node={node} returnPath={returnPath} />
                  ))}
                  {Array.from({ length: totalSlots - colNodes.length }).map((_, i) => (
                    <div key={`e-${i}`} style={{ minHeight: 88 }} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Champion column */}
          <div style={{ width: 108, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 36 }}>
            <div style={{
              width: 92, padding: "18px 10px", textAlign: "center",
              background: champion ? "linear-gradient(180deg, rgba(251,191,36,.18), rgba(251,191,36,.04))" : "rgba(255,255,255,0.03)",
              border: `1px solid ${champion ? "rgba(251,191,36,.35)" : BD}`,
              borderRadius: 14,
              boxShadow: champion ? "0 0 24px rgba(251,191,36,0.12)" : "none",
            }}>
              <div style={{ fontSize: 30, marginBottom: 6 }}>🏆</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Campeón</div>
              {champion ? (
                <div style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", lineHeight: 1.4, fontFamily: "var(--font-space), sans-serif" }}>
                  {champion.players.map((p) => p.playerProfile.lastName).join(" / ")}
                </div>
              ) : (
                <div style={{ fontSize: 10, color: "#334155", fontStyle: "italic" }}>Por definir</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BracketNodeCard({ node, returnPath }: { node: BracketNode; returnPath: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen,  setEditOpen]  = useState(false);
  const [hover,     setHover]     = useState(false);
  const match = node.match;

  if (node.isBye && node.team) {
    const names = node.team.players.map((p) => p.playerProfile.lastName);
    return (
      <div style={{ borderRadius: 12, border: "1px dashed rgba(163,230,53,.3)", background: "rgba(163,230,53,0.05)", padding: "14px 12px", minHeight: 72, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: A }}>{names.join(" / ")}</div>
        <div style={{ fontSize: 10, color: A, marginTop: 2, opacity: 0.7, fontWeight: 700 }}>BYE</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div style={{ minHeight: 72, borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 12, color: "#334155", fontStyle: "italic" }}>Por definir</span>
      </div>
    );
  }

  const side1     = match.teams.find((t) => t.side === 1);
  const side2     = match.teams.find((t) => t.side === 2);
  const completed = match.status === "COMPLETED" || match.status === "WALKOVER";
  const inProgress = match.status === "IN_PROGRESS";
  const winnerId  = match.result?.winnerId ?? undefined;
  const statusColor = completed ? A : inProgress ? "#fbbf24" : "#38bdf8";
  const score = completed && match.sets.length > 0
    ? match.sets.map((s) => `${s.games1}-${s.games2}`).join(", ")
    : null;

  return (
    <>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          borderRadius: 12, overflow: "hidden",
          background: CARD,
          border: `1px solid ${hover ? statusColor + "66" : completed ? "rgba(163,230,53,0.18)" : BD}`,
          boxShadow: inProgress ? "0 0 0 2px rgba(251,191,36,.25)" : hover ? "0 6px 20px rgba(0,0,0,.45)" : "none",
          transition: "all .12s",
        }}
      >
        <NodeTeamRow mt={side1} winnerId={winnerId} completed={completed} />
        <div style={{ height: 1, background: BD_SOFT }} />
        <NodeTeamRow mt={side2} winnerId={winnerId} completed={completed} />

        {/* Footer */}
        <div style={{ padding: "7px 12px", borderTop: `1px solid ${BD_SOFT}`, background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, flexShrink: 0, ...(inProgress ? { animation: "vib-live 1.2s infinite" } : {}) }} />
            <span style={{ fontSize: 10, color: "#475569" }}>
              {completed ? "Jugado" : inProgress ? "En curso" : "Programado"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {score && (
              <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", fontFamily: "var(--font-space), sans-serif" }}>{score}</span>
            )}
            {!completed && side1 && side2 && (
              <button
                onClick={() => setModalOpen(true)}
                style={{ fontSize: 9, padding: "3px 9px", borderRadius: 6, border: "none", background: A, color: "#080e1a", cursor: "pointer", fontFamily: "inherit", fontWeight: 800, boxShadow: "0 0 12px rgba(163,230,53,0.25)" }}
              >
                Cargar
              </button>
            )}
            {completed && (
              <button
                onClick={() => setEditOpen(true)}
                style={{ fontSize: 9, padding: "3px 9px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}
              >
                Editar
              </button>
            )}
          </div>
        </div>
      </div>

      {modalOpen && <RecordResultModal match={match} onClose={() => setModalOpen(false)} returnPath={returnPath} />}
      {editOpen  && <RecordResultModal match={match} onClose={() => setEditOpen(false)}  returnPath={returnPath} mode="edit" />}
    </>
  );
}

function NodeTeamRow({ mt, winnerId, completed }: { mt: MatchTeam | undefined; winnerId: string | undefined; completed: boolean }) {
  const isWinner = completed && !!mt && winnerId === mt.teamId;
  const names    = mt?.team.players.map((p) => p.playerProfile.lastName) ?? [];
  return (
    <div style={{
      padding: "11px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
      background: isWinner ? "rgba(163,230,53,.1)" : "transparent",
      borderLeft: isWinner ? "3px solid #a3e635" : "3px solid transparent",
    }}>
      <span style={{
        fontSize: 12, fontWeight: isWinner ? 800 : 500, flex: 1,
        color: !mt ? "#334155" : isWinner ? "#f1f5f9" : "#94a3b8",
        fontStyle: !mt ? "italic" : "normal",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        fontFamily: isWinner ? "var(--font-space), sans-serif" : "inherit",
      }}>
        {mt ? (names.length > 0 ? names.join(" / ") : "—") : "Por definir"}
      </span>
      {isWinner && <span style={{ fontSize: 12, flexShrink: 0 }}>🏆</span>}
    </div>
  );
}
