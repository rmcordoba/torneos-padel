// CRUD completo: TorneoWizard (stepper) + JugadoresView con create/edit/delete

const { useState: useC, useEffect: useE, useRef: useR } = React;

// ─── MODAL OVERLAY ────────────────────────────────────────────────────────────
const Overlay = ({ children, onClose, wide }) => (
  <div onClick={e => e.target === e.currentTarget && onClose()} style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
    backdropFilter: "blur(4px)", zIndex: 2000,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20, animation: "fadeIn 0.2s ease",
  }}>
    <div style={{
      background: "oklch(17% 0.014 250)", borderRadius: 16,
      border: "1px solid oklch(28% 0.01 250)",
      boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      width: "100%", maxWidth: wide ? 860 : 520,
      maxHeight: "90vh", display: "flex", flexDirection: "column",
      animation: "slideIn 0.2s ease",
    }}>
      {children}
    </div>
  </div>
);

// ─── CONFIRM DELETE ───────────────────────────────────────────────────────────
const DeleteConfirmModal = ({ player, onConfirm, onClose }) => (
  <Overlay onClose={onClose}>
    <div style={{ padding: "28px 28px 24px" }}>
      <div style={{ fontSize: 32, marginBottom: 16, textAlign: "center" }}>🗑</div>
      <h2 style={{ textAlign: "center", fontFamily: "Space Grotesk, sans-serif", color: "#f1f5f9", fontSize: 18, marginBottom: 8 }}>
        Eliminar jugador
      </h2>
      <p style={{ textAlign: "center", color: "#64748b", fontSize: 13, marginBottom: 6 }}>
        ¿Estás seguro que querés eliminar a
      </p>
      <p style={{ textAlign: "center", color: "#f87171", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
        {player.nombre}
      </p>
      <div style={{ padding: 14, borderRadius: 10, background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)", marginBottom: 24, fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
        ⚠ Esta acción es irreversible. Se eliminará su perfil, historial de torneos y registros de inscripciones.
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</Btn>
        <Btn variant="danger" onClick={onConfirm} style={{ flex: 1 }}>Confirmar eliminación</Btn>
      </div>
    </div>
  </Overlay>
);

// ─── JUGADOR MODAL (create / edit) ────────────────────────────────────────────
const JugadorModal = ({ mode, player, onSave, onClose }) => {
  const empty = { nombre: "", email: "", telefono: "", categorias: [], sede: "Sede Central", notas: "" };
  const [form, setForm] = useC(mode === "edit" && player ? { ...player } : empty);
  const [errors, setErrors] = useC({});

  const cats = ["Masculino A", "Masculino B", "Femenino A", "Femenino B", "Mixto A", "Mixto B"];
  const sedes = ["Sede Central", "Sede Norte"];

  const setF = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  const toggleCat = (c) => setForm(f => ({
    ...f,
    categorias: f.categorias.includes(c) ? f.categorias.filter(x => x !== c) : [...f.categorias, c]
  }));

  const validate = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "Requerido";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Email inválido";
    if (form.categorias.length === 0) e.categorias = "Seleccioná al menos una";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (validate()) onSave(form);
  };

  const FieldErr = ({ k, label, children }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: errors[k] ? "#f87171" : "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
        {label} {errors[k] && <span style={{ textTransform: "none", fontWeight: 400 }}>— {errors[k]}</span>}
      </label>
      {children}
    </div>
  );

  return (
    <Overlay onClose={onClose}>
      {/* Header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid oklch(24% 0.01 250)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(163,230,53,0.12)", border: "1px solid rgba(163,230,53,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👤</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: "#f1f5f9" }}>
              {mode === "create" ? "Nuevo jugador" : "Editar jugador"}
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>
              {mode === "create" ? "Completá los datos del jugador" : `Editando: ${player?.nombre}`}
            </p>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "oklch(24% 0.01 250)", border: "none", color: "#64748b", width: 30, height: 30, borderRadius: 7, cursor: "pointer", fontSize: 14 }}>✕</button>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <FieldErr k="nombre" label="Nombre completo">
            <input value={form.nombre} onChange={e => setF("nombre")(e.target.value)} placeholder="Ej: Martín García" style={{
              width: "100%", padding: "9px 14px", background: "oklch(22% 0.012 250)",
              border: `1px solid ${errors.nombre ? "rgba(248,113,113,0.5)" : "oklch(30% 0.01 250)"}`,
              borderRadius: 8, color: "#e2e8f0", fontFamily: "inherit", fontSize: 13, outline: "none",
            }} />
          </FieldErr>
          <FieldErr k="email" label="Email">
            <input type="email" value={form.email} onChange={e => setF("email")(e.target.value)} placeholder="jugador@mail.com" style={{
              width: "100%", padding: "9px 14px", background: "oklch(22% 0.012 250)",
              border: `1px solid ${errors.email ? "rgba(248,113,113,0.5)" : "oklch(30% 0.01 250)"}`,
              borderRadius: 8, color: "#e2e8f0", fontFamily: "inherit", fontSize: 13, outline: "none",
            }} />
          </FieldErr>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Teléfono</label>
            <input value={form.telefono} onChange={e => setF("telefono")(e.target.value)} placeholder="+54 9 11 ..." style={{
              width: "100%", padding: "9px 14px", background: "oklch(22% 0.012 250)",
              border: "1px solid oklch(30% 0.01 250)", borderRadius: 8, color: "#e2e8f0", fontFamily: "inherit", fontSize: 13, outline: "none",
            }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Sede principal</label>
            <select value={form.sede} onChange={e => setF("sede")(e.target.value)} style={{
              width: "100%", padding: "9px 14px", background: "oklch(22% 0.012 250)",
              border: "1px solid oklch(30% 0.01 250)", borderRadius: 8, color: "#e2e8f0", fontFamily: "inherit", fontSize: 13, outline: "none", cursor: "pointer",
            }}>
              {sedes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <FieldErr k="categorias" label="Categorías habilitadas">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 2 }}>
            {cats.map(c => {
              const sel = form.categorias.includes(c);
              return (
                <button key={c} onClick={() => toggleCat(c)} style={{
                  padding: "7px 14px", borderRadius: 20, border: "1px solid",
                  borderColor: sel ? "#a3e635" : errors.categorias ? "rgba(248,113,113,0.4)" : "oklch(30% 0.01 250)",
                  background: sel ? "rgba(163,230,53,0.15)" : "transparent",
                  color: sel ? "#a3e635" : "#64748b", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.12s",
                }}>
                  {sel ? "✓ " : ""}{c}
                </button>
              );
            })}
          </div>
        </FieldErr>

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Notas internas</label>
          <textarea value={form.notas} onChange={e => setF("notas")(e.target.value)} rows={2} placeholder="Observaciones, lesiones, nivel..." style={{
            width: "100%", padding: "9px 14px", background: "oklch(22% 0.012 250)",
            border: "1px solid oklch(30% 0.01 250)", borderRadius: 8, color: "#e2e8f0", fontFamily: "inherit", fontSize: 13, outline: "none", resize: "vertical",
          }} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid oklch(24% 0.01 250)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave}>{mode === "create" ? "Crear jugador" : "Guardar cambios"}</Btn>
      </div>
    </Overlay>
  );
};

// ─── TORNEO WIZARD ────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Básicos",       icon: "📋" },
  { id: 2, label: "Categorías",    icon: "🏷" },
  { id: 3, label: "Formato",       icon: "🎯" },
  { id: 4, label: "Inscripciones", icon: "✍" },
  { id: 5, label: "Confirmación",  icon: "✅" },
];

const TorneoWizard = ({ onClose, onCreated }) => {
  const [step, setStep] = useC(1);
  const [form, setForm] = useC({
    nombre: "",
    sede: "Sede Central",
    fechaInicio: "",
    fechaFin: "",
    fechaCierreInscripcion: "",
    descripcion: "",
    categorias: [],
    formatos: {},
    cupos: {},
    aprobacionManual: true,
    listaEspera: true,
    publicarAlCrear: false,
    avanceAutomatico: true,
  });

  const setF = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const CATS_DISPONIBLES = ["Masculino A", "Masculino B", "Femenino A", "Femenino B", "Mixto A", "Mixto B"];
  const FORMATOS = [
    { value: "single_elimination", label: "Eliminación simple" },
    { value: "groups_playoff", label: "Grupos + Playoff" },
  ];
  const CUPOS = [4, 8, 12, 16, 24, 32];

  const toggleCat = (c) => {
    setForm(f => {
      const next = f.categorias.includes(c)
        ? f.categorias.filter(x => x !== c)
        : [...f.categorias, c];
      return {
        ...f, categorias: next,
        formatos: { ...f.formatos, [c]: f.formatos[c] || "groups_playoff" },
        cupos: { ...f.cupos, [c]: f.cupos[c] || 16 },
      };
    });
  };

  const setFormato = (cat, val) => setForm(f => ({ ...f, formatos: { ...f.formatos, [cat]: val } }));
  const setCupo    = (cat, val) => setForm(f => ({ ...f, cupos:    { ...f.cupos,    [cat]: val } }));

  const canNext = () => {
    if (step === 1) return form.nombre.trim() && form.fechaInicio && form.fechaFin;
    if (step === 2) return form.categorias.length > 0;
    return true;
  };

  const handleCreate = () => {
    onCreated && onCreated(form);
    onClose();
  };

  // Toggle component local
  const WToggle = ({ value, onChange }) => (
    <div onClick={() => onChange(!value)} style={{
      width: 40, height: 22, borderRadius: 11, cursor: "pointer", transition: "all 0.2s",
      background: value ? "#a3e635" : "oklch(28% 0.01 250)", position: "relative", flexShrink: 0,
    }}>
      <div style={{ position: "absolute", top: 3, left: value ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: value ? "#0a0f0a" : "#475569", transition: "left 0.2s" }} />
    </div>
  );

  return (
    <Overlay onClose={onClose} wide>
      {/* Header */}
      <div style={{ padding: "20px 28px 0", borderBottom: "1px solid oklch(24% 0.01 250)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20 }}>🏆</span>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: "#f1f5f9" }}>Crear nuevo torneo</h2>
          </div>
          <button onClick={onClose} style={{ background: "oklch(24% 0.01 250)", border: "none", color: "#64748b", width: 30, height: 30, borderRadius: 7, cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>
        {/* Step bar */}
        <div style={{ display: "flex", gap: 0, marginBottom: -1 }}>
          {STEPS.map((s, i) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div onClick={() => done && setStep(s.id)} style={{
                  flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
                  borderBottom: active ? "2px solid #a3e635" : "2px solid transparent",
                  cursor: done ? "pointer" : "default", marginBottom: -1,
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: done ? "#a3e635" : active ? "rgba(163,230,53,0.2)" : "oklch(24% 0.01 250)",
                    border: `2px solid ${done ? "#a3e635" : active ? "#a3e635" : "oklch(32% 0.01 250)"}`,
                    fontSize: 11, fontWeight: 800, color: done ? "#0a0f0a" : active ? "#a3e635" : "#475569",
                  }}>
                    {done ? "✓" : s.id}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: active ? "#a3e635" : done ? "#64748b" : "#334155" }}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ width: 1, height: 14, background: "oklch(28% 0.01 250)" }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1, minHeight: 320 }}>

        {/* Step 1: Básicos */}
        {step === 1 && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            <div style={{ marginBottom: 18, fontSize: 13, color: "#475569" }}>Información general del torneo</div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Nombre del torneo *</label>
              <input value={form.nombre} onChange={e => setF("nombre")(e.target.value)} placeholder="Ej: Copa Primavera 2026" style={{
                width: "100%", padding: "11px 16px", background: "oklch(22% 0.012 250)",
                border: "1px solid oklch(30% 0.01 250)", borderRadius: 9, color: "#e2e8f0", fontFamily: "inherit", fontSize: 14, outline: "none",
              }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
              {[
                { label: "Fecha de inicio *", key: "fechaInicio", type: "date" },
                { label: "Fecha de cierre *", key: "fechaFin", type: "date" },
                { label: "Cierre de inscripciones", key: "fechaCierreInscripcion", type: "date" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => setF(f.key)(e.target.value)} style={{
                    width: "100%", padding: "9px 12px", background: "oklch(22% 0.012 250)",
                    border: "1px solid oklch(30% 0.01 250)", borderRadius: 8, color: "#e2e8f0", fontFamily: "inherit", fontSize: 13, outline: "none",
                  }} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Sede</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["Sede Central", "Sede Norte"].map(s => (
                  <button key={s} onClick={() => setF("sede")(s)} style={{
                    flex: 1, padding: "10px", borderRadius: 9, border: "1px solid",
                    borderColor: form.sede === s ? "#a3e635" : "oklch(30% 0.01 250)",
                    background: form.sede === s ? "rgba(163,230,53,0.1)" : "oklch(22% 0.012 250)",
                    color: form.sede === s ? "#a3e635" : "#64748b",
                    fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}>
                    🏟 {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Descripción (opcional)</label>
              <textarea value={form.descripcion} onChange={e => setF("descripcion")(e.target.value)} rows={2} placeholder="Descripción pública del torneo..." style={{
                width: "100%", padding: "9px 14px", background: "oklch(22% 0.012 250)",
                border: "1px solid oklch(30% 0.01 250)", borderRadius: 8, color: "#e2e8f0", fontFamily: "inherit", fontSize: 13, outline: "none", resize: "none",
              }} />
            </div>
          </div>
        )}

        {/* Step 2: Categorías */}
        {step === 2 && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            <div style={{ marginBottom: 18, fontSize: 13, color: "#475569" }}>Seleccioná las categorías que participarán en este torneo</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {CATS_DISPONIBLES.map(c => {
                const sel = form.categorias.includes(c);
                return (
                  <div key={c} onClick={() => toggleCat(c)} style={{
                    padding: "16px 18px", borderRadius: 11, cursor: "pointer",
                    border: `2px solid ${sel ? "#a3e635" : "oklch(30% 0.01 250)"}`,
                    background: sel ? "rgba(163,230,53,0.08)" : "oklch(21% 0.012 250)",
                    transition: "all 0.15s",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: sel ? "#a3e635" : "#e2e8f0", fontFamily: "Space Grotesk, sans-serif" }}>{c}</span>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${sel ? "#a3e635" : "oklch(34% 0.01 250)"}`, background: sel ? "#a3e635" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#0a0f0a", fontWeight: 800 }}>
                        {sel ? "✓" : ""}
                      </div>
                    </div>
                    {sel && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 5 }}>Cupo</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {[8, 12, 16, 24].map(n => (
                            <button key={n} onClick={e => { e.stopPropagation(); setCupo(c, n); }} style={{
                              padding: "3px 9px", borderRadius: 6, border: "1px solid",
                              borderColor: (form.cupos[c] || 16) === n ? "#a3e635" : "oklch(32% 0.01 250)",
                              background: (form.cupos[c] || 16) === n ? "rgba(163,230,53,0.2)" : "transparent",
                              color: (form.cupos[c] || 16) === n ? "#a3e635" : "#64748b",
                              fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                            }}>{n}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {form.categorias.length > 0 && (
              <div style={{ marginTop: 16, padding: 12, borderRadius: 9, background: "rgba(163,230,53,0.07)", border: "1px solid rgba(163,230,53,0.2)", fontSize: 13, color: "#64748b" }}>
                ✓ {form.categorias.length} categoría{form.categorias.length > 1 ? "s" : ""} seleccionada{form.categorias.length > 1 ? "s" : ""}: <strong style={{ color: "#a3e635" }}>{form.categorias.join(", ")}</strong>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Formato */}
        {step === 3 && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            <div style={{ marginBottom: 18, fontSize: 13, color: "#475569" }}>Definí el formato de competencia para cada categoría</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {form.categorias.map(cat => (
                <Card key={cat} style={{ padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", fontFamily: "Space Grotesk, sans-serif", marginBottom: 3 }}>{cat}</div>
                      <div style={{ fontSize: 12, color: "#475569" }}>{form.cupos[cat] || 16} parejas</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {FORMATOS.map(f => (
                        <button key={f.value} onClick={() => setFormato(cat, f.value)} style={{
                          padding: "8px 16px", borderRadius: 8, border: "1px solid",
                          borderColor: (form.formatos[cat] || "groups_playoff") === f.value ? "#a3e635" : "oklch(30% 0.01 250)",
                          background: (form.formatos[cat] || "groups_playoff") === f.value ? "rgba(163,230,53,0.12)" : "transparent",
                          color: (form.formatos[cat] || "groups_playoff") === f.value ? "#a3e635" : "#64748b",
                          fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        }}>{f.label}</button>
                      ))}
                    </div>
                  </div>
                  {(form.formatos[cat] || "groups_playoff") === "groups_playoff" && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid oklch(26% 0.01 250)", display: "flex", gap: 20 }}>
                      {[
                        { label: "Grupos de", val: "4 equipos" },
                        { label: "Clasifican", val: "2 por grupo" },
                        { label: "Playoff", val: "Eliminación simple" },
                      ].map(d => (
                        <div key={d.label}>
                          <div style={{ fontSize: 10, color: "#475569", marginBottom: 2 }}>{d.label}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>{d.val}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Inscripciones */}
        {step === 4 && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            <div style={{ marginBottom: 18, fontSize: 13, color: "#475569" }}>Configurá cómo se gestionan las inscripciones</div>
            {[
              { key: "aprobacionManual", label: "Aprobación manual", desc: "El organizador aprueba cada inscripción antes de confirmarla" },
              { key: "listaEspera", label: "Lista de espera automática", desc: "Al llenarse el cupo, los jugadores quedan en lista de espera" },
              { key: "avanceAutomatico", label: "Avance automático de llaves", desc: "Al cargar resultado, la llave avanza sin intervención manual" },
              { key: "publicarAlCrear", label: "Publicar al crear", desc: "El torneo queda visible en el portal público inmediatamente" },
            ].map(opt => (
              <div key={opt.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", marginBottom: 10, borderRadius: 10, background: "oklch(21% 0.012 250)", border: "1px solid oklch(28% 0.01 250)" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 3 }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: "#475569" }}>{opt.desc}</div>
                </div>
                <WToggle value={form[opt.key]} onChange={v => setF(opt.key)(v)} />
              </div>
            ))}
          </div>
        )}

        {/* Step 5: Confirmación */}
        {step === 5 && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            <div style={{ marginBottom: 18, fontSize: 13, color: "#475569" }}>Revisá el resumen antes de crear el torneo</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Card>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Datos generales</div>
                {[
                  { label: "Nombre", value: form.nombre || "—" },
                  { label: "Sede", value: form.sede },
                  { label: "Inicio", value: form.fechaInicio || "—" },
                  { label: "Cierre", value: form.fechaFin || "—" },
                ].map(d => (
                  <div key={d.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "#475569" }}>{d.label}</span>
                    <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>{d.value}</span>
                  </div>
                ))}
              </Card>
              <Card>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Categorías ({form.categorias.length})</div>
                {form.categorias.map(c => (
                  <div key={c} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>{c}</span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>{form.cupos[c] || 16} · {(form.formatos[c] || "groups_playoff") === "groups_playoff" ? "Grupos+PO" : "Elim. simple"}</span>
                  </div>
                ))}
              </Card>
              <Card style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Configuración</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  {[
                    { label: "Aprobación manual", value: form.aprobacionManual },
                    { label: "Lista de espera", value: form.listaEspera },
                    { label: "Avance automático", value: form.avanceAutomatico },
                    { label: "Publicar al crear", value: form.publicarAlCrear },
                  ].map(opt => (
                    <div key={opt.label} style={{ padding: "10px 12px", borderRadius: 8, background: opt.value ? "rgba(163,230,53,0.08)" : "oklch(22% 0.012 250)", border: `1px solid ${opt.value ? "rgba(163,230,53,0.2)" : "oklch(28% 0.01 250)"}` }}>
                      <div style={{ fontSize: 11, color: opt.value ? "#a3e635" : "#475569", fontWeight: 700, marginBottom: 3 }}>{opt.value ? "✓ Sí" : "✕ No"}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{opt.label}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "16px 28px", borderTop: "1px solid oklch(24% 0.01 250)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "#334155" }}>Paso {step} de {STEPS.length}</span>
        <div style={{ display: "flex", gap: 10 }}>
          {step > 1 && <Btn variant="ghost" onClick={() => setStep(s => s - 1)}>← Anterior</Btn>}
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          {step < STEPS.length
            ? <Btn onClick={() => setStep(s => s + 1)} disabled={!canNext()}>Siguiente →</Btn>
            : <Btn onClick={handleCreate}>🏆 Crear torneo</Btn>
          }
        </div>
      </div>
    </Overlay>
  );
};

// ─── JUGADORES VIEW (full CRUD) ────────────────────────────────────────────────
const JugadoresView = () => {
  const [players, setPlayers] = useC(PLAYERS_DATA.map((p, i) => ({ ...p, id: i + 1 })));
  const [search, setSearch] = useC("");
  const [categoriaFilter, setCategoriaFilter] = useC("todas");
  const [selectedPlayer, setSelectedPlayer] = useC(null);
  const [modal, setModal] = useC(null); // null | {mode: 'create'|'edit', player}
  const [deleteConfirm, setDeleteConfirm] = useC(null);
  const [toast, setToast] = useC(null);

  const categorias = ["todas", "Masculino A", "Masculino B", "Femenino A", "Mixto B"];

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = players.filter(p => {
    const matchSearch = search === "" || p.nombre.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoriaFilter === "todas" || p.categorias.includes(categoriaFilter);
    return matchSearch && matchCat;
  });

  const handleSave = (form) => {
    if (modal.mode === "create") {
      const newP = { ...form, id: Date.now(), avatar: form.nombre.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase(), torneos: 0, victorias: 0, derrotas: 0, puntos: 0, ranking: {}, historial: [], activo: true, fechaRegistro: new Date().toISOString().split("T")[0] };
      setPlayers(ps => [...ps, newP]);
      showToast(`Jugador ${form.nombre} creado correctamente`);
    } else {
      setPlayers(ps => ps.map(p => p.id === modal.player.id ? { ...p, ...form } : p));
      if (selectedPlayer?.id === modal.player.id) setSelectedPlayer(p => ({ ...p, ...form }));
      showToast(`Cambios guardados`);
    }
    setModal(null);
  };

  const handleDelete = () => {
    setPlayers(ps => ps.filter(p => p.id !== deleteConfirm.id));
    if (selectedPlayer?.id === deleteConfirm.id) setSelectedPlayer(null);
    showToast(`Jugador eliminado`, "danger");
    setDeleteConfirm(null);
  };

  return (
    <div style={{ display: "flex", gap: 20, height: "calc(100vh - 130px)", position: "relative" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          padding: "12px 20px", borderRadius: 10, zIndex: 3000,
          background: toast.type === "danger" ? "rgba(248,113,113,0.15)" : "rgba(163,230,53,0.15)",
          border: `1px solid ${toast.type === "danger" ? "rgba(248,113,113,0.4)" : "rgba(163,230,53,0.4)"}`,
          color: toast.type === "danger" ? "#f87171" : "#a3e635",
          fontSize: 13, fontWeight: 600, backdropFilter: "blur(8px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          animation: "fadeIn 0.2s ease",
        }}>
          {toast.type === "danger" ? "🗑" : "✓"} {toast.msg}
        </div>
      )}

      {/* Modals */}
      {modal && <JugadorModal mode={modal.mode} player={modal.player} onSave={handleSave} onClose={() => setModal(null)} />}
      {deleteConfirm && <DeleteConfirmModal player={deleteConfirm} onConfirm={handleDelete} onClose={() => setDeleteConfirm(null)} />}

      {/* Left: list */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: "#f1f5f9" }}>
            Jugadores <span style={{ fontSize: 14, fontWeight: 400, color: "#475569", marginLeft: 6 }}>{filtered.length} encontrados</span>
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" small>↑ Importar CSV</Btn>
            <Btn small onClick={() => setModal({ mode: "create", player: null })}>+ Nuevo jugador</Btn>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o email..."
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

        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#334155" }}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>🔍</div>
              <div style={{ fontSize: 14, marginBottom: 8 }}>No se encontraron jugadores</div>
              <Btn small onClick={() => setModal({ mode: "create", player: null })}>+ Crear jugador</Btn>
            </div>
          ) : filtered.map(p => (
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
                <Avatar initials={p.avatar || p.nombre.slice(0,2).toUpperCase()} size={34} color={p.ranking && Object.values(p.ranking)[0] === 1 ? "#a3e635" : "#60a5fa"} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{p.nombre}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{p.email}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {(p.categorias || []).map(c => (
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

      {/* Right: profile panel */}
      {selectedPlayer ? (
        <PlayerProfileFull
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          onEdit={() => setModal({ mode: "edit", player: selectedPlayer })}
          onDelete={() => setDeleteConfirm(selectedPlayer)}
        />
      ) : (
        <div style={{ width: 300, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ textAlign: "center", color: "#334155" }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>👤</div>
            <div style={{ fontSize: 13, marginBottom: 12 }}>Seleccioná un jugador<br />para ver su perfil</div>
            <Btn small onClick={() => setModal({ mode: "create", player: null })}>+ Nuevo jugador</Btn>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PLAYER PROFILE (full, with actions) ─────────────────────────────────────
const PlayerProfileFull = ({ player, onClose, onEdit, onDelete }) => {
  const winRate = player.victorias + player.derrotas > 0
    ? Math.round(player.victorias / (player.victorias + player.derrotas) * 100)
    : 0;

  return (
    <div style={{ width: 310, flexShrink: 0, background: "oklch(17% 0.014 250)", border: "1px solid oklch(28% 0.01 250)", borderRadius: 14, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid oklch(24% 0.01 250)", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "oklch(24% 0.01 250)", border: "none", color: "#64748b", width: 26, height: 26, borderRadius: 7, cursor: "pointer", fontSize: 12 }}>✕</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Avatar initials={player.avatar || player.nombre.slice(0,2).toUpperCase()} size={48} color="#a3e635" />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", fontFamily: "Space Grotesk, sans-serif" }}>{player.nombre}</div>
            <div style={{ fontSize: 11, color: "#475569" }}>{player.email}</div>
            <div style={{ fontSize: 11, color: "#475569" }}>{player.telefono}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {player.ranking && Object.entries(player.ranking).map(([cat, pos]) => (
            <span key={cat} style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: pos === 1 ? "rgba(163,230,53,0.15)" : "oklch(23% 0.01 250)", border: `1px solid ${pos === 1 ? "rgba(163,230,53,0.3)" : "oklch(30% 0.01 250)"}`, color: pos === 1 ? "#a3e635" : "#64748b" }}>
              #{pos} {cat}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "14px 16px", borderBottom: "1px solid oklch(24% 0.01 250)", gap: 1 }}>
        {[
          { label: "Torneos", value: player.torneos, color: "#60a5fa" },
          { label: "Victorias", value: player.victorias, color: "#a3e635" },
          { label: "Puntos", value: player.puntos, color: "#f1f5f9" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "Space Grotesk, sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "12px 16px", borderBottom: "1px solid oklch(24% 0.01 250)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>Ratio victorias</span>
          <span style={{ fontSize: 11, color: "#a3e635", fontWeight: 700 }}>{winRate}%</span>
        </div>
        <div style={{ height: 5, background: "oklch(25% 0.01 250)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", background: "#a3e635", borderRadius: 4, width: `${winRate}%` }} />
        </div>
      </div>

      <div style={{ padding: "12px 16px", borderBottom: "1px solid oklch(24% 0.01 250)" }}>
        {[
          { label: "Sede", value: player.sede },
          { label: "Registro", value: player.fechaRegistro },
          { label: "Categorías", value: (player.categorias || []).join(", ") || "—" },
          { label: "Notas", value: player.notas || "—" },
        ].map(f => (
          <div key={f.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
            <span style={{ fontSize: 12, color: "#475569", flexShrink: 0 }}>{f.label}</span>
            <span style={{ fontSize: 12, color: "#94a3b8", textAlign: "right", maxWidth: 180 }}>{f.value}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: "12px 16px", flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Historial</div>
        {(player.historial || []).length === 0 ? (
          <div style={{ fontSize: 12, color: "#334155", textAlign: "center", padding: "16px 0" }}>Sin historial aún</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {(player.historial || []).map((h, i) => (
              <div key={i} style={{ padding: "9px 11px", background: "oklch(21% 0.012 250)", borderRadius: 8, border: "1px solid oklch(26% 0.01 250)" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", marginBottom: 3 }}>{h.torneo}</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#475569" }}>{h.categoria}</span>
                  <span style={{ fontSize: 11, color: h.resultado?.includes("🏆") ? "#a3e635" : "#64748b", fontWeight: h.resultado?.includes("🏆") ? 700 : 400 }}>{h.resultado}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "14px 16px", borderTop: "1px solid oklch(24% 0.01 250)", display: "flex", gap: 8 }}>
        <Btn small variant="ghost" onClick={onEdit} style={{ flex: 1 }}>✏ Editar</Btn>
        <Btn small variant="danger" onClick={onDelete}>🗑</Btn>
      </div>
    </div>
  );
};

// Export — JugadoresView overrides the version from padel-views2.jsx
Object.assign(window, { TorneoWizard, JugadoresView });
