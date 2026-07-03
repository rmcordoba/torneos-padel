import Link from "next/link";

const ACCENT = "#a3e635";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-grid" style={{
      minHeight: "100vh",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      background: "#050c18",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Dot-grid texture over whole screen */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "32px 32px", opacity: 0.4,
      }} />

      {/* ═══ LEFT — branding panel (hidden on small screens via CSS) ═══ */}
      <div className="auth-brand" style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "48px 56px",
        background: "linear-gradient(145deg, rgba(8,16,36,0.6) 0%, rgba(6,12,28,0.3) 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}>
        {/* Ambient glow */}
        <div aria-hidden style={{
          position: "absolute", top: "20%", left: "10%", width: 420, height: 420,
          background: "radial-gradient(circle, rgba(163,230,53,0.1) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
          animation: "glow-drift 11s ease-in-out infinite",
        }} />

        {/* Logo top */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", position: "relative", zIndex: 2 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(163,230,53,0.12)", border: "1.5px solid rgba(163,230,53,0.28)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            boxShadow: "0 0 20px rgba(163,230,53,0.18)",
          }}>🎾</div>
          <div style={{ fontFamily: "var(--font-space), sans-serif", fontWeight: 800, fontSize: 18 }}>
            <span style={{ color: "#f8fafc" }}>Pádel</span>
            <span style={{ color: ACCENT }}>Pro</span>
          </div>
        </Link>

        {/* Center: court art + tagline */}
        <div style={{ position: "relative", zIndex: 2 }}>
          {/* Court SVG */}
          <div style={{ marginBottom: 36, display: "flex", justifyContent: "center" }}>
            <div style={{ perspective: "560px", perspectiveOrigin: "50% 30%" }}>
              <div className="court-svg" style={{ transform: "rotateX(44deg) rotateZ(-6deg)", transformStyle: "preserve-3d" }}>
                <svg viewBox="0 0 200 360" width="180" height="324" style={{ display: "block", overflow: "visible" }}>
                  <defs>
                    <filter id="authng"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    <filter id="authlg"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  </defs>
                  <rect x="2" y="2" width="196" height="356" rx="3" fill="rgba(163,230,53,0.025)" stroke="rgba(163,230,53,0.5)" strokeWidth="2"/>
                  <rect x="16" y="16" width="168" height="328" rx="1" fill="none" stroke="rgba(163,230,53,0.18)" strokeWidth="1"/>
                  <line x1="16" y1="112" x2="184" y2="112" stroke="rgba(163,230,53,0.2)" strokeWidth="1"/>
                  <line x1="16" y1="248" x2="184" y2="248" stroke="rgba(163,230,53,0.2)" strokeWidth="1"/>
                  <line x1="100" y1="112" x2="100" y2="248" stroke="rgba(163,230,53,0.2)" strokeWidth="1"/>
                  <line x1="-4" y1="180" x2="204" y2="180" stroke={ACCENT} strokeWidth="2.5" filter="url(#authng)" opacity="0.9"/>
                  <circle cx="0" cy="180" r="4" fill={ACCENT} opacity="0.85"/>
                  <circle cx="200" cy="180" r="4" fill={ACCENT} opacity="0.85"/>
                  {/* Ball */}
                  <g filter="url(#authlg)">
                    <circle cx="140" cy="90" r="9" fill={ACCENT} opacity="0.95">
                      <animateMotion path="M0,0 C16,-24 34,-6 8,10 C-12,22 -26,6 0,0" dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"/>
                    </circle>
                  </g>
                </svg>
              </div>
            </div>
          </div>

          <h2 style={{
            fontFamily: "var(--font-space), sans-serif",
            fontSize: 32, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em",
            marginBottom: 14, maxWidth: 380,
          }} className="grad-text">
            Gestioná tus torneos de pádel
          </h2>
          <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.6, maxWidth: 360, marginBottom: 28 }}>
            Creá torneos, gestioná inscripciones, generá cuadros automáticos y seguí resultados en tiempo real.
          </p>

          {/* Feature bullets */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: "🏆", text: "Torneos con cuadros automáticos" },
              { icon: "📊", text: "Ranking y estadísticas en vivo" },
              { icon: "📅", text: "Agenda y gestión de canchas" },
            ].map((f) => (
              <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  background: "rgba(163,230,53,0.08)", border: "1px solid rgba(163,230,53,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                }}>{f.icon}</div>
                <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ position: "relative", zIndex: 2, fontSize: 12, color: "#334155" }}>
          PádelPro · 2026 · <Link href="/torneos" style={{ color: "#475569", textDecoration: "none" }}>Ver portal público →</Link>
        </div>
      </div>

      {/* ═══ RIGHT — form area ═══ */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "32px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* Compact logo — visible only when brand panel is hidden */}
          <Link href="/" className="auth-mobile-logo" style={{
            display: "none", alignItems: "center", justifyContent: "center", gap: 10,
            textDecoration: "none", marginBottom: 28,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "rgba(163,230,53,0.12)", border: "1.5px solid rgba(163,230,53,0.28)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>🎾</div>
            <div style={{ fontFamily: "var(--font-space), sans-serif", fontWeight: 800, fontSize: 18 }}>
              <span style={{ color: "#f8fafc" }}>Pádel</span>
              <span style={{ color: ACCENT }}>Pro</span>
            </div>
          </Link>

          {children}
        </div>
      </div>

      {/* Responsive: hide brand panel on narrow screens */}
      <style>{`
        @media (max-width: 860px) {
          .auth-grid { grid-template-columns: 1fr !important; }
          .auth-brand { display: none !important; }
          .auth-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
