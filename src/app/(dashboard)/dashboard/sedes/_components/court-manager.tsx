"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import {
  createCourt, updateCourt, deleteCourt,
  type VenueActionState,
} from "@/modules/venues/actions";
import type { Court } from "@prisma/client";
import {
  Plus, Pencil, Trash2, Check, X, Loader2,
  Layers, Wind, Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SURFACES = ["Cemento", "Césped sintético", "Cristal", "Madera", "Tierra batida"];

interface CourtManagerProps {
  venueId: string;
  courts: Court[];
}

export function CourtManager({ venueId, courts }: CourtManagerProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {courts.length === 0 && !showAdd && (
        <div className="flex flex-col items-center py-10 text-center rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02]">
          <Layers className="h-8 w-8 text-white/10 mb-2" />
          <p className="text-sm font-bold text-slate-400">Sin canchas</p>
          <p className="text-xs text-slate-500 mt-1">Agregá las canchas disponibles en esta sede.</p>
        </div>
      )}

      <ul className="space-y-2">
        {courts.map((court) =>
          editingId === court.id ? (
            <CourtEditRow
              key={court.id}
              court={court}
              venueId={venueId}
              onDone={() => setEditingId(null)}
            />
          ) : (
            <CourtRow
              key={court.id}
              court={court}
              venueId={venueId}
              onEdit={() => setEditingId(court.id)}
            />
          )
        )}
      </ul>

      {showAdd ? (
        <CourtAddRow venueId={venueId} onDone={() => setShowAdd(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-lime-400/40 bg-lime-400/[0.06] py-3 text-sm font-bold text-lime-400 hover:bg-lime-400/[0.12] hover:border-lime-400/60 transition-all"
        >
          <Plus className="h-4 w-4" /> Agregar cancha
        </button>
      )}
    </div>
  );
}

// ─── Row (read) ───────────────────────────────────────────────────────────────

function CourtRow({
  court, venueId, onEdit,
}: { court: Court; venueId: string; onEdit: () => void }) {
  const [deleting, setDeleting] = useState(false);

  return (
    <li className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[rgba(10,18,38,0.6)] px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400">
        <Layers className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-slate-100">{court.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {court.surface && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Wind className="h-3 w-3" /> {court.surface}
            </span>
          )}
          {court.isIndoor && (
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Home className="h-3 w-3" /> Cubierta
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/[0.06] hover:text-slate-200 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={async () => {
            setDeleting(true);
            await deleteCourt(court.id, venueId);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-500/15 hover:text-rose-400 transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </li>
  );
}

// ─── Row (edit) ───────────────────────────────────────────────────────────────

function CourtEditRow({
  court, venueId, onDone,
}: { court: Court; venueId: string; onDone: () => void }) {
  const action = updateCourt.bind(null, court.id, venueId);
  const [state, formAction, isPending] = useActionState<VenueActionState, FormData>(action, null);
  const [isIndoor, setIsIndoor] = useState(court.isIndoor);
  const submitted = useRef(false);
  useEffect(() => {
    if (isPending) submitted.current = true;
    if (!isPending && submitted.current && state === null) onDone();
  }, [isPending, state]);

  return (
    <li className="rounded-xl border border-lime-400/25 bg-lime-400/[0.05] p-3">
      <form action={formAction} className="space-y-2">
        <input type="hidden" name="isIndoor" value={String(isIndoor)} />
        <CourtFields defaultValues={court} isIndoor={isIndoor} setIsIndoor={setIsIndoor} error={state?.fieldErrors?.name?.[0]} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onDone}
            className="h-8 px-3 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-100 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={isPending}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-lime-400 text-xs font-extrabold text-[#080e1a] hover:bg-lime-300 shadow-[0_0_14px_rgba(163,230,53,0.25)] disabled:opacity-50 transition-colors">
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Guardar
          </button>
        </div>
      </form>
    </li>
  );
}

// ─── Row (add) ────────────────────────────────────────────────────────────────

function CourtAddRow({ venueId, onDone }: { venueId: string; onDone: () => void }) {
  const action = createCourt.bind(null, venueId);
  const [state, formAction, isPending] = useActionState<VenueActionState, FormData>(action, null);
  const [isIndoor, setIsIndoor] = useState(false);
  const submitted = useRef(false);
  useEffect(() => {
    if (isPending) submitted.current = true;
    if (!isPending && submitted.current && state === null) onDone();
  }, [isPending, state]);

  return (
    <div className="rounded-xl border border-lime-400/25 bg-[rgba(10,18,38,0.7)] p-3 space-y-2">
      <form action={formAction}>
        <input type="hidden" name="isIndoor" value={String(isIndoor)} />
        <CourtFields isIndoor={isIndoor} setIsIndoor={setIsIndoor} error={state?.fieldErrors?.name?.[0]} />
        <div className="flex justify-end gap-2 mt-2">
          <button type="button" onClick={onDone}
            className="h-8 px-3 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-100 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={isPending}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-lime-400 text-xs font-extrabold text-[#080e1a] hover:bg-lime-300 shadow-[0_0_14px_rgba(163,230,53,0.25)] disabled:opacity-50 transition-colors">
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Agregar
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Shared form fields ───────────────────────────────────────────────────────

function CourtFields({
  defaultValues,
  isIndoor,
  setIsIndoor,
  error,
}: {
  defaultValues?: Partial<Court>;
  isIndoor: boolean;
  setIsIndoor: (v: boolean) => void;
  error?: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
      {/* Nombre */}
      <div className="sm:col-span-1 space-y-1">
        <label className="text-xs font-bold text-slate-300">Nombre</label>
        <input
          name="name"
          defaultValue={defaultValues?.name ?? ""}
          placeholder="Cancha 1, Cancha A..."
          required
          className={cn(
            "flex h-9 w-full rounded-lg border bg-white/[0.05] text-slate-100 px-3 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/40",
            error ? "border-rose-500/40" : "border-white/[0.08]"
          )}
        />
        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>

      {/* Superficie */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-300">Superficie</label>
        <select
          name="surface"
          defaultValue={defaultValues?.surface ?? ""}
          className="flex h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.05] text-slate-100 [color-scheme:dark] px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/40"
        >
          <option value="">Sin especificar</option>
          {SURFACES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Cubierta toggle */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-300">Tipo</label>
        <button
          type="button"
          onClick={() => setIsIndoor(!isIndoor)}
          className={cn(
            "flex h-9 w-full items-center justify-center gap-2 rounded-lg border text-xs font-semibold transition-colors",
            isIndoor
              ? "border-sky-400/40 bg-sky-500/15 text-sky-400"
              : "border-white/[0.08] bg-white/[0.04] text-slate-400 hover:bg-white/[0.07]"
          )}
        >
          {isIndoor ? <Home className="h-3.5 w-3.5" /> : <Wind className="h-3.5 w-3.5" />}
          {isIndoor ? "Cubierta" : "Al aire libre"}
        </button>
      </div>
    </div>
  );
}
