// Dashboard, Torneos, and other main views

const { useState, useEffect } = React;

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
const Dashboard = ({ data, onNavigate }) => {
  const pendientes = data.inscripciones.filter(i => i.estado === "pendiente");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <StatCard label="Torneos Activos" value={data.stats.torneosActivos} sub="en curso" accent="#a3e635" />
        <StatCard label="Jugadores" value={data.stats.jugadoresRegistrados} sub="registrados" accent="#60a5fa" />
        <StatCard label="Pendientes" value={data.stats.inscripcionesPendientes} sub="inscripciones" accent="#fbbf24" />
        <StatCard label="Partidos Hoy" value={data.stats.partidosHoy} sub="programados" accent="#a78bfa" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 }}>
        {/* Torneos activos */}
        <Card>
          <SectionTitle title="Torneos activos" action={
            <Btn small variant="ghost" onClick={() => onNavigate("torneos")}>Ver todos →</Btn>
          } />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.torneos.filter(t => t.estado !== "finalizado").map(t => (
              <div key={t.id} onClick={() => onNavigate("torneo", t.id)} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                background: "oklch(22% 0.012 250)", borderRadius: 10,
                border: "1px solid oklch(30% 0.01 250)", cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(163,230,53,0.3)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "oklch(30% 0.01 250)"}
              >
                <Avatar initials={t.nombre[0]} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 14, fontFamily: "Space Grotesk, sans-serif" }}>{t.nombre}</span>
                    <Badge estado={t.estado} />
                  </div>
                  <span style={{ fontSize: 12, color: "#475569" }}>{t.sede} · {t.categorias.length} categorías · {t.formato}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{t.fechaInicio} →</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{t.fechaFin}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Inscripciones pendientes */}
        <Card>
          <SectionTitle title="Pendientes de aprobación" action={
            <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 600 }}>{pendientes.length} nuevas</span>
          } />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pendientes.slice(0, 5).map(i => (
              <div key={i.id} style={{
                padding: "12px 14px", background: "oklch(22% 0.012 250)",
                borderRadius: 9, border: "1px solid oklch(30% 0.01 250)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.3 }}>{i.pareja[0]}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.3 }}>{i.pareja[1]}</div>
                  </div>
                  <Badge estado={i.estado} />
                </div>
                <div style={{ fontSize: 11, color: "#475569", marginBottom: 10 }}>{i.categoria} · {i.fecha}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn small variant="success">✓ Aprobar</Btn>
                  <Btn small variant="danger">✕ Rechazar</Btn>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Agenda del día */}
      <Card>
        <SectionTitle title="Agenda de hoy — Lun 21 Abr" action={
          <span style={{ fontSize: 12, color: "#475569" }}>Copa de Verano 2026</span>
        } />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
          {data.agenda.map(a => (
            <div key={a.id} style={{
              padding: "12px 10px", borderRadius: 9, textAlign: "center",
              background: a.estado === "en_curso" ? "rgba(163,230,53,0.08)" : "oklch(22% 0.012 250)",
              border: `1px solid ${a.estado === "en_curso" ? "rgba(163,230,53,0.35)" : "oklch(30% 0.01 250)"}`,
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: a.estado === "en_curso" ? "#a3e635" : "#f1f5f9", fontFamily: "Space Grotesk, sans-serif" }}>{a.hora}</div>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>{a.cancha}</div>
              <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.4, marginBottom: 6 }}>{a.partido.replace(" vs ", "\nvs\n")}</div>
              <Badge estado={a.estado} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ─── TORNEOS LIST ─────────────────────────────────────────────────────────────
const TorneosView = ({ torneos, onNavigate }) => {
  const [filtro, setFiltro] = useState("todos");
  const [showWizard, setShowWizard] = useState(false);
  const filtered = filtro === "todos" ? torneos : torneos.filter(t => t.estado === filtro);
  return (
    <div>
      {showWizard && (() => { const W = window.TorneoWizard; return W ? <W onClose={() => setShowWizard(false)} onCreated={() => setShowWizard(false)} /> : null; })()}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: "#f1f5f9" }}>Torneos</h1>
        <Btn onClick={() => setShowWizard(true)}>+ Nuevo torneo</Btn>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {["todos","activo","inscripciones","finalizado"].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: "6px 14px", borderRadius: 20, border: "1px solid",
            borderColor: filtro === f ? "#a3e635" : "oklch(30% 0.01 250)",
            background: filtro === f ? "rgba(163,230,53,0.1)" : "transparent",
            color: filtro === f ? "#a3e635" : "#64748b",
            fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer",
            textTransform: "capitalize",
          }}>
            {f === "todos" ? "Todos" : f === "inscripciones" ? "Inscripciones" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(t => (
          <div key={t.id} onClick={() => onNavigate("torneo", t.id)} style={{
            display: "grid", gridTemplateColumns: "auto 1fr auto auto",
            alignItems: "center", gap: 20, padding: "18px 20px",
            background: "oklch(19% 0.012 250)", borderRadius: 12,
            border: "1px solid oklch(28% 0.01 250)", cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(163,230,53,0.3)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "oklch(28% 0.01 250)"}
          >
            <Avatar initials={t.nombre.slice(0,2).toUpperCase()} size={44} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", fontFamily: "Space Grotesk, sans-serif" }}>{t.nombre}</span>
                <Badge estado={t.estado} />
              </div>
              <span style={{ fontSize: 13, color: "#475569" }}>
                {t.sede} · {t.formato} · {t.fechaInicio} → {t.fechaFin}
              </span>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {t.categorias.map(c => (
                <div key={c.id} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 3 }}>{c.nombre}</div>
                  <ProgressBar value={c.inscriptos} max={c.cupo} />
                </div>
              ))}
            </div>
            <span style={{ color: "#475569", fontSize: 18 }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── TORNEO DETALLE ───────────────────────────────────────────────────────────
const TorneoDetalle = ({ torneo, data, onBack }) => {
  const [tab, setTab] = useState("categorias");
  const tabs = [
    { id: "categorias", label: "Categorías", count: torneo.categorias.length },
    { id: "inscripciones", label: "Inscripciones", count: data.inscripciones.length },
    { id: "fixture", label: "Fixture / Cuadro" },
    { id: "agenda", label: "Agenda", count: data.agenda.length },
  ];
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13, fontFamily: "inherit", marginBottom: 12, padding: 0 }}>
          ← Volver a torneos
        </button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar initials={torneo.nombre.slice(0,2).toUpperCase()} size={48} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: "#f1f5f9" }}>{torneo.nombre}</h1>
                <Badge estado={torneo.estado} />
              </div>
              <span style={{ fontSize: 13, color: "#475569" }}>{torneo.sede} · {torneo.formato} · {torneo.fechaInicio} → {torneo.fechaFin}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" small>⚙ Configurar</Btn>
            <Btn small>↗ Publicar</Btn>
          </div>
        </div>
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === "categorias" && <CategoriasTab torneo={torneo} />}
      {tab === "inscripciones" && <InscripcionesTab data={data} />}
      {tab === "fixture" && <FixtureTab fixture={data.fixture} />}
      {tab === "agenda" && <AgendaTab agenda={data.agenda} />}
    </div>
  );
};

// ─── CATEGORÍAS TAB ────────────────────────────────────────────────────────────
const CategoriasTab = ({ torneo }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
    {torneo.categorias.map(c => (
      <Card key={c.id}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", fontFamily: "Space Grotesk, sans-serif", marginBottom: 4 }}>{c.nombre}</div>
            <Badge estado={c.estado} />
          </div>
          <Btn small variant="ghost">Ver cuadro →</Btn>
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>Ocupación</span>
            <span style={{ fontSize: 12, color: c.inscriptos >= c.cupo ? "#f87171" : "#a3e635", fontWeight: 700 }}>{c.inscriptos}/{c.cupo} parejas</span>
          </div>
          <ProgressBar value={c.inscriptos} max={c.cupo} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn small variant="ghost">+ Inscribir pareja</Btn>
          <Btn small variant="ghost">🎾 Generar fixture</Btn>
        </div>
      </Card>
    ))}
    <Card style={{ border: "2px dashed oklch(30% 0.01 250)", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120 }}>
      <Btn variant="ghost">+ Agregar categoría</Btn>
    </Card>
  </div>
);

// ─── INSCRIPCIONES TAB ─────────────────────────────────────────────────────────
const InscripcionesTab = ({ data }) => {
  const [inscripciones, setInscripciones] = useState(data.inscripciones);
  const [filtro, setFiltro] = useState("todas");
  const [search, setSearch] = useState("");

  const approve = (id) => setInscripciones(prev => prev.map(i => i.id === id ? { ...i, estado: "aprobada" } : i));
  const reject  = (id) => setInscripciones(prev => prev.map(i => i.id === id ? { ...i, estado: "rechazada" } : i));

  const filtered = inscripciones.filter(i => {
    const matchFiltro = filtro === "todas" || i.estado === filtro;
    const matchSearch = search === "" || i.pareja.some(p => p.toLowerCase().includes(search.toLowerCase())) || i.categoria.toLowerCase().includes(search.toLowerCase());
    return matchFiltro && matchSearch;
  });

  const counts = {
    pendiente: inscripciones.filter(i => i.estado === "pendiente").length,
    lista_espera: inscripciones.filter(i => i.estado === "lista_espera").length,
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar pareja o categoría..." style={{
          flex: 1, padding: "9px 14px", background: "oklch(22% 0.012 250)",
          border: "1px solid oklch(30% 0.01 250)", borderRadius: 8,
          color: "#e2e8f0", fontFamily: "inherit", fontSize: 13, outline: "none",
        }} />
        <div style={{ display: "flex", gap: 4 }}>
          {["todas","pendiente","aprobada","lista_espera","rechazada"].map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{
              padding: "8px 12px", borderRadius: 7, border: "1px solid",
              borderColor: filtro === f ? "#a3e635" : "oklch(30% 0.01 250)",
              background: filtro === f ? "rgba(163,230,53,0.1)" : "transparent",
              color: filtro === f ? "#a3e635" : "#64748b",
              fontFamily: "inherit", fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}>
              {f === "todas" ? "Todas" : f === "lista_espera" ? "Espera" : f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "pendiente" && counts.pendiente > 0 && <span style={{ marginLeft: 4, background: "#fbbf24", color: "#0a0f0a", borderRadius: 10, padding: "0 5px", fontSize: 10 }}>{counts.pendiente}</span>}
              {f === "lista_espera" && counts.lista_espera > 0 && <span style={{ marginLeft: 4, background: "#a78bfa", color: "#0a0f0a", borderRadius: 10, padding: "0 5px", fontSize: 10 }}>{counts.lista_espera}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 160px 140px 160px", gap: 12, padding: "8px 16px" }}>
          {["Jugador 1","Jugador 2","Categoría","Fecha","Estado"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
          ))}
        </div>
        {filtered.map(i => (
          <div key={i.id} style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 160px 140px 160px",
            gap: 12, padding: "14px 16px", alignItems: "center",
            background: "oklch(19% 0.012 250)", borderRadius: 10,
            border: `1px solid ${i.estado === "pendiente" ? "rgba(251,191,36,0.2)" : "oklch(28% 0.01 250)"}`,
          }}>
            <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>{i.pareja[0]}</span>
            <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>{i.pareja[1]}</span>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>{i.categoria}</span>
            <span style={{ fontSize: 12, color: "#475569" }}>{i.fecha}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Badge estado={i.estado} />
              {i.estado === "pendiente" && (
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => approve(i.id)} title="Aprobar" style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(163,230,53,0.15)", border: "1px solid rgba(163,230,53,0.3)", color: "#a3e635", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✓</button>
                  <button onClick={() => reject(i.id)} title="Rechazar" style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#475569" }}>No hay inscripciones que coincidan</div>
        )}
      </div>
    </div>
  );
};

// ─── FIXTURE TAB ───────────────────────────────────────────────────────────────
const FixtureTab = ({ fixture }) => {
  const colW = 220;
  const rowH = 80;
  const vGap = 20;
  const hGap = 40;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", fontFamily: "Space Grotesk, sans-serif" }}>{fixture.categoriaNombre}</span>
          <Badge estado="activo" />
          <span style={{ fontSize: 12, color: "#475569" }}>Eliminación Simple · {fixture.rondas.reduce((a,r) => a + r.partidos.length, 0)} partidos</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn small variant="ghost">↓ Exportar</Btn>
          <Btn small>+ Cargar resultado</Btn>
        </div>
      </div>

      <div style={{ overflowX: "auto", paddingBottom: 16 }}>
        <div style={{ display: "flex", gap: hGap, minWidth: fixture.rondas.length * (colW + hGap) }}>
          {fixture.rondas.map((ronda, ri) => {
            const count = ronda.partidos.length;
            const totalH = count * rowH + (count - 1) * vGap;
            return (
              <div key={ri} style={{ width: colW, flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14, textAlign: "center" }}>
                  {ronda.nombre}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: vGap, justifyContent: "space-around", height: totalH > 200 ? totalH : "auto" }}>
                  {ronda.partidos.map((p, pi) => (
                    <MatchCard key={pi} partido={p} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const MatchCard = ({ partido }) => {
  const [hover, setHover] = useState(false);
  const isTBD = !partido.local || partido.local === "TBD";
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? "oklch(24% 0.015 250)" : "oklch(21% 0.012 250)",
        border: `1px solid ${partido.resultado ? "rgba(163,230,53,0.25)" : hover ? "oklch(32% 0.01 250)" : "oklch(28% 0.01 250)"}`,
        borderRadius: 10, overflow: "hidden", transition: "all 0.15s", cursor: "pointer",
      }}
    >
      {[partido.local, partido.visitante].map((equipo, i) => {
        const isGanador = equipo === partido.ganador;
        const esTBD = !equipo || equipo === "TBD";
        return (
          <div key={i} style={{
            padding: "9px 12px", display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: i === 0 ? "1px solid oklch(25% 0.01 250)" : "none",
            background: isGanador ? "rgba(163,230,53,0.06)" : "transparent",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {isGanador && <span style={{ fontSize: 9, color: "#a3e635" }}>🏆</span>}
              <span style={{
                fontSize: 12, fontWeight: isGanador ? 700 : 400,
                color: esTBD ? "#334155" : isGanador ? "#a3e635" : "#94a3b8",
              }}>
                {esTBD ? "Por definir" : equipo}
              </span>
            </div>
            {partido.resultado && (
              <span style={{ fontSize: 11, fontWeight: 700, color: isGanador ? "#a3e635" : "#475569" }}>
                {isGanador ? partido.resultado.split(", ").map(s => s.split("-")).map(([a,b]) => a).join("-") : partido.resultado.split(", ").map(s => s.split("-")).map(([a,b]) => b).join("-")}
              </span>
            )}
          </div>
        );
      })}
      {partido.hora && (
        <div style={{ padding: "5px 12px", display: "flex", gap: 8 }}>
          <span style={{ fontSize: 10, color: "#334155" }}>⏰ {partido.hora}</span>
          <span style={{ fontSize: 10, color: "#334155" }}>📍 {partido.cancha}</span>
        </div>
      )}
    </div>
  );
};

// ─── AGENDA TAB ────────────────────────────────────────────────────────────────
const AgendaTab = ({ agenda }) => (
  <div>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {["Lun 21","Mar 22","Mié 23","Jue 24","Vie 25"].map((d, i) => (
          <button key={i} style={{
            padding: "7px 14px", borderRadius: 8, border: "1px solid",
            borderColor: i === 0 ? "#a3e635" : "oklch(30% 0.01 250)",
            background: i === 0 ? "rgba(163,230,53,0.1)" : "transparent",
            color: i === 0 ? "#a3e635" : "#64748b",
            fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            {d}
          </button>
        ))}
      </div>
      <Btn small>+ Programar partido</Btn>
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "grid", gridTemplateColumns: "80px 120px 1fr 130px 140px", gap: 12, padding: "8px 16px" }}>
        {["Hora","Cancha","Partido","Categoría","Estado"].map(h => (
          <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
        ))}
      </div>
      {agenda.map(a => (
        <div key={a.id} style={{
          display: "grid", gridTemplateColumns: "80px 120px 1fr 130px 140px",
          gap: 12, padding: "14px 16px", alignItems: "center",
          background: a.estado === "en_curso" ? "rgba(163,230,53,0.04)" : "oklch(19% 0.012 250)",
          borderRadius: 10,
          border: `1px solid ${a.estado === "en_curso" ? "rgba(163,230,53,0.25)" : "oklch(28% 0.01 250)"}`,
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: a.estado === "en_curso" ? "#a3e635" : "#f1f5f9", fontFamily: "Space Grotesk, sans-serif" }}>{a.hora}</span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{a.cancha}</span>
          <span style={{ fontSize: 13, color: "#e2e8f0" }}>{a.partido}</span>
          <span style={{ fontSize: 12, color: "#64748b" }}>{a.categoria}</span>
          <Badge estado={a.estado} />
        </div>
      ))}
    </div>
  </div>
);

// ─── RANKING VIEW ──────────────────────────────────────────────────────────────
const RankingView = ({ ranking }) => {
  const [categoria, setCategoria] = useState("Masculino A");
  const categorias = ["Masculino A", "Masculino B", "Femenino A", "Mixto B"];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: "#f1f5f9" }}>Ranking</h1>
        <span style={{ fontSize: 12, color: "#475569" }}>Actualizado: Copa de Verano 2026 · Ronda 2</span>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {categorias.map(c => (
          <button key={c} onClick={() => setCategoria(c)} style={{
            padding: "7px 16px", borderRadius: 20, border: "1px solid",
            borderColor: categoria === c ? "#a3e635" : "oklch(30% 0.01 250)",
            background: categoria === c ? "rgba(163,230,53,0.1)" : "transparent",
            color: categoria === c ? "#a3e635" : "#64748b",
            fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            {c}
          </button>
        ))}
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid oklch(28% 0.01 250)", display: "grid", gridTemplateColumns: "56px 1fr 100px 100px 100px 100px", gap: 12, alignItems: "center" }}>
          {["#","Pareja","Puntos","Torneos","Victorias","Derrotas"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
          ))}
        </div>
        {ranking.map((r, i) => (
          <div key={r.pos} style={{
            padding: "16px 20px",
            borderBottom: i < ranking.length - 1 ? "1px solid oklch(25% 0.01 250)" : "none",
            display: "grid", gridTemplateColumns: "56px 1fr 100px 100px 100px 100px",
            gap: 12, alignItems: "center",
            background: i === 0 ? "rgba(163,230,53,0.04)" : i === 1 ? "rgba(96,165,250,0.03)" : i === 2 ? "rgba(251,191,36,0.03)" : "transparent",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              {i < 3 ? (
                <span style={{ fontSize: 18 }}>{["🥇","🥈","🥉"][i]}</span>
              ) : (
                <span style={{ fontSize: 14, fontWeight: 700, color: "#475569", fontFamily: "Space Grotesk, sans-serif" }}>{r.pos}</span>
              )}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{r.pareja[0]}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{r.pareja[1]}</div>
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: i === 0 ? "#a3e635" : "#f1f5f9", fontFamily: "Space Grotesk, sans-serif" }}>{r.pts}</span>
            <span style={{ fontSize: 13, color: "#94a3b8", textAlign: "center" }}>{r.torneos}</span>
            <span style={{ fontSize: 13, color: "#a3e635", fontWeight: 600, textAlign: "center" }}>{r.victorias}</span>
            <span style={{ fontSize: 13, color: "#f87171", textAlign: "center" }}>{r.derrotas}</span>
          </div>
        ))}
      </Card>
    </div>
  );
};

// Export all views
Object.assign(window, { Dashboard, TorneosView, TorneoDetalle, CategoriasTab, InscripcionesTab, FixtureTab, AgendaTab, RankingView });
