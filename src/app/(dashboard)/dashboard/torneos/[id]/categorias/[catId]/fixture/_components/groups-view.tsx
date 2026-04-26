"use client";

import { useState } from "react";
import type { getFixtureByCategory } from "@/modules/matches/queries";
import { RecordResultModal } from "./record-result-modal";

type Stage      = Awaited<ReturnType<typeof getFixtureByCategory>>[number];
type Group      = Stage["groups"][number];
type GroupMatch = Group["matches"][number];

const A = "#a3e635";

export function GroupsView({ stage, returnPath }: { stage: Stage; returnPath: string }) {
  const [activeGroup, setActiveGroup] = useState(stage.groups[0]?.id ?? null);
  const group = stage.groups.find((g) => g.id === activeGroup) ?? stage.groups[0];

  return (
    <div style={{ background: "oklch(16% 0.012 250)", borderRadius: 14, border: "1px solid var(--border-default)", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
        <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
          {stage.name}
        </span>
      </div>

      {/* Group selector */}
      {stage.groups.length > 1 && (
        <div style={{ padding: "12px 16px", display: "flex", gap: 6, borderBottom: "1px solid var(--border-subtle)" }}>
          {stage.groups.map((g) => {
            const active = activeGroup === g.id;
            return (
              <button key={g.id} onClick={() => setActiveGroup(g.id)} style={{
                padding: "6px 16px", borderRadius: 8,
                border: `1px solid ${active ? "rgba(163,230,53,.4)" : "var(--border-default)"}`,
                background: active ? "rgba(163,230,53,.12)" : "transparent",
                color: active ? A : "var(--text-faint)",
                fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>{g.name}</button>
            );
          })}
        </div>
      )}

      {/* 2-column: standings + matches */}
      {group && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>

          {/* Standings */}
          <div style={{ borderRight: "1px solid var(--border-subtle)" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
                {group.name} — Posiciones
              </span>
              <span style={{ fontSize: 11, color: "var(--text-faint)" }}>Clasifican top 2</span>
            </div>

            {/* Table header */}
            <div style={{ padding: "8px 18px", display: "grid", gridTemplateColumns: "26px 1fr 36px 36px 36px 36px 36px 44px", gap: 4, borderBottom: "1px solid oklch(20% 0.01 250)" }}>
              {["#","Pareja","PJ","PG","PP","SG","SP","Pts"].map((h) => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "var(--text-darkest)", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: h !== "Pareja" ? "center" : "left" }}>
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {group.standings.map((st, i) => {
              const classify = i < 2;
              const names    = st.team.players.map((p) => p.playerProfile.lastName).join(" / ");
              return (
                <div key={st.id} style={{
                  padding: "12px 18px", display: "grid",
                  gridTemplateColumns: "26px 1fr 36px 36px 36px 36px 36px 44px",
                  gap: 4, alignItems: "center",
                  borderBottom: i < group.standings.length - 1 ? "1px solid oklch(20% 0.01 250)" : "none",
                  background: classify ? "rgba(163,230,53,0.04)" : "transparent",
                  borderLeft: classify ? "2px solid rgba(163,230,53,0.4)" : "2px solid transparent",
                }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: classify ? A : "var(--text-darkest)", textAlign: "center", fontFamily: "Space Grotesk, sans-serif" }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: classify ? 700 : 400, color: classify ? "var(--text-secondary)" : "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {names}
                  </span>
                  {[st.matchesPlayed, st.matchesWon, st.matchesLost, st.setsWon, st.setsLost].map((v, vi) => (
                    <span key={vi} style={{ fontSize: 12, color: "var(--text-faint)", textAlign: "center" }}>{v}</span>
                  ))}
                  <span style={{ fontSize: 15, fontWeight: 800, textAlign: "center", color: classify ? A : "var(--text-faint)", fontFamily: "Space Grotesk, sans-serif" }}>
                    {st.points}
                  </span>
                </div>
              );
            })}

            {group.standings.length === 0 && (
              <div style={{ padding: "24px 18px", textAlign: "center", color: "var(--text-darkest)", fontSize: 13 }}>
                Sin datos de posiciones aún
              </div>
            )}

            {/* Legend */}
            <div style={{ padding: "10px 18px", borderTop: "1px solid oklch(20% 0.01 250)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-faint)" }}>
                <span style={{ width: 10, height: 3, background: "rgba(163,230,53,.4)", borderRadius: 2, flexShrink: 0 }} />
                Clasifican a eliminación
              </span>
            </div>
          </div>

          {/* Matches */}
          <div>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
                Partidos del grupo
              </span>
            </div>
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {group.matches.map((match) => (
                <GroupMatchRow key={match.id} match={match} returnPath={returnPath} />
              ))}
              {group.matches.length === 0 && (
                <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-darkest)", fontSize: 13 }}>
                  Sin partidos generados
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Classified summary (multiple groups) */}
      {stage.groups.length > 1 && (
        <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border-subtle)" }}>
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
              Resumen — Clasificados
            </span>
          </div>
          <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: `repeat(${stage.groups.length}, 1fr)`, gap: 12 }}>
            {stage.groups.map((g) => (
              <div key={g.id}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                  {g.name}
                </div>
                {g.standings.slice(0, 2).map((st, i) => {
                  const names = st.team.players.map((p) => p.playerProfile.lastName).join(" / ");
                  return (
                    <div key={st.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, padding: "9px 12px", background: "oklch(20% 0.012 250)", borderRadius: 9, border: "1px solid rgba(163,230,53,.2)" }}>
                      <span style={{ fontSize: 16 }}>{["🥇","🥈"][i]}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>{names}</div>
                        <div style={{ fontSize: 10, color: "var(--text-faint)" }}>{st.points} pts · {st.matchesWon}V {st.matchesLost}D</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GroupMatchRow({ match, returnPath }: { match: GroupMatch; returnPath: string }) {
  const [open,     setOpen]     = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [hover,    setHover]    = useState(false);

  const side1      = match.teams.find((t) => t.side === 1);
  const side2      = match.teams.find((t) => t.side === 2);
  const completed  = match.status === "COMPLETED" || match.status === "WALKOVER";
  const inProgress = match.status === "IN_PROGRESS";
  const winnerId   = match.result?.winnerId;
  const statusColor = completed ? A : inProgress ? "#fbbf24" : "#3b82f6";

  const label1 = side1?.team.players.map((p) => p.playerProfile.lastName).join(" / ") ?? "TBD";
  const label2 = side2?.team.players.map((p) => p.playerProfile.lastName).join(" / ") ?? "TBD";
  const score  = completed && match.sets.length > 0 ? match.sets.map((s) => `${s.games1}-${s.games2}`).join(", ") : null;

  return (
    <>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          padding: "11px 14px", borderRadius: 10,
          border: `1px solid ${hover ? statusColor + "40" : "oklch(24% 0.01 250)"}`,
          background: hover ? "oklch(20% 0.012 250)" : "oklch(18% 0.012 250)",
          transition: "all .12s",
          display: "grid", gridTemplateColumns: "1fr 90px 1fr 72px",
          gap: 8, alignItems: "center",
        }}
      >
        {/* Team 1 */}
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 12, fontWeight: completed && winnerId === side1?.teamId ? 700 : 400, color: completed && winnerId === side1?.teamId ? "var(--text-secondary)" : "var(--text-faint)" }}>
            {label1}
          </span>
        </div>

        {/* Score / status */}
        <div style={{ textAlign: "center" }}>
          {score ? (
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", fontFamily: "Space Grotesk, sans-serif" }}>{score}</span>
          ) : (
            <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: statusColor + "22", color: statusColor, fontWeight: 700 }}>
              {inProgress ? "● Vivo" : "Prog."}
            </span>
          )}
        </div>

        {/* Team 2 */}
        <div>
          <span style={{ fontSize: 12, fontWeight: completed && winnerId === side2?.teamId ? 700 : 400, color: completed && winnerId === side2?.teamId ? "var(--text-secondary)" : "var(--text-faint)" }}>
            {label2}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
          {!completed && (
            <button
              onClick={() => setOpen(true)}
              style={{ fontSize: 10, padding: "3px 9px", borderRadius: 6, border: "1px solid var(--border-default)", background: "oklch(22% 0.012 250)", color: A, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}
            >
              Cargar
            </button>
          )}
          {completed && (
            <button
              onClick={() => setEditOpen(true)}
              style={{ fontSize: 10, padding: "3px 9px", borderRadius: 6, border: "1px solid oklch(26% 0.01 250)", background: "transparent", color: "var(--text-faint)", cursor: "pointer", fontFamily: "inherit" }}
            >
              Editar
            </button>
          )}
        </div>
      </div>

      {open     && <RecordResultModal match={match} onClose={() => setOpen(false)}     returnPath={returnPath} />}
      {editOpen && <RecordResultModal match={match} onClose={() => setEditOpen(false)} returnPath={returnPath} mode="edit" />}
    </>
  );
}
