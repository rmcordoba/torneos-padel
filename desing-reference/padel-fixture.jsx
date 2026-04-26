// ─── FIXTURE & CALENDARIO VIEWS ───────────────────────────────────────────────

// ── Rich fixture mock data ────────────────────────────────────────────────────
const FIXTURE_CATS = ["Masculino A", "Femenino A", "Masculino B", "Mixto B"];

const GRUPOS_MOCK = {
  "Masculino A": [
    {
      id: "A", nombre: "Grupo A",
      equipos: [
        { id: 1, nombre: "Torres / Sánchez",   pj:3, pg:3, pp:0, sf:6, sc:1, pts:9  },
        { id: 2, nombre: "Peralta / Gómez",    pj:3, pg:2, pp:1, sf:5, sc:3, pts:6  },
        { id: 3, nombre: "Morales / Herrera",  pj:3, pg:1, pp:2, sf:3, sc:5, pts:3  },
        { id: 4, nombre: "Ríos / Vega",        pj:3, pg:0, pp:3, sf:1, sc:6, pts:0  },
      ],
      partidos: [
        { e1:1, e2:2, res:"6-3, 6-4",   ganador:1, estado:"jugado"    },
        { e1:3, e2:4, res:"6-2, 6-1",   ganador:3, estado:"jugado"    },
        { e1:1, e2:3, res:"6-1, 6-2",   ganador:1, estado:"jugado"    },
        { e1:2, e2:4, res:"7-5, 6-3",   ganador:2, estado:"jugado"    },
        { e1:1, e2:4, res:"6-0, 6-1",   ganador:1, estado:"jugado"    },
        { e1:2, e2:3, res:"6-4, 3-6, 6-3", ganador:2, estado:"jugado" },
      ],
    },
    {
      id: "B", nombre: "Grupo B",
      equipos: [
        { id: 5, nombre: "Mendez / Acosta",  pj:3, pg:3, pp:0, sf:6, sc:2, pts:9  },
        { id: 6, nombre: "Suárez / Bravo",   pj:3, pg:2, pp:1, sf:5, sc:4, pts:6  },
        { id: 7, nombre: "Ibarra / Meza",    pj:3, pg:1, pp:2, sf:3, sc:5, pts:3  },
        { id: 8, nombre: "Palma / Leiva",    pj:3, pg:0, pp:3, sf:1, sc:6, pts:0  },
      ],
      partidos: [
        { e1:5, e2:6, res:"6-2, 6-3",   ganador:5, estado:"jugado"    },
        { e1:7, e2:8, res:"6-4, 6-2",   ganador:7, estado:"jugado"    },
        { e1:5, e2:7, res:"6-1, 6-3",   ganador:5, estado:"jugado"    },
        { e1:6, e2:8, res:"6-3, 7-5",   ganador:6, estado:"jugado"    },
        { e1:5, e2:8, res:"6-0, 6-2",   ganador:5, estado:"jugado"    },
        { e1:6, e2:7, res:null,          ganador:null, estado:"en_curso" },
      ],
    },
  ],
  "Femenino A": [
    {
      id: "C", nombre: "Grupo Único",
      equipos: [
        { id: 9,  nombre: "Ruiz / Díaz",          pj:2, pg:2, pp:0, sf:4, sc:1, pts:6  },
        { id: 10, nombre: "Rodríguez / Fernández", pj:2, pg:1, pp:1, sf:3, sc:3, pts:3  },
        { id: 11, nombre: "Costa / Blanco",        pj:2, pg:1, pp:1, sf:3, sc:4, pts:3  },
        { id: 12, nombre: "Navarro / Ríos",        pj:2, pg:0, pp:2, sf:1, sc:4, pts:0  },
      ],
      partidos: [
        { e1:9,  e2:10, res:"6-3, 6-2", ganador:9,  estado:"jugado"     },
        { e1:11, e2:12, res:"6-4, 6-1", ganador:11, estado:"jugado"     },
        { e1:9,  e2:11, res:null,        ganador:null, estado:"programado" },
        { e1:10, e2:12, res:null,        ganador:null, estado:"programado" },
        { e1:9,  e2:12, res:null,        ganador:null, estado:"programado" },
        { e1:10, e2:11, res:null,        ganador:null, estado:"programado" },
      ],
    },
  ],
  "Masculino B": [
    {
      id: "D", nombre: "Grupo A",
      equipos: [
        { id: 13, nombre: "Castro / Mendez",  pj:2, pg:2, pp:0, sf:4, sc:0, pts:6  },
        { id: 14, nombre: "Ortiz / Vargas",   pj:2, pg:1, pp:1, sf:2, sc:3, pts:3  },
        { id: 15, nombre: "García / López",   pj:1, pg:0, pp:1, sf:1, sc:3, pts:0  },
        { id: 16, nombre: "Romero / Díaz",    pj:1, pg:0, pp:1, sf:0, sc:3, pts:0  },
      ],
      partidos: [
        { e1:13, e2:15, res:"6-1, 6-0",  ganador:13, estado:"jugado"     },
        { e1:14, e2:16, res:"6-3, 3-6, 6-2", ganador:14, estado:"jugado" },
        { e1:13, e2:14, res:null, ganador:null, estado:"en_curso"         },
        { e1:15, e2:16, res:null, ganador:null, estado:"programado"       },
        { e1:13, e2:16, res:null, ganador:null, estado:"programado"       },
        { e1:14, e2:15, res:null, ganador:null, estado:"programado"       },
      ],
    },
  ],
  "Mixto B": [
    {
      id: "E", nombre: "Grupo Único",
      equipos: [
        { id: 17, nombre: "Acosta / Ruiz",     pj:3, pg:3, pp:0, sf:6, sc:1, pts:9  },
        { id: 18, nombre: "Blanco / Torres",   pj:3, pg:2, pp:1, sf:4, sc:3, pts:6  },
        { id: 19, nombre: "Ríos / Herrera",    pj:3, pg:1, pp:2, sf:2, sc:4, pts:3  },
        { id: 20, nombre: "Meza / Gómez",      pj:3, pg:0, pp:3, sf:1, sc:6, pts:0  },
      ],
      partidos: [
        { e1:17, e2:18, res:"6-4, 6-3", ganador:17, estado:"jugado"    },
        { e1:19, e2:20, res:"6-2, 6-0", ganador:19, estado:"jugado"    },
        { e1:17, e2:19, res:"6-1, 6-2", ganador:17, estado:"jugado"    },
        { e1:18, e2:20, res:"7-5, 6-4", ganador:18, estado:"jugado"    },
        { e1:17, e2:20, res:"6-0, 6-0", ganador:17, estado:"jugado"    },
        { e1:18, e2:19, res:"6-4, 5-7, 7-5", ganador:18, estado:"jugado" },
      ],
    },
  ],
};

const ELIM_MOCK = {
  "Masculino A": {
    rondas: [
      {
        nombre: "Cuartos de Final", orden: 1,
        partidos: [
          { id:"q1", e1:"Torres / Sánchez",  e2:"Suárez / Bravo",   res:"6-3, 6-4",      ganador:"Torres / Sánchez",  estado:"jugado",    hora:"Vie 25 · 10:00", cancha:"Cancha 1", seed1:"1A", seed2:"2B" },
          { id:"q2", e1:"Mendez / Acosta",   e2:"Peralta / Gómez",  res:"4-6, 7-5, 6-3", ganador:"Mendez / Acosta",   estado:"jugado",    hora:"Vie 25 · 11:30", cancha:"Cancha 2", seed1:"1B", seed2:"2A" },
          { id:"q3", e1:"Morales / Herrera", e2:"Ibarra / Meza",    res:"6-2, 6-1",      ganador:"Morales / Herrera", estado:"jugado",    hora:"Vie 25 · 13:00", cancha:"Cancha 1", seed1:"3A", seed2:"4B" },
          { id:"q4", e1:"Ríos / Vega",       e2:"Palma / Leiva",    res:null,             ganador:null,                estado:"en_curso",  hora:"Vie 25 · 14:30", cancha:"Cancha 3", seed1:"3B", seed2:"4A" },
        ],
      },
      {
        nombre: "Semifinal", orden: 2,
        partidos: [
          { id:"s1", e1:"Torres / Sánchez",  e2:"Mendez / Acosta",  res:null, ganador:null, estado:"programado", hora:"Sáb 26 · 15:00", cancha:"Cancha 1", seed1:"", seed2:"" },
          { id:"s2", e1:"Morales / Herrera", e2:"TBD",              res:null, ganador:null, estado:"pendiente",  hora:"Sáb 26 · 16:30", cancha:"Cancha 2", seed1:"", seed2:"" },
        ],
      },
      {
        nombre: "Final", orden: 3,
        partidos: [
          { id:"f1", e1:"TBD", e2:"TBD", res:null, ganador:null, estado:"pendiente", hora:"Dom 27 · 17:00", cancha:"Cancha Central", seed1:"", seed2:"" },
        ],
      },
    ],
  },
  "Femenino A": {
    rondas: [
      {
        nombre: "Semifinal", orden: 1,
        partidos: [
          { id:"fs1", e1:"Ruiz / Díaz",           e2:"TBD",                   res:null, ganador:null, estado:"programado", hora:"Sáb 26 · 09:00", cancha:"Cancha 2", seed1:"1C", seed2:"" },
          { id:"fs2", e1:"Rodríguez / Fernández", e2:"Costa / Blanco",        res:null, ganador:null, estado:"programado", hora:"Sáb 26 · 10:30", cancha:"Cancha 3", seed1:"2C", seed2:"3C" },
        ],
      },
      {
        nombre: "Final", orden: 2,
        partidos: [
          { id:"ff1", e1:"TBD", e2:"TBD", res:null, ganador:null, estado:"pendiente", hora:"Dom 27 · 11:00", cancha:"Cancha 2", seed1:"", seed2:"" },
        ],
      },
    ],
  },
  "Masculino B": {
    rondas: [
      {
        nombre: "Final", orden: 1,
        partidos: [
          { id:"mf1", e1:"Castro / Mendez", e2:"TBD", res:null, ganador:null, estado:"pendiente", hora:"Dom 27 · 13:00", cancha:"Cancha 1", seed1:"1D", seed2:"" },
        ],
      },
    ],
  },
  "Mixto B": {
    rondas: [
      {
        nombre: "Semifinal", orden: 1,
        partidos: [
          { id:"xfs1", e1:"Acosta / Ruiz",   e2:"Ríos / Herrera", res:"6-3, 6-1", ganador:"Acosta / Ruiz",  estado:"jugado",    hora:"Vie 25 · 16:00", cancha:"Cancha 3", seed1:"1E", seed2:"3E" },
          { id:"xfs2", e1:"Blanco / Torres", e2:"Meza / Gómez",   res:"6-2, 6-4", ganador:"Blanco / Torres",estado:"jugado",    hora:"Vie 25 · 17:30", cancha:"Cancha 1", seed1:"2E", seed2:"4E" },
        ],
      },
      {
        nombre: "Final", orden: 2,
        partidos: [
          { id:"xff1", e1:"Acosta / Ruiz", e2:"Blanco / Torres", res:null, ganador:null, estado:"programado", hora:"Dom 27 · 15:00", cancha:"Cancha Central", seed1:"", seed2:"" },
        ],
      },
    ],
  },
};

// ── Calendar data ─────────────────────────────────────────────────────────────
const CAT_COLORS = {
  "Masculino A": "#a3e635",
  "Femenino A":  "#f472b6",
  "Masculino B": "#60a5fa",
  "Mixto B":     "#fb923c",
};

const CALENDAR_PARTIDOS = [
  // April
  { id:1,  fecha:"2026-04-10", hora:"09:00", cancha:"Cancha 1", partido:"Torres / Sánchez vs Ríos / Vega",          cat:"Masculino A", estado:"jugado"    },
  { id:2,  fecha:"2026-04-10", hora:"11:00", cancha:"Cancha 2", partido:"Ruiz / Díaz vs Navarro / Ríos",             cat:"Femenino A",  estado:"jugado"    },
  { id:3,  fecha:"2026-04-12", hora:"10:00", cancha:"Cancha 1", partido:"Peralta / Gómez vs Morales / Herrera",      cat:"Masculino A", estado:"jugado"    },
  { id:4,  fecha:"2026-04-12", hora:"12:00", cancha:"Cancha 3", partido:"Castro / Mendez vs García / López",         cat:"Masculino B", estado:"jugado"    },
  { id:5,  fecha:"2026-04-14", hora:"10:00", cancha:"Cancha 2", partido:"Acosta / Ruiz vs Meza / Gómez",             cat:"Mixto B",     estado:"jugado"    },
  { id:6,  fecha:"2026-04-15", hora:"09:00", cancha:"Cancha 1", partido:"Mendez / Acosta vs Palma / Leiva",          cat:"Masculino A", estado:"jugado"    },
  { id:7,  fecha:"2026-04-15", hora:"11:00", cancha:"Cancha 2", partido:"Rodríguez / Fernández vs Costa / Blanco",   cat:"Femenino A",  estado:"jugado"    },
  { id:8,  fecha:"2026-04-17", hora:"10:00", cancha:"Cancha 1", partido:"Torres / Sánchez vs Morales / Herrera",     cat:"Masculino A", estado:"jugado"    },
  { id:9,  fecha:"2026-04-17", hora:"12:00", cancha:"Cancha 3", partido:"Suárez / Bravo vs Ibarra / Meza",           cat:"Masculino A", estado:"jugado"    },
  { id:10, fecha:"2026-04-19", hora:"10:00", cancha:"Cancha 2", partido:"Blanco / Torres vs Ríos / Herrera",         cat:"Mixto B",     estado:"jugado"    },
  { id:11, fecha:"2026-04-21", hora:"09:00", cancha:"Cancha 1", partido:"Peralta / Gómez vs Ríos / Vega",            cat:"Masculino A", estado:"jugado"    },
  { id:12, fecha:"2026-04-21", hora:"11:00", cancha:"Cancha 2", partido:"Ruiz / Díaz vs Costa / Blanco",             cat:"Femenino A",  estado:"jugado"    },
  { id:13, fecha:"2026-04-22", hora:"10:00", cancha:"Cancha 3", partido:"Ortiz / Vargas vs Romero / Díaz",           cat:"Masculino B", estado:"jugado"    },
  { id:14, fecha:"2026-04-23", hora:"10:00", cancha:"Cancha 1", partido:"Torres / Sánchez vs Mendez / Acosta",       cat:"Masculino A", estado:"jugado"    },
  { id:15, fecha:"2026-04-24", hora:"10:00", cancha:"Cancha 2", partido:"Castro / Mendez vs Ortiz / Vargas",         cat:"Masculino B", estado:"jugado"    },
  { id:16, fecha:"2026-04-25", hora:"10:00", cancha:"Cancha 1", partido:"Torres / Sánchez vs Suárez / Bravo",        cat:"Masculino A", estado:"jugado"    },
  { id:17, fecha:"2026-04-25", hora:"11:30", cancha:"Cancha 2", partido:"Mendez / Acosta vs Peralta / Gómez",        cat:"Masculino A", estado:"jugado"    },
  { id:18, fecha:"2026-04-25", hora:"13:00", cancha:"Cancha 1", partido:"Morales / Herrera vs Ibarra / Meza",        cat:"Masculino A", estado:"jugado"    },
  { id:19, fecha:"2026-04-25", hora:"14:30", cancha:"Cancha 3", partido:"Ríos / Vega vs Palma / Leiva",              cat:"Masculino A", estado:"en_curso"  },
  { id:20, fecha:"2026-04-25", hora:"16:00", cancha:"Cancha 3", partido:"Acosta / Ruiz vs Ríos / Herrera",           cat:"Mixto B",     estado:"en_curso"  },
  { id:21, fecha:"2026-04-26", hora:"09:00", cancha:"Cancha 2", partido:"Ruiz / Díaz vs TBD",                        cat:"Femenino A",  estado:"programado"},
  { id:22, fecha:"2026-04-26", hora:"10:30", cancha:"Cancha 3", partido:"Rodríguez / Fernández vs Costa / Blanco",   cat:"Femenino A",  estado:"programado"},
  { id:23, fecha:"2026-04-26", hora:"15:00", cancha:"Cancha 1", partido:"Torres / Sánchez vs Mendez / Acosta",       cat:"Masculino A", estado:"programado"},
  { id:24, fecha:"2026-04-26", hora:"16:30", cancha:"Cancha 2", partido:"Morales / Herrera vs TBD",                  cat:"Masculino A", estado:"programado"},
  { id:25, fecha:"2026-04-27", hora:"11:00", cancha:"Cancha 2", partido:"Final Femenino A",                          cat:"Femenino A",  estado:"programado"},
  { id:26, fecha:"2026-04-27", hora:"13:00", cancha:"Cancha 1", partido:"Final Masculino B",                         cat:"Masculino B", estado:"programado"},
  { id:27, fecha:"2026-04-27", hora:"15:00", cancha:"Cancha Central", partido:"Final Mixto B",                       cat:"Mixto B",     estado:"programado"},
  { id:28, fecha:"2026-04-27", hora:"17:00", cancha:"Cancha Central", partido:"Gran Final — Masculino A",            cat:"Masculino A", estado:"programado"},
  // May
  { id:29, fecha:"2026-05-15", hora:"09:00", cancha:"Cancha 1", partido:"Torneo Otoño — Apertura",                   cat:"Masculino A", estado:"programado"},
  { id:30, fecha:"2026-05-15", hora:"11:00", cancha:"Cancha 2", partido:"Torneo Otoño — Femenino",                   cat:"Femenino A",  estado:"programado"},
];

// ─────────────────────────────────────────────────────────────────────────────
// FIXTURE VIEW
// ─────────────────────────────────────────────────────────────────────────────
const FixtureView = () => {
  const { useState: useS } = React;
  const [cat, setCat]    = useS("Masculino A");
  const [phase, setPhase] = useS("grupos"); // "grupos" | "eliminacion"

  const accent = "#a3e635";

  const PhaseBtn = ({ id, label, icon }) => (
    <button onClick={() => setPhase(id)} style={{
      display: "flex", alignItems: "center", gap: 7,
      padding: "9px 18px", borderRadius: 9, border: "1px solid",
      borderColor: phase === id ? `${accent}50` : "oklch(30% 0.01 250)",
      background: phase === id ? `${accent}18` : "transparent",
      color: phase === id ? accent : "#64748b",
      fontFamily: "inherit", fontSize: 13, fontWeight: 600,
      cursor: "pointer", transition: "all .12s",
    }}>
      {icon} {label}
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>
            Fixture · Copa de Verano 2026
          </h1>
          <p style={{ fontSize: 13, color: "#475569" }}>Gestión de fases: grupos y eliminación directa</p>
        </div>
        <button style={{
          padding: "9px 18px", borderRadius: 9, background: accent,
          border: "none", color: "#0f172a", fontFamily: "inherit",
          fontSize: 13, fontWeight: 700, cursor: "pointer",
        }}>
          + Nuevo partido
        </button>
      </div>

      {/* Category tabs */}
      <div style={{
        display: "flex", gap: 4,
        background: "oklch(16% 0.012 250)",
        padding: 4, borderRadius: 11,
        border: "1px solid oklch(24% 0.01 250)",
        width: "fit-content",
      }}>
        {FIXTURE_CATS.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{
            padding: "7px 16px", borderRadius: 8, border: "none",
            background: cat === c ? "oklch(24% 0.015 250)" : "transparent",
            color: cat === c ? "#f1f5f9" : "#475569",
            fontFamily: "inherit", fontSize: 12, fontWeight: cat === c ? 700 : 400,
            cursor: "pointer", transition: "all .12s",
            boxShadow: cat === c ? "0 1px 4px rgba(0,0,0,0.4)" : "none",
          }}>
            <span style={{ marginRight: 5, width: 8, height: 8, borderRadius: "50%", display: "inline-block", background: CAT_COLORS[c] }} />
            {c}
          </button>
        ))}
      </div>

      {/* Phase toggle */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", borderBottom: "1px solid oklch(22% 0.01 250)", paddingBottom: 16 }}>
        <PhaseBtn id="grupos"      label="Fase de Grupos"     icon="⊞" />
        <PhaseBtn id="eliminacion" label="Eliminación Directa" icon="⚡" />
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <StatusDot color="#a3e635" label="Jugado" />
          <StatusDot color="#fbbf24" label="En curso" />
          <StatusDot color="#3b82f6" label="Programado" />
          <StatusDot color="#475569" label="Pendiente" />
        </div>
      </div>

      {phase === "grupos"      && <GruposPhase cat={cat} />}
      {phase === "eliminacion" && <EliminacionPhase cat={cat} />}
    </div>
  );
};

const StatusDot = ({ color, label }) => (
  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#475569" }}>
    <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
    {label}
  </span>
);

// ─── GRUPOS PHASE ─────────────────────────────────────────────────────────────
const GruposPhase = ({ cat }) => {
  const { useState: useS } = React;
  const grupos = GRUPOS_MOCK[cat] || [];
  const [activeGrupo, setActiveGrupo] = useS(grupos[0]?.id || null);
  const grupo = grupos.find(g => g.id === activeGrupo) || grupos[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {grupos.length > 1 && (
        <div style={{ display: "flex", gap: 6 }}>
          {grupos.map(g => (
            <button key={g.id} onClick={() => setActiveGrupo(g.id)} style={{
              padding: "6px 16px", borderRadius: 8, border: "1px solid",
              borderColor: activeGrupo === g.id ? "rgba(163,230,53,.4)" : "oklch(28% 0.01 250)",
              background: activeGrupo === g.id ? "rgba(163,230,53,.12)" : "transparent",
              color: activeGrupo === g.id ? "#a3e635" : "#64748b",
              fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>{g.nombre}</button>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Standings */}
        <div style={{
          background: "oklch(16% 0.012 250)",
          border: "1px solid oklch(24% 0.01 250)",
          borderRadius: 14, overflow: "hidden",
        }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid oklch(22% 0.01 250)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>
              {grupo?.nombre} — Tabla de posiciones
            </span>
            <span style={{ fontSize: 11, color: "#475569" }}>Clasifican top 2</span>
          </div>
          {/* Header row */}
          <div style={{ padding: "8px 18px", display: "grid", gridTemplateColumns: "26px 1fr 36px 36px 36px 36px 36px 44px", gap: 4, borderBottom: "1px solid oklch(20% 0.01 250)" }}>
            {["#","Pareja","PJ","PG","PP","SF","SC","Pts"].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em", textAlign: h !== "Pareja" ? "center" : "left" }}>{h}</span>
            ))}
          </div>
          {grupo?.equipos.map((eq, i) => {
            const classify = i < 2;
            return (
              <div key={eq.id} style={{
                padding: "12px 18px",
                display: "grid", gridTemplateColumns: "26px 1fr 36px 36px 36px 36px 36px 44px",
                gap: 4, alignItems: "center",
                borderBottom: i < grupo.equipos.length - 1 ? "1px solid oklch(20% 0.01 250)" : "none",
                background: classify ? "rgba(163,230,53,0.04)" : "transparent",
                borderLeft: classify ? "2px solid rgba(163,230,53,0.4)" : "2px solid transparent",
              }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: classify ? "#a3e635" : "#334155", textAlign: "center", fontFamily: "Space Grotesk, sans-serif" }}>{i + 1}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  {classify && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#a3e635", flexShrink: 0 }} />}
                  <span style={{ fontSize: 13, fontWeight: classify ? 700 : 400, color: classify ? "#e2e8f0" : "#94a3b8" }}>{eq.nombre}</span>
                </div>
                {[eq.pj, eq.pg, eq.pp, eq.sf, eq.sc].map((v, vi) => (
                  <span key={vi} style={{ fontSize: 12, color: "#475569", textAlign: "center" }}>{v}</span>
                ))}
                <span style={{
                  fontSize: 15, fontWeight: 800, textAlign: "center",
                  color: classify ? "#a3e635" : "#64748b",
                  fontFamily: "Space Grotesk, sans-serif",
                }}>{eq.pts}</span>
              </div>
            );
          })}
          <div style={{ padding: "10px 18px", display: "flex", gap: 16 }}>
            <LegendItem color="rgba(163,230,53,0.4)" label="Clasifican a eliminación" />
          </div>
        </div>

        {/* Matches */}
        <div style={{
          background: "oklch(16% 0.012 250)",
          border: "1px solid oklch(24% 0.01 250)",
          borderRadius: 14, overflow: "hidden",
        }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid oklch(22% 0.01 250)" }}>
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>
              Partidos del grupo
            </span>
          </div>
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            {grupo?.partidos.map((p, i) => {
              const e1 = grupo.equipos.find(e => e.id === p.e1);
              const e2 = grupo.equipos.find(e => e.id === p.e2);
              return (
                <GrupoMatchRow key={i} partido={p} e1={e1} e2={e2} />
              );
            })}
          </div>
        </div>
      </div>

      {/* All groups summary if multiple */}
      {grupos.length > 1 && (
        <div style={{ background: "oklch(16% 0.012 250)", border: "1px solid oklch(24% 0.01 250)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid oklch(22% 0.01 250)" }}>
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>Resumen — Clasificados</span>
          </div>
          <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: `repeat(${grupos.length}, 1fr)`, gap: 12 }}>
            {grupos.map(g => (
              <div key={g.id}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>{g.nombre}</div>
                {g.equipos.slice(0, 2).map((eq, i) => (
                  <div key={eq.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, padding: "9px 12px", background: "oklch(20% 0.012 250)", borderRadius: 9, border: "1px solid rgba(163,230,53,0.2)" }}>
                    <span style={{ fontSize: 16 }}>{["🥇","🥈"][i]}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{eq.nombre}</div>
                      <div style={{ fontSize: 10, color: "#475569" }}>{eq.pts} pts · {eq.pg}V {eq.pp}D</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const LegendItem = ({ color, label }) => (
  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#475569" }}>
    <span style={{ width: 10, height: 3, background: color, borderRadius: 2, flexShrink: 0 }} />
    {label}
  </span>
);

const GrupoMatchRow = ({ partido, e1, e2 }) => {
  const { useState: useS } = React;
  const [hover, setHover] = useS(false);
  const statusColor = { jugado:"#a3e635", en_curso:"#fbbf24", programado:"#3b82f6", pendiente:"#475569" }[partido.estado] || "#475569";
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "11px 14px", borderRadius: 10,
        border: `1px solid ${hover ? statusColor + "40" : "oklch(24% 0.01 250)"}`,
        background: hover ? "oklch(20% 0.012 250)" : "oklch(18% 0.012 250)",
        transition: "all .12s",
        display: "grid", gridTemplateColumns: "1fr 80px 1fr 100px",
        gap: 10, alignItems: "center",
      }}
    >
      {/* E1 */}
      <div style={{ textAlign: "right" }}>
        <span style={{ fontSize: 12, fontWeight: partido.ganador === partido.e1 ? 700 : 400, color: partido.ganador === partido.e1 ? "#e2e8f0" : "#64748b" }}>
          {e1?.nombre || "—"}
        </span>
      </div>
      {/* Score */}
      <div style={{ textAlign: "center" }}>
        {partido.estado === "jugado" ? (
          <span style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", fontFamily: "Space Grotesk, sans-serif" }}>{partido.res}</span>
        ) : (
          <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: statusColor + "22", color: statusColor, fontWeight: 700 }}>
            {partido.estado === "en_curso" ? "● Vivo" : partido.estado === "programado" ? "Prog." : "Pdte."}
          </span>
        )}
      </div>
      {/* E2 */}
      <div>
        <span style={{ fontSize: 12, fontWeight: partido.ganador === partido.e2 ? 700 : 400, color: partido.ganador === partido.e2 ? "#e2e8f0" : "#64748b" }}>
          {e2?.nombre || "—"}
        </span>
      </div>
      {/* Actions */}
      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
        {partido.estado !== "jugado" && (
          <button style={{ fontSize: 10, padding: "3px 9px", borderRadius: 6, border: "1px solid oklch(30% 0.01 250)", background: "oklch(22% 0.012 250)", color: "#a3e635", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
            Cargar
          </button>
        )}
        {partido.estado === "jugado" && (
          <button style={{ fontSize: 10, padding: "3px 9px", borderRadius: 6, border: "1px solid oklch(26% 0.01 250)", background: "transparent", color: "#475569", cursor: "pointer", fontFamily: "inherit" }}>
            Editar
          </button>
        )}
      </div>
    </div>
  );
};

// ─── ELIMINACIÓN PHASE ────────────────────────────────────────────────────────
const EliminacionPhase = ({ cat }) => {
  const data = ELIM_MOCK[cat];
  if (!data) return (
    <div style={{ textAlign: "center", padding: "60px 0", color: "#334155" }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: .4 }}>⚡</div>
      <div style={{ fontSize: 14 }}>Sin datos de eliminación para {cat}</div>
    </div>
  );

  const maxPartidos = Math.max(...data.rondas.map(r => r.partidos.length));

  return (
    <div>
      {/* Progress bar */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "oklch(16% 0.012 250)", borderRadius: 12, border: "1px solid oklch(24% 0.01 250)", overflow: "hidden" }}>
        {data.rondas.map((r, i) => {
          const done    = r.partidos.every(p => p.estado === "jugado");
          const partial = !done && r.partidos.some(p => p.estado === "jugado" || p.estado === "en_curso");
          return (
            <div key={i} style={{ flex: 1, padding: "12px 16px", borderRight: i < data.rondas.length - 1 ? "1px solid oklch(22% 0.01 250)" : "none", display: "flex", align: "center", gap: 8, alignItems: "center" }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: done ? "rgba(163,230,53,.2)" : partial ? "rgba(251,191,36,.15)" : "oklch(22% 0.01 250)", border: `1px solid ${done ? "rgba(163,230,53,.4)" : partial ? "rgba(251,191,36,.3)" : "oklch(28% 0.01 250)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: done ? "#a3e635" : partial ? "#fbbf24" : "#334155", fontWeight: 800, fontFamily: "Space Grotesk, sans-serif" }}>
                {done ? "✓" : i + 1}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: done ? "#a3e635" : partial ? "#fbbf24" : "#64748b" }}>{r.nombre}</div>
                <div style={{ fontSize: 10, color: "#334155" }}>{r.partidos.length} partido{r.partidos.length !== 1 ? "s" : ""}</div>
              </div>
            </div>
          );
        })}
        {/* Champion placeholder */}
        <div style={{ width: 90, padding: "12px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(251,191,36,.1)", border: "1px solid rgba(251,191,36,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🏆</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>Campeón</div>
        </div>
      </div>

      {/* Bracket */}
      <div style={{ overflowX: "auto", paddingBottom: 12 }}>
        <div style={{ display: "flex", gap: 0, minWidth: data.rondas.length * 290 + 110, alignItems: "stretch" }}>
          {data.rondas.map((ronda, ri) => (
            <BracketColumn
              key={ri}
              ronda={ronda}
              isLast={ri === data.rondas.length - 1}
              maxPartidos={maxPartidos}
            />
          ))}
          {/* Champion */}
          <ChampionColumn rondas={data.rondas} />
        </div>
      </div>
    </div>
  );
};

const BracketColumn = ({ ronda, isLast, maxPartidos }) => {
  const colHeight = Math.max(maxPartidos * 110, 220);
  return (
    <div style={{ width: 270, flexShrink: 0, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "8px 14px 12px", textAlign: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.09em" }}>{ronda.nombre}</span>
      </div>
      {/* Matches */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-around", gap: 10, padding: "0 8px 8px" }}>
        {ronda.partidos.map((p, pi) => (
          <BracketMatchCard key={p.id} partido={p} isLast={isLast} />
        ))}
      </div>
    </div>
  );
};

const BracketMatchCard = ({ partido, isLast }) => {
  const { useState: useS } = React;
  const [hover, setHover] = useS(false);
  const statusColor = { jugado:"#a3e635", en_curso:"#fbbf24", programado:"#3b82f6", pendiente:"#334155" }[partido.estado] || "#334155";

  const TeamRow = ({ nombre, seed, isWinner, isTbd }) => (
    <div style={{
      padding: "10px 12px",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
      background: isWinner ? "rgba(163,230,53,0.1)" : "transparent",
      borderLeft: isWinner ? "2px solid rgba(163,230,53,0.6)" : "2px solid transparent",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
        {seed && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: "oklch(24% 0.01 250)", color: "#475569", flexShrink: 0, fontFamily: "Space Grotesk, sans-serif" }}>{seed}</span>}
        <span style={{ fontSize: 12, fontWeight: isWinner ? 700 : 400, color: isTbd ? "#334155" : isWinner ? "#e2e8f0" : "#94a3b8", fontStyle: isTbd ? "italic" : "normal", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {isTbd ? "Por definir" : nombre}
        </span>
      </div>
      {isWinner && <span style={{ fontSize: 10, color: "#a3e635", flexShrink: 0 }}>✓</span>}
    </div>
  );

  const tbd1 = !partido.e1 || partido.e1 === "TBD";
  const tbd2 = !partido.e2 || partido.e2 === "TBD";

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "oklch(18% 0.012 250)",
        border: `1px solid ${hover ? statusColor + "50" : "oklch(26% 0.01 250)"}`,
        borderRadius: 12, overflow: "hidden",
        boxShadow: partido.estado === "en_curso" ? `0 0 0 2px rgba(251,191,36,.25)` : hover ? "0 4px 16px rgba(0,0,0,.4)" : "none",
        transition: "all .12s",
      }}
    >
      <TeamRow nombre={partido.e1} seed={partido.seed1} isWinner={partido.ganador === partido.e1} isTbd={tbd1} />
      <div style={{ height: 1, background: "oklch(22% 0.01 250)" }} />
      <TeamRow nombre={partido.e2} seed={partido.seed2} isWinner={partido.ganador === partido.e2} isTbd={tbd2} />

      {/* Footer */}
      <div style={{ padding: "7px 12px", borderTop: "1px solid oklch(20% 0.01 250)", background: "oklch(15% 0.01 250)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {partido.hora && <span style={{ fontSize: 10, color: "#334155" }}>⏰ {partido.hora}</span>}
          {partido.cancha && <span style={{ fontSize: 10, color: "#334155" }}>📍 {partido.cancha}</span>}
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
          {partido.estado !== "jugado" && !tbd1 && !tbd2 && (
            <button style={{ fontSize: 9, padding: "2px 7px", borderRadius: 5, border: "1px solid rgba(163,230,53,.3)", background: "rgba(163,230,53,.1)", color: "#a3e635", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
              Cargar
            </button>
          )}
          {partido.res && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", fontFamily: "Space Grotesk, sans-serif" }}>{partido.res}</span>
          )}
        </div>
      </div>
    </div>
  );
};

const ChampionColumn = ({ rondas }) => {
  const finalRound = rondas[rondas.length - 1];
  const finalPartido = finalRound?.partidos[0];
  const campeon = finalPartido?.ganador;

  return (
    <div style={{ width: 100, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 36 }}>
      <div style={{
        width: 84, padding: "16px 10px", textAlign: "center",
        background: campeon ? "rgba(251,191,36,.12)" : "oklch(16% 0.012 250)",
        border: `1px solid ${campeon ? "rgba(251,191,36,.3)" : "oklch(26% 0.01 250)"}`,
        borderRadius: 12,
      }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>🏆</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Campeón</div>
        {campeon ? (
          <div style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", lineHeight: 1.3 }}>{campeon}</div>
        ) : (
          <div style={{ fontSize: 10, color: "#334155", fontStyle: "italic" }}>Por definir</div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CALENDARIO VIEW
// ─────────────────────────────────────────────────────────────────────────────
const CalendarioView = () => {
  const { useState: useS, useMemo } = React;

  const today = new Date(2026, 3, 25); // April 25 2026
  const [currentMonth, setCurrentMonth] = useS(3); // 0-indexed
  const [currentYear, setCurrentYear] = useS(2026);
  const [selectedDay, setSelectedDay] = useS(25);
  const [filterCat, setFilterCat] = useS("todas");
  const [viewMode, setViewMode] = useS("mes"); // "mes" | "semana"

  const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DAYS   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Group partidos by date
  const partidosByDate = useMemo(() => {
    const map = {};
    CALENDAR_PARTIDOS.forEach(p => {
      const [y, m, d] = p.fecha.split("-").map(Number);
      if (y === currentYear && m - 1 === currentMonth) {
        if (!map[d]) map[d] = [];
        map[d].push(p);
      }
    });
    return map;
  }, [currentMonth, currentYear]);

  const selectedPartidos = (partidosByDate[selectedDay] || []).filter(p => filterCat === "todas" || p.cat === filterCat);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDay(null);
  };

  const isToday = d => d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>
            Calendario de partidos
          </h1>
          <p style={{ fontSize: 13, color: "#475569" }}>Copa de Verano 2026 · Gestión de agenda</p>
        </div>
        <button style={{ padding: "9px 18px", borderRadius: 9, background: "#a3e635", border: "none", color: "#0f172a", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + Agendar partido
        </button>
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {["todas", ...FIXTURE_CATS].map(c => (
          <button key={c} onClick={() => setFilterCat(c)} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 14px", borderRadius: 20, border: "1px solid",
            borderColor: filterCat === c ? (c === "todas" ? "rgba(163,230,53,.4)" : CAT_COLORS[c] + "50") : "oklch(28% 0.01 250)",
            background: filterCat === c ? (c === "todas" ? "rgba(163,230,53,.12)" : CAT_COLORS[c] + "18") : "transparent",
            color: filterCat === c ? (c === "todas" ? "#a3e635" : CAT_COLORS[c]) : "#475569",
            fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            {c !== "todas" && <span style={{ width: 7, height: 7, borderRadius: "50%", background: CAT_COLORS[c] }} />}
            {c === "todas" ? "Todas" : c}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        {/* Calendar grid */}
        <div style={{ background: "oklch(16% 0.012 250)", borderRadius: 14, border: "1px solid oklch(24% 0.01 250)", overflow: "hidden" }}>
          {/* Month nav */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid oklch(22% 0.01 250)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: 8, background: "oklch(22% 0.012 250)", border: "1px solid oklch(30% 0.01 250)", color: "#64748b", cursor: "pointer", fontSize: 14 }}>‹</button>
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <button onClick={nextMonth} style={{ width: 32, height: 32, borderRadius: 8, background: "oklch(22% 0.012 250)", border: "1px solid oklch(30% 0.01 250)", color: "#64748b", cursor: "pointer", fontSize: 14 }}>›</button>
          </div>

          {/* Day names */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "10px 14px 6px" }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em" }}>{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, padding: "4px 14px 16px" }}>
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayPartidos = (partidosByDate[day] || []).filter(p => filterCat === "todas" || p.cat === filterCat);
              const isSelected = day === selectedDay;
              const todayDay = isToday(day);
              const catDots = [...new Set(dayPartidos.map(p => p.cat))];

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    position: "relative",
                    padding: "8px 4px 6px",
                    borderRadius: 9,
                    border: `1px solid ${isSelected ? "rgba(163,230,53,.5)" : todayDay ? "rgba(163,230,53,.25)" : "transparent"}`,
                    background: isSelected ? "rgba(163,230,53,.15)" : todayDay ? "rgba(163,230,53,.06)" : dayPartidos.length ? "oklch(20% 0.012 250)" : "transparent",
                    cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    transition: "all .1s",
                    minHeight: 56,
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "oklch(20% 0.012 250)"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = todayDay ? "rgba(163,230,53,.06)" : dayPartidos.length ? "oklch(20% 0.012 250)" : "transparent"; }}
                >
                  <span style={{
                    fontSize: 13, fontWeight: isSelected || todayDay ? 800 : 400,
                    color: isSelected ? "#a3e635" : todayDay ? "#a3e635" : "#94a3b8",
                    fontFamily: "Space Grotesk, sans-serif",
                    width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "50%",
                    background: todayDay && !isSelected ? "rgba(163,230,53,.2)" : "transparent",
                  }}>
                    {day}
                  </span>
                  {/* Match count badge */}
                  {dayPartidos.length > 0 && (
                    <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", maxWidth: 48 }}>
                      {catDots.slice(0, 3).map(c => (
                        <span key={c} style={{ width: 5, height: 5, borderRadius: "50%", background: CAT_COLORS[c], flexShrink: 0 }} />
                      ))}
                    </div>
                  )}
                  {dayPartidos.length > 0 && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#334155" }}>
                      {dayPartidos.length}p
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ padding: "12px 20px", borderTop: "1px solid oklch(22% 0.01 250)", display: "flex", gap: 16, flexWrap: "wrap" }}>
            {Object.entries(CAT_COLORS).map(([c, color]) => (
              <span key={c} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#475569" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Day detail panel */}
        <div style={{ background: "oklch(16% 0.012 250)", borderRadius: 14, border: "1px solid oklch(24% 0.01 250)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid oklch(22% 0.01 250)" }}>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15, color: "#f1f5f9", marginBottom: 2 }}>
              {selectedDay ? `${DAYS[new Date(currentYear, currentMonth, selectedDay).getDay()]} ${selectedDay} ${MONTHS[currentMonth]}` : "Seleccioná un día"}
            </div>
            <div style={{ fontSize: 11, color: "#475569" }}>
              {selectedPartidos.length > 0 ? `${selectedPartidos.length} partido${selectedPartidos.length !== 1 ? "s" : ""}` : "Sin partidos"}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
            {selectedPartidos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#334155" }}>
                <div style={{ fontSize: 32, marginBottom: 8, opacity: .4 }}>📅</div>
                <div style={{ fontSize: 13 }}>{selectedDay ? "Sin partidos este día" : "Seleccioná un día"}</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selectedPartidos.sort((a,b) => a.hora.localeCompare(b.hora)).map(p => (
                  <CalendarioPartidoCard key={p.id} partido={p} />
                ))}
              </div>
            )}
          </div>

          {selectedDay && (
            <div style={{ padding: "12px 14px", borderTop: "1px solid oklch(22% 0.01 250)" }}>
              <button style={{ width: "100%", padding: "9px", borderRadius: 9, background: "rgba(163,230,53,.12)", border: "1px solid rgba(163,230,53,.25)", color: "#a3e635", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                + Agendar en este día
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Weekly overview strip */}
      <div style={{ background: "oklch(16% 0.012 250)", borderRadius: 14, border: "1px solid oklch(24% 0.01 250)", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid oklch(22% 0.01 250)" }}>
          <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>
            Esta semana · 25–27 abril
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0 }}>
          {["Lun 21","Mar 22","Mié 23","Jue 24","Vie 25","Sáb 26","Dom 27"].map((label, i) => {
            const dayNum = [21,22,23,24,25,26,27][i];
            const dayP = (partidosByDate[dayNum] || []).filter(p => filterCat === "todas" || p.cat === filterCat);
            const isActive = dayNum === selectedDay;
            const isTodayW = dayNum === 25;
            return (
              <button key={i} onClick={() => setSelectedDay(dayNum)}
                style={{
                  padding: "14px 8px", border: "none",
                  borderRight: i < 6 ? "1px solid oklch(22% 0.01 250)" : "none",
                  background: isActive ? "rgba(163,230,53,.1)" : isTodayW ? "rgba(163,230,53,.04)" : "transparent",
                  cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  transition: "background .12s",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "oklch(20% 0.012 250)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? "rgba(163,230,53,.1)" : isTodayW ? "rgba(163,230,53,.04)" : "transparent"; }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: isTodayW ? "#a3e635" : "#334155", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
                {isTodayW && <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 10, background: "rgba(163,230,53,.2)", color: "#a3e635", fontWeight: 800 }}>HOY</span>}
                <span style={{ fontSize: 20, fontWeight: 800, color: isActive ? "#a3e635" : "#64748b", fontFamily: "Space Grotesk, sans-serif" }}>
                  {dayP.length}
                </span>
                <span style={{ fontSize: 10, color: "#334155" }}>partido{dayP.length !== 1 ? "s" : ""}</span>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", maxWidth: 60 }}>
                  {[...new Set(dayP.map(p => p.cat))].map(c => (
                    <span key={c} style={{ width: 6, height: 6, borderRadius: "50%", background: CAT_COLORS[c] }} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const CalendarioPartidoCard = ({ partido }) => {
  const statusColor = { jugado:"#a3e635", en_curso:"#fbbf24", programado:"#3b82f6" }[partido.estado] || "#475569";
  const statusLabel = { jugado:"Jugado", en_curso:"En curso", programado:"Programado" }[partido.estado] || "Pendiente";
  return (
    <div style={{
      padding: "11px 13px", borderRadius: 10,
      background: "oklch(20% 0.012 250)",
      border: `1px solid ${statusColor}25`,
      borderLeft: `3px solid ${CAT_COLORS[partido.cat] || "#475569"}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: CAT_COLORS[partido.cat], textTransform: "uppercase", letterSpacing: "0.06em" }}>{partido.cat}</span>
        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: statusColor + "20", color: statusColor, fontWeight: 700 }}>{statusLabel}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 6, lineHeight: 1.3 }}>{partido.partido}</div>
      <div style={{ display: "flex", gap: 10 }}>
        <span style={{ fontSize: 11, color: "#475569" }}>⏰ {partido.hora}</span>
        <span style={{ fontSize: 11, color: "#475569" }}>📍 {partido.cancha}</span>
      </div>
    </div>
  );
};

// Export to window
Object.assign(window, { FixtureView, CalendarioView });
