"use client";

import { useState } from "react";
import { unscheduleMatch } from "@/modules/scheduling/actions";
import type { getScheduleByOrganizer, getVenuesWithCourts } from "@/modules/scheduling/queries";
import { AssignScheduleModal } from "./assign-schedule-modal";
import { CheckCircle2, Clock, MapPin, Layers, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Slot = Awaited<ReturnType<typeof getScheduleByOrganizer>>[number];
type Venues = Awaited<ReturnType<typeof getVenuesWithCourts>>;

interface AgendaDayProps {
  slots: Slot[];
  date: string;
  venues: Venues;
}

export function AgendaDay({ slots, date, venues }: AgendaDayProps) {
  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
        <Clock className="h-10 w-10 text-slate-200 mx-auto mb-3" />
        <h3 className="font-bold text-slate-900">Sin partidos programados</h3>
        <p className="text-sm text-slate-500 mt-1">
          Asigná horarios desde el panel de partidos sin programar.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900">
          {slots.length} partido{slots.length !== 1 ? "s" : ""} programado{slots.length !== 1 ? "s" : ""}
        </h2>
      </div>
      <ul className="divide-y divide-slate-100">
        {slots.map((slot) => (
          <AgendaSlotRow key={slot.id} slot={slot} venues={venues} date={date} />
        ))}
      </ul>
    </div>
  );
}

function AgendaSlotRow({ slot, venues, date }: { slot: Slot; venues: Venues; date: string }) {
  const [removing, setRemoving] = useState(false);
  const match = slot.match;
  if (!match) return null;

  const tc = match.stage.tournamentCategory;
  const teamNames = match.teams.map((mt) =>
    mt.team.players.map((p) => `${p.playerProfile.lastName}`).join(" / ")
  );
  const completed = match.status === "COMPLETED" || match.status === "WALKOVER";

  const timeLabel = new Date(slot.startTime).toLocaleTimeString("es-AR", {
    hour: "2-digit", minute: "2-digit",
  });
  const endLabel = slot.endTime
    ? new Date(slot.endTime).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <li className={cn("flex items-start gap-4 px-5 py-4", completed && "opacity-60")}>
      {/* Time */}
      <div className="shrink-0 w-16 text-center">
        <p className="text-sm font-bold text-slate-900">{timeLabel}</p>
        {endLabel && <p className="text-[11px] text-slate-400">{endLabel}</p>}
      </div>

      {/* Match info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {completed && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
          <p className="text-sm font-semibold text-slate-900 truncate">
            {teamNames[0] ?? "TBD"} <span className="text-slate-300 font-normal">vs</span> {teamNames[1] ?? "TBD"}
          </p>
        </div>
        <p className="text-xs text-slate-400 truncate mt-0.5">
          {tc.tournament.name} · {tc.category.name}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3 w-3 text-slate-400" /> {slot.venue.name}
          </span>
          {slot.courtAssignment && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Layers className="h-3 w-3 text-slate-400" /> {slot.courtAssignment.court.name}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {!completed && (
        <div className="flex items-center gap-1 shrink-0">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <AssignScheduleModal match={match as any} venues={venues} selectedDate={date} isEdit />
          <button
            type="button"
            disabled={removing}
            onClick={async () => {
              setRemoving(true);
              await unscheduleMatch(match.id);
            }}
            title="Quitar horario"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
    </li>
  );
}
