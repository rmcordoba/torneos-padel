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
      <div className="rounded-2xl border border-white/[0.07] bg-[rgba(10,18,38,0.7)] backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.07] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
            <Shield className="h-4 w-4 text-orange-400" />
          </div>
          <h2 className="text-base font-extrabold text-slate-100 font-display">{stage.name}</h2>
        </div>

        <div className="p-6 space-y-6">
          {roundGroups.map((group) => (
            <LbRoundSection key={group.id} group={group} returnPath={returnPath} />
          ))}

          {roundGroups.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">
              Los partidos del Cuadro B se generan a medida que avanzan los resultados del Cuadro A.
            </p>
          )}
        </div>
      </div>

      {/* Gran Final */}
      {grandFinalGroup && grandFinalGroup.matches.length > 0 && (
        <div className="rounded-2xl border border-amber-400/25 bg-[linear-gradient(135deg,rgba(251,191,36,0.1),rgba(10,18,38,0.85)_45%)] backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.35)] overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-400/15 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-amber-400" />
            </div>
            <h2 className="text-base font-extrabold text-amber-300 font-display">Gran Final</h2>
          </div>
          <div className="p-6">
            {grandFinalGroup.matches.map((match) => (
              <GrandFinalCard key={match.id} match={match} returnPath={returnPath} />
            ))}
          </div>
        </div>
      )}

      {grandFinalGroup && grandFinalGroup.matches.length === 0 && (
        <div className="rounded-2xl border border-dashed border-amber-400/25 bg-amber-400/[0.04] p-6 text-center">
          <Trophy className="h-6 w-6 text-amber-400/60 mx-auto mb-2" />
          <p className="text-sm font-bold text-amber-300 font-display">Gran Final</p>
          <p className="text-xs text-amber-400/70 mt-1">Se disputará cuando ambos finalistas estén definidos.</p>
        </div>
      )}
    </div>
  );
}

function LbRoundSection({ group, returnPath }: { group: Group; returnPath: string }) {
  const hasMatches = group.matches.length > 0;

  return (
    <div>
      <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">
        {group.name}
      </h3>
      {hasMatches ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {group.matches.map((match) => (
            <LbMatchCard key={match.id} match={match} returnPath={returnPath} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500 italic">Pendiente de definición…</p>
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
          "w-full rounded-xl border bg-[rgba(8,16,36,0.7)] text-left overflow-hidden transition-all",
          completed ? "border-white/[0.07] cursor-default" : "border-white/[0.08] hover:border-orange-400/40 hover:shadow-[0_6px_20px_rgba(0,0,0,0.4)] cursor-pointer"
        )}
      >
        <div className="flex flex-col divide-y divide-white/[0.05]">
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
          <div className="px-3 py-1.5 text-[11px] text-slate-400 border-t border-white/[0.05] font-display">
            {score}
          </div>
        )}
        {!completed && (
          <div className="px-3 py-1.5 border-t border-white/[0.05] flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-amber-400" />
            <span className="text-[11px] text-orange-400 font-bold">Cargar resultado</span>
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
    <div className={cn("flex items-center gap-2 px-3 h-10", isWinner && "bg-lime-400/[0.08]")} style={isWinner ? { borderLeft: "3px solid #a3e635" } : undefined}>
      {isWinner && <CheckCircle2 className="h-3.5 w-3.5 text-lime-400 shrink-0" />}
      <span className={cn(
        "text-xs font-bold truncate",
        isWinner ? "text-lime-400 font-display" : completed ? "text-slate-400" : "text-slate-300"
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
          "w-full max-w-sm mx-auto rounded-xl border-2 bg-[rgba(8,16,36,0.8)] text-left overflow-hidden transition-all block",
          completed ? "border-amber-400/30 cursor-default" : "border-amber-400/30 hover:border-amber-400/60 hover:shadow-[0_8px_28px_rgba(251,191,36,0.15)] cursor-pointer"
        )}
      >
        <div className="flex flex-col divide-y divide-amber-400/10">
          {[side1, side2].map((side, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-2 px-4 h-12",
                completed && winnerId === side?.teamId && "bg-amber-400/[0.1]"
              )}
            >
              {completed && winnerId === side?.teamId && (
                <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
              )}
              <span className={cn(
                "text-sm font-bold truncate font-display",
                completed && winnerId === side?.teamId ? "text-amber-300" : "text-slate-300"
              )}>
                {teamLabel(side)}
              </span>
              {idx === 0 && <span className="ml-auto text-[10px] text-slate-500 font-semibold">Cuadro A</span>}
              {idx === 1 && <span className="ml-auto text-[10px] text-slate-500 font-semibold">Cuadro B</span>}
            </div>
          ))}
        </div>
        {score && (
          <div className="px-4 py-2 text-xs text-amber-300 font-extrabold border-t border-amber-400/10 text-center font-display">
            {score}
          </div>
        )}
        {!completed && (
          <div className="px-4 py-2 border-t border-amber-400/10 text-center">
            <span className="text-xs text-amber-300 font-bold">Cargar resultado final</span>
          </div>
        )}
      </button>

      {open && (
        <RecordResultModal match={match} onClose={() => setOpen(false)} returnPath={returnPath} />
      )}
    </>
  );
}
