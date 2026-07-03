"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type SliderCategory = {
  id: string;
  status: string;
  maxTeams: number;
  category: { name: string };
  _count: { registrations: number };
};

type SliderTournament = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: Date | string;
  endDate: Date | string;
  organizer: { name: string };
  categories: SliderCategory[];
};

const ACCENT = "#a3e635";
const DELAY  = 8_000;

function fmt(d: Date | string, opts: Intl.DateTimeFormatOptions) {
  return new Date(d).toLocaleDateString("es-AR", opts);
}

function ProgressBar() {
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.04)" }}>
      <div style={{
        height: "100%", background: ACCENT,
        boxShadow: "0 0 8px rgba(163,230,53,0.6)",
        animation: `torneosProgress ${DELAY}ms linear forwards`,
      }} />
    </div>
  );
}

export function TorneosSlider({ tournaments, basePath = "" }: { tournaments: SliderTournament[]; basePath?: string }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const count = tournaments.length;

  const goTo = (idx: number) => setCurrent(((idx % count) + count) % count);

  useEffect(() => {
    if (count <= 1) return;
    timerRef.current = setTimeout(() => goTo(current + 1), DELAY);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, count]);

  const t = tournaments[current];

  return (
    <>
      <style>{`
        @keyframes torneosProgress {
          from { width: 0% }
          to   { width: 100% }
        }
        @keyframes heroFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Hero wrapper ── */}
      <div style={{
        position: "relative", overflow: "hidden",
        minHeight: 420,
        display: "flex", alignItems: "center",
        /* Layered dark + radial glow based on tournament status */
        background: "#060c1c",
        borderBottom: "1px solid rgba(163,230,53,0.08)",
      }}>

        {/* Ambient background glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `
            radial-gradient(ellipse 60% 80% at 80% 50%, rgba(163,230,53,0.12) 0%, transparent 65%),
            radial-gradient(ellipse 40% 60% at 0% 100%, rgba(56,189,248,0.06) 0%, transparent 60%)
          `,
        }} />

        {/* Big decorative number in background */}
        <div style={{
          position: "absolute", right: -10, top: "50%", transform: "translateY(-50%)",
          fontFamily: "var(--font-space), sans-serif", fontSize: "clamp(120px,18vw,220px)",
          fontWeight: 900, color: "rgba(163,230,53,0.04)",
          lineHeight: 1, userSelect: "none", pointerEvents: "none",
          letterSpacing: "-0.04em",
        }}>
          {String(current + 1).padStart(2, "0")}
        </div>

        {/* Content */}
        <div style={{
          position: "relative", maxWidth: 1140, margin: "0 auto",
          padding: "60px 24px 64px", width: "100%",
        }}>

          {/* Top metadata row */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16, marginBottom: 24,
            animation: "heroFadeIn .5s cubic-bezier(0.23,1,0.32,1) backwards",
          }}>
            {/* Live badge */}
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "5px 14px", borderRadius: 100,
              background: "rgba(163,230,53,0.12)",
              border: "1px solid rgba(163,230,53,0.25)",
              fontSize: 11, fontWeight: 700, color: ACCENT,
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: ACCENT, flexShrink: 0,
                boxShadow: "0 0 8px rgba(163,230,53,0.7)",
                animation: "pulse-dot 1.5s infinite",
              }} />
              En curso
            </span>

            <span style={{ fontSize: 13, color: "#475569" }}>
              {fmt(t.startDate, { day: "numeric", month: "long" })}
              {" – "}
              {fmt(t.endDate, { day: "numeric", month: "long", year: "numeric" })}
            </span>

            {count > 1 && (
              <span style={{ marginLeft: "auto", fontSize: 12, color: "#334155", fontVariantNumeric: "tabular-nums", fontFamily: "var(--font-space), sans-serif", fontWeight: 700 }}>
                {current + 1} / {count}
              </span>
            )}
          </div>

          {/* Tournament name — large gradient heading */}
          <h1 style={{
            fontFamily: "var(--font-space), sans-serif",
            fontSize: "clamp(32px,5vw,58px)",
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            marginBottom: 12,
            maxWidth: 720,
            background: "linear-gradient(135deg, #f8fafc 30%, #a3e635 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "heroFadeIn .6s .06s cubic-bezier(0.23,1,0.32,1) backwards",
          }}>
            {t.name}
          </h1>

          {t.description && (
            <p style={{
              fontSize: 16, color: "#64748b", maxWidth: 520, lineHeight: 1.6, marginBottom: 8,
              animation: "heroFadeIn .6s .1s cubic-bezier(0.23,1,0.32,1) backwards",
            }}>
              {t.description}
            </p>
          )}

          <p style={{
            fontSize: 13, color: "#475569", marginBottom: 36,
            display: "flex", alignItems: "center", gap: 6,
            animation: "heroFadeIn .5s .14s cubic-bezier(0.23,1,0.32,1) backwards",
          }}>
            <span style={{ fontSize: 14 }}>📍</span>
            {t.organizer.name}
          </p>

          {/* Category cards + CTA row */}
          <div style={{
            display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end",
            animation: "heroFadeIn .5s .18s cubic-bezier(0.23,1,0.32,1) backwards",
          }}>

            {/* Category pills — compact glass cards */}
            {t.categories.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {t.categories.slice(0, 4).map((tc) => {
                  const approved  = tc._count.registrations;
                  const pct       = tc.maxTeams > 0 ? Math.min(100, Math.round((approved / tc.maxTeams) * 100)) : 0;
                  const barColor  = pct >= 100 ? "#f87171" : pct > 75 ? "#fb923c" : ACCENT;
                  const isOpen    = tc.status === "REGISTRATION_OPEN";
                  return (
                    <Link
                      key={tc.id}
                      href={`${basePath}/torneos/${t.id}/categorias/${tc.id}`}
                      style={{
                        display: "flex", flexDirection: "column", gap: 6,
                        padding: "11px 14px", borderRadius: 12, textDecoration: "none",
                        background: "rgba(255,255,255,0.05)",
                        border: `1px solid ${isOpen ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.08)"}`,
                        backdropFilter: "blur(12px)",
                        minWidth: 130,
                        transition: "background .15s, border-color .15s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{tc.category.name}</span>
                        {isOpen && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Abierta</span>
                        )}
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 2, transition: "width .3s" }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#475569" }}>
                        {approved}/{tc.maxTeams} parejas
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* CTA + navigation */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
              <Link
                href={`${basePath}/torneos/${t.id}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  height: 44, padding: "0 24px", borderRadius: 100,
                  background: ACCENT, color: "#080e1a",
                  fontSize: 14, fontWeight: 800, textDecoration: "none",
                  boxShadow: "0 0 24px rgba(163,230,53,0.4), 0 4px 16px rgba(0,0,0,0.3)",
                  flexShrink: 0,
                }}
              >
                Ver torneo →
              </Link>

              {count > 1 && (
                <>
                  <button onClick={() => goTo(current - 1)} style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", backdropFilter: "blur(8px)", color: "#94a3b8", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {tournaments.map((_, i) => (
                      <button key={i} onClick={() => goTo(i)} style={{ width: i === current ? 24 : 8, height: 8, borderRadius: 4, border: "none", cursor: "pointer", padding: 0, background: i === current ? ACCENT : "rgba(255,255,255,0.2)", boxShadow: i === current ? "0 0 10px rgba(163,230,53,0.5)" : "none", transition: "all .25s ease" }} />
                    ))}
                  </div>
                  <button onClick={() => goTo(current + 1)} style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", backdropFilter: "blur(8px)", color: "#94a3b8", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
                </>
              )}
            </div>
          </div>
        </div>

        {count > 1 && <ProgressBar key={current} />}
      </div>
    </>
  );
}
