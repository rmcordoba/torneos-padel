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
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Shuffle className="h-4 w-4 text-violet-500" />
            <h2 className="text-base font-bold text-slate-900">
              Posiciones — {formatLabel}
            </h2>
            {!hasResults && (
              <span className="ml-auto text-xs text-slate-400">Sin resultados aún</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-2 text-slate-400 font-semibold w-6">#</th>
                  <th className="text-left px-4 py-2 text-slate-400 font-semibold">Equipo</th>
                  <th className="text-center px-2 py-2 text-slate-400 font-semibold">PJ</th>
                  <th className="text-center px-2 py-2 text-slate-400 font-semibold">PG</th>
                  <th className="text-center px-2 py-2 text-slate-400 font-semibold">GG</th>
                  <th className="text-center px-2 py-2 text-slate-400 font-semibold">GP</th>
                  <th className="text-center px-2 py-2 text-slate-400 font-semibold">+/-</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {standings.map((s, idx) => (
                  <tr key={s.teamId} className={cn(idx === 0 && hasResults && "bg-violet-50/30")}>
                    <td className="px-4 py-2.5 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900 truncate max-w-[140px]">
                      {s.names.join(" / ")}
                    </td>
                    <td className="text-center px-2 py-2.5 text-slate-600">{s.matchesPlayed}</td>
                    <td className="text-center px-2 py-2.5 text-slate-600">{s.matchesWon}</td>
                    <td className="text-center px-2 py-2.5 font-bold text-violet-700">{s.gamesWon}</td>
                    <td className="text-center px-2 py-2.5 text-slate-600">{s.gamesLost}</td>
                    <td className={cn(
                      "text-center px-2 py-2.5 font-semibold",
                      s.gamesWon - s.gamesLost > 0 ? "text-emerald-600" : s.gamesWon - s.gamesLost < 0 ? "text-red-500" : "text-slate-400"
                    )}>
                      {s.gamesWon - s.gamesLost > 0 ? "+" : ""}{s.gamesWon - s.gamesLost}
                    </td>
                  </tr>
                ))}
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
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
          allDone ? "bg-emerald-100" : "bg-violet-100"
        )}>
          {allDone
            ? <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            : <Clock className="h-3 w-3 text-violet-500" />}
        </div>
        <span className="font-bold text-sm text-slate-800">{group.name}</span>
        <span className="text-xs text-slate-400 ml-auto mr-2">
          {completedCount}/{group.matches.length} partidos
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {group.matches.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Sin partidos generados aún.</p>
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
          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
          !completed && "hover:bg-slate-50 cursor-pointer",
          completed && "cursor-default"
        )}
      >
        <div className="shrink-0">
          {completed
            ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            : <Clock className="h-4 w-4 text-amber-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-xs font-semibold truncate", completed && winnerId === side1?.teamId ? "text-emerald-700" : "text-slate-700")}>
              {teamLabel(side1)}
            </span>
            <span className="text-slate-300 shrink-0 text-xs">vs</span>
            <span className={cn("text-xs font-semibold truncate", completed && winnerId === side2?.teamId ? "text-emerald-700" : "text-slate-700")}>
              {teamLabel(side2)}
            </span>
          </div>
          {score && <p className="text-[11px] text-slate-400 mt-0.5">{score}</p>}
        </div>
        {!completed && (
          <span className="text-xs text-violet-600 font-semibold shrink-0">Cargar resultado</span>
        )}
      </button>

      {open && (
        <RecordResultModal match={match} onClose={() => setOpen(false)} returnPath={returnPath} />
      )}
    </>
  );
}
