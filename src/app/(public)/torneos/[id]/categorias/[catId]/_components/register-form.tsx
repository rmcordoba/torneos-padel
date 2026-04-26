"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { createRegistrationByPlayer } from "@/modules/registrations/actions";

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
};

const G  = "#16a34a";
const GL = "#f0fdf4";

export function RegisterForm({
  tournamentCategoryId,
  myProfileId,
}: {
  tournamentCategoryId: string;
  myProfileId: string;
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
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`/api/players/search?q=${encodeURIComponent(query)}`);
        if (r.ok) {
          const data: Player[] = await r.json();
          setResults(data.filter((p) => p.id !== myProfileId));
          setOpen(true);
        }
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, myProfileId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectPlayer(p: Player) {
    setSelected(p);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .rf-spin { animation: spin 0.8s linear infinite; }
      `}</style>

      <input type="hidden" name="tournamentCategoryId" value={tournamentCategoryId} />
      <input type="hidden" name="partnerId" value={selected?.id ?? ""} />

      {/* Partner search */}
      <div ref={containerRef} style={{ position: "relative" }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
          Buscá tu compañero/a
        </label>

        {selected ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 12, background: GL, border: "1px solid #bbf7d0", padding: "10px 14px" }}>
            <div style={{ width: 36, height: 36, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#bbf7d0", color: "#15803d", fontSize: 13, fontWeight: 700 }}>
              {selected.firstName[0]}{selected.lastName[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>
                {selected.firstName} {selected.lastName}
              </p>
              {selected.email && (
                <p style={{ fontSize: 12, color: G, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected.email}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "none", background: "rgba(22,163,74,0.12)", color: "#15803d", cursor: "pointer", fontSize: 14 }}
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#94a3b8", pointerEvents: "none" }}>🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { setFocused(true); results.length > 0 && setOpen(true); }}
                onBlur={() => setFocused(false)}
                placeholder="Escribí nombre o apellido..."
                style={{
                  width: "100%", height: 40, paddingLeft: 36, paddingRight: searching ? 36 : 12,
                  borderRadius: 12, border: focused ? `2px solid ${G}` : "1px solid #e2e8f0",
                  fontSize: 13, color: "#1e293b", background: "#fff",
                  outline: "none", boxSizing: "border-box",
                }}
              />
              {searching && (
                <span
                  className="rf-spin"
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#94a3b8" }}
                >
                  ⟳
                </span>
              )}
            </div>

            {open && results.length > 0 && (
              <ul style={{
                position: "absolute", zIndex: 20, marginTop: 4, width: "100%",
                borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff",
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)", overflow: "hidden",
                maxHeight: 208, overflowY: "auto", listStyle: "none", padding: 0, margin: "4px 0 0",
              }}>
                {results.map((p) => (
                  <li
                    key={p.id}
                    onMouseDown={() => selectPlayer(p)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f8fafc" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = GL)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                  >
                    <div style={{ width: 32, height: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#f1f5f9", color: "#64748b", fontSize: 12, fontWeight: 700 }}>
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                        {p.firstName} {p.lastName}
                      </p>
                      {p.email && (
                        <p style={{ fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.email}</p>
                      )}
                    </div>
                    <span style={{ marginLeft: "auto", fontSize: 16, flexShrink: 0 }}>✓</span>
                  </li>
                ))}
              </ul>
            )}

            {open && !searching && results.length === 0 && query.length >= 2 && (
              <div style={{ position: "absolute", zIndex: 20, marginTop: 4, width: "100%", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", padding: "12px 16px" }}>
                <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center" }}>
                  Sin resultados para &quot;{query}&quot;
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Error */}
      {state?.error && (
        <p style={{ fontSize: 13, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "8px 12px" }}>
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={!selected || pending}
        style={{
          width: "100%", height: 40, borderRadius: 12, border: "none",
          background: !selected || pending ? "#cbd5e1" : G,
          color: "#fff", fontSize: 13, fontWeight: 700,
          cursor: !selected || pending ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "background 0.15s",
        }}
      >
        {pending && (
          <span className="rf-spin" style={{ fontSize: 14, display: "inline-block" }}>⟳</span>
        )}
        Solicitar inscripción
      </button>

      <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
        Tu solicitud quedará pendiente hasta que el organizador la apruebe.
      </p>
    </form>
  );
}
