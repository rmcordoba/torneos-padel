import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrganizersByUser } from "@/modules/organizers/queries";
import { PortalHeader } from "./(public)/_components/portal-header";
import {
  HeroParticles,
  DriftingGlow,
  MarqueeBanner,
  SR,
  Counter,
  LivePing,
} from "./(public)/_components/landing-client";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "PádelPro — Torneos, Cuadros y Ranking" };

const ACCENT = "#a3e635";
const MAX    = 1140;

const FEATURES = [
  {
    href: "/torneos",
    emoji: "🏆",
    title: "Torneos",
    desc: "Explorá torneos activos, filtrá por estado e inscribite a los que tienen cupo disponible.",
    color: ACCENT,
    glow: "rgba(163,230,53,0.12)",
    border: "rgba(163,230,53,0.22)",
  },
  {
    href: "/cuadros",
    emoji: "⎇",
    title: "Cuadros",
    desc: "Seguí fixtures en tiempo real: grupos, llaves de eliminación y resultados al instante.",
    color: "#60a5fa",
    glow: "rgba(96,165,250,0.12)",
    border: "rgba(96,165,250,0.22)",
  },
  {
    href: "/agenda",
    emoji: "📅",
    title: "Agenda",
    desc: "Consultá el calendario de partidos: horarios, canchas y estado de cada encuentro.",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.12)",
    border: "rgba(167,139,250,0.22)",
  },
  {
    href: "/ranking",
    emoji: "📊",
    title: "Ranking",
    desc: "Clasificación automática al finalizar cada torneo, con podio visual y tabla completa.",
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.22)",
  },
  {
    href: "/jugadores",
    emoji: "👤",
    title: "Jugadores",
    desc: "Directorio completo con historial de torneos, categorías y posición en el ranking.",
    color: "#fb923c",
    glow: "rgba(249,115,22,0.12)",
    border: "rgba(249,115,22,0.22)",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Encontrá un torneo",
    desc: "Buscá torneos activos, mirá qué categorías tienen inscripciones abiertas y anotate con tu pareja.",
    icon: "🎾",
  },
  {
    num: "02",
    title: "Seguí cada partido",
    desc: "En tiempo real: grupos, cuadros de eliminación y scores a medida que los carga el organizador.",
    icon: "⚡",
  },
  {
    num: "03",
    title: "Subí en el ranking",
    desc: "Cada torneo suma puntos. Al finalizar se recalcula el ranking de temporada automáticamente.",
    icon: "🏅",
  },
];

/* ─── Padel court with enhanced SVG animations ──────────────────────────── */
function CourtArt() {
  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>

      {/* Ambient radial glow — static, no JS needed */}
      <div aria-hidden style={{
        position: "absolute", inset: -80,
        background: "radial-gradient(ellipse at 50% 50%, rgba(163,230,53,0.12) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      {/* 3D perspective container */}
      <div className="hero-court" style={{ perspective: "520px", perspectiveOrigin: "50% 28%" }}>
        <div className="court-svg" style={{ transform: "rotateX(46deg) rotateZ(-7deg)", transformStyle: "preserve-3d" }}>
          <svg viewBox="0 0 210 400" width="210" height="400" style={{ display: "block", overflow: "visible" }}>
            <defs>
              <filter id="lg"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <filter id="ng"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              <radialGradient id="spot" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(163,230,53,0.12)"/>
                <stop offset="100%" stopColor="transparent"/>
              </radialGradient>
            </defs>

            {/* Court surface */}
            <rect x="2" y="2" width="206" height="396" rx="3"
              fill="rgba(163,230,53,0.025)" stroke="rgba(163,230,53,0.55)" strokeWidth="2"/>

            {/* Inner zone (glass walls) */}
            <rect x="18" y="18" width="174" height="364" rx="1"
              fill="none" stroke="rgba(163,230,53,0.2)" strokeWidth="1"/>

            {/* Service lines */}
            <line x1="18" y1="124" x2="192" y2="124" stroke="rgba(163,230,53,0.22)" strokeWidth="1"/>
            <line x1="18" y1="276" x2="192" y2="276" stroke="rgba(163,230,53,0.22)" strokeWidth="1"/>

            {/* Center service line */}
            <line x1="105" y1="124" x2="105" y2="276" stroke="rgba(163,230,53,0.22)" strokeWidth="1"/>

            {/* Wall corners */}
            <line x1="2"   y1="2"   x2="18"  y2="18"  stroke="rgba(163,230,53,0.4)" strokeWidth="1.5"/>
            <line x1="208" y1="2"   x2="192" y2="18"  stroke="rgba(163,230,53,0.4)" strokeWidth="1.5"/>
            <line x1="2"   y1="398" x2="18"  y2="382" stroke="rgba(163,230,53,0.4)" strokeWidth="1.5"/>
            <line x1="208" y1="398" x2="192" y2="382" stroke="rgba(163,230,53,0.4)" strokeWidth="1.5"/>

            {/* Drifting spotlight — makes it feel alive */}
            <ellipse cx="105" cy="190" rx="55" ry="75" fill="url(#spot)" opacity="0.7">
              <animateTransform attributeName="transform" type="translate"
                values="0,0; 28,-55; -22,-65; 15,40; 0,0"
                dur="10s" repeatCount="indefinite" calcMode="spline"
                keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"/>
            </ellipse>

            {/* NET — glowing, with animation */}
            <line x1="-6" y1="200" x2="216" y2="200"
              stroke={ACCENT} strokeWidth="3" filter="url(#ng)" opacity="0.95"/>
            {/* Net glow pulse */}
            <line x1="-6" y1="200" x2="216" y2="200"
              stroke={ACCENT} strokeWidth="8" opacity="0.08">
              <animate attributeName="opacity" values="0.08;0.22;0.08" dur="2.5s" repeatCount="indefinite"/>
            </line>

            {/* Net posts */}
            <circle cx="0"   cy="200" r="5" fill={ACCENT} opacity="0.9"/>
            <circle cx="210" cy="200" r="5" fill={ACCENT} opacity="0.9"/>

            {/* ── Player 1 (bottom half) ── */}
            <rect x="72" y="308" width="24" height="36" rx="9"
              fill="rgba(163,230,53,0.1)" stroke="rgba(163,230,53,0.32)" strokeWidth="1.5">
              <animate attributeName="y" values="308;305;308" dur="1.4s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
            </rect>
            {/* Racket P1 */}
            <ellipse cx="97" cy="318" rx="6" ry="10" fill="none" stroke="rgba(163,230,53,0.38)" strokeWidth="1.5">
              <animateTransform attributeName="transform" type="rotate"
                values="-28 97 318;-16 97 318;-28 97 318"
                dur="0.85s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
            </ellipse>
            {/* Shadow P1 */}
            <ellipse cx="84" cy="348" rx="13" ry="3" fill="rgba(0,0,0,0.22)">
              <animate attributeName="rx" values="13;11;13" dur="1.4s" repeatCount="indefinite"/>
            </ellipse>

            {/* ── Player 2 (top half) ── */}
            <rect x="114" y="58" width="24" height="36" rx="9"
              fill="rgba(163,230,53,0.1)" stroke="rgba(163,230,53,0.32)" strokeWidth="1.5">
              <animate attributeName="y" values="58;61;58" dur="1.1s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
            </rect>
            {/* Racket P2 */}
            <ellipse cx="113" cy="67" rx="6" ry="10" fill="none" stroke="rgba(163,230,53,0.38)" strokeWidth="1.5">
              <animateTransform attributeName="transform" type="rotate"
                values="22 113 67;12 113 67;22 113 67"
                dur="0.95s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/>
            </ellipse>
            {/* Shadow P2 */}
            <ellipse cx="126" cy="96" rx="13" ry="3" fill="rgba(0,0,0,0.22)">
              <animate attributeName="rx" values="13;11;13" dur="1.1s" repeatCount="indefinite"/>
            </ellipse>

            {/* ── Main ball with trail ── */}
            <g filter="url(#lg)">
              {/* Trail ring */}
              <circle cx="148" cy="95" r="13" fill="none" stroke="rgba(163,230,53,0.2)" strokeWidth="2">
                <animateMotion path="M0,0 C18,-26 38,-8 8,10 C-14,24 -30,6 0,0"
                  dur="4.5s" repeatCount="indefinite" calcMode="spline"
                  keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"/>
                <animate attributeName="r" values="13;8;13" dur="4.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.35;0;0.35" dur="4.5s" repeatCount="indefinite"/>
              </circle>
              {/* Ball shadow */}
              <circle cx="148" cy="102" r="7" fill="rgba(0,0,0,0.35)">
                <animateMotion path="M0,4 C18,-22 38,-4 8,14 C-14,28 -30,10 0,4"
                  dur="4.5s" repeatCount="indefinite" calcMode="spline"
                  keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"/>
              </circle>
              {/* Ball */}
              <circle cx="148" cy="95" r="10" fill={ACCENT}>
                <animateMotion path="M0,0 C18,-26 38,-8 8,10 C-14,24 -30,6 0,0"
                  dur="4.5s" repeatCount="indefinite" calcMode="spline"
                  keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"/>
              </circle>
            </g>

            {/* ── Second ball (opposite side) ── */}
            <circle cx="68" cy="295" r="8" fill="rgba(163,230,53,0.5)">
              <animateMotion path="M0,0 C-14,-20 -24,4 0,16 C20,26 30,4 0,0"
                dur="6.2s" repeatCount="indefinite" calcMode="spline"
                keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"/>
            </circle>
          </svg>
        </div>
      </div>

      {/* "En vivo" floating badge */}
      <div style={{
        position: "absolute", top: 28, right: -4,
        display: "flex", alignItems: "center", gap: 7,
        padding: "7px 14px", borderRadius: 100,
        background: "rgba(163,230,53,0.1)",
        border: "1px solid rgba(163,230,53,0.28)",
        backdropFilter: "blur(10px)",
        fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.07em",
        boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
        animation: "hero-entry 0.7s cubic-bezier(0.23,1,0.32,1) 0.8s both",
      }}>
        <LivePing />
        En vivo
      </div>

      {/* Score card */}
      <div style={{
        position: "absolute", bottom: 52, left: -28,
        padding: "14px 18px", borderRadius: 16,
        background: "rgba(6,14,30,0.93)",
        border: "1px solid rgba(255,255,255,0.09)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
        animation: "hero-entry 0.7s cubic-bezier(0.23,1,0.32,1) 1s both",
        minWidth: 148,
      }}>
        <div style={{ fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>
          Set 2 · En curso
        </div>
        <div style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>
          García / Ruiz
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 26, fontWeight: 900, color: ACCENT, lineHeight: 1 }}>6</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 10, color: "#334155", fontWeight: 600 }}>
            <span>Set 1: 6–4</span>
            <span>Set 2: ...</span>
          </div>
          <span style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 26, fontWeight: 900, color: "#475569", lineHeight: 1 }}>3</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default async function LandingPage() {
  const session = await auth();

  let isOrganizer = false;
  if (session?.user?.id) {
    const memberships = await getOrganizersByUser(session.user.id);
    isOrganizer = memberships.length > 0;
  }

  const sessionUser = session?.user
    ? { name: session.user.name, email: session.user.email, systemRole: session.user.systemRole, isOrganizer }
    : null;

  const plans = await prisma.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });

  return (
    <div className="portal-bg">
      <PortalHeader sessionUser={sessionUser} />

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section style={{
        minHeight: "calc(100vh - 60px)",
        display: "flex", alignItems: "center",
        position: "relative", overflow: "hidden",
      }}>
        {/* Floating particles */}
        <HeroParticles count={24} />

        {/* Drifting ambient glow */}
        <DriftingGlow />

        {/* Vertical accent line */}
        <div aria-hidden style={{
          position: "absolute", top: 0, left: 0, width: 1, height: "100%",
          background: "linear-gradient(180deg, transparent 0%, rgba(163,230,53,0.22) 40%, transparent 100%)",
        }} />

        <div style={{
          maxWidth: MAX, margin: "0 auto", padding: "60px 24px", width: "100%",
          display: "grid", gridTemplateColumns: "1fr 420px", gap: 64, alignItems: "center",
          position: "relative",
        }}>

          {/* ── Left column ── */}
          <div>
            {/* Badge */}
            <div className="hero-badge" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 16px", borderRadius: 100, marginBottom: 28,
              background: "rgba(163,230,53,0.08)", border: "1px solid rgba(163,230,53,0.2)",
            }}>
              <span style={{ fontSize: 14 }}>🎾</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: ACCENT, letterSpacing: "0.05em" }}>
                Portal de torneos de pádel
              </span>
            </div>

            {/* Headline */}
            <h1
              className="hero-h1 grad-text"
              style={{
                fontFamily: "var(--font-space), sans-serif",
                fontSize: "clamp(36px, 5vw, 66px)",
                fontWeight: 900, lineHeight: 1.05,
                letterSpacing: "-0.03em", marginBottom: 24,
              }}
            >
              Todo el pádel,
              <br />en un solo lugar
            </h1>

            <p
              className="hero-sub"
              style={{ fontSize: 18, color: "#64748b", lineHeight: 1.7, maxWidth: 480, marginBottom: 36 }}
            >
              Seguí torneos en tiempo real, explorá cuadros y resultados,
              consultá el ranking y la agenda de partidos de tu organización.
            </p>

            {/* CTAs */}
            <div className="hero-ctas" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 44 }}>
              <Link
                href="/torneos"
                className="btn-lime"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  height: 52, padding: "0 32px", borderRadius: 100,
                  color: "#080e1a", fontSize: 15, fontWeight: 800, textDecoration: "none",
                  boxShadow: "0 0 32px rgba(163,230,53,0.35), 0 4px 16px rgba(0,0,0,0.3)",
                  letterSpacing: "-0.01em",
                }}
              >
                Explorar torneos →
              </Link>
              <Link
                href="/ranking"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  height: 52, padding: "0 26px", borderRadius: 100,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#e2e8f0", fontSize: 15, fontWeight: 600, textDecoration: "none",
                  backdropFilter: "blur(8px)", transition: "background .2s",
                }}
              >
                Ver ranking
              </Link>
              <Link
                href="/registrar-club"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  height: 52, padding: "0 26px", borderRadius: 100,
                  background: "rgba(163,230,53,0.08)",
                  border: "1px solid rgba(163,230,53,0.3)",
                  color: "#a3e635", fontSize: 15, fontWeight: 700, textDecoration: "none",
                  backdropFilter: "blur(8px)", transition: "background .2s",
                }}
              >
                🎾 Registrá tu club
              </Link>
            </div>

            {/* Quick links */}
            <div className="hero-links" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#334155", fontWeight: 600, marginRight: 4 }}>Explorá:</span>
              {[
                { href: "/cuadros",   label: "Cuadros"   },
                { href: "/agenda",    label: "Agenda"    },
                { href: "/jugadores", label: "Jugadores" },
              ].map((l) => (
                <Link key={l.href} href={l.href} style={{
                  fontSize: 12, fontWeight: 600, color: "#64748b", textDecoration: "none",
                  padding: "5px 14px", borderRadius: 100,
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "rgba(255,255,255,0.04)",
                  transition: "color .15s, border-color .15s",
                }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* ── Right column: court ── */}
          <CourtArt />
        </div>

        {/* Scroll hint */}
        <div aria-hidden style={{
          position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: 0.28,
        }}>
          <span style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.09em", textTransform: "uppercase" }}>
            Descubrí más
          </span>
          <div style={{ width: 1, height: 36, background: "linear-gradient(180deg, rgba(163,230,53,0.7), transparent)" }} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          MARQUEE BANNER
      ══════════════════════════════════════════════════ */}
      <MarqueeBanner />

      {/* ══════════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════════ */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.018)",
        backdropFilter: "blur(8px)",
      }}>
        <div style={{
          maxWidth: MAX, margin: "0 auto", padding: "44px 24px",
          display: "flex", justifyContent: "center", gap: 80, flexWrap: "wrap",
        }}>
          {[
            { target: 5,   suffix: "",   color: ACCENT,    label: "Secciones del portal",   special: undefined },
            { target: 0,   suffix: "",   color: "#60a5fa", label: "Partidos en tiempo real", special: "∞"       },
            { target: 100, suffix: "%",  color: "#a78bfa", label: "Acceso gratuito",          special: undefined },
          ].map((s) => (
            <SR key={s.label} style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "var(--font-space), sans-serif",
                fontSize: 52, fontWeight: 900, lineHeight: 1,
                color: s.color, marginBottom: 10,
                textShadow: `0 0 48px ${s.color}55`,
              }}>
                <Counter target={s.target} suffix={s.suffix} special={s.special} />
              </div>
              <div style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>{s.label}</div>
            </SR>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════ */}
      <section style={{ maxWidth: MAX, margin: "0 auto", padding: "88px 24px" }}>
        <SR style={{ textAlign: "center", marginBottom: 60 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
            Qué encontrás en PádelPro
          </p>
          <h2
            className="grad-text"
            style={{
              fontFamily: "var(--font-space), sans-serif",
              fontSize: "clamp(28px,4vw,44px)", fontWeight: 900,
              letterSpacing: "-0.02em", marginBottom: 16,
            }}
          >
            Toda la info del torneo
          </h2>
          <p style={{ fontSize: 16, color: "#64748b", maxWidth: 460, margin: "0 auto", lineHeight: 1.7 }}>
            Desde la inscripción hasta el podio final, seguí cada etapa sin perderte nada.
          </p>
        </SR>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <SR key={f.href} delay={(Math.min(i + 1, 5)) as 1|2|3|4|5}>
              <Link
                href={f.href}
                className="t-card"
                style={{ textDecoration: "none", display: "block" }}
              >
                {/* Icon gradient header */}
                <div style={{
                  padding: "24px 24px 18px",
                  background: `linear-gradient(135deg, ${f.glow} 0%, transparent 65%)`,
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                }}>
                  <div
                    className="fc-icon icon-bob"
                    style={{
                      width: 52, height: 52, borderRadius: 16,
                      background: f.glow, border: `1px solid ${f.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 24, boxShadow: `0 0 24px ${f.glow}`,
                    }}
                  >
                    {f.emoji}
                  </div>
                  <span className="fc-arrow" style={{ fontSize: 20, color: "#334155" }}>→</span>
                </div>

                {/* Body */}
                <div style={{ padding: "20px 24px 24px" }}>
                  <h3 style={{
                    fontFamily: "var(--font-space), sans-serif",
                    fontSize: 18, fontWeight: 800, color: "#f8fafc", marginBottom: 10,
                  }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65 }}>{f.desc}</p>
                  <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: f.color }}>
                    Explorar {f.title.toLowerCase()}
                    <span className="fc-arrow">→</span>
                  </div>
                </div>
              </Link>
            </SR>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════ */}
      <section style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.015)",
      }}>
        <div style={{ maxWidth: MAX, margin: "0 auto", padding: "80px 24px" }}>
          <SR style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
              Simple y rápido
            </p>
            <h2 style={{
              fontFamily: "var(--font-space), sans-serif",
              fontSize: "clamp(26px,4vw,40px)", fontWeight: 900,
              color: "#f8fafc", letterSpacing: "-0.02em",
            }}>
              ¿Cómo funciona?
            </h2>
          </SR>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {STEPS.map((step, i) => (
              <SR key={step.num} delay={(i + 1) as 1|2|3}>
                <div className="glass" style={{ borderRadius: 22, padding: "36px 32px", height: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
                    <span style={{
                      fontFamily: "var(--font-space), sans-serif",
                      fontSize: 11, fontWeight: 900, color: ACCENT, letterSpacing: "0.1em",
                    }}>
                      {step.num}
                    </span>
                    <div style={{ flex: 1, height: 1, background: "rgba(163,230,53,0.15)" }} />
                    <span className="icon-bob" style={{ fontSize: 30, display: "inline-block" }}>{step.icon}</span>
                  </div>
                  <h3 style={{
                    fontFamily: "var(--font-space), sans-serif",
                    fontSize: 20, fontWeight: 800, color: "#f8fafc", marginBottom: 12,
                  }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>{step.desc}</p>
                </div>
              </SR>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════ */}
      <section style={{ maxWidth: MAX, margin: "0 auto", padding: "80px 24px" }}>
        <SR>
          <div
            className="cta-pulse"
            style={{
              borderRadius: 28, padding: "64px 48px", textAlign: "center",
              background: "linear-gradient(135deg, rgba(163,230,53,0.07) 0%, rgba(8,16,38,0) 50%, rgba(56,189,248,0.05) 100%)",
              border: "1px solid rgba(163,230,53,0.14)",
              position: "relative", overflow: "hidden",
            }}
          >
            {/* Background top glow */}
            <div aria-hidden style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "radial-gradient(ellipse 60% 80% at 50% -10%, rgba(163,230,53,0.07) 0%, transparent 65%)",
            }} />

            {/* Decorative racket */}
            <div aria-hidden style={{
              position: "absolute", right: -20, bottom: -30,
              fontSize: 190, opacity: 0.032, lineHeight: 1,
              userSelect: "none", pointerEvents: "none",
              transform: "rotate(-18deg)",
            }}>🎾</div>

            <div style={{ position: "relative" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
                Acceso libre y gratuito
              </p>
              <h2
                className="grad-text"
                style={{
                  fontFamily: "var(--font-space), sans-serif",
                  fontSize: "clamp(28px,4vw,48px)", fontWeight: 900,
                  letterSpacing: "-0.02em", marginBottom: 16,
                }}
              >
                Empezá a explorar ahora
              </h2>
              <p style={{ fontSize: 17, color: "#64748b", maxWidth: 440, margin: "0 auto 40px", lineHeight: 1.7 }}>
                Todo el contenido es público y gratuito.
                Registrate si querés inscribirte a torneos con tu pareja.
              </p>

              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/torneos" className="btn-lime" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  height: 52, padding: "0 32px", borderRadius: 100,
                  color: "#080e1a", fontSize: 15, fontWeight: 800, textDecoration: "none",
                  boxShadow: "0 0 32px rgba(163,230,53,0.35)",
                  letterSpacing: "-0.01em",
                }}>
                  Ver torneos →
                </Link>
                <Link href="/cuadros" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  height: 52, padding: "0 28px", borderRadius: 100,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                  color: "#e2e8f0", fontSize: 15, fontWeight: 600, textDecoration: "none",
                  backdropFilter: "blur(8px)",
                }}>
                  Ver cuadros
                </Link>
              </div>
            </div>
          </div>
        </SR>
      </section>

      {/* ══════════════════════════════════════════════════
          PRICING — para clubes
      ══════════════════════════════════════════════════ */}
      {plans.length > 0 && (
        <section style={{ padding: "64px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth: MAX, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
              Para clubes y organizadores
            </p>
            <h2 className="grad-text" style={{ fontFamily: "var(--font-space), sans-serif", fontSize: "clamp(26px,3.5vw,40px)", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 12 }}>
              Gestioná tu club en su propio sitio
            </h2>
            <p style={{ fontSize: 16, color: "#64748b", maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.7 }}>
              Probalo gratis 14 días. Torneos, inscripciones, ranking y un sitio público propio para tu club.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, maxWidth: 680, margin: "0 auto 36px" }}>
              {plans.map((p) => (
                <div key={p.id} style={{
                  borderRadius: 18, padding: 28, textAlign: "left",
                  background: p.hasBookingsModule ? "rgba(163,230,53,0.06)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${p.hasBookingsModule ? "rgba(163,230,53,0.22)" : "rgba(255,255,255,0.08)"}`,
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif", marginBottom: 6 }}>{p.name}</div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: ACCENT, fontFamily: "var(--font-space), sans-serif", marginBottom: 16 }}>
                    {Number(p.priceMonthly).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })}
                    <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>/mes</span>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                    <li style={{ fontSize: 13, color: "#cbd5e1" }}>✓ Torneos, inscripciones y fixtures</li>
                    <li style={{ fontSize: 13, color: "#cbd5e1" }}>✓ Ranking y sitio público propio</li>
                    <li style={{ fontSize: 13, color: p.hasBookingsModule ? "#cbd5e1" : "#475569" }}>
                      {p.hasBookingsModule ? "✓ Reserva de canchas (turnos)" : "✗ Reserva de canchas"}
                    </li>
                  </ul>
                </div>
              ))}
            </div>

            <Link href="/registrar-club" className="btn-lime" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              height: 52, padding: "0 32px", borderRadius: 100,
              color: "#080e1a", fontSize: 15, fontWeight: 800, textDecoration: "none",
              boxShadow: "0 0 32px rgba(163,230,53,0.35)",
            }}>
              🎾 Registrá tu club gratis →
            </Link>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════ */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(5,12,24,0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        padding: "28px 0",
      }}>
        <div style={{
          maxWidth: MAX, margin: "0 auto", padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(163,230,53,0.12)", border: "1px solid rgba(163,230,53,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
              🎾
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-space), sans-serif", fontWeight: 800, fontSize: 13 }}>
                <span style={{ color: "#f8fafc" }}>Pádel</span>
                <span style={{ color: ACCENT }}>Pro</span>
              </div>
              <div style={{ fontSize: 10, color: "#334155", fontWeight: 500 }}>Gestión de torneos de pádel</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {["/torneos", "/cuadros", "/ranking", "/agenda", "/jugadores"].map((href) => (
              <Link key={href} href={href} style={{ fontSize: 12, color: "#334155", textDecoration: "none", fontWeight: 500 }}>
                {href.slice(1).charAt(0).toUpperCase() + href.slice(2)}
              </Link>
            ))}
          </div>
          <span style={{ fontSize: 11, color: "#1e2d4a" }}>PádelPro · 2026</span>
        </div>
      </footer>
    </div>
  );
}
