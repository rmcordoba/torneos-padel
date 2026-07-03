"use client";

import { useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MatchForImage = {
  id: string;
  date: string;           // "2026-05-10"
  startTime: string;      // "10:00"
  venueName: string;
  courtName: string | null;
  team1: string[];        // ["M. García", "J. López"]
  team2: string[];
};

type Props = {
  tournamentName: string;
  categoryName: string;
  organizerName: string;
  matches: MatchForImage[];
};

// ─── Colors (all explicit hex — no CSS vars for html2canvas) ─────────────────

const C = {
  bg:         "#0b1220",
  bgCard:     "#0f1a2e",
  bgCardInner:"#0d1526",
  border:     "#1a2744",
  accent:     "#a3e635",
  accentDim:  "rgba(163,230,53,0.15)",
  accentBorder:"rgba(163,230,53,0.3)",
  white:      "#f1f5f9",
  muted:      "#94a3b8",
  faint:      "#4a5568",
  vs:         "#a3e635",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const DAYS_FULL    = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return `${DAYS_FULL[d.getDay()]} ${d.getDate()} de ${MONTHS_SHORT[d.getMonth()]}`;
}

function groupByDate(matches: MatchForImage[]): Map<string, MatchForImage[]> {
  const map = new Map<string, MatchForImage[]>();
  for (const m of matches) {
    const existing = map.get(m.date) ?? [];
    existing.push(m);
    map.set(m.date, existing);
  }
  return map;
}

// ─── Card component (rendered off-screen for capture) ────────────────────────

function FixtureCard({ data, cardRef }: { data: Props; cardRef?: React.RefObject<HTMLDivElement | null> }) {
  const grouped = groupByDate(data.matches);
  const F = "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif";

  return (
    <div
      ref={cardRef}
      style={{
        width: 1080,
        background: C.bg,
        fontFamily: F,
        display: "flex",
        flexDirection: "column",
        minHeight: 1920,
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 8, background: C.accent, flexShrink: 0 }} />

      {/* Header */}
      <div style={{ padding: "56px 64px 44px", flexShrink: 0 }}>

        {/* Organizer row */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: C.accentDim, border: `1.5px solid ${C.accentBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26,
          }}>
            🎾
          </div>
          <span style={{
            fontSize: 15, fontWeight: 700, color: C.faint,
            textTransform: "uppercase", letterSpacing: "0.12em",
          }}>
            {data.organizerName}
          </span>
        </div>

        {/* Tournament name */}
        <div style={{
          fontSize: 52, fontWeight: 900, color: C.white,
          lineHeight: 1.1, marginBottom: 20,
          letterSpacing: "-0.02em",
        }}>
          {data.tournamentName}
        </div>

        {/* Category badge */}
        <div style={{ display: "inline-flex", alignItems: "center" }}>
          <span style={{
            padding: "8px 22px", borderRadius: 100,
            background: C.accentDim, border: `1.5px solid ${C.accentBorder}`,
            color: C.accent, fontSize: 17, fontWeight: 800,
            letterSpacing: "0.02em",
          }}>
            {data.categoryName}
          </span>
        </div>
      </div>

      {/* Section divider */}
      <div style={{ margin: "0 64px 44px", display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <span style={{
          fontSize: 13, fontWeight: 800, color: C.faint,
          textTransform: "uppercase", letterSpacing: "0.18em",
        }}>
          Fixture & Horarios
        </span>
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>

      {/* Matches */}
      <div style={{ padding: "0 64px", flex: 1, display: "flex", flexDirection: "column", gap: 32 }}>
        {data.matches.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: C.faint, fontSize: 18 }}>
            Sin partidos programados
          </div>
        ) : (
          Array.from(grouped.entries()).map(([date, dayMatches]) => (
            <div key={date} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Date header */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                padding: "10px 20px", borderRadius: 10,
                background: C.bgCard, border: `1px solid ${C.border}`,
                alignSelf: "flex-start",
              }}>
                <span style={{ fontSize: 15, color: C.accent }}>📅</span>
                <span style={{
                  fontSize: 15, fontWeight: 800, color: C.muted,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                }}>
                  {formatDate(date)}
                </span>
              </div>

              {/* Match cards */}
              {dayMatches.map((match) => (
                <div
                  key={match.id}
                  style={{
                    background: C.bgCard,
                    border: `1px solid ${C.border}`,
                    borderRadius: 20,
                    overflow: "hidden",
                  }}
                >
                  {/* Teams row */}
                  <div style={{
                    display: "flex", alignItems: "center",
                    padding: "26px 32px", gap: 0,
                  }}>
                    {/* Team 1 */}
                    <div style={{ flex: 1, textAlign: "right", paddingRight: 28 }}>
                      {match.team1.map((name, i) => (
                        <div key={i} style={{
                          fontSize: 20, fontWeight: 800, color: C.white,
                          lineHeight: 1.5, letterSpacing: "-0.01em",
                        }}>
                          {name}
                        </div>
                      ))}
                    </div>

                    {/* VS */}
                    <div style={{
                      width: 72, textAlign: "center", flexShrink: 0,
                      fontSize: 22, fontWeight: 900, color: C.accent,
                      letterSpacing: "0.04em",
                    }}>
                      VS
                    </div>

                    {/* Team 2 */}
                    <div style={{ flex: 1, textAlign: "left", paddingLeft: 28 }}>
                      {match.team2.map((name, i) => (
                        <div key={i} style={{
                          fontSize: 20, fontWeight: 800, color: C.white,
                          lineHeight: 1.5, letterSpacing: "-0.01em",
                        }}>
                          {name}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Info bar */}
                  <div style={{
                    padding: "14px 32px",
                    background: C.bgCardInner,
                    borderTop: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", gap: 28,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15 }}>🕐</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: C.muted }}>
                        {match.startTime}
                      </span>
                    </div>
                    <div style={{ width: 1, height: 16, background: C.border }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15 }}>📍</span>
                      <span style={{ fontSize: 15, fontWeight: 600, color: C.muted }}>
                        {match.venueName}
                        {match.courtName ? ` · ${match.courtName}` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        margin: "52px 64px 0",
        paddingTop: 32, paddingBottom: 44,
        borderTop: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: C.accentDim, border: `1px solid ${C.accentBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>
            🎾
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, color: C.muted, letterSpacing: "-0.01em" }}>
            PadelPro
          </span>
        </div>
        <span style={{ fontSize: 13, color: C.faint, fontWeight: 500 }}>
          Gestión inteligente de torneos
        </span>
      </div>

      {/* Bottom accent bar */}
      <div style={{ height: 8, background: C.accent, flexShrink: 0 }} />
    </div>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────

export function GenerarImagenBtn(props: Props) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  async function handleDownload() {
    if (!captureRef.current) return;
    setLoading(true);
    try {
      // Carga diferida: html2canvas pesa ~45 kB y solo se necesita al descargar
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(captureRef.current, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#0b1220",
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `fixture-${props.categoryName.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setLoading(false);
    }
  }

  const SCALE = 0.34; // 1080 * 0.34 ≈ 367px preview width

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "9px 18px", borderRadius: 9,
          border: "1px solid var(--border-default)",
          background: "transparent", color: "var(--text-muted)",
          fontFamily: "inherit", fontSize: 13, fontWeight: 600,
          cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7,
          transition: "all .12s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(163,230,53,.4)";
          e.currentTarget.style.color = "#a3e635";
          e.currentTarget.style.background = "rgba(163,230,53,.07)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-default)";
          e.currentTarget.style.color = "var(--text-muted)";
          e.currentTarget.style.background = "transparent";
        }}
      >
        📸 Compartir fixture
      </button>

      {/* Hidden capture target — off-screen, full 1080px */}
      <div style={{ position: "fixed", left: -1200, top: 0, zIndex: -1, pointerEvents: "none" }}>
        <FixtureCard data={props} cardRef={captureRef} />
      </div>

      {/* Modal */}
      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,.75)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
          }}
        >
          <div style={{
            background: "oklch(14% 0.012 250)",
            border: "1px solid var(--border-default)",
            borderRadius: 18,
            padding: 24,
            display: "flex", flexDirection: "column", gap: 20,
            maxHeight: "90vh", overflow: "hidden",
            width: "fit-content",
            maxWidth: "100%",
          }}>
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  Imagen para compartir
                </h2>
                <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "4px 0 0" }}>
                  Formato vertical · Instagram Stories / WhatsApp Status
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: "oklch(20% 0.01 250)", border: "1px solid oklch(28% 0.01 250)",
                  color: "var(--text-faint)", cursor: "pointer", fontSize: 13,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            {/* Preview */}
            <div style={{
              overflow: "auto",
              maxHeight: "calc(90vh - 140px)",
              borderRadius: 12,
              border: "1px solid var(--border-subtle)",
            }}>
              <div style={{
                width: 1080 * SCALE,
                height: "auto",
                transformOrigin: "top left",
              }}>
                <div style={{
                  transform: `scale(${SCALE})`,
                  transformOrigin: "top left",
                  width: 1080,
                }}>
                  <FixtureCard data={props} />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  padding: "9px 18px", borderRadius: 9,
                  border: "1px solid var(--border-default)",
                  background: "transparent", color: "var(--text-faint)",
                  fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDownload}
                disabled={loading}
                style={{
                  padding: "9px 22px", borderRadius: 9,
                  background: loading ? "rgba(163,230,53,.4)" : "#a3e635",
                  border: "none", color: "#0f172a",
                  fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                {loading ? "⏳ Generando…" : "↓ Descargar PNG"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
