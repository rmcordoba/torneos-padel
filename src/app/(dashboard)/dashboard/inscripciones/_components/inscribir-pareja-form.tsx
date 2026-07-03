"use client";

import { useActionState, useState, useCallback, useRef, useEffect } from "react";
import { createRegistrationByOrganizer, type RegistrationActionState } from "@/modules/registrations/actions";
import { WeekdayAvailabilityPicker } from "@/components/ui/weekday-availability-picker";
import { UserPlus, Search, X, Check, Loader2, AlertCircle, ChevronDown } from "lucide-react";

interface PlayerResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

interface TournamentCategory {
  id: string;
  name: string;
}

interface Tournament {
  id: string;
  name: string;
  hasWeekdayPlay: boolean;
  categories: TournamentCategory[];
}

interface Props {
  tournaments: Tournament[];
}

export function InscribirParejaForm({ tournaments }: Props) {
  const [open, setOpen] = useState(false);
  const [tournamentId, setTournamentId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [player1, setPlayer1] = useState<PlayerResult | null>(null);
  const [player2, setPlayer2] = useState<PlayerResult | null>(null);

  const [state, action, isPending] = useActionState<RegistrationActionState, FormData>(
    createRegistrationByOrganizer,
    null
  );

  const selectedTournament = tournaments.find((t) => t.id === tournamentId);
  const categories = selectedTournament?.categories ?? [];

  // Reset category when tournament changes
  const handleTournamentChange = (id: string) => {
    setTournamentId(id);
    setCategoryId("");
  };

  // Close and reset on success
  useEffect(() => {
    if (!isPending && state === null && open && (player1 || player2)) {
      setOpen(false);
      setTournamentId("");
      setCategoryId("");
      setPlayer1(null);
      setPlayer2(null);
    }
  }, [isPending, state]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "10px 18px", borderRadius: 10,
          background: "#a3e635", border: "none",
          color: "#080e1a", fontSize: 13, fontWeight: 800,
          cursor: "pointer", fontFamily: "inherit",
          boxShadow: "0 0 20px rgba(163,230,53,0.3)",
          flexShrink: 0,
        }}
      >
        <UserPlus size={15} />
        Inscribir pareja
      </button>
    );
  }

  const canSubmit = tournamentId && categoryId && player1 && player2 && !isPending;

  return (
    <div style={{
      background: "var(--bg-surface)", borderRadius: 14,
      border: "1px solid var(--accent-30)", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px",
        background: "var(--accent-15)", borderBottom: "1px solid var(--accent-30)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <UserPlus size={14} color="var(--accent)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
            Inscribir nueva pareja
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{ background: "none", border: "none", color: "var(--text-dimmer)", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex" }}
        >
          <X size={15} />
        </button>
      </div>

      <form action={action} style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
        <input type="hidden" name="returnPath" value="/dashboard/inscripciones" />
        {categoryId && <input type="hidden" name="tournamentCategoryId" value={categoryId} />}
        {player1 && <input type="hidden" name="player1Id" value={player1.id} />}
        {player2 && <input type="hidden" name="player2Id" value={player2.id} />}

        {state?.error && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px", borderRadius: 8,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
            fontSize: 13, color: "#f87171",
          }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            {state.error}
          </div>
        )}

        {/* Torneo */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Torneo</label>
          <SelectField
            value={tournamentId}
            onChange={handleTournamentChange}
            placeholder="Seleccionar torneo..."
            options={tournaments.map((t) => ({ value: t.id, label: t.name }))}
          />
        </div>

        {/* Categoría */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Categoría</label>
          <SelectField
            value={categoryId}
            onChange={setCategoryId}
            placeholder={tournamentId ? "Seleccionar categoría..." : "Primero elegí un torneo"}
            disabled={!tournamentId || categories.length === 0}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>

        {/* Jugador 1 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Jugador 1</label>
          <PlayerSearchInput
            value={player1}
            onSelect={setPlayer1}
            excludeId={player2?.id}
            placeholder="Buscar por nombre, apellido o email..."
          />
        </div>

        {/* Jugador 2 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Jugador 2</label>
          <PlayerSearchInput
            value={player2}
            onSelect={setPlayer2}
            excludeId={player1?.id}
            placeholder="Buscar por nombre, apellido o email..."
          />
        </div>

        {/* Preview pareja */}
        {player1 && player2 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", borderRadius: 9,
            background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
          }}>
            <PlayerPill player={player1} color="#a3e635" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dimmer)", flexShrink: 0 }}>VS</span>
            <PlayerPill player={player2} color="#60a5fa" />
          </div>
        )}

        {/* Disponibilidad horaria (solo si el torneo tiene juego entre semana) */}
        {selectedTournament?.hasWeekdayPlay && (
          <div style={{
            padding: "14px", borderRadius: 10,
            background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
          }}>
            <WeekdayAvailabilityPicker />
          </div>
        )}

        {/* Acciones */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4, borderTop: "1px solid var(--border-subtle)" }}>
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: "transparent", border: "1px solid var(--border-default)",
              color: "var(--text-secondary)", cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: canSubmit ? "var(--accent)" : "var(--accent-15)",
              color: canSubmit ? "#000" : "var(--accent)",
              border: "none", cursor: canSubmit ? "pointer" : "not-allowed",
              opacity: canSubmit ? 1 : 0.6,
            }}
          >
            {isPending ? (
              <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Procesando...</>
            ) : (
              <><Check size={13} /> Inscribir pareja</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── SelectField ──────────────────────────────────────────────────────────────

function SelectField({
  value, onChange, placeholder, options, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: "100%", padding: "9px 34px 9px 12px", borderRadius: 8, fontSize: 13,
          background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
          color: value ? "var(--text-primary)" : "var(--text-dimmer)",
          appearance: "none", cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={13} style={{
        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
        color: "var(--text-dimmer)", pointerEvents: "none",
      }} />
    </div>
  );
}

// ─── PlayerSearchInput ────────────────────────────────────────────────────────

function PlayerSearchInput({
  value, onSelect, excludeId, placeholder,
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (value) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 12px", borderRadius: 9,
        background: "var(--accent-15)", border: "1px solid var(--accent-30)",
      }}>
        <PlayerAvatar name={`${value.firstName} ${value.lastName}`} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            {value.firstName} {value.lastName}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "var(--text-dimmer)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {value.email}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          style={{ background: "none", border: "none", color: "var(--text-dimmer)", cursor: "pointer", padding: 2, borderRadius: 4, display: "flex" }}
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-dimmer)", pointerEvents: "none" }} />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          style={{
            width: "100%", padding: "9px 34px 9px 30px", borderRadius: 8, fontSize: 13,
            background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
            color: "var(--text-primary)", outline: "none", boxSizing: "border-box",
          }}
        />
        {loading && (
          <Loader2 size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-dimmer)", animation: "spin 1s linear infinite" }} />
        )}
      </div>

      {open && (results.length > 0 || (query.length >= 2 && !loading)) && (
        <div style={{
          position: "absolute", zIndex: 50, top: "calc(100% + 4px)", left: 0, right: 0,
          background: "var(--bg-surface)", border: "1px solid var(--border-default)",
          borderRadius: 10, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        }}>
          {results.length === 0 ? (
            <div style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-dimmer)", textAlign: "center" }}>
              No se encontraron jugadores para &ldquo;{query}&rdquo;
            </div>
          ) : (
            <ul style={{ maxHeight: 200, overflowY: "auto", margin: 0, padding: 0, listStyle: "none" }}>
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => { onSelect(p); setQuery(""); setOpen(false); setResults([]); }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", background: "none", border: "none",
                      color: "var(--text-primary)", cursor: "pointer", textAlign: "left",
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                  >
                    <PlayerAvatar name={`${p.firstName} ${p.lastName}`} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{p.firstName} {p.lastName}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--text-dimmer)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.email}</p>
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

function PlayerAvatar({ name }: { name: string }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{
      width: 30, height: 30, borderRadius: 7, flexShrink: 0,
      background: "var(--accent-15)", border: "1px solid var(--accent-30)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 800, color: "var(--accent)",
      fontFamily: "var(--font-space), sans-serif",
    }}>
      {initials}
    </div>
  );
}

function PlayerPill({ player, color }: { player: PlayerResult; color: string }) {
  const initials = `${player.firstName} ${player.lastName}`.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 8, minWidth: 0 }}>
      <div style={{
        width: 26, height: 26, borderRadius: 6, flexShrink: 0,
        background: `${color}22`, border: `1px solid ${color}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 800, color, fontFamily: "var(--font-space), sans-serif",
      }}>
        {initials}
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {player.lastName}, {player.firstName}
      </span>
    </div>
  );
}
