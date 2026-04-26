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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-sm font-bold text-slate-900">{mode === "edit" ? "Editar resultado" : "Cargar resultado"}</h2>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 transition-colors"
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
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex-1 text-center">
              <p className="text-xs font-bold text-slate-900 truncate">{team1Name}</p>
              <p className="text-[10px] text-slate-400">Equipo 1</p>
            </div>
            <span className="text-xs font-bold text-slate-300">VS</span>
            <div className="flex-1 text-center">
              <p className="text-xs font-bold text-slate-900 truncate">{team2Name}</p>
              <p className="text-[10px] text-slate-400">Equipo 2</p>
            </div>
          </div>

          {state?.error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </div>
          )}

          {/* Walkover toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={cn(
                "h-5 w-9 rounded-full transition-colors relative",
                isWalkover ? "bg-amber-500" : "bg-slate-200"
              )}
              onClick={() => setIsWalkover(!isWalkover)}
            >
              <div className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                isWalkover ? "translate-x-4" : "translate-x-0.5"
              )} />
            </div>
            <span className="text-sm font-semibold text-slate-700">Walkover / W.O.</span>
          </label>

          {isWalkover ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600">¿Qué equipo gana por walkover?</p>
              <div className="grid grid-cols-2 gap-2">
                {side1 && (
                  <button
                    type="button"
                    onClick={() => setWalkoverId(side1.teamId)}
                    className={cn(
                      "rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all",
                      walkoverId === side1.teamId
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
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
                      "rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all",
                      walkoverId === side2.teamId
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
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
                <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1">
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
                      className="h-10 w-full rounded-xl border border-slate-200 text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-slate-300 font-bold text-sm">–</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      placeholder="0"
                      value={set.games2}
                      onChange={(e) => updateSet(idx, "games2", e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 text-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeSet(idx)}
                      disabled={sets.length === 1}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:pointer-events-none"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {sets.length < 5 && (
                  <button
                    type="button"
                    onClick={addSet}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-600 transition-colors font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" /> Agregar set
                  </button>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || (isWalkover && !walkoverId) || (!isWalkover && sets.every((s) => !s.games1 && !s.games2))}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:pointer-events-none"
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
