"use client";

import { useState } from "react";
import type { getFixtureByCategory } from "@/modules/matches/queries";
import { RecordResultModal } from "./record-result-modal";

type Stage      = Awaited<ReturnType<typeof getFixtureByCategory>>[number];
type BracketNode = Stage["bracketNodes"][number];
type BracketMatch = NonNullable<BracketNode["match"]>;
type MatchTeam   = BracketMatch["teams"][number];

const A = "#a3e635";

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
      <div style={{ background: "oklch(16% 0.012 250)", borderRadius: 14, border: "1px solid var(--border-default)", padding: "48px 24px", textAlign: "center" }}>
        <p style={{ color: "var(--text-faint)", fontSize: 14 }}>El cuadro aún no tiene partidos asignados.</p>
      </div>
    );
  }

  // Group by round
  const roundMap = new Map<number, BracketNode[]>();
  for (const node of nodes) {
    if (!roundMap.has(node.round)) roundMap.set(node.round, []);
    roundMap.get(node.round)!.push(node);
  }
  const rounds     = Array.from(roundMap.keys()).sort((a, b) => b - a); // highest first
  const numRounds  = rounds.length;
  const roundLabels = buildRoundLabels(numRounds);

  // Progress per round
  const progress = rounds.map((r, i) => {
    const rNodes    = roundMap.get(r) ?? [];
    const withMatch = rNodes.filter((n) => n.match);
    const done    = withMatch.length > 0 && withMatch.every((n) => n.match!.status === "COMPLETED" || n.match!.status === "WALKOVER");
    const partial = !done && withMatch.some((n) => ["COMPLETED","WALKOVER","IN_PROGRESS"].includes(n.match!.status));
    return { label: roundLabels[i], done, partial, count: withMatch.length };
  });

  // Champion
  const finalNode = (roundMap.get(1) ?? [])[0];
  const champion  = finalNode?.team;

  return (
    <div style={{ background: "oklch(16% 0.012 250)", borderRadius: 14, border: "1px solid var(--border-default)", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
          {stage.name}
        </span>
        <div style={{ display: "flex", gap: 14 }}>
          {[
            { color: A,          label: "Jugado"     },
            { color: "#fbbf24",  label: "En curso"   },
            { color: "#3b82f6",  label: "Programado" },
            { color: "#334155",  label: "Pendiente"  },
          ].map((s) => (
            <span key={s.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-faint)" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", background: "oklch(14% 0.012 250)", borderBottom: "1px solid var(--border-subtle)" }}>
        {progress.map((r, i) => (
          <div key={i} style={{
            flex: 1, padding: "12px 16px",
            borderRight: i < progress.length - 1 ? "1px solid var(--border-subtle)" : "none",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 7, flexShrink: 0,
              background: r.done ? "rgba(163,230,53,.2)" : r.partial ? "rgba(251,191,36,.15)" : "oklch(22% 0.01 250)",
              border: `1px solid ${r.done ? "rgba(163,230,53,.4)" : r.partial ? "rgba(251,191,36,.3)" : "oklch(28% 0.01 250)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, fontFamily: "Space Grotesk, sans-serif",
              color: r.done ? A : r.partial ? "#fbbf24" : "var(--text-darkest)",
            }}>
              {r.done ? "✓" : i + 1}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: r.done ? A : r.partial ? "#fbbf24" : "var(--text-faint)" }}>{r.label}</div>
              <div style={{ fontSize: 10, color: "var(--text-darkest)" }}>{r.count} partido{r.count !== 1 ? "s" : ""}</div>
            </div>
          </div>
        ))}
        {/* Champion placeholder in progress bar */}
        <div style={{ width: 96, padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 7,
            background: champion ? "rgba(251,191,36,.15)" : "oklch(22% 0.01 250)",
            border: `1px solid ${champion ? "rgba(251,191,36,.3)" : "oklch(28% 0.01 250)"}`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
          }}>🏆</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)" }}>Campeón</div>
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
                <div style={{ padding: "8px 14px 12px", textAlign: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.09em" }}>
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
              width: 88, padding: "16px 10px", textAlign: "center",
              background: champion ? "rgba(251,191,36,.12)" : "oklch(18% 0.012 250)",
              border: `1px solid ${champion ? "rgba(251,191,36,.3)" : "var(--border-default)"}`,
              borderRadius: 12,
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🏆</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Campeón</div>
              {champion ? (
                <div style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", lineHeight: 1.4 }}>
                  {champion.players.map((p) => p.playerProfile.lastName).join(" / ")}
                </div>
              ) : (
                <div style={{ fontSize: 10, color: "var(--text-darkest)", fontStyle: "italic" }}>Por definir</div>
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
      <div style={{ borderRadius: 12, border: "1px dashed rgba(163,230,53,.3)", background: "oklch(18% 0.012 250)", padding: "14px 12px", minHeight: 72, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: A }}>{names.join(" / ")}</div>
        <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>BYE</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div style={{ minHeight: 72, borderRadius: 12, background: "oklch(15% 0.01 250)", border: "1px dashed oklch(24% 0.01 250)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 12, color: "var(--text-darkest)", fontStyle: "italic" }}>Por definir</span>
      </div>
    );
  }

  const side1     = match.teams.find((t) => t.side === 1);
  const side2     = match.teams.find((t) => t.side === 2);
  const completed = match.status === "COMPLETED" || match.status === "WALKOVER";
  const inProgress = match.status === "IN_PROGRESS";
  const winnerId  = match.result?.winnerId ?? undefined;
  const statusColor = completed ? A : inProgress ? "#fbbf24" : "#3b82f6";
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
          background: "oklch(18% 0.012 250)",
          border: `1px solid ${hover ? statusColor + "55" : "oklch(26% 0.01 250)"}`,
          boxShadow: inProgress ? "0 0 0 2px rgba(251,191,36,.25)" : hover ? "0 4px 16px rgba(0,0,0,.4)" : "none",
          transition: "all .12s",
        }}
      >
        <NodeTeamRow mt={side1} winnerId={winnerId} completed={completed} />
        <div style={{ height: 1, background: "oklch(22% 0.01 250)" }} />
        <NodeTeamRow mt={side2} winnerId={winnerId} completed={completed} />

        {/* Footer */}
        <div style={{ padding: "6px 12px", borderTop: "1px solid oklch(20% 0.01 250)", background: "oklch(15% 0.01 250)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: "var(--text-darkest)" }}>
              {completed ? "Jugado" : inProgress ? "En curso" : "Programado"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {score && (
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", fontFamily: "Space Grotesk, sans-serif" }}>{score}</span>
            )}
            {!completed && side1 && side2 && (
              <button
                onClick={() => setModalOpen(true)}
                style={{ fontSize: 9, padding: "2px 7px", borderRadius: 5, border: "1px solid rgba(163,230,53,.3)", background: "rgba(163,230,53,.1)", color: A, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}
              >
                Cargar
              </button>
            )}
            {completed && (
              <button
                onClick={() => setEditOpen(true)}
                style={{ fontSize: 9, padding: "2px 7px", borderRadius: 5, border: "1px solid oklch(28% 0.01 250)", background: "transparent", color: "var(--text-faint)", cursor: "pointer", fontFamily: "inherit" }}
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
      padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
      background: isWinner ? "rgba(163,230,53,.1)" : "transparent",
      borderLeft: isWinner ? "2px solid rgba(163,230,53,.6)" : "2px solid transparent",
    }}>
      <span style={{
        fontSize: 12, fontWeight: isWinner ? 700 : 400, flex: 1,
        color: !mt ? "var(--text-darkest)" : isWinner ? "var(--text-secondary)" : "var(--text-muted)",
        fontStyle: !mt ? "italic" : "normal",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {mt ? (names.length > 0 ? names.join(" / ") : "—") : "Por definir"}
      </span>
      {isWinner && <span style={{ fontSize: 10, color: A, flexShrink: 0 }}>✓</span>}
    </div>
  );
}
