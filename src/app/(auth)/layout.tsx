export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-base)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Padel court SVG — fondo */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.045, pointerEvents: "none" }}
        viewBox="0 0 900 600"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect x="80" y="60" width="740" height="480" stroke="#a3e635" strokeWidth="3" rx="2" />
        <line x1="80" y1="300" x2="820" y2="300" stroke="#a3e635" strokeWidth="4" />
        <line x1="80" y1="183" x2="820" y2="183" stroke="#a3e635" strokeWidth="1.5" />
        <line x1="80" y1="417" x2="820" y2="417" stroke="#a3e635" strokeWidth="1.5" />
        <line x1="450" y1="183" x2="450" y2="417" stroke="#a3e635" strokeWidth="1.5" />
        <line x1="80" y1="60" x2="80" y2="540" stroke="#a3e635" strokeWidth="5" />
        <line x1="820" y1="60" x2="820" y2="540" stroke="#a3e635" strokeWidth="5" />
        <line x1="80" y1="60" x2="820" y2="60" stroke="#a3e635" strokeWidth="5" />
        <line x1="80" y1="540" x2="820" y2="540" stroke="#a3e635" strokeWidth="5" />
        <circle cx="80" cy="300" r="5" fill="#a3e635" />
        <circle cx="820" cy="300" r="5" fill="#a3e635" />
      </svg>

      {/* Glow izquierdo */}
      <div style={{ position: "absolute", left: -180, top: "50%", transform: "translateY(-50%)", width: 480, height: 480, background: "radial-gradient(circle, rgba(163,230,53,0.07) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
      {/* Glow derecho */}
      <div style={{ position: "absolute", right: -180, top: "50%", transform: "translateY(-50%)", width: 480, height: 480, background: "radial-gradient(circle, rgba(163,230,53,0.07) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />

      {/* Contenido */}
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 58, height: 58, borderRadius: 16, background: "var(--accent-15)", border: "1px solid var(--accent-30)", marginBottom: 16 }}>
            <PadelIcon />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", fontFamily: "Space Grotesk, sans-serif", letterSpacing: "-0.02em", margin: 0 }}>
            PadelPro
          </h1>
          <p style={{ fontSize: 13, color: "var(--accent)", marginTop: 6, fontWeight: 500 }}>
            Plataforma de gestión de torneos
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}

function PadelIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#a3e635" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" strokeOpacity="0.5" />
      <path d="M5 10 Q8 6 12 10 Q16 6 19 10" />
      <path d="M5 14 Q8 18 12 14 Q16 18 19 14" />
    </svg>
  );
}
