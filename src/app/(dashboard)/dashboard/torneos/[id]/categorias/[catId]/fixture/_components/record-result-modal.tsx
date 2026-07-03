"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { recordMatchResult, editMatchResult } from "@/modules/matches/actions";
import type { getFixtureByCategory } from "@/modules/matches/queries";
import { X, Plus, Trash2, AlertCircle, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Stage = Awaited<ReturnType<typeof getFixtureByCategory>>[number];
type MatchType = NonNullable<Stage["bracketNodes"][number]["match"]> | Stage["groups"][number]["matches"][number];

interface RecordResultModalProps {
  match: MatchType;
  onClose: () => void;
  returnPath: string;
  mode?: "record" | "edit";
}

interface SetEntry {
  games1: string;
  games2: string;
  tiebreak1: string;
  tiebreak2: string;
}

export function RecordResultModal({ match, onClose, returnPath, mode = "record" }: RecordResultModalProps) {
  const [recordState, recordAction, recordPending] = useActionState(recordMatchResult, null);
  const [editState, editAction, editPending] = useActionState(editMatchResult, null);
  const state = mode === "edit" ? editState : recordState;
  const action = mode === "edit" ? editAction : recordAction;
  const isPending = mode === "edit" ? editPending : recordPending;

  const initialSets: SetEntry[] = mode === "edit" && "sets" in match && Array.isArray((match as { sets: unknown[] }).sets) && (match as { sets: unknown[] }).sets.length > 0
    ? (match as { sets: { games1: number; games2: number; tiebreak1: number | null; tiebreak2: number | null }[] }).sets.map((s) => ({
        games1: String(s.games1),
        games2: String(s.games2),
        tiebreak1: s.tiebreak1 != null ? String(s.tiebreak1) : "",
        tiebreak2: s.tiebreak2 != null ? String(s.tiebreak2) : "",
      }))
    : [{ games1: "", games2: "", tiebreak1: "", tiebreak2: "" }];

  const [sets, setSets] = useState<SetEntry[]>(initialSets);
  const [isWalkover, setIsWalkover] = useState(mode === "edit" && match.status === "WALKOVER");
  const [walkoverId, setWalkoverId] = useState(mode === "edit" ? (match.result?.winnerId ?? "") : "");
  const wasSubmittedRef = useRef(false);

  const side1 = match.teams.find((t) => t.side === 1);
  const side2 = match.teams.find((t) => t.side === 2);

  const team1Name = side1?.team.players.map((p) => `${p.playerProfile.firstName} ${p.playerProfile.lastName}`).join(" / ") ?? "TBD";
  const team2Name = side2?.team.players.map((p) => `${p.playerProfile.firstName} ${p.playerProfile.lastName}`).join(" / ") ?? "TBD";

  useEffect(() => {
    if (isPending) wasSubmittedRef.current = true;
    if (!isPending && wasSubmittedRef.current && state === null) {
      onClose();
    }
  }, [isPending, state]);

  const addSet = () => {
    if (sets.length < 5) setSets([...sets, { games1: "", games2: "", tiebreak1: "", tiebreak2: "" }]);
  };

  const removeSet = (idx: number) => {
    if (sets.length > 1) setSets(sets.filter((_, i) => i !== idx));
  };

  const updateSet = (idx: number, field: keyof SetEntry, value: string) => {
    setSets(sets.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl bg-[rgba(8,16,36,0.97)] border border-white/[0.09] shadow-[0_24px_64px_rgba(0,0,0,0.6)] overflow-hidden backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] bg-lime-400/[0.06]">
          <h2 className="text-sm font-extrabold text-slate-100 font-display">{mode === "edit" ? "Editar resultado" : "Cargar resultado"}</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-white/[0.08] hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={action} className="p-6 space-y-5">
          <input type="hidden" name="matchId" value={match.id} />
          <input type="hidden" name="returnPath" value={returnPath} />
          <input type="hidden" name="isWalkover" value={String(isWalkover)} />
          {isWalkover && walkoverId && (
            <input type="hidden" name="walkoverId" value={walkoverId} />
          )}

          {/* Teams display */}
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
            <div className="flex-1 text-center min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate font-display">{team1Name}</p>
              <p className="text-[10px] text-slate-500">Equipo 1</p>
            </div>
            <span className="text-xs font-extrabold text-lime-400 shrink-0">VS</span>
            <div className="flex-1 text-center min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate font-display">{team2Name}</p>
              <p className="text-[10px] text-slate-500">Equipo 2</p>
            </div>
          </div>

          {state?.error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/25 px-3 py-2 text-sm text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </div>
          )}

          {/* Walkover toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={cn(
                "h-5 w-9 rounded-full transition-colors relative",
                isWalkover ? "bg-amber-400" : "bg-white/[0.1]"
              )}
              onClick={() => setIsWalkover(!isWalkover)}
            >
              <div className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                isWalkover ? "translate-x-4" : "translate-x-0.5"
              )} />
            </div>
            <span className="text-sm font-bold text-slate-300">Walkover / W.O.</span>
          </label>

          {isWalkover ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400">¿Qué equipo gana por walkover?</p>
              <div className="grid grid-cols-2 gap-2">
                {side1 && (
                  <button
                    type="button"
                    onClick={() => setWalkoverId(side1.teamId)}
                    className={cn(
                      "rounded-xl border py-2.5 px-3 text-xs font-bold transition-all",
                      walkoverId === side1.teamId
                        ? "border-lime-400/40 bg-lime-400/15 text-lime-400"
                        : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/[0.15]"
                    )}
                  >
                    {team1Name.split(" / ")[0]}
                  </button>
                )}
                {side2 && (
                  <button
                    type="button"
                    onClick={() => setWalkoverId(side2.teamId)}
                    className={cn(
                      "rounded-xl border py-2.5 px-3 text-xs font-bold transition-all",
                      walkoverId === side2.teamId
                        ? "border-lime-400/40 bg-lime-400/15 text-lime-400"
                        : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/[0.15]"
                    )}
                  >
                    {team2Name.split(" / ")[0]}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Sets */}
              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-x-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wide px-1">
                  <span className="truncate">{team1Name.split(" / ")[0]}</span>
                  <span />
                  <span className="truncate text-right">{team2Name.split(" / ")[0]}</span>
                  <span />
                </div>

                {sets.map((set, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
                    {/* Hidden inputs */}
                    <input type="hidden" name={`sets[${idx}][games1]`} value={set.games1} />
                    <input type="hidden" name={`sets[${idx}][games2]`} value={set.games2} />
                    {set.tiebreak1 && <input type="hidden" name={`sets[${idx}][tiebreak1]`} value={set.tiebreak1} />}
                    {set.tiebreak2 && <input type="hidden" name={`sets[${idx}][tiebreak2]`} value={set.tiebreak2} />}

                    <input
                      type="number"
                      min={0}
                      max={99}
                      placeholder="0"
                      value={set.games1}
                      onChange={(e) => updateSet(idx, "games1", e.target.value)}
                      className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.05] text-slate-100 text-center text-base font-extrabold font-display focus:outline-none focus:ring-2 focus:ring-lime-400/40 [color-scheme:dark]"
                    />
                    <span className="text-slate-600 font-bold text-sm">–</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      placeholder="0"
                      value={set.games2}
                      onChange={(e) => updateSet(idx, "games2", e.target.value)}
                      className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.05] text-slate-100 text-center text-base font-extrabold font-display focus:outline-none focus:ring-2 focus:ring-lime-400/40 [color-scheme:dark]"
                    />
                    <button
                      type="button"
                      onClick={() => removeSet(idx)}
                      disabled={sets.length === 1}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:pointer-events-none disabled:opacity-30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {sets.length < 5 && (
                  <button
                    type="button"
                    onClick={addSet}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-lime-400 transition-colors font-bold"
                  >
                    <Plus className="h-3.5 w-3.5" /> Agregar set
                  </button>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-white/[0.05] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || (isWalkover && !walkoverId) || (!isWalkover && sets.every((s) => !s.games1 && !s.games2))}
              className="flex items-center gap-2 rounded-lg bg-lime-400 px-5 py-2 text-sm font-extrabold text-[#080e1a] shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:bg-lime-300 transition-colors disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none"
            >
              {isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                : <><Check className="h-4 w-4" /> {mode === "edit" ? "Guardar cambios" : "Guardar resultado"}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
