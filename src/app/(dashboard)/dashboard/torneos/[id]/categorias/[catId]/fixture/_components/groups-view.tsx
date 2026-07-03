"use client";

import { useState } from "react";
import type { getFixtureByCategory } from "@/modules/matches/queries";
import { RecordResultModal } from "./record-result-modal";

type Stage      = Awaited<ReturnType<typeof getFixtureByCategory>>[number];
type Group      = Stage["groups"][number];
type GroupMatch = Group["matches"][number];

const A = "#a3e635";
const PANEL   = "rgba(10,18,38,0.7)";
const BD      = "rgba(255,255,255,0.07)";
const BD_SOFT = "rgba(255,255,255,0.05)";

export function GroupsView({ stage, returnPath }: { stage: Stage; returnPath: string }) {
  const [activeGroup, setActiveGroup] = useState(stage.groups[0]?.id ?? null);
  const group = stage.groups.find((g) => g.id === activeGroup) ?? stage.groups[0];

  return (
    <div style={{ background: PANEL, borderRadius: 18, border: `1px solid ${BD}`, overflow: "hidden", backdropFilter: "blur(16px)", boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}>

      {/* Header */}
      <div style={{ padding: "16px 22px", borderBottom: `1px solid ${BD}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(163,230,53,0.12)", border: "1px solid rgba(163,230,53,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⊞</div>
        <span style={{ fontFamily: "var(--font-space), sans-serif", fontWeight: 800, fontSize: 16, color: "#f8fafc" }}>
          {stage.name}
        </span>
      </div>

      {/* Group selector */}
      {stage.groups.length > 1 && (
        <div style={{ padding: "12px 16px", display: "flex", gap: 6, flexWrap: "wrap", borderBottom: `1px solid ${BD}` }}>
          {stage.groups.map((g) => {
            const active = activeGroup === g.id;
            return (
              <button key={g.id} onClick={() => setActiveGroup(g.id)} style={{
                padding: "7px 18px", borderRadius: 100,
                border: "none",
                background: active ? A : "rgba(255,255,255,0.05)",
                color: active ? "#080e1a" : "#64748b",
                fontFamily: "inherit", fontSize: 12, fontWeight: 800, cursor: "pointer",
                boxShadow: active ? "0 0 16px rgba(163,230,53,0.25)" : "none",
                transition: "all .12s",
              }}>{g.name}</button>
            );
          })}
        </div>
      )}

      {/* 2-column: standings + matches */}
      {group && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>

          {/* Standings */}
          <div style={{ borderRight: `1px solid ${BD}` }}>
            <div style={{ padding: "12px 18px", borderBottom: `1px solid ${BD}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-space), sans-serif", fontWeight: 800, fontSize: 13, color: "#f1f5f9" }}>
                {group.name} — Posiciones
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: A, background: "rgba(163,230,53,0.1)", border: "1px solid rgba(163,230,53,0.2)", padding: "2px 8px", borderRadius: 20 }}>Top 2</span>
            </div>

            {/* Table header */}
            <div style={{ padding: "9px 18px", display: "grid", gridTemplateColumns: "26px 1fr 34px 34px 34px 34px 34px 44px", gap: 4, borderBottom: `1px solid ${BD_SOFT}`, background: "rgba(255,255,255,0.02)" }}>
              {["#","Pareja","PJ","PG","PP","SG","SP","Pts"].map((h) => (
                <span key={h} style={{ fontSize: 10, fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: h !== "Pareja" ? "center" : "left" }}>
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
                  gridTemplateColumns: "26px 1fr 34px 34px 34px 34px 34px 44px",
                  gap: 4, alignItems: "center",
                  borderBottom: i < group.standings.length - 1 ? `1px solid ${BD_SOFT}` : "none",
                  background: classify ? "rgba(163,230,53,0.05)" : "transparent",
                  borderLeft: classify ? "3px solid #a3e635" : "3px solid transparent",
                }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: classify ? A : "#334155", textAlign: "center", fontFamily: "var(--font-space), sans-serif" }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: classify ? 700 : 500, color: classify ? "#f1f5f9" : "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: classify ? "var(--font-space), sans-serif" : "inherit" }}>
                    {names}
                  </span>
                  {[st.matchesPlayed, st.matchesWon, st.matchesLost, st.setsWon, st.setsLost].map((v, vi) => (
                    <span key={vi} style={{ fontSize: 12, color: "#64748b", textAlign: "center" }}>{v}</span>
                  ))}
                  <span style={{ fontSize: 16, fontWeight: 900, textAlign: "center", color: classify ? A : "#64748b", fontFamily: "var(--font-space), sans-serif" }}>
                    {st.points}
                  </span>
                </div>
              );
            })}

            {group.standings.length === 0 && (
              <div style={{ padding: "24px 18px", textAlign: "center", color: "#334155", fontSize: 13 }}>
                Sin datos de posiciones aún
              </div>
            )}
          </div>

          {/* Matches */}
          <div>
            <div style={{ padding: "12px 18px", borderBottom: `1px solid ${BD}` }}>
              <span style={{ fontFamily: "var(--font-space), sans-serif", fontWeight: 800, fontSize: 13, color: "#f1f5f9" }}>
                Partidos del grupo
              </span>
            </div>
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {group.matches.map((match) => (
                <GroupMatchRow key={match.id} match={match} returnPath={returnPath} />
              ))}
              {group.matches.length === 0 && (
                <div style={{ padding: "24px 0", textAlign: "center", color: "#334155", fontSize: 13 }}>
                  Sin partidos generados
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Classified summary (multiple groups) */}
      {stage.groups.length > 1 && (
        <div style={{ borderTop: `1px solid ${BD}` }}>
          <div style={{ padding: "12px 18px", borderBottom: `1px solid ${BD}` }}>
            <span style={{ fontFamily: "var(--font-space), sans-serif", fontWeight: 800, fontSize: 13, color: "#f1f5f9" }}>
              Resumen — Clasificados
            </span>
          </div>
          <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: `repeat(${stage.groups.length}, 1fr)`, gap: 12 }}>
            {stage.groups.map((g) => (
              <div key={g.id}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                  {g.name}
                </div>
                {g.standings.slice(0, 2).map((st, i) => {
                  const names = st.team.players.map((p) => p.playerProfile.lastName).join(" / ");
                  return (
                    <div key={st.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, padding: "10px 12px", background: "rgba(163,230,53,0.05)", borderRadius: 10, border: "1px solid rgba(163,230,53,.18)" }}>
                      <span style={{ fontSize: 17 }}>{["🥇","🥈"][i]}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", fontFamily: "var(--font-space), sans-serif" }}>{names}</div>
                        <div style={{ fontSize: 10, color: "#64748b" }}>{st.points} pts · {st.matchesWon}V {st.matchesLost}D</div>
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
  const statusColor = completed ? A : inProgress ? "#fbbf24" : "#38bdf8";

  const label1 = side1?.team.players.map((p) => p.playerProfile.lastName).join(" / ") ?? "TBD";
  const label2 = side2?.team.players.map((p) => p.playerProfile.lastName).join(" / ") ?? "TBD";
  const score  = completed && match.sets.length > 0 ? match.sets.map((s) => `${s.games1}-${s.games2}`).join(", ") : null;
  const w1 = completed && winnerId === side1?.teamId;
  const w2 = completed && winnerId === side2?.teamId;

  return (
    <>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          padding: "11px 14px", borderRadius: 11,
          border: `1px solid ${hover ? statusColor + "55" : BD}`,
          background: hover ? "rgba(255,255,255,0.04)" : "rgba(8,16,36,0.6)",
          transition: "all .12s",
          display: "grid", gridTemplateColumns: "1fr 90px 1fr 64px",
          gap: 8, alignItems: "center",
        }}
      >
        {/* Team 1 */}
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 12, fontWeight: w1 ? 800 : 500, color: w1 ? "#f1f5f9" : "#64748b", fontFamily: w1 ? "var(--font-space), sans-serif" : "inherit" }}>
            {label1}
          </span>
        </div>

        {/* Score / status */}
        <div style={{ textAlign: "center" }}>
          {score ? (
            <span style={{ fontSize: 12, fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif" }}>{score}</span>
          ) : (
            <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, background: statusColor + "22", color: statusColor, fontWeight: 800 }}>
              {inProgress ? "● Vivo" : "Prog."}
            </span>
          )}
        </div>

        {/* Team 2 */}
        <div>
          <span style={{ fontSize: 12, fontWeight: w2 ? 800 : 500, color: w2 ? "#f1f5f9" : "#64748b", fontFamily: w2 ? "var(--font-space), sans-serif" : "inherit" }}>
            {label2}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
          {!completed && (
            <button
              onClick={() => setOpen(true)}
              style={{ fontSize: 10, padding: "4px 10px", borderRadius: 7, border: "none", background: A, color: "#080e1a", cursor: "pointer", fontFamily: "inherit", fontWeight: 800, boxShadow: "0 0 12px rgba(163,230,53,0.2)" }}
            >
              Cargar
            </button>
          )}
          {completed && (
            <button
              onClick={() => setEditOpen(true)}
              style={{ fontSize: 10, padding: "4px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#64748b", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}
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
