"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { createRegistrationByPlayer } from "@/modules/registrations/actions";
import { WeekdayAvailabilityPicker } from "@/components/ui/weekday-availability-picker";

type Player = { id: string; firstName: string; lastName: string; email: string | null };

const ACCENT    = "#a3e635";
const ACCENT_BG = "rgba(163,230,53,0.10)";
const ACCENT_BD = "rgba(163,230,53,0.22)";
const GLASS_BD  = "rgba(255,255,255,0.08)";
const INPUT_BG  = "rgba(255,255,255,0.05)";

export function RegisterForm({
  tournamentCategoryId,
  myProfileId,
  myFirstName,
  myLastName,
  hasWeekdayPlay,
}: {
  tournamentCategoryId: string;
  myProfileId: string;
  myFirstName: string;
  myLastName: string;
  hasWeekdayPlay: boolean;
}) {
  const [state, action, pending] = useActionState(createRegistrationByPlayer, null);
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<Player[]>([]);
  const [selected, setSelected]   = useState<Player | null>(null);
  const [searching, setSearching] = useState(false);
  const [open, setOpen]           = useState(false);
  const [focused, setFocused]     = useState(false);
  const containerRef              = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`/api/players/search?q=${encodeURIComponent(query)}`);
        if (r.ok) {
          const data: Player[] = await r.json();
          setResults(data.filter((p) => p.id !== myProfileId));
          setOpen(true);
        }
      } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query, myProfileId]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function selectPlayer(p: Player) {
    setSelected(p);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function clearPartner() {
    setSelected(null);
    setQuery("");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!selected) { e.preventDefault(); return; }
  }

  const canSubmit = !!selected && !pending;

  return (
    <form action={action} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <style>{`
        @keyframes rf-spin { to { transform: rotate(360deg); } }
        .rf-spin { animation: rf-spin 0.8s linear infinite; }
      `}</style>

      <input type="hidden" name="tournamentCategoryId" value={tournamentCategoryId} />
      <input type="hidden" name="partnerId" value={selected?.id ?? ""} />

      {/* Jugador 1 */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: 8 }}>
          Jugador 1 — vos
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 12, background: ACCENT_BG, border: `1px solid ${ACCENT_BD}`, padding: "10px 14px" }}>
          <div style={{ width: 36, height: 36, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "rgba(163,230,53,0.15)", color: ACCENT, fontSize: 13, fontWeight: 700 }}>
            {myFirstName[0]}{myLastName[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>
              {myFirstName} {myLastName}
            </p>
            <p style={{ fontSize: 11, color: "#94a3b8" }}>Tu cuenta</p>
          </div>
          <span style={{ fontSize: 16, color: ACCENT, flexShrink: 0 }}>✓</span>
        </div>
      </div>

      {/* Conector */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.05em" }}>+</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* Jugador 2 */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: 8 }}>
          Jugador 2 — compañero/a
          <span style={{ color: "#f87171", marginLeft: 3 }}>*</span>
        </label>

        {selected ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 12, background: ACCENT_BG, border: `1px solid ${ACCENT_BD}`, padding: "10px 14px" }}>
            <div style={{ width: 36, height: 36, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "rgba(163,230,53,0.15)", color: ACCENT, fontSize: 13, fontWeight: 700 }}>
              {selected.firstName[0]}{selected.lastName[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>
                {selected.firstName} {selected.lastName}
              </p>
              {selected.email && (
                <p style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected.email}</p>
              )}
            </div>
            <button
              type="button"
              onClick={clearPartner}
              disabled={pending}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "none", background: ACCENT_BG, color: ACCENT, cursor: pending ? "default" : "pointer", fontSize: 13, flexShrink: 0 }}
              aria-label="Cambiar compañero"
            >
              ✕
            </button>
          </div>
        ) : (
          <div ref={containerRef} style={{ position: "relative" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#475569", pointerEvents: "none" }}>🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { setFocused(true); results.length > 0 && setOpen(true); }}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                placeholder="Escribí nombre o apellido..."
                autoComplete="off"
                style={{
                  width: "100%", height: 42, paddingLeft: 36, paddingRight: searching ? 36 : 12,
                  borderRadius: 12,
                  border: `${focused ? "2px" : "1px"} solid ${focused ? ACCENT_BD : GLASS_BD}`,
                  fontSize: 13, color: "#e2e8f0", background: INPUT_BG,
                  outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
                }}
              />
              {searching && (
                <span className="rf-spin" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#64748b" }}>⟳</span>
              )}
            </div>

            {open && results.length > 0 && (
              <ul style={{
                position: "absolute", zIndex: 20, marginTop: 4, width: "100%",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.09)",
                background: "rgba(8,16,36,0.97)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                overflow: "hidden",
                maxHeight: 208, overflowY: "auto", listStyle: "none", padding: 0, margin: "4px 0 0",
              }}>
                {results.map((p) => (
                  <li
                    key={p.id}
                    onMouseDown={() => selectPlayer(p)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)", transition: "background .12s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_BG)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width: 32, height: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "rgba(255,255,255,0.06)", color: "#94a3b8", fontSize: 12, fontWeight: 700 }}>
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{p.firstName} {p.lastName}</p>
                      {p.email && <p style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.email}</p>}
                    </div>
                    <span style={{ marginLeft: "auto", fontSize: 14, color: ACCENT, flexShrink: 0 }}>→</span>
                  </li>
                ))}
              </ul>
            )}

            {open && !searching && results.length === 0 && query.length >= 2 && (
              <div style={{ position: "absolute", zIndex: 20, marginTop: 4, width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(8,16,36,0.97)", backdropFilter: "blur(20px)", padding: "14px 16px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#64748b" }}>Sin resultados para &quot;{query}&quot;</p>
                <p style={{ fontSize: 11, color: "#334155", marginTop: 4 }}>El compañero debe tener una cuenta en el sistema.</p>
              </div>
            )}

            {!open && !selected && (
              <p style={{ fontSize: 11, color: "#475569", marginTop: 6, paddingLeft: 2 }}>
                Escribí al menos 2 caracteres para buscar. Tu compañero/a debe tener cuenta en el sistema.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Resumen pareja */}
      {selected && (
        <div style={{ borderRadius: 12, border: `1px solid ${ACCENT_BD}`, background: ACCENT_BG, padding: "14px 16px", marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: ACCENT, marginBottom: 8 }}>
            Tu pareja
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{myFirstName} {myLastName}</span>
            <span style={{ fontSize: 12, color: ACCENT, fontWeight: 700 }}>—</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{selected.firstName} {selected.lastName}</span>
          </div>
          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
            Tu solicitud quedará pendiente hasta que el organizador la apruebe.
          </p>
        </div>
      )}

      {/* Aviso */}
      {!selected && (
        <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", padding: "12px 16px", marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: "#475569", textAlign: "center" }}>
            Necesitás seleccionar a tu compañero/a para poder inscribirse.
          </p>
        </div>
      )}

      {/* Disponibilidad horaria (torneos con juego entre semana) */}
      {hasWeekdayPlay && (
        <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", padding: "14px 16px", marginBottom: 16 }}>
          <WeekdayAvailabilityPicker />
        </div>
      )}

      {/* Error */}
      {state?.error && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "#f87171", background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
          <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
          {state.error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        style={{
          width: "100%", height: 44, borderRadius: 12, border: "none",
          background: !canSubmit ? "rgba(255,255,255,0.08)" : ACCENT,
          color: !canSubmit ? "#475569" : "#0f172a",
          fontSize: 13, fontWeight: 800,
          cursor: !canSubmit ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all .15s",
          boxShadow: canSubmit ? "0 0 20px rgba(163,230,53,0.3)" : "none",
        }}
      >
        {pending ? (
          <><span className="rf-spin" style={{ fontSize: 14, display: "inline-block" }}>⟳</span> Enviando solicitud…</>
        ) : !selected ? (
          "Seleccioná tu compañero/a para continuar"
        ) : (
          "✓ Confirmar inscripción de pareja"
        )}
      </button>
    </form>
  );
}
