"use client";

import { useEffect, useRef, useState } from "react";

/* ─── Deterministic pseudo-random (avoids hydration mismatch) ─────────────── */
function pr(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/* ─── Floating particles background (client-only to avoid hydration drift) ── */
export function HeroParticles({ count = 22 }: { count?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Render nothing on the server / first client paint, then mount the particles.
  // This guarantees no SSR/CSR markup mismatch for these decorative elements.
  if (!mounted) return null;

  return (
    <div
      aria-hidden
      style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}
    >
      {Array.from({ length: count }, (_, i) => {
        const x      = (pr(i * 3.14) * 100).toFixed(3);
        const startY = (pr(i * 2.71) * 100).toFixed(3);
        const size   = +(pr(i * 1.61) * 3 + 1).toFixed(2);
        const dur    = (pr(i * 4.36) * 12 + 7).toFixed(2);
        const delay  = (pr(i * 7.07) * 14).toFixed(2);
        const kind   = pr(i * 5.55);
        const color  =
          kind < 0.45 ? "#a3e635" :
          kind < 0.72 ? "rgba(96,165,250,0.85)" :
                        "rgba(167,139,250,0.75)";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${startY}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              background: color,
              opacity: 0,
              animation: `p-float ${dur}s ${delay}s infinite ease-out`,
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── Ambient glow blob that slowly drifts ───────────────────────────────── */
export function DriftingGlow() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        width: "58%", height: "58%",
        borderRadius: "50%",
        background:
          "radial-gradient(ellipse, rgba(163,230,53,0.09) 0%, transparent 70%)",
        top: "8%", left: "34%",
        pointerEvents: "none",
        animation: "glow-drift 11s ease-in-out infinite",
        willChange: "transform",
      }}
    />
  );
}

/* ─── Scrolling marquee banner ───────────────────────────────────────────── */
const ITEMS = [
  "🏆 Torneos en vivo",
  "📊 Ranking actualizado",
  "⎇ Cuadros en tiempo real",
  "📅 Agenda de partidos",
  "👤 Directorio de jugadores",
  "🎾 Inscripciones abiertas",
  "⚡ Resultados al instante",
  "🥇 Podio y estadísticas",
];

export function MarqueeBanner() {
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <div
      style={{
        overflow: "hidden",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(163,230,53,0.025)",
        padding: "11px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "max-content",
          animation: "marquee 28s linear infinite",
          willChange: "transform",
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            style={{
              padding: "0 28px",
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
              display: "flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
              borderRight: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Scroll reveal wrapper ──────────────────────────────────────────────── */
export function SR({
  children,
  delay = 0,
  style,
  className = "",
}: {
  children: React.ReactNode;
  delay?: 0 | 1 | 2 | 3 | 4 | 5;
  style?: React.CSSProperties;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`sr${delay ? ` sr-d${delay}` : ""} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}

/* ─── Animated number counter ────────────────────────────────────────────── */
export function Counter({
  target,
  suffix = "",
  special,
  duration = 1800,
}: {
  target: number;
  suffix?: string;
  special?: string;  // display as-is (e.g. "∞")
  duration?: number;
}) {
  const [value, setValue] = useState("0");
  const ref     = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          if (special) {
            setTimeout(() => setValue(special), 300);
            return;
          }
          const t0 = performance.now();
          function tick() {
            const progress = Math.min((performance.now() - t0) / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(String(Math.round(eased * target)));
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, special, duration]);

  return (
    <span ref={ref}>
      {special && value === "0" ? "0" : value}
      {!special && suffix}
    </span>
  );
}

/* ─── Live ping indicator (double ring) ─────────────────────────────────── */
export function LivePing({ color = "#a3e635" }: { color?: string }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: 10, height: 10, flexShrink: 0 }}>
      {/* Ping ring */}
      <span style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: color, opacity: 0.4,
        animation: "ping 1.4s cubic-bezier(0,0,0.2,1) infinite",
      }} />
      {/* Solid dot */}
      <span style={{
        width: 10, height: 10, borderRadius: "50%",
        background: color,
        boxShadow: `0 0 8px ${color}80`,
      }} />
    </span>
  );
}
