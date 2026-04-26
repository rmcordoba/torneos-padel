// Shared UI Components for Padel Tournament System

const Badge = ({ estado }) => {
  const map = {
    activo:          { label: "Activo",           bg: "rgba(163,230,53,0.15)",  color: "#a3e635", border: "rgba(163,230,53,0.3)" },
    inscripciones:   { label: "Inscripciones",    bg: "rgba(96,165,250,0.15)",  color: "#60a5fa", border: "rgba(96,165,250,0.3)" },
    finalizado:      { label: "Finalizado",        bg: "rgba(148,163,184,0.12)", color: "#94a3b8", border: "rgba(148,163,184,0.25)" },
    pendiente:       { label: "Pendiente",         bg: "rgba(251,191,36,0.15)",  color: "#fbbf24", border: "rgba(251,191,36,0.3)" },
    aprobada:        { label: "Aprobada",          bg: "rgba(163,230,53,0.15)",  color: "#a3e635", border: "rgba(163,230,53,0.3)" },
    rechazada:       { label: "Rechazada",         bg: "rgba(248,113,113,0.15)", color: "#f87171", border: "rgba(248,113,113,0.3)" },
    lista_espera:    { label: "Lista de espera",   bg: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "rgba(167,139,250,0.3)" },
    abierta:         { label: "Abierta",           bg: "rgba(163,230,53,0.12)",  color: "#a3e635", border: "rgba(163,230,53,0.25)" },
    llena:           { label: "Llena",             bg: "rgba(248,113,113,0.12)", color: "#f87171", border: "rgba(248,113,113,0.25)" },
    cerrada:         { label: "Cerrada",           bg: "rgba(148,163,184,0.12)", color: "#94a3b8", border: "rgba(148,163,184,0.25)" },
    programado:      { label: "Programado",        bg: "rgba(96,165,250,0.12)",  color: "#60a5fa", border: "rgba(96,165,250,0.25)" },
    en_curso:        { label: "En curso",          bg: "rgba(163,230,53,0.15)",  color: "#a3e635", border: "rgba(163,230,53,0.3)" },
    jugado:          { label: "Jugado",            bg: "rgba(148,163,184,0.12)", color: "#94a3b8", border: "rgba(148,163,184,0.25)" },
  };
  const s = map[estado] || { label: estado, bg: "#1e293b", color: "#94a3b8", border: "#334155" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase",
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {estado === "en_curso" && (
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a3e635", boxShadow: "0 0 6px #a3e635", display: "inline-block", animation: "pulse 1.5s infinite" }} />
      )}
      {s.label}
    </span>
  );
};

const Btn = ({ children, variant = "primary", onClick, small, disabled }) => {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: small ? "6px 14px" : "9px 20px",
    borderRadius: 8, fontFamily: "inherit",
    fontSize: small ? 12 : 13, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none", transition: "all 0.15s",
    opacity: disabled ? 0.45 : 1,
  };
  const variants = {
    primary: { background: "#a3e635", color: "#0a0f0a" },
    ghost:   { background: "transparent", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.2)" },
    danger:  { background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)" },
    success: { background: "rgba(163,230,53,0.15)", color: "#a3e635", border: "1px solid rgba(163,230,53,0.3)" },
  };
  return (
    <button style={{ ...base, ...variants[variant] }} onClick={!disabled ? onClick : undefined}>
      {children}
    </button>
  );
};

const Card = ({ children, style = {} }) => (
  <div style={{
    background: "oklch(19% 0.012 250)",
    border: "1px solid oklch(28% 0.01 250)",
    borderRadius: 12, padding: 20, ...style
  }}>
    {children}
  </div>
);

const StatCard = ({ label, value, sub, accent }) => (
  <Card style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
    <span style={{ fontSize: 36, fontWeight: 700, color: accent || "#f1f5f9", lineHeight: 1, fontFamily: "Space Grotesk, sans-serif" }}>{value}</span>
    {sub && <span style={{ fontSize: 12, color: "#475569" }}>{sub}</span>}
  </Card>
);

const SectionTitle = ({ title, action }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#f1f5f9", fontFamily: "Space Grotesk, sans-serif" }}>{title}</h2>
    {action}
  </div>
);

const Avatar = ({ initials, size = 32, color = "#a3e635" }) => (
  <div style={{
    width: size, height: size, borderRadius: 8,
    background: `${color}22`, border: `1px solid ${color}44`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.35, fontWeight: 700, color, flexShrink: 0,
    fontFamily: "Space Grotesk, sans-serif",
  }}>
    {initials}
  </div>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", gap: 2, borderBottom: "1px solid oklch(28% 0.01 250)", marginBottom: 20 }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{
        padding: "10px 18px", background: "none", border: "none",
        borderBottom: active === t.id ? "2px solid #a3e635" : "2px solid transparent",
        color: active === t.id ? "#a3e635" : "#64748b",
        fontFamily: "inherit", fontSize: 13, fontWeight: 600,
        cursor: "pointer", marginBottom: -1, transition: "all 0.15s",
      }}>
        {t.label}
        {t.count != null && (
          <span style={{
            marginLeft: 6, padding: "1px 7px", borderRadius: 20,
            fontSize: 10, fontWeight: 700,
            background: active === t.id ? "rgba(163,230,53,0.2)" : "rgba(148,163,184,0.15)",
            color: active === t.id ? "#a3e635" : "#64748b",
          }}>{t.count}</span>
        )}
      </button>
    ))}
  </div>
);

const ProgressBar = ({ value, max, color = "#a3e635" }) => {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: "oklch(25% 0.01 250)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? "#f87171" : color, borderRadius: 4, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: 11, color: "#64748b", minWidth: 45, textAlign: "right" }}>{value}/{max}</span>
    </div>
  );
};

// Export to window for cross-script access
Object.assign(window, { Badge, Btn, Card, StatCard, SectionTitle, Avatar, TabBar, ProgressBar });
