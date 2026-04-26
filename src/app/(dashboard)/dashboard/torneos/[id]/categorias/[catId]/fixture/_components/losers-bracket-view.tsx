"use client";

import { useState } from "react";
import type { getFixtureByCategory } from "@/modules/matches/queries";
import { Shield, CheckCircle2, Clock, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { RecordResultModal } from "./record-result-modal";

type Stage = Awaited<ReturnType<typeof getFixtureByCategory>>[number];
type Group = Stage["groups"][number];
type GroupMatch = Group["matches"][number];

interface LosersViewProps {
  stage: Stage;
  returnPath: string;
}

export function LosersBracketView({ stage, returnPath }: LosersViewProps) {
  const groups = stage.groups.sort((a, b) => a.order - b.order);
  const roundGroups = groups.slice(0, -1);
  const grandFinalGroup = groups[groups.length - 1];

  return (
    <div className="space-y-4">
      {/* Cuadro B rounds */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Shield className="h-4 w-4 text-orange-500" />
          <h2 className="text-base font-bold text-slate-900">{stage.name}</h2>
        </div>

        <div className="p-6 space-y-6">
          {roundGroups.map((group) => (
            <LbRoundSection key={group.id} group={group} returnPath={returnPath} />
          ))}

          {roundGroups.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">
              Los partidos del Cuadro B se generan a medida que avanzan los resultados del Cuadro A.
            </p>
          )}
        </div>
      </div>

      {/* Gran Final */}
      {grandFinalGroup && grandFinalGroup.matches.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-600" />
            <h2 className="text-base font-bold text-amber-900">Gran Final</h2>
          </div>
          <div className="p-6">
            {grandFinalGroup.matches.map((match) => (
              <GrandFinalCard key={match.id} match={match} returnPath={returnPath} />
            ))}
          </div>
        </div>
      )}

      {grandFinalGroup && grandFinalGroup.matches.length === 0 && (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-6 text-center">
          <Trophy className="h-6 w-6 text-amber-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-amber-700">Gran Final</p>
          <p className="text-xs text-amber-600 mt-1">Se disputará cuando ambos finalistas estén definidos.</p>
        </div>
      )}
    </div>
  );
}

function LbRoundSection({ group, returnPath }: { group: Group; returnPath: string }) {
  const hasMatches = group.matches.length > 0;

  return (
    <div>
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
        {group.name}
      </h3>
      {hasMatches ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {group.matches.map((match) => (
            <LbMatchCard key={match.id} match={match} returnPath={returnPath} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">Pendiente de definición…</p>
      )}
    </div>
  );
}

function LbMatchCard({ match, returnPath }: { match: GroupMatch; returnPath: string }) {
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
          "w-full rounded-xl border bg-white text-left overflow-hidden transition-all",
          completed ? "border-slate-200 cursor-default" : "border-slate-200 hover:border-orange-300 hover:shadow-md cursor-pointer"
        )}
      >
        <div className="flex flex-col divide-y divide-slate-100">
          <MatchRow
            label={teamLabel(side1)}
            isWinner={completed && winnerId === side1?.teamId}
            completed={completed}
          />
          <MatchRow
            label={teamLabel(side2)}
            isWinner={completed && winnerId === side2?.teamId}
            completed={completed}
          />
        </div>
        {score && (
          <div className="px-3 py-1.5 text-[11px] text-slate-400 border-t border-slate-50">
            {score}
          </div>
        )}
        {!completed && (
          <div className="px-3 py-1.5 border-t border-slate-50 flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-amber-400" />
            <span className="text-[11px] text-orange-600 font-semibold">Cargar resultado</span>
          </div>
        )}
      </button>

      {open && (
        <RecordResultModal match={match} onClose={() => setOpen(false)} returnPath={returnPath} />
      )}
    </>
  );
}

function MatchRow({ label, isWinner, completed }: { label: string; isWinner: boolean; completed: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 px-3 h-9", isWinner && "bg-emerald-50")}>
      {isWinner && <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />}
      <span className={cn(
        "text-xs font-semibold truncate",
        isWinner ? "text-emerald-700" : "text-slate-700"
      )}>
        {label}
      </span>
    </div>
  );
}

function GrandFinalCard({ match, returnPath }: { match: GroupMatch; returnPath: string }) {
  const [open, setOpen] = useState(false);
  const side1 = match.teams.find((t) => t.side === 1);
  const side2 = match.teams.find((t) => t.side === 2);
  const completed = match.status === "COMPLETED" || match.status === "WALKOVER";
  const winnerId = match.result?.winnerId;

  const teamLabel = (mt: typeof side1) =>
    mt ? mt.team.players.map((p) => p.playerProfile.lastName).join(" / ") : "Por definir";

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
          "w-full max-w-sm mx-auto rounded-xl border-2 bg-white text-left overflow-hidden transition-all",
          completed ? "border-amber-200 cursor-default" : "border-amber-200 hover:border-amber-400 hover:shadow-lg cursor-pointer"
        )}
      >
        <div className="flex flex-col divide-y divide-amber-100">
          {[side1, side2].map((side, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-2 px-4 h-11",
                completed && winnerId === side?.teamId && "bg-amber-50"
              )}
            >
              {completed && winnerId === side?.teamId && (
                <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              )}
              <span className={cn(
                "text-sm font-bold truncate",
                completed && winnerId === side?.teamId ? "text-amber-800" : "text-slate-700"
              )}>
                {teamLabel(side)}
              </span>
              {idx === 0 && <span className="ml-auto text-xs text-slate-400">Cuadro A</span>}
              {idx === 1 && <span className="ml-auto text-xs text-slate-400">Cuadro B</span>}
            </div>
          ))}
        </div>
        {score && (
          <div className="px-4 py-2 text-xs text-amber-700 font-semibold border-t border-amber-100 text-center">
            {score}
          </div>
        )}
        {!completed && (
          <div className="px-4 py-2 border-t border-amber-100 text-center">
            <span className="text-xs text-amber-700 font-semibold">Cargar resultado final</span>
          </div>
        )}
      </button>

      {open && (
        <RecordResultModal match={match} onClose={() => setOpen(false)} returnPath={returnPath} />
      )}
    </>
  );
}
