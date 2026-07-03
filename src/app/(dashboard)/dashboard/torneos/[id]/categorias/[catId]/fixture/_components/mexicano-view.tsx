"use client";

import { useState } from "react";
import type { getFixtureByCategory } from "@/modules/matches/queries";
import { Shuffle, CheckCircle2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { RecordResultModal } from "./record-result-modal";

type Stage = Awaited<ReturnType<typeof getFixtureByCategory>>[number];
type Group = Stage["groups"][number];
type GroupMatch = Group["matches"][number];

interface MexicanoViewProps {
  stage: Stage;
  returnPath: string;
  formatLabel?: string; // "Mexicano" | "Americano"
}

interface AggStanding {
  teamId: string;
  names: string[];
  gamesWon: number;
  gamesLost: number;
  matchesWon: number;
  matchesPlayed: number;
}

function computeAggregateStandings(stage: Stage): AggStanding[] {
  const stats: Record<string, { gw: number; gl: number; won: number; played: number; names: string[] }> = {};

  for (const group of stage.groups) {
    for (const match of group.matches) {
      if (match.status !== "COMPLETED" && match.status !== "WALKOVER") continue;
      const t1 = match.teams.find((t) => t.side === 1);
      const t2 = match.teams.find((t) => t.side === 2);
      if (!t1 || !t2) continue;

      if (!stats[t1.teamId]) {
        stats[t1.teamId] = { gw: 0, gl: 0, won: 0, played: 0, names: t1.team.players.map((p) => p.playerProfile.lastName) };
      }
      if (!stats[t2.teamId]) {
        stats[t2.teamId] = { gw: 0, gl: 0, won: 0, played: 0, names: t2.team.players.map((p) => p.playerProfile.lastName) };
      }

      stats[t1.teamId].played++;
      stats[t2.teamId].played++;

      for (const set of match.sets) {
        stats[t1.teamId].gw += set.games1;
        stats[t1.teamId].gl += set.games2;
        stats[t2.teamId].gw += set.games2;
        stats[t2.teamId].gl += set.games1;
      }

      if (match.result?.winnerId === t1.teamId) stats[t1.teamId].won++;
      else if (match.result?.winnerId === t2.teamId) stats[t2.teamId].won++;
    }
  }

  // Incluir equipos que aún no tienen estadísticas (de la ronda activa)
  for (const group of stage.groups) {
    for (const match of group.matches) {
      for (const mt of match.teams) {
        if (!stats[mt.teamId]) {
          stats[mt.teamId] = {
            gw: 0, gl: 0, won: 0, played: 0,
            names: mt.team.players.map((p) => p.playerProfile.lastName),
          };
        }
      }
    }
  }

  return Object.entries(stats)
    .sort(([, a], [, b]) => {
      if (b.gw !== a.gw) return b.gw - a.gw;
      if (b.gw - b.gl !== a.gw - a.gl) return (b.gw - b.gl) - (a.gw - a.gl);
      return b.won - a.won;
    })
    .map(([teamId, s]) => ({
      teamId,
      names: s.names,
      gamesWon: s.gw,
      gamesLost: s.gl,
      matchesWon: s.won,
      matchesPlayed: s.played,
    }));
}

export function MexicanoView({ stage, returnPath, formatLabel = "Mexicano" }: MexicanoViewProps) {
  const standings = computeAggregateStandings(stage);
  const groups = stage.groups.sort((a, b) => a.order - b.order);
  const hasResults = standings.some((s) => s.matchesPlayed > 0);

  return (
    <div className="space-y-6">
      {/* Tabla de posiciones acumulada */}
      {standings.length > 0 && (
        <div className="rounded-2xl border border-white/[0.07] bg-[rgba(10,18,38,0.7)] backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.35)] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.07] flex items-center gap-2">
            <Shuffle className="h-4 w-4 text-violet-400" />
            <h2 className="text-base font-extrabold text-slate-100 font-display">
              Posiciones — {formatLabel}
            </h2>
            {!hasResults && (
              <span className="ml-auto text-xs text-slate-500">Sin resultados aún</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="text-left px-4 py-2.5 text-slate-500 font-extrabold w-6">#</th>
                  <th className="text-left px-4 py-2.5 text-slate-500 font-extrabold">Equipo</th>
                  <th className="text-center px-2 py-2.5 text-slate-500 font-extrabold">PJ</th>
                  <th className="text-center px-2 py-2.5 text-slate-500 font-extrabold">PG</th>
                  <th className="text-center px-2 py-2.5 text-slate-500 font-extrabold">GG</th>
                  <th className="text-center px-2 py-2.5 text-slate-500 font-extrabold">GP</th>
                  <th className="text-center px-2 py-2.5 text-slate-500 font-extrabold">+/-</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {standings.map((s, idx) => {
                  const leader = idx === 0 && hasResults;
                  return (
                  <tr key={s.teamId} className={cn(leader && "bg-violet-500/[0.06]")} style={leader ? { borderLeft: "3px solid #a78bfa" } : undefined}>
                    <td className="px-4 py-3 font-black font-display" style={{ color: leader ? "#a78bfa" : "#334155" }}>{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-slate-100 truncate max-w-[140px] font-display">
                      {s.names.join(" / ")}
                    </td>
                    <td className="text-center px-2 py-3 text-slate-400">{s.matchesPlayed}</td>
                    <td className="text-center px-2 py-3 text-slate-400">{s.matchesWon}</td>
                    <td className="text-center px-2 py-3 font-black text-violet-300 font-display">{s.gamesWon}</td>
                    <td className="text-center px-2 py-3 text-slate-400">{s.gamesLost}</td>
                    <td className={cn(
                      "text-center px-2 py-3 font-bold",
                      s.gamesWon - s.gamesLost > 0 ? "text-lime-400" : s.gamesWon - s.gamesLost < 0 ? "text-rose-400" : "text-slate-500"
                    )}>
                      {s.gamesWon - s.gamesLost > 0 ? "+" : ""}{s.gamesWon - s.gamesLost}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rondas */}
      <div className="space-y-3">
        {groups.map((group, idx) => (
          <RoundAccordion
            key={group.id}
            group={group}
            returnPath={returnPath}
            defaultOpen={idx === groups.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function RoundAccordion({
  group,
  returnPath,
  defaultOpen,
}: {
  group: Group;
  returnPath: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const completedCount = group.matches.filter(
    (m) => m.status === "COMPLETED" || m.status === "WALKOVER"
  ).length;
  const allDone = group.matches.length > 0 && completedCount === group.matches.length;

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[rgba(10,18,38,0.7)] backdrop-blur-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors"
      >
        <div className={cn(
          "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border",
          allDone ? "bg-lime-400/15 border-lime-400/30" : "bg-violet-500/15 border-violet-500/30"
        )}>
          {allDone
            ? <CheckCircle2 className="h-3.5 w-3.5 text-lime-400" />
            : <Clock className="h-3.5 w-3.5 text-violet-400" />}
        </div>
        <span className="font-extrabold text-sm text-slate-100 font-display">{group.name}</span>
        <span className="text-xs text-slate-500 ml-auto mr-2">
          {completedCount}/{group.matches.length} partidos
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
      </button>

      {open && (
        <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
          {group.matches.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Sin partidos generados aún.</p>
          ) : (
            group.matches.map((match) => (
              <MexicanoMatchRow key={match.id} match={match} returnPath={returnPath} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function MexicanoMatchRow({ match, returnPath }: { match: GroupMatch; returnPath: string }) {
  const [open, setOpen] = useState(false);
  const side1 = match.teams.find((t) => t.side === 1);
  const side2 = match.teams.find((t) => t.side === 2);
  const completed = match.status === "COMPLETED" || match.status === "WALKOVER";
  const winnerId = match.result?.winnerId;

  const teamLabel = (mt: typeof side1) =>
    mt ? mt.team.players.map((p) => p.playerProfile.lastName).join(" / ") : "TBD";

  const score = completed && match.sets.length > 0
    ? match.sets.map((s) => `${s.games1}-${s.games2}`).join(", ")
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => !completed && setOpen(true)}
        disabled={completed}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors",
          !completed && "hover:bg-white/[0.03] cursor-pointer",
          completed && "cursor-default"
        )}
      >
        <div className="shrink-0">
          {completed
            ? <CheckCircle2 className="h-4 w-4 text-lime-400" />
            : <Clock className="h-4 w-4 text-amber-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-xs font-bold truncate", completed && winnerId === side1?.teamId ? "text-lime-400 font-display" : "text-slate-300")}>
              {teamLabel(side1)}
            </span>
            <span className="text-slate-600 shrink-0 text-xs">vs</span>
            <span className={cn("text-xs font-bold truncate", completed && winnerId === side2?.teamId ? "text-lime-400 font-display" : "text-slate-300")}>
              {teamLabel(side2)}
            </span>
          </div>
          {score && <p className="text-[11px] text-slate-500 mt-0.5 font-display">{score}</p>}
        </div>
        {!completed && (
          <span className="text-xs text-lime-400 font-bold shrink-0">Cargar →</span>
        )}
      </button>

      {open && (
        <RecordResultModal match={match} onClose={() => setOpen(false)} returnPath={returnPath} />
      )}
    </>
  );
}
