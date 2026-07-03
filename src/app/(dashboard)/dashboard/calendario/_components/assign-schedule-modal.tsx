"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { assignSchedule, type ScheduleActionState } from "@/modules/scheduling/actions";
import type { getVenuesWithCourts } from "@/modules/scheduling/queries";
import { Calendar, Clock, Pencil, X, Check, Loader2, AlertCircle } from "lucide-react";

type Venues = Awaited<ReturnType<typeof getVenuesWithCourts>>;

interface MatchForSchedule {
  id: string;
  stage: {
    tournamentCategory: {
      category: { name: string };
      tournament: { id: string; name: string };
    };
  };
  teams: {
    side: number;
    team: { players: { playerProfile: { lastName: string } }[] };
  }[];
}

interface AssignScheduleModalProps {
  match: MatchForSchedule;
  venues: Venues;
  selectedDate: string;
  isEdit?: boolean;
}

export function AssignScheduleModal({ match, venues, selectedDate, isEdit }: AssignScheduleModalProps) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState<ScheduleActionState, FormData>(assignSchedule, null);
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const submitted = useRef(false);

  useEffect(() => {
    if (isPending) submitted.current = true;
    if (!isPending && submitted.current && state === null) setOpen(false);
  }, [isPending, state]);

  const selectedVenue = venues.find((v) => v.id === venueId);
  const tc = match.stage.tournamentCategory;
  const teamNames = match.teams.map((mt) =>
    mt.team.players.map((p) => `${p.playerProfile.lastName}`).join(" / ")
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          isEdit
            ? "flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white/[0.06] hover:text-slate-200 transition-colors"
            : "mt-2 flex items-center gap-1.5 text-xs font-bold text-lime-400 hover:text-lime-300 transition-colors"
        }
      >
        {isEdit ? <Pencil className="h-3.5 w-3.5" /> : <><Calendar className="h-3 w-3" /> Asignar horario</>}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-[rgba(8,16,36,0.97)] border border-white/[0.09] shadow-[0_24px_64px_rgba(0,0,0,0.6)] overflow-hidden backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] bg-lime-400/[0.06]">
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold text-slate-100 font-display">Asignar horario</h2>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {teamNames[0] ?? "TBD"} vs {teamNames[1] ?? "TBD"} · {tc.category.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:bg-white/[0.08] hover:text-slate-200 transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={action} className="p-6 space-y-4">
              <input type="hidden" name="matchId" value={match.id} />
              <input type="hidden" name="tournamentId" value={tc.tournament.id} />

              {state?.error && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/25 px-3 py-2 text-sm text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {state.error}
                </div>
              )}

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-300">Fecha</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    name="date"
                    defaultValue={selectedDate}
                    required
                    className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.05] text-slate-100 [color-scheme:dark] pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/40"
                  />
                </div>
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-300">Hora inicio</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="time"
                      name="startTime"
                      required
                      className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.05] text-slate-100 [color-scheme:dark] pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/40"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-300">Hora fin</label>
                  <input
                    type="time"
                    name="endTime"
                    className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.05] text-slate-100 [color-scheme:dark] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/40"
                  />
                </div>
              </div>

              {/* Venue */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-300">Sede</label>
                <select
                  name="venueId"
                  value={venueId}
                  onChange={(e) => setVenueId(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.05] text-slate-100 [color-scheme:dark] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/40"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              {/* Court */}
              {selectedVenue && selectedVenue.courts.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-300">Cancha</label>
                  <select
                    name="courtId"
                    className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.05] text-slate-100 [color-scheme:dark] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/40"
                  >
                    <option value="">Sin cancha específica</option>
                    {selectedVenue.courts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.surface ? ` (${c.surface})` : ""}{c.isIndoor ? " — cubierta" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Motivo (solo al reprogramar — queda en el historial) */}
              {isEdit && (
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-300">
                    Motivo del cambio <span className="font-normal text-slate-500">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    name="reason"
                    maxLength={300}
                    placeholder="Ej: lluvia, pedido de los jugadores..."
                    className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.05] text-slate-100 px-3 text-sm placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/40"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-white/[0.05] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-lg bg-lime-400 px-5 py-2 text-sm font-extrabold text-[#080e1a] shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:bg-lime-300 transition-colors disabled:opacity-50"
                >
                  {isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                    : <><Check className="h-4 w-4" /> Guardar</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
