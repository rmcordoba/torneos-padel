// Jugadores and Reportes views

const { useState: useState2, useEffect: useEffect2 } = React;

// ─── JUGADORES VIEW ────────────────────────────────────────────────────────────
const JugadoresView = () => {
  const [search, setSearch] = useState2("");
  const [categoriaFilter, setCategoriaFilter] = useState2("todas");
  const [selectedPlayer, setSelectedPlayer] = useState2(null);

  const categorias = ["todas", "Masculino A", "Masculino B", "Femenino A", "Mixto B"];

  const filtered = PLAYERS_DATA.filter(p => {
    const matchSearch = search === "" ||
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoriaFilter === "todas" || p.categorias.includes(categoriaFilter);
    return matchSearch && matchCat;
  });

  return (
    <div style={{ display: "flex", gap: 20, height: "calc(100vh - 130px)" }}>
      {/* Left: list */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Header + controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: "#f1f5f9" }}>
            Jugadores <span style={{ fontSize: 14, fontWeight: 400, color: "#475569", marginLeft: 6 }}>{filtered.length} encontrados</span>
          </h1>
          <Btn>+ Nuevo jugador</Btn>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email..."
              style={{ width: "100%", padding: "9px 14px 9px 36px", background: "oklch(19% 0.012 250)", border: "1px solid oklch(28% 0.01 250)", borderRadius: 8, color: "#e2e8f0", fontFamily: "inherit", fontSize: 13, outline: "none" }}
            />
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#334155", fontSize: 13 }}>🔍</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {categorias.map(c => (
              <button key={c} onClick={() => setCategoriaFilter(c)} style={{
                padding: "8px 12px", borderRadius: 7, border: "1px solid",
                borderColor: categoriaFilter === c ? "#a3e635" : "oklch(30% 0.01 250)",
                background: categoriaFilter === c ? "rgba(163,230,53,0.1)" : "transparent",
                color: categoriaFilter === c ? "#a3e635" : "#64748b",
                fontFamily: "inherit", fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}>
                {c === "todas" ? "Todas" : c}
              </button>
            ))}
          </div>
        </div>

        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px 80px 80px", gap: 12, padding: "8px 16px" }}>
          {["Jugador","Categorías","Sede","Torneos","V/D","Puntos"].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
          ))}
        </div>

        {/* Player rows */}
        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
          {filtered.map(p => (
            <div key={p.id} onClick={() => setSelectedPlayer(p)} style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px 80px 80px",
              gap: 12, padding: "14px 16px", alignItems: "center",
              background: selectedPlayer?.id === p.id ? "oklch(23% 0.015 250)" : "oklch(19% 0.012 250)",
              borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
              border: `1px solid ${selectedPlayer?.id === p.id ? "rgba(163,230,53,0.3)" : "oklch(28% 0.01 250)"}`,
            }}
            onMouseEnter={e => { if (selectedPlayer?.id !== p.id) e.currentTarget.style.borderColor = "oklch(34% 0.01 250)"; }}
            onMouseLeave={e => { if (selectedPlayer?.id !== p.id) e.currentTarget.style.borderColor = "oklch(28% 0.01 250)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar initials={p.avatar} size={34} color={p.ranking[Object.keys(p.ranking)[0]] === 1 ? "#a3e635" : "#60a5fa"} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{p.nombre}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{p.email}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {p.categorias.map(c => (
                  <span key={c} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "oklch(26% 0.012 250)", color: "#64748b", border: "1px solid oklch(32% 0.01 250)" }}>{c}</span>
                ))}
              </div>
              <span style={{ fontSize: 12, color: "#64748b" }}>{p.sede}</span>
              <span style={{ fontSize: 13, color: "#94a3b8", textAlign: "center" }}>{p.torneos}</span>
              <span style={{ fontSize: 12, textAlign: "center" }}>
                <span style={{ color: "#a3e635" }}>{p.victorias}</span>
                <span style={{ color: "#334155" }}>/</span>
                <span style={{ color: "#f87171" }}>{p.derrotas}</span>
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", fontFamily: "Space Grotesk, sans-serif", textAlign: "center" }}>{p.puntos}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: player profile panel */}
      {selectedPlayer ? (
        <PlayerProfile player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      ) : (
        <div style={{ width: 300, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ textAlign: "center", color: "#334155" }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>👤</div>
            <div style={{ fontSize: 13 }}>Seleccioná un jugador<br />para ver su perfil</div>
          </div>
        </div>
      )}
    </div>
  );
};

const PlayerProfile = ({ player, onClose }) => {
  const rankCat = Object.entries(player.ranking)[0];
  return (
    <div style={{
      width: 310, flexShrink: 0, background: "oklch(17% 0.014 250)",
      border: "1px solid oklch(28% 0.01 250)", borderRadius: 14,
      overflowY: "auto", display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid oklch(24% 0.01 250)", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "oklch(24% 0.01 250)", border: "none", color: "#64748b", width: 28, height: 28, borderRadius: 7, cursor: "pointer", fontSize: 14 }}>✕</button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <Avatar initials={player.avatar} size={52} color="#a3e635" />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", fontFamily: "Space Grotesk, sans-serif" }}>{player.nombre}</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{player.email}</div>
            <div style={{ fontSize: 11, color: "#475569" }}>{player.telefono}</div>
          </div>
        </div>
        {/* Ranking badges */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.entries(player.ranking).map(([cat, pos]) => (
            <div key={cat} style={{ padding: "4px 10px", borderRadius: 20, background: pos === 1 ? "rgba(163,230,53,0.15)" : "oklch(23% 0.01 250)", border: `1px solid ${pos === 1 ? "rgba(163,230,53,0.3)" : "oklch(30% 0.01 250)"}` }}>
              <span style={{ fontSize: 10, color: pos === 1 ? "#a3e635" : "#64748b", fontWeight: 700 }}>#{pos} · {cat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, padding: "14px 16px", borderBottom: "1px solid oklch(24% 0.01 250)" }}>
        {[
          { label: "Torneos", value: player.torneos, color: "#60a5fa" },
          { label: "Victorias", value: player.victorias, color: "#a3e635" },
          { label: "Puntos", value: player.puntos, color: "#f1f5f9" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: "Space Grotesk, sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Win rate bar */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid oklch(24% 0.01 250)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>Ratio de victorias</span>
          <span style={{ fontSize: 11, color: "#a3e635", fontWeight: 700 }}>{Math.round(player.victorias / (player.victorias + player.derrotas) * 100)}%</span>
        </div>
        <div style={{ height: 5, background: "oklch(25% 0.01 250)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", background: "#a3e635", borderRadius: 4, width: `${Math.round(player.victorias / (player.victorias + player.derrotas) * 100)}%` }} />
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid oklch(24% 0.01 250)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Sede", value: player.sede },
            { label: "Registro", value: player.fechaRegistro },
            { label: "Categorías", value: player.categorias.join(", ") },
          ].map(f => (
            <div key={f.label} style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#475569" }}>{f.label}</span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Historial */}
      <div style={{ padding: "14px 16px", flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Historial de torneos</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {player.historial.map((h, i) => (
            <div key={i} style={{ padding: "10px 12px", background: "oklch(21% 0.012 250)", borderRadius: 8, border: "1px solid oklch(26% 0.01 250)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>{h.torneo}</div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "#475569" }}>{h.categoria} · con {h.pareja}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                <span style={{ fontSize: 11, color: h.resultado.includes("🏆") ? "#a3e635" : "#64748b", fontWeight: h.resultado.includes("🏆") ? 700 : 400 }}>{h.resultado}</span>
                <span style={{ fontSize: 10, color: "#334155" }}>{h.fecha}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: "14px 16px", borderTop: "1px solid oklch(24% 0.01 250)", display: "flex", gap: 8 }}>
        <Btn small variant="ghost" style={{ flex: 1 }}>✏ Editar</Btn>
        <Btn small variant="ghost">⚙</Btn>
        <Btn small variant="danger">🗑</Btn>
      </div>
    </div>
  );
};

// ─── REPORTES VIEW ─────────────────────────────────────────────────────────────
const ReportesView = () => {
  const [tab, setTab] = useState2("inscriptos");
  const tabs = [
    { id: "inscriptos", label: "Inscriptos" },
    { id: "partidos", label: "Partidos" },
    { id: "campeones", label: "Campeones" },
    { id: "ocupacion", label: "Ocupación" },
    { id: "auditoria", label: "Auditoría" },
  ];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: "#f1f5f9" }}>Reportes</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn small variant="ghost">↓ Exportar CSV</Btn>
          <Btn small variant="ghost">📄 PDF</Btn>
        </div>
      </div>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      {tab === "inscriptos" && <ReporteInscriptos />}
      {tab === "partidos" && <ReportePartidos />}
      {tab === "campeones" && <ReporteCampeones />}
      {tab === "ocupacion" && <ReporteOcupacion />}
      {tab === "auditoria" && <ReporteAuditoria />}
    </div>
  );
};

const ReporteInscriptos = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    {/* Summary cards */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
      {[
        { label: "Total inscriptos", value: 80, color: "#60a5fa" },
        { label: "Aprobados", value: 62, color: "#a3e635" },
        { label: "Pendientes", value: 15, color: "#fbbf24" },
        { label: "Lista de espera", value: 3, color: "#a78bfa" },
      ].map(s => (
        <Card key={s.label}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{s.label}</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: "Space Grotesk, sans-serif" }}>{s.value}</div>
        </Card>
      ))}
    </div>

    {/* Table */}
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "12px 20px", borderBottom: "1px solid oklch(28% 0.01 250)", display: "grid", gridTemplateColumns: "2fr 100px 100px 100px 100px 100px", gap: 12 }}>
        {["Torneo","Estado","Total","Aprobados","Pendientes","Espera"].map(h => (
          <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
        ))}
      </div>
      {REPORTS_DATA.inscriptosPorTorneo.map((r, i) => (
        <div key={i} style={{ padding: "14px 20px", borderBottom: i < REPORTS_DATA.inscriptosPorTorneo.length-1 ? "1px solid oklch(22% 0.01 250)" : "none", display: "grid", gridTemplateColumns: "2fr 100px 100px 100px 100px 100px", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{r.torneo}</span>
          <Badge estado={r.estado} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", fontFamily: "Space Grotesk, sans-serif", textAlign: "center" }}>{r.total}</span>
          <span style={{ fontSize: 13, color: "#a3e635", textAlign: "center" }}>{r.aprobadas}</span>
          <span style={{ fontSize: 13, color: "#fbbf24", textAlign: "center" }}>{r.pendientes}</span>
          <span style={{ fontSize: 13, color: "#a78bfa", textAlign: "center" }}>{r.espera}</span>
        </div>
      ))}
    </Card>

    {/* Breakdown por categoría */}
    <Card>
      <SectionTitle title="Inscriptos por categoría — Copa de Verano 2026" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {MOCK_DATA.torneos[0].categorias.map(c => (
          <div key={c.id} style={{ padding: "12px 14px", background: "oklch(22% 0.012 250)", borderRadius: 9, border: "1px solid oklch(28% 0.01 250)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>{c.nombre}</div>
            <ProgressBar value={c.inscriptos} max={c.cupo} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <Badge estado={c.estado} />
              <span style={{ fontSize: 11, color: "#475569" }}>{c.cupo - c.inscriptos} lugares libres</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

const ReportePartidos = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
      {[
        { label: "Partidos jugados", value: 36, color: "#a3e635" },
        { label: "Pendientes", value: 8, color: "#fbbf24" },
        { label: "Reprogramados", value: 3, color: "#60a5fa" },
        { label: "Walkovers", value: 1, color: "#f87171" },
      ].map(s => (
        <Card key={s.label}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{s.label}</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: "Space Grotesk, sans-serif" }}>{s.value}</div>
        </Card>
      ))}
    </div>
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "12px 20px", borderBottom: "1px solid oklch(28% 0.01 250)", display: "grid", gridTemplateColumns: "2fr 100px 100px 100px 100px", gap: 12 }}>
        {["Torneo","Jugados","Pendientes","Reprogramados","Walkovers"].map(h => (
          <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
        ))}
      </div>
      {REPORTS_DATA.partidosPorTorneo.map((r, i) => (
        <div key={i} style={{ padding: "14px 20px", borderBottom: i < REPORTS_DATA.partidosPorTorneo.length-1 ? "1px solid oklch(22% 0.01 250)" : "none", display: "grid", gridTemplateColumns: "2fr 100px 100px 100px 100px", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{r.torneo}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#a3e635", fontFamily: "Space Grotesk, sans-serif", textAlign: "center" }}>{r.jugados}</span>
          <span style={{ fontSize: 13, color: "#fbbf24", textAlign: "center" }}>{r.pendientes}</span>
          <span style={{ fontSize: 13, color: "#60a5fa", textAlign: "center" }}>{r.reprogramados}</span>
          <span style={{ fontSize: 13, color: "#f87171", textAlign: "center" }}>{r.walkovers}</span>
        </div>
      ))}
    </Card>
    {/* Agenda de pendientes */}
    <Card>
      <SectionTitle title="Partidos pendientes — Copa de Verano 2026" />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {MOCK_DATA.agenda.filter(a => a.estado === "programado").map(a => (
          <div key={a.id} style={{ display: "grid", gridTemplateColumns: "80px 120px 1fr 130px 110px", gap: 12, padding: "12px 14px", background: "oklch(22% 0.012 250)", borderRadius: 8, border: "1px solid oklch(28% 0.01 250)", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", fontFamily: "Space Grotesk, sans-serif" }}>{a.hora}</span>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>{a.cancha}</span>
            <span style={{ fontSize: 13, color: "#e2e8f0" }}>{a.partido}</span>
            <span style={{ fontSize: 11, color: "#64748b" }}>{a.categoria}</span>
            <Badge estado={a.estado} />
          </div>
        ))}
      </div>
    </Card>
  </div>
);

const ReporteCampeones = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "12px 20px", borderBottom: "1px solid oklch(28% 0.01 250)", display: "grid", gridTemplateColumns: "2fr 160px 220px 220px 120px", gap: 12 }}>
        {["Torneo","Categoría","Campeón 🏆","Subcampeón","Fecha"].map(h => (
          <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
        ))}
      </div>
      {REPORTS_DATA.campeones.map((r, i) => (
        <div key={i} style={{ padding: "16px 20px", borderBottom: i < REPORTS_DATA.campeones.length-1 ? "1px solid oklch(22% 0.01 250)" : "none", display: "grid", gridTemplateColumns: "2fr 160px 220px 220px 120px", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{r.torneo}</span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{r.categoria}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🏆</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#a3e635" }}>{r.campeon}</span>
          </div>
          <span style={{ fontSize: 13, color: "#64748b" }}>{r.subcampeon}</span>
          <span style={{ fontSize: 12, color: "#475569" }}>{r.fecha}</span>
        </div>
      ))}
    </Card>
  </div>
);

const ReporteOcupacion = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
      {[
        { label: "Total horas usadas", value: "37h", color: "#a3e635" },
        { label: "Ocupación promedio", value: "72%", color: "#60a5fa" },
        { label: "Partidos agendados", value: 23, color: "#f1f5f9" },
      ].map(s => (
        <Card key={s.label}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{s.label}</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: "Space Grotesk, sans-serif" }}>{s.value}</div>
        </Card>
      ))}
    </div>
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "12px 20px", borderBottom: "1px solid oklch(28% 0.01 250)", display: "grid", gridTemplateColumns: "1fr 1fr 2fr 80px 80px 120px", gap: 12 }}>
        {["Sede","Cancha","Torneo","Partidos","Horas","Ocupación"].map(h => (
          <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
        ))}
      </div>
      {REPORTS_DATA.ocupacionCanchas.map((r, i) => {
        const pct = Math.round(r.horasUsadas / r.horasDisponibles * 100);
        return (
          <div key={i} style={{ padding: "14px 20px", borderBottom: i < REPORTS_DATA.ocupacionCanchas.length-1 ? "1px solid oklch(22% 0.01 250)" : "none", display: "grid", gridTemplateColumns: "1fr 1fr 2fr 80px 80px 120px", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>{r.sede}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{r.cancha}</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>{r.torneo}</span>
            <span style={{ fontSize: 13, color: "#94a3b8", textAlign: "center" }}>{r.partidos}</span>
            <span style={{ fontSize: 13, color: "#94a3b8", textAlign: "center" }}>{r.horasUsadas}h</span>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: pct > 80 ? "#a3e635" : "#64748b" }}>{pct}%</span>
              </div>
              <div style={{ height: 4, background: "oklch(25% 0.01 250)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", background: pct > 80 ? "#a3e635" : pct > 50 ? "#60a5fa" : "#475569", width: `${pct}%`, borderRadius: 2 }} />
              </div>
            </div>
          </div>
        );
      })}
    </Card>
  </div>
);

const AUDIT_LOGS = [
  { id: 1, usuario: "Admin", accion: "Aprobó inscripción", detalle: "Torres / Sánchez — Masculino A", fecha: "2026-04-21 14:32", tipo: "inscripcion" },
  { id: 2, usuario: "Admin", accion: "Cargó resultado", detalle: "Torres/Sánchez 6-3, 6-4 vs Morales/Herrera", fecha: "2026-04-21 13:15", tipo: "resultado" },
  { id: 3, usuario: "Colaborador 1", accion: "Programó partido", detalle: "Cancha 3 · 14:30 · Peralta/Gómez vs Ríos/Vega", fecha: "2026-04-21 10:00", tipo: "agenda" },
  { id: 4, usuario: "Admin", accion: "Publicó torneo", detalle: "Copa de Verano 2026 — visible públicamente", fecha: "2026-04-10 09:00", tipo: "torneo" },
  { id: 5, usuario: "Admin", accion: "Generó fixture", detalle: "Masculino A · Eliminación simple · 8 parejas", fecha: "2026-04-10 08:45", tipo: "fixture" },
  { id: 6, usuario: "Admin", accion: "Rechazó inscripción", detalle: "Blanco / Costa — Femenino A", fecha: "2026-04-12 16:20", tipo: "inscripcion" },
];

const tipoColors = { inscripcion: "#60a5fa", resultado: "#a3e635", agenda: "#a78bfa", torneo: "#fbbf24", fixture: "#f97316" };

const ReporteAuditoria = () => (
  <div>
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "12px 20px", borderBottom: "1px solid oklch(28% 0.01 250)", display: "grid", gridTemplateColumns: "120px 140px 160px 1fr 160px", gap: 12 }}>
        {["Tipo","Usuario","Acción","Detalle","Fecha y hora"].map(h => (
          <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
        ))}
      </div>
      {AUDIT_LOGS.map((log, i) => (
        <div key={log.id} style={{ padding: "14px 20px", borderBottom: i < AUDIT_LOGS.length-1 ? "1px solid oklch(22% 0.01 250)" : "none", display: "grid", gridTemplateColumns: "120px 140px 160px 1fr 160px", gap: 12, alignItems: "center" }}>
          <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: `${tipoColors[log.tipo]}18`, color: tipoColors[log.tipo], border: `1px solid ${tipoColors[log.tipo]}30` }}>{log.tipo}</span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{log.usuario}</span>
          <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>{log.accion}</span>
          <span style={{ fontSize: 12, color: "#64748b" }}>{log.detalle}</span>
          <span style={{ fontSize: 11, color: "#475569", fontFamily: "monospace" }}>{log.fecha}</span>
        </div>
      ))}
    </Card>
  </div>
);

Object.assign(window, { JugadoresView, ReportesView });
