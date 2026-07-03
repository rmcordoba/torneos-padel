"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Trophy, User, Loader2 } from "lucide-react";
import { closeMobileNav } from "@/hooks/use-mobile-nav";

const ACCENT = "#a3e635";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  REGISTRATION_OPEN: "Inscripción abierta",
  REGISTRATION_CLOSED: "Inscripción cerrada",
  IN_PROGRESS: "En juego",
  COMPLETED: "Finalizado",
  CANCELLED: "Cancelado",
};

type Results = {
  players: { id: string; name: string; email: string | null }[];
  tournaments: { id: string; name: string; status: string }[];
};

const EMPTY: Results = { players: [], tournaments: [] };

export function DashSearch({ fullWidth = false }: { fullWidth?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Lista plana para navegación con flechas: torneos primero, después jugadores
  const items = [
    ...results.tournaments.map((t) => ({ kind: "tournament" as const, ...t })),
    ...results.players.map((p) => ({ kind: "player" as const, ...p })),
  ];
  const hasResults = items.length > 0;

  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [close]);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQ(val);
    setActive(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 2) {
      abortRef.current?.abort();
      setResults(EMPTY);
      setLoading(false);
      setOpen(false);
      return;
    }

    setLoading(true);
    setOpen(true);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val.trim())}`, {
          signal: controller.signal,
        });
        if (res.ok) setResults(await res.json());
        else setResults(EMPTY);
        setLoading(false);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResults(EMPTY);
          setLoading(false);
        }
      }
    }, 300);
  }

  function navigate(item: (typeof items)[number]) {
    close();
    closeMobileNav();
    setQ("");
    setResults(EMPTY);
    if (item.kind === "tournament") router.push(`/dashboard/torneos/${item.id}`);
    else router.push(`/dashboard/jugadores/${item.id}`);
  }

  function goToFullList() {
    const val = q.trim();
    if (!val) return;
    close();
    closeMobileNav();
    router.push(`/dashboard/jugadores?q=${encodeURIComponent(val)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      close();
      return;
    }
    if (!open || !hasResults) {
      if (e.key === "Enter") {
        e.preventDefault();
        goToFullList();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0) navigate(items[active]);
      else goToFullList();
    }
  }

  // Índices para resaltar el item activo dentro de cada grupo
  const tCount = results.tournaments.length;

  return (
    <div ref={rootRef} className={fullWidth ? undefined : "dash-search-wrap"} style={{ position: "relative" }}>
      <input
        className="dash-search"
        value={q}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (hasResults || loading) setOpen(true); }}
        placeholder="Buscar torneo o jugador…"
        aria-label="Buscar torneo o jugador"
        role="combobox"
        aria-expanded={open}
        style={{
          padding: "8px 14px 8px 36px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 100,
          color: "#e2e8f0",
          fontSize: 13,
          outline: "none",
          width: fullWidth ? "100%" : 240,
          fontFamily: "inherit",
          transition: "border-color .15s",
        }}
      />
      <Search
        size={14}
        style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#475569", pointerEvents: "none" }}
      />
      {loading && (
        <Loader2
          size={14}
          style={{ position: "absolute", right: 13, top: "50%", marginTop: -7, color: "#475569", animation: "spin 0.7s linear infinite" }}
        />
      )}

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 150,
          ...(fullWidth ? { left: 0 } : { width: 320 }),
          background: "#0b1424", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14, padding: 6, boxShadow: "0 16px 48px rgba(0,0,0,0.55)",
          animation: "fade-in 0.15s ease",
        }}>
          {!loading && !hasResults && (
            <p style={{ padding: "14px 12px", fontSize: 12, color: "#64748b", textAlign: "center" }}>
              Sin resultados para «{q.trim()}»
            </p>
          )}

          {results.tournaments.length > 0 && (
            <>
              <GroupLabel>Torneos</GroupLabel>
              {results.tournaments.map((t, i) => (
                <ResultRow
                  key={t.id}
                  icon={<Trophy size={13} color={active === i ? ACCENT : "#64748b"} />}
                  title={t.name}
                  subtitle={STATUS_LABEL[t.status] ?? t.status}
                  isActive={active === i}
                  onSelect={() => navigate({ kind: "tournament", ...t })}
                  onHover={() => setActive(i)}
                />
              ))}
            </>
          )}

          {results.players.length > 0 && (
            <>
              <GroupLabel>Jugadores</GroupLabel>
              {results.players.map((p, i) => (
                <ResultRow
                  key={p.id}
                  icon={<User size={13} color={active === tCount + i ? ACCENT : "#64748b"} />}
                  title={p.name}
                  subtitle={p.email ?? undefined}
                  isActive={active === tCount + i}
                  onSelect={() => navigate({ kind: "player", ...p })}
                  onHover={() => setActive(tCount + i)}
                />
              ))}
            </>
          )}

          {hasResults && (
            <button
              onClick={goToFullList}
              style={{
                all: "unset", boxSizing: "border-box", display: "block", width: "100%",
                marginTop: 4, padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                fontSize: 11, fontWeight: 600, color: "#64748b", textAlign: "center",
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              Ver todos los jugadores que coinciden →
            </button>
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      padding: "6px 10px 4px", fontSize: 9, fontWeight: 800,
      letterSpacing: "0.1em", textTransform: "uppercase", color: "#334155",
    }}>
      {children}
    </p>
  );
}

function ResultRow({
  icon, title, subtitle, isActive, onSelect, onHover,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  isActive: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      onMouseEnter={onHover}
      style={{
        all: "unset", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "8px 10px", borderRadius: 8, cursor: "pointer",
        background: isActive ? "rgba(163,230,53,0.1)" : "transparent",
      }}
    >
      <span style={{ flexShrink: 0, display: "flex" }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: isActive ? ACCENT : "#cbd5e1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {title}
        </span>
        {subtitle && (
          <span style={{ display: "block", fontSize: 10, color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {subtitle}
          </span>
        )}
      </span>
    </button>
  );
}
