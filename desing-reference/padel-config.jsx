// Módulo de Configuración — 5 tabs: General, Sedes & Canchas, Categorías, Colaboradores, Parámetros

const { useState: useS, useRef } = React;

// ─── TOGGLE ───────────────────────────────────────────────────────────────────
const Toggle = ({ value, onChange }) => (
  <div onClick={() => onChange(!value)} style={{
    width: 40, height: 22, borderRadius: 11, cursor: "pointer", transition: "all 0.2s",
    background: value ? "#a3e635" : "oklch(28% 0.01 250)",
    position: "relative", flexShrink: 0,
  }}>
    <div style={{
      position: "absolute", top: 3, left: value ? 21 : 3,
      width: 16, height: 16, borderRadius: "50%",
      background: value ? "#0a0f0a" : "#475569", transition: "left 0.2s",
    }} />
  </div>
);

// ─── FIELD ────────────────────────────────────────────────────────────────────
const Field = ({ label, children, hint }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>{label}</label>
    {children}
    {hint && <div style={{ fontSize: 11, color: "#334155", marginTop: 5 }}>{hint}</div>}
  </div>
);

const Input = ({ value, onChange, placeholder, type = "text" }) => (
  <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
    width: "100%", padding: "9px 14px",
    background: "oklch(22% 0.012 250)", border: "1px solid oklch(30% 0.01 250)",
    borderRadius: 8, color: "#e2e8f0", fontFamily: "inherit", fontSize: 13, outline: "none",
    transition: "border-color 0.15s",
  }}
  onFocus={e => e.target.style.borderColor = "rgba(163,230,53,0.5)"}
  onBlur={e => e.target.style.borderColor = "oklch(30% 0.01 250)"}
  />
);

const Select = ({ value, onChange, options }) => (
  <select value={value} onChange={e => onChange(e.target.value)} style={{
    width: "100%", padding: "9px 14px",
    background: "oklch(22% 0.012 250)", border: "1px solid oklch(30% 0.01 250)",
    borderRadius: 8, color: "#e2e8f0", fontFamily: "inherit", fontSize: 13, outline: "none", cursor: "pointer",
  }}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const SaveBar = ({ onSave, saved }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10,
    padding: "14px 0", borderTop: "1px solid oklch(26% 0.01 250)", marginTop: 24,
  }}>
    {saved && <span style={{ fontSize: 12, color: "#a3e635" }}>✓ Guardado</span>}
    <Btn variant="ghost" small>Cancelar</Btn>
    <Btn small onClick={onSave}>Guardar cambios</Btn>
  </div>
);

// ─── GENERAL ──────────────────────────────────────────────────────────────────
const ConfigGeneral = () => {
  const [saved, setSaved] = useS(false);
  const [form, setForm] = useS({
    nombre: "Club Pádel Buenos Aires",
    email: "admin@padelclub.com",
    telefono: "+54 9 11 4000-1234",
    direccion: "Av. del Libertador 5200, CABA",
    web: "www.padelclub.com.ar",
    descripcion: "Club de pádel fundado en 2018. Torneos, clases y alquiler de canchas.",
  });
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", marginBottom: 18, fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 11 }}>Información del organizador</div>
        <Field label="Nombre del club">
          <Input value={form.nombre} onChange={set("nombre")} />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Email de contacto">
            <Input value={form.email} onChange={set("email")} type="email" />
          </Field>
          <Field label="Teléfono">
            <Input value={form.telefono} onChange={set("telefono")} />
          </Field>
        </div>
        <Field label="Dirección principal">
          <Input value={form.direccion} onChange={set("direccion")} />
        </Field>
        <Field label="Sitio web">
          <Input value={form.web} onChange={set("web")} />
        </Field>
        <Field label="Descripción pública" hint="Se muestra en el portal público">
          <textarea value={form.descripcion} onChange={e => set("descripcion")(e.target.value)} rows={3} style={{
            width: "100%", padding: "9px 14px", background: "oklch(22% 0.012 250)",
            border: "1px solid oklch(30% 0.01 250)", borderRadius: 8, color: "#e2e8f0",
            fontFamily: "inherit", fontSize: 13, outline: "none", resize: "vertical",
          }} />
        </Field>
        <SaveBar onSave={save} saved={saved} />
      </div>

      {/* Right panel */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Logo */}
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Logo del club</div>
          <div style={{ width: "100%", height: 120, background: "oklch(22% 0.012 250)", borderRadius: 10, border: "2px dashed oklch(30% 0.01 250)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12, cursor: "pointer" }}>
            <div style={{ fontSize: 32 }}>🎾</div>
            <span style={{ fontSize: 12, color: "#475569" }}>Subir logo (PNG, SVG)</span>
          </div>
          <Btn small variant="ghost" style={{ width: "100%" }}>↑ Cargar imagen</Btn>
        </Card>

        {/* Plan */}
        <Card style={{ background: "rgba(163,230,53,0.06)", border: "1px solid rgba(163,230,53,0.2)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Plan actual</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#a3e635", fontFamily: "Space Grotesk, sans-serif", marginBottom: 4 }}>Pro</div>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 14 }}>Torneos ilimitados · 5 colaboradores · Portal público</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {["✓ Multi-sede","✓ Ranking automático","✓ Reportes avanzados","✓ Importación CSV"].map(f => (
              <span key={f} style={{ fontSize: 12, color: "#64748b" }}>{f}</span>
            ))}
          </div>
          <Btn small variant="ghost">Ver planes →</Btn>
        </Card>

        {/* Stats */}
        <Card>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Uso del sistema</div>
          {[
            { label: "Torneos creados", value: 3, max: "∞" },
            { label: "Colaboradores", value: 2, max: 5 },
            { label: "Jugadores registrados", value: 248, max: "∞" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>{s.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>{s.value} / {s.max}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ─── SEDES & CANCHAS ──────────────────────────────────────────────────────────
const SEDES_INIT = [
  { id: 1, nombre: "Sede Central", direccion: "Av. del Libertador 5200, CABA", canchas: [
    { id: 1, nombre: "Cancha 1", superficie: "cristal", techada: true, activa: true },
    { id: 2, nombre: "Cancha 2", superficie: "cristal", techada: true, activa: true },
    { id: 3, nombre: "Cancha 3", superficie: "césped", techada: false, activa: true },
    { id: 4, nombre: "Cancha Central", superficie: "cristal", techada: true, activa: true },
  ]},
  { id: 2, nombre: "Sede Norte", direccion: "Maipú 800, Vicente López", canchas: [
    { id: 5, nombre: "Cancha 1", superficie: "cristal", techada: false, activa: true },
    { id: 6, nombre: "Cancha 2", superficie: "cemento", techada: false, activa: false },
  ]},
];

const ConfigSedes = () => {
  const [sedes, setSedes] = useS(SEDES_INIT);
  const [expanded, setExpanded] = useS({ 1: true, 2: false });
  const [editingCancha, setEditingCancha] = useS(null);
  const [newSede, setNewSede] = useS(false);
  const [newSedeName, setNewSedeName] = useS("");

  const toggleCanchaActiva = (sedeId, canchaId) => {
    setSedes(s => s.map(sede => sede.id === sedeId ? {
      ...sede, canchas: sede.canchas.map(c => c.id === canchaId ? { ...c, activa: !c.activa } : c)
    } : sede));
  };

  const addCancha = (sedeId) => {
    setSedes(s => s.map(sede => sede.id === sedeId ? {
      ...sede, canchas: [...sede.canchas, { id: Date.now(), nombre: `Cancha ${sede.canchas.length + 1}`, superficie: "cristal", techada: true, activa: true }]
    } : sede));
  };

  const superficies = [
    { value: "cristal", label: "Cristal" },
    { value: "césped", label: "Césped sintético" },
    { value: "cemento", label: "Cemento" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn small onClick={() => setNewSede(true)}>+ Nueva sede</Btn>
      </div>

      {newSede && (
        <Card style={{ border: "1px solid rgba(163,230,53,0.3)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 12 }}>Nueva sede</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Field label="Nombre"><Input value={newSedeName} onChange={setNewSedeName} placeholder="Ej: Sede Sur" /></Field>
            <Field label="Dirección"><Input value="" onChange={() => {}} placeholder="Dirección completa" /></Field>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn small onClick={() => { setSedes(s => [...s, { id: Date.now(), nombre: newSedeName || "Nueva sede", direccion: "", canchas: [] }]); setNewSede(false); setNewSedeName(""); }}>Crear sede</Btn>
            <Btn small variant="ghost" onClick={() => setNewSede(false)}>Cancelar</Btn>
          </div>
        </Card>
      )}

      {sedes.map(sede => (
        <Card key={sede.id} style={{ padding: 0, overflow: "hidden" }}>
          {/* Sede header */}
          <div onClick={() => setExpanded(e => ({ ...e, [sede.id]: !e[sede.id] }))} style={{
            padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", background: expanded[sede.id] ? "oklch(21% 0.013 250)" : "oklch(19% 0.012 250)",
            transition: "background 0.15s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(163,230,53,0.12)", border: "1px solid rgba(163,230,53,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏟</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", fontFamily: "Space Grotesk, sans-serif" }}>{sede.nombre}</div>
                <div style={{ fontSize: 12, color: "#475569" }}>{sede.direccion} · {sede.canchas.length} canchas · {sede.canchas.filter(c => c.activa).length} activas</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Btn small variant="ghost" onClick={e => { e.stopPropagation(); }}>✏ Editar</Btn>
              <span style={{ color: "#475569", fontSize: 16, transition: "transform 0.2s", transform: expanded[sede.id] ? "rotate(180deg)" : "rotate(0deg)" }}>⌄</span>
            </div>
          </div>

          {/* Canchas */}
          {expanded[sede.id] && (
            <div style={{ padding: "0 20px 16px", borderTop: "1px solid oklch(25% 0.01 250)" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 100px 90px 120px", gap: 12, padding: "12px 0 8px", borderBottom: "1px solid oklch(25% 0.01 250)", marginBottom: 8 }}>
                {["Nombre","Superficie","Techada","Activa",""].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
                ))}
              </div>
              {sede.canchas.map(c => (
                <div key={c.id} style={{
                  display: "grid", gridTemplateColumns: "1fr 140px 100px 90px 120px",
                  gap: 12, padding: "10px 0", alignItems: "center",
                  borderBottom: "1px solid oklch(22% 0.01 250)", opacity: c.activa ? 1 : 0.5,
                }}>
                  {editingCancha === c.id ? (
                    <input defaultValue={c.nombre} style={{ padding: "5px 10px", background: "oklch(24% 0.01 250)", border: "1px solid rgba(163,230,53,0.4)", borderRadius: 6, color: "#e2e8f0", fontFamily: "inherit", fontSize: 13, outline: "none" }} />
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{c.nombre}</span>
                  )}
                  <select value={c.superficie} onChange={() => {}} style={{ padding: "5px 10px", background: "oklch(22% 0.01 250)", border: "1px solid oklch(30% 0.01 250)", borderRadius: 6, color: "#94a3b8", fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}>
                    {superficies.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Toggle value={c.techada} onChange={() => {}} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Toggle value={c.activa} onChange={() => toggleCanchaActiva(sede.id, c.id)} />
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setEditingCancha(editingCancha === c.id ? null : c.id)} style={{ padding: "4px 10px", borderRadius: 6, background: "oklch(24% 0.01 250)", border: "1px solid oklch(30% 0.01 250)", color: "#94a3b8", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>
                      {editingCancha === c.id ? "✓ Ok" : "✏"}
                    </button>
                    <button style={{ padding: "4px 8px", borderRadius: 6, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", cursor: "pointer", fontSize: 11 }}>🗑</button>
                  </div>
                </div>
              ))}
              <button onClick={() => addCancha(sede.id)} style={{ marginTop: 12, padding: "7px 14px", borderRadius: 8, background: "transparent", border: "1px dashed oklch(32% 0.01 250)", color: "#475569", fontFamily: "inherit", fontSize: 12, cursor: "pointer", width: "100%", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(163,230,53,0.3)"; e.currentTarget.style.color = "#a3e635"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "oklch(32% 0.01 250)"; e.currentTarget.style.color = "#475569"; }}>
                + Agregar cancha
              </button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

// ─── CATEGORÍAS ───────────────────────────────────────────────────────────────
const CATS_INIT = [
  { id: 1, nombre: "Masculino A", descripcion: "Nivel avanzado", cupoDefault: 16, genero: "M", activa: true },
  { id: 2, nombre: "Masculino B", descripcion: "Nivel intermedio", cupoDefault: 16, genero: "M", activa: true },
  { id: 3, nombre: "Femenino A", descripcion: "Nivel avanzado", cupoDefault: 8, genero: "F", activa: true },
  { id: 4, nombre: "Femenino B", descripcion: "Nivel intermedio", cupoDefault: 8, genero: "F", activa: true },
  { id: 5, nombre: "Mixto A", descripcion: "Mixto avanzado", cupoDefault: 8, genero: "MX", activa: true },
  { id: 6, nombre: "Mixto B", descripcion: "Mixto intermedio", cupoDefault: 12, genero: "MX", activa: false },
];

const ConfigCategorias = () => {
  const [cats, setCats] = useS(CATS_INIT);
  const [newCat, setNewCat] = useS(false);
  const [editing, setEditing] = useS(null);
  const [saved, setSaved] = useS(false);

  const toggle = (id) => setCats(c => c.map(cat => cat.id === id ? { ...cat, activa: !cat.activa } : cat));
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const genColors = { M: { bg: "rgba(96,165,250,0.12)", c: "#60a5fa" }, F: { bg: "rgba(244,114,182,0.12)", c: "#f472b6" }, MX: { bg: "rgba(167,139,250,0.12)", c: "#a78bfa" } };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: "#475569" }}>{cats.filter(c => c.activa).length} categorías activas · {cats.filter(c => !c.activa).length} inactivas</span>
        <Btn small onClick={() => setNewCat(true)}>+ Nueva categoría</Btn>
      </div>

      {newCat && (
        <Card style={{ border: "1px solid rgba(163,230,53,0.3)", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 14 }}>Nueva categoría</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 100px", gap: 12, marginBottom: 12 }}>
            <Field label="Nombre"><Input value="" onChange={() => {}} placeholder="Ej: Masculino C" /></Field>
            <Field label="Descripción"><Input value="" onChange={() => {}} placeholder="Nivel, descripción..." /></Field>
            <Field label="Cupo default">
              <Select value="16" onChange={() => {}} options={[8,12,16,24,32].map(n => ({ value: String(n), label: String(n) + " parejas" }))} />
            </Field>
            <Field label="Género">
              <Select value="M" onChange={() => {}} options={[{ value: "M", label: "Masculino" }, { value: "F", label: "Femenino" }, { value: "MX", label: "Mixto" }]} />
            </Field>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn small onClick={() => setNewCat(false)}>Crear</Btn>
            <Btn small variant="ghost" onClick={() => setNewCat(false)}>Cancelar</Btn>
          </div>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid oklch(28% 0.01 250)", display: "grid", gridTemplateColumns: "1fr 200px 120px 100px 80px 100px", gap: 12 }}>
          {["Categoría","Descripción","Cupo default","Género","Activa",""].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
          ))}
        </div>
        {cats.map((c, i) => {
          const gc = genColors[c.genero];
          return (
            <div key={c.id} style={{
              padding: "14px 20px", borderBottom: i < cats.length - 1 ? "1px solid oklch(22% 0.01 250)" : "none",
              display: "grid", gridTemplateColumns: "1fr 200px 120px 100px 80px 100px",
              gap: 12, alignItems: "center", opacity: c.activa ? 1 : 0.5,
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", fontFamily: "Space Grotesk, sans-serif" }}>{c.nombre}</span>
              <span style={{ fontSize: 12, color: "#64748b" }}>{c.descripcion}</span>
              <span style={{ fontSize: 13, color: "#94a3b8", textAlign: "center" }}>{c.cupoDefault} parejas</span>
              <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: gc.bg, color: gc.c, textAlign: "center", display: "inline-block" }}>
                {c.genero === "M" ? "Masc." : c.genero === "F" ? "Fem." : "Mixto"}
              </span>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Toggle value={c.activa} onChange={() => toggle(c.id)} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{ padding: "4px 10px", borderRadius: 6, background: "oklch(24% 0.01 250)", border: "1px solid oklch(30% 0.01 250)", color: "#94a3b8", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>✏ Editar</button>
              </div>
            </div>
          );
        })}
      </Card>
      <SaveBar onSave={save} saved={saved} />
    </div>
  );
};

// ─── COLABORADORES ────────────────────────────────────────────────────────────
const PERMISOS = [
  { id: "inscripciones", label: "Inscripciones", desc: "Aprobar / rechazar" },
  { id: "resultados",    label: "Resultados",    desc: "Cargar resultados" },
  { id: "agenda",        label: "Agenda",        desc: "Programar partidos" },
  { id: "reportes",      label: "Reportes",      desc: "Ver reportes" },
  { id: "jugadores",     label: "Jugadores",     desc: "Gestionar jugadores" },
];

const COLAB_INIT = [
  { id: 1, nombre: "Laura Martínez", email: "laura@padelclub.com", rol: "colaborador", avatar: "LM", permisos: ["inscripciones", "resultados", "agenda"], activo: true },
  { id: 2, nombre: "Diego Soto", email: "diego@padelclub.com", rol: "colaborador", avatar: "DS", permisos: ["resultados", "agenda"], activo: true },
];

const ConfigColaboradores = () => {
  const [colabs, setColabs] = useS(COLAB_INIT);
  const [inviting, setInviting] = useS(false);
  const [selected, setSelected] = useS(1);
  const [saved, setSaved] = useS(false);

  const colab = colabs.find(c => c.id === selected);
  const togglePerm = (permId) => {
    setColabs(cs => cs.map(c => c.id === selected ? {
      ...c,
      permisos: c.permisos.includes(permId)
        ? c.permisos.filter(p => p !== permId)
        : [...c.permisos, permId]
    } : c));
  };

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
      {/* Left: list */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}>2 / 5 colaboradores</span>
          <Btn small onClick={() => setInviting(true)}>+ Invitar</Btn>
        </div>

        {inviting && (
          <Card style={{ marginBottom: 12, border: "1px solid rgba(163,230,53,0.3)", padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 10 }}>Invitar colaborador</div>
            <Field label="Email"><Input value="" onChange={() => {}} placeholder="email@ejemplo.com" type="email" /></Field>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn small onClick={() => setInviting(false)}>Enviar invitación</Btn>
              <Btn small variant="ghost" onClick={() => setInviting(false)}>✕</Btn>
            </div>
          </Card>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {colabs.map(c => (
            <div key={c.id} onClick={() => setSelected(c.id)} style={{
              padding: "12px 14px", borderRadius: 10, cursor: "pointer",
              background: selected === c.id ? "oklch(23% 0.015 250)" : "oklch(19% 0.012 250)",
              border: `1px solid ${selected === c.id ? "rgba(163,230,53,0.3)" : "oklch(28% 0.01 250)"}`,
              display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s",
            }}>
              <Avatar initials={c.avatar} size={34} color="#60a5fa" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.nombre}</div>
                <div style={{ fontSize: 11, color: "#475569" }}>{c.permisos.length} permisos</div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.activo ? "#a3e635" : "#475569", flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Right: permissions */}
      {colab && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid oklch(26% 0.01 250)" }}>
            <Avatar initials={colab.avatar} size={44} color="#60a5fa" />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", fontFamily: "Space Grotesk, sans-serif" }}>{colab.nombre}</div>
              <div style={{ fontSize: 12, color: "#475569" }}>{colab.email}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <Btn small variant="ghost">✏ Editar</Btn>
              <Btn small variant="danger">Revocar acceso</Btn>
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Permisos granulares</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PERMISOS.map(p => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px", borderRadius: 10,
                background: colab.permisos.includes(p.id) ? "rgba(163,230,53,0.05)" : "oklch(22% 0.012 250)",
                border: `1px solid ${colab.permisos.includes(p.id) ? "rgba(163,230,53,0.2)" : "oklch(28% 0.01 250)"}`,
                transition: "all 0.15s",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{p.desc}</div>
                </div>
                <Toggle value={colab.permisos.includes(p.id)} onChange={() => togglePerm(p.id)} />
              </div>
            ))}
          </div>
          <SaveBar onSave={save} saved={saved} />
        </Card>
      )}
    </div>
  );
};

// ─── PARÁMETROS ───────────────────────────────────────────────────────────────
const ConfigParametros = () => {
  const [saved, setSaved] = useS(false);
  const [params, setParams] = useS({
    formato: "groups_playoff",
    setsPartido: "3",
    gamesPorSet: "6",
    setDecisivo: "super_tiebreak",
    listaEspera: true,
    avanceAutomatico: true,
    resultadoManual: false,
    inscripcionPareja: true,
    aprobacionManual: true,
    publicarAutomatico: false,
    rankingHabilitado: true,
    puntosCampeon: 100,
    puntosSubcampeon: 60,
    puntosSemi: 30,
    puntosGrupos: 10,
  });
  const set = (k) => (v) => setParams(p => ({ ...p, [k]: v }));
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid oklch(26% 0.01 250)" }}>{title}</div>
      {children}
    </div>
  );

  const ToggleRow = ({ label, desc, paramKey }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid oklch(24% 0.01 250)" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0" }}>{label}</div>
        <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{desc}</div>
      </div>
      <Toggle value={params[paramKey]} onChange={v => set(paramKey)(v)} />
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
      <div>
        <Section title="Formato y competencia">
          <Field label="Formato por defecto">
            <Select value={params.formato} onChange={set("formato")} options={[
              { value: "single_elimination", label: "Eliminación simple" },
              { value: "groups_playoff", label: "Grupos + Playoff" },
              { value: "double_elimination", label: "Doble eliminación (V2)" },
              { value: "americano", label: "Americano (V2)" },
            ]} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Sets por partido">
              <Select value={params.setsPartido} onChange={set("setsPartido")} options={[
                { value: "1", label: "1 set" },
                { value: "3", label: "Al mejor de 3" },
              ]} />
            </Field>
            <Field label="Games por set">
              <Select value={params.gamesPorSet} onChange={set("gamesPorSet")} options={[
                { value: "4", label: "4 games" },
                { value: "6", label: "6 games" },
                { value: "9", label: "9 games" },
              ]} />
            </Field>
          </div>
          <Field label="Set decisivo (3er set)">
            <Select value={params.setDecisivo} onChange={set("setDecisivo")} options={[
              { value: "super_tiebreak", label: "Super tiebreak (10 pts)" },
              { value: "tiebreak", label: "Tiebreak clásico (7 pts)" },
              { value: "set_completo", label: "Set completo" },
            ]} />
          </Field>
        </Section>

        <Section title="Inscripciones">
          <ToggleRow label="Inscripción por pareja" desc="Siempre en formato dupla fija" paramKey="inscripcionPareja" />
          <ToggleRow label="Aprobación manual" desc="El organizador aprueba cada inscripción" paramKey="aprobacionManual" />
          <ToggleRow label="Lista de espera automática" desc="Cuando el cupo se llena, genera lista de espera" paramKey="listaEspera" />
        </Section>
      </div>

      <div>
        <Section title="Fixture y resultados">
          <ToggleRow label="Avance automático de llaves" desc="Al cargar resultado, avanza automáticamente" paramKey="avanceAutomatico" />
          <ToggleRow label="Resultado manual forzado" desc="Requiere confirmación antes de publicar" paramKey="resultadoManual" />
          <ToggleRow label="Publicar torneo automáticamente" desc="Al crearlo queda visible en el portal público" paramKey="publicarAutomatico" />
        </Section>

        <Section title="Ranking">
          <ToggleRow label="Ranking habilitado" desc="Calcula y muestra ranking de este organizador" paramKey="rankingHabilitado" />
          {params.rankingHabilitado && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Puntos por resultado</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Campeón",     key: "puntosCampeon" },
                  { label: "Subcampeón",  key: "puntosSubcampeon" },
                  { label: "Semifinal",   key: "puntosSemi" },
                  { label: "Fase grupos", key: "puntosGrupos" },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 5 }}>{f.label}</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="number" value={params[f.key]} onChange={e => set(f.key)(Number(e.target.value))} style={{
                        width: 80, padding: "7px 10px", background: "oklch(22% 0.012 250)",
                        border: "1px solid oklch(30% 0.01 250)", borderRadius: 7, color: "#e2e8f0",
                        fontFamily: "inherit", fontSize: 13, outline: "none",
                      }} />
                      <span style={{ fontSize: 12, color: "#475569" }}>pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        <div style={{ padding: 14, borderRadius: 10, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", marginBottom: 4 }}>⚠ Cambios con impacto</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Modificar el formato o puntos de ranking afecta torneos en curso. Estos cambios solo aplicarán a torneos nuevos.</div>
        </div>
      </div>

      <div style={{ gridColumn: "1 / -1" }}>
        <SaveBar onSave={save} saved={saved} />
      </div>
    </div>
  );
};

// ─── CONFIGURACIÓN MAIN ───────────────────────────────────────────────────────
const ConfiguracionView = () => {
  const [tab, setTab] = useS("general");
  const tabs = [
    { id: "general",       label: "General" },
    { id: "sedes",         label: "Sedes & Canchas" },
    { id: "categorias",    label: "Categorías" },
    { id: "colaboradores", label: "Colaboradores" },
    { id: "parametros",    label: "Parámetros" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: "#f1f5f9", marginBottom: 4 }}>Configuración</h1>
        <span style={{ fontSize: 13, color: "#475569" }}>Club Pádel Buenos Aires</span>
      </div>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      <div style={{ paddingTop: 4 }}>
        {tab === "general"       && <ConfigGeneral />}
        {tab === "sedes"         && <ConfigSedes />}
        {tab === "categorias"    && <ConfigCategorias />}
        {tab === "colaboradores" && <ConfigColaboradores />}
        {tab === "parametros"    && <ConfigParametros />}
      </div>
    </div>
  );
};

Object.assign(window, { ConfiguracionView });
