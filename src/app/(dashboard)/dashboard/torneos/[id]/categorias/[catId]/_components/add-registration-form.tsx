"use client";

import { useActionState, useState, useCallback, useRef, useEffect } from "react";
import { createRegistrationByOrganizer, type RegistrationActionState } from "@/modules/registrations/actions";
import { UserPlus, Search, X, Check, Loader2, AlertCircle } from "lucide-react";

interface PlayerResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  dni: string | null;
}

interface AddRegistrationFormProps {
  tournamentCategoryId: string;
  returnPath: string;
  isFull: boolean;
}

export function AddRegistrationForm({
  tournamentCategoryId,
  returnPath,
  isFull,
}: AddRegistrationFormProps) {
  const [open, setOpen] = useState(false);
  const [state, action, isPending] = useActionState<RegistrationActionState, FormData>(
    createRegistrationByOrganizer,
    null
  );

  const [player1, setPlayer1] = useState<PlayerResult | null>(null);
  const [player2, setPlayer2] = useState<PlayerResult | null>(null);

  // Reset on success (state === null after action + no error)
  useEffect(() => {
    if (!isPending && state === null && (player1 || player2)) {
      setPlayer1(null);
      setPlayer2(null);
      setOpen(false);
    }
  }, [isPending, state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 transition-all w-full justify-center"
      >
        <UserPlus className="h-4 w-4" />
        {isFull ? "Agregar a lista de espera" : "Inscribir pareja"}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-emerald-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-emerald-50 border-b border-emerald-100">
        <div className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-bold text-slate-900">
            {isFull ? "Agregar a lista de espera" : "Inscribir nueva pareja"}
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form action={action} className="p-5 space-y-4">
        <input type="hidden" name="tournamentCategoryId" value={tournamentCategoryId} />
        <input type="hidden" name="returnPath" value={returnPath} />
        {player1 && <input type="hidden" name="player1Id" value={player1.id} />}
        {player2 && <input type="hidden" name="player2Id" value={player2.id} />}

        {state?.error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {state.error}
          </div>
        )}

        {isFull && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-700">
            El cupo está lleno. La pareja se agregará a la lista de espera.
          </div>
        )}

        {/* Player 1 */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Jugador 1</label>
          <PlayerSearchInput
            value={player1}
            onSelect={setPlayer1}
            excludeId={player2?.id}
            placeholder="Buscar por nombre, apellido o email..."
          />
        </div>

        {/* Player 2 */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Jugador 2</label>
          <PlayerSearchInput
            value={player2}
            onSelect={setPlayer2}
            excludeId={player1?.id}
            placeholder="Buscar por nombre, apellido o email..."
          />
        </div>

        {/* VS divider visual */}
        {player1 && player2 && (
          <div className="flex items-center gap-3 py-2">
            <PlayerPill player={player1} />
            <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">VS</span>
            <PlayerPill player={player2} />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!player1 || !player2 || isPending}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</>
            ) : (
              <><Check className="h-4 w-4" /> {isFull ? "Agregar a espera" : "Inscribir pareja"}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── PlayerSearchInput ────────────────────────────────────────────────────────

function PlayerSearchInput({
  value,
  onSelect,
  excludeId,
  placeholder,
}: {
  value: PlayerResult | null;
  onSelect: (p: PlayerResult | null) => void;
  excludeId?: string;
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/players/search?q=${encodeURIComponent(q)}`);
      const data: PlayerResult[] = await res.json();
      setResults(data.filter((p) => p.id !== excludeId));
    } finally {
      setLoading(false);
    }
  }, [excludeId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(q), 300);
  };

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5">
        <PlayerAvatar name={`${value.firstName} ${value.lastName}`} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">{value.firstName} {value.lastName}</p>
          <p className="text-xs text-slate-500 truncate">{value.email}</p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-slate-400 hover:text-red-500 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />
        )}
      </div>

      {open && (results.length > 0 || (query.length >= 2 && !loading)) && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500 text-center">
              No se encontraron jugadores para "{query}"
            </div>
          ) : (
            <ul className="max-h-52 overflow-y-auto divide-y divide-slate-100">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50 transition-colors text-left"
                    onClick={() => { onSelect(p); setQuery(""); setOpen(false); setResults([]); }}
                  >
                    <PlayerAvatar name={`${p.firstName} ${p.lastName}`} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{p.firstName} {p.lastName}</p>
                      <p className="text-xs text-slate-500 truncate">{p.email}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helpers visuales ─────────────────────────────────────────────────────────

function PlayerPill({ player }: { player: PlayerResult }) {
  return (
    <div className="flex flex-1 items-center gap-2 min-w-0 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1.5">
      <PlayerAvatar name={`${player.firstName} ${player.lastName}`} size="xs" />
      <span className="text-xs font-semibold text-slate-700 truncate">
        {player.lastName}, {player.firstName}
      </span>
    </div>
  );
}

function PlayerAvatar({ name, size = "sm" }: { name: string; size?: "xs" | "sm" }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const sizeClass = size === "xs" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";
  return (
    <div className={`shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 font-bold text-white ${sizeClass}`}>
      {initials}
    </div>
  );
}
