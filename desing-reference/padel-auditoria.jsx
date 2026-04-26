// ─── AUDITORÍA VIEW ───────────────────────────────────────────────────────────

const AUDIT_LOG = [
  // April 25
  { id:1,  ts:"2026-04-25 14:32", user:"Admin", avatar:"AD", role:"admin",       action:"resultado_cargado",    entity:"Partido",       detail:"Torres / Sánchez vs Suárez / Bravo · 6-3, 6-4",          cat:"Masculino A", torneo:"Copa de Verano 2026", ip:"192.168.1.10" },
  { id:2,  ts:"2026-04-25 13:55", user:"Admin", avatar:"AD", role:"admin",       action:"inscripcion_aprobada", entity:"Inscripción",   detail:"Peralta / Gómez — Masculino A",                           cat:"Masculino A", torneo:"Copa de Verano 2026", ip:"192.168.1.10" },
  { id:3,  ts:"2026-04-25 13:40", user:"Sistema", avatar:"SI", role:"sistema",   action:"partido_iniciado",     entity:"Partido",       detail:"Ríos / Vega vs Palma / Leiva — Cancha 3",                 cat:"Masculino A", torneo:"Copa de Verano 2026", ip:"—" },
  { id:4,  ts:"2026-04-25 13:10", user:"Collab01", avatar:"C1", role:"colaborador", action:"horario_editado",   entity:"Calendario",    detail:"Partido q4 movido de 14:00 a 14:30",                      cat:"—",           torneo:"Copa de Verano 2026", ip:"192.168.1.22" },
  { id:5,  ts:"2026-04-25 12:50", user:"Admin", avatar:"AD", role:"admin",       action:"jugador_editado",      entity:"Jugador",       detail:"Torres, Pablo — teléfono actualizado",                     cat:"—",           torneo:"—",                   ip:"192.168.1.10" },
  { id:6,  ts:"2026-04-25 12:20", user:"Sistema", avatar:"SI", role:"sistema",   action:"partido_finalizado",   entity:"Partido",       detail:"Mendez / Acosta vs Peralta / Gómez · 4-6, 7-5, 6-3",     cat:"Masculino A", torneo:"Copa de Verano 2026", ip:"—" },
  { id:7,  ts:"2026-04-25 11:48", user:"Admin", avatar:"AD", role:"admin",       action:"inscripcion_rechazada",entity:"Inscripción",   detail:"Blanco / Costa — Femenino A",                             cat:"Femenino A",  torneo:"Copa de Verano 2026", ip:"192.168.1.10" },
  { id:8,  ts:"2026-04-25 11:15", user:"Collab01", avatar:"C1", role:"colaborador", action:"resultado_cargado", entity:"Partido",       detail:"Torres / Sánchez vs Morales / Herrera · 6-1, 6-2",        cat:"Masculino A", torneo:"Copa de Verano 2026", ip:"192.168.1.22" },
  { id:9,  ts:"2026-04-25 10:30", user:"Sistema", avatar:"SI", role:"sistema",   action:"login",                entity:"Sesión",        detail:"Collab01 inició sesión desde 192.168.1.22",               cat:"—",           torneo:"—",                   ip:"192.168.1.22" },
  { id:10, ts:"2026-04-25 09:50", user:"Admin", avatar:"AD", role:"admin",       action:"categoria_editada",    entity:"Torneo",        detail:"Cupo Masculino A aumentado de 14 a 16",                   cat:"Masculino A", torneo:"Copa de Verano 2026", ip:"192.168.1.10" },
  { id:11, ts:"2026-04-25 09:12", user:"Admin", avatar:"AD", role:"admin",       action:"login",                entity:"Sesión",        detail:"Admin inició sesión desde 192.168.1.10",                  cat:"—",           torneo:"—",                   ip:"192.168.1.10" },
  // April 24
  { id:12, ts:"2026-04-24 18:45", user:"Admin", avatar:"AD", role:"admin",       action:"resultado_cargado",    entity:"Partido",       detail:"Morales / Herrera vs Ibarra / Meza · 6-2, 6-1",           cat:"Masculino A", torneo:"Copa de Verano 2026", ip:"192.168.1.10" },
  { id:13, ts:"2026-04-24 17:20", user:"Collab01", avatar:"C1", role:"colaborador", action:"cancha_asignada",   entity:"Calendario",    detail:"Final Femenino A asignada a Cancha 2",                    cat:"Femenino A",  torneo:"Copa de Verano 2026", ip:"192.168.1.22" },
  { id:14, ts:"2026-04-24 16:00", user:"Sistema", avatar:"SI", role:"sistema",   action:"partido_iniciado",     entity:"Partido",       detail:"Castro / Mendez vs Ortiz / Vargas — Cancha 1",            cat:"Masculino B", torneo:"Copa de Verano 2026", ip:"—" },
  { id:15, ts:"2026-04-24 14:30", user:"Admin", avatar:"AD", role:"admin",       action:"inscripcion_aprobada", entity:"Inscripción",   detail:"Ruiz / Díaz — Femenino A",                                cat:"Femenino A",  torneo:"Copa de Verano 2026", ip:"192.168.1.10" },
  { id:16, ts:"2026-04-24 13:10", user:"Admin", avatar:"AD", role:"admin",       action:"torneo_editado",       entity:"Torneo",        detail:"Torneo Otoño Pro — fecha inicio cambiada a 15 mayo",      cat:"—",           torneo:"Torneo Otoño Pro",    ip:"192.168.1.10" },
  { id:17, ts:"2026-04-24 11:00", user:"Sistema", avatar:"SI", role:"sistema",   action:"recordatorio_enviado", entity:"Notificación",  detail:"Recordatorio enviado a 28 jugadores — partido mañana",    cat:"—",           torneo:"Copa de Verano 2026", ip:"—" },
  { id:18, ts:"2026-04-24 09:30", user:"Admin", avatar:"AD", role:"admin",       action:"jugador_creado",       entity:"Jugador",       detail:"Navarro, Camila — nueva jugadora registrada",             cat:"Femenino A",  torneo:"—",                   ip:"192.168.1.10" },
  // April 23
  { id:19, ts:"2026-04-23 20:15", user:"Admin", avatar:"AD", role:"admin",       action:"resultado_cargado",    entity:"Partido",       detail:"Peralta / Gómez vs Ríos / Vega · 7-5, 4-6, 6-3",         cat:"Masculino A", torneo:"Copa de Verano 2026", ip:"192.168.1.10" },
  { id:20, ts:"2026-04-23 18:40", user:"Collab01", avatar:"C1", role:"colaborador", action:"resultado_cargado", entity:"Partido",       detail:"Suárez / Bravo vs Ibarra / Meza · 6-4, 7-5",             cat:"Masculino A", torneo:"Copa de Verano 2026", ip:"192.168.1.22" },
  { id:21, ts:"2026-04-23 15:00", user:"Admin", avatar:"AD", role:"admin",       action:"inscripcion_aprobada", entity:"Inscripción",   detail:"Rodríguez / Fernández — Femenino A",                      cat:"Femenino A",  torneo:"Copa de Verano 2026", ip:"192.168.1.10" },
  { id:22, ts:"2026-04-23 11:20", user:"Sistema", avatar:"SI", role:"sistema",   action:"backup_generado",      entity:"Sistema",       detail:"Backup automático generado — 2.4 MB",                     cat:"—",           torneo:"—",                   ip:"—" },
  { id:23, ts:"2026-04-22 17:00", user:"Admin", avatar:"AD", role:"admin",       action:"torneo_creado",        entity:"Torneo",        detail:"Torneo Otoño Pro 2026 — creado con 2 categorías",         cat:"—",           torneo:"Torneo Otoño Pro",    ip:"192.168.1.10" },
  { id:24, ts:"2026-04-22 10:30", user:"Admin", avatar:"AD", role:"admin",       action:"jugador_editado",      entity:"Jugador",       detail:"Sánchez, Javier — categoría actualizada a Masculino A",   cat:"Masculino A", torneo:"—",                   ip:"192.168.1.10" },
  { id:25, ts:"2026-04-21 14:00", user:"Sistema", avatar:"SI", role:"sistema",   action:"reporte_generado",     entity:"Reportes",      detail:"Reporte semanal generado y enviado al organizador",       cat:"—",           torneo:"Copa de Verano 2026", ip:"—" },
];

const ACTION_META = {
  resultado_cargado:    { label:"Resultado cargado",    icon:"⚽", color:"#a3e635", group:"partido"      },
  inscripcion_aprobada: { label:"Inscripción aprobada", icon:"✓",  color:"#34d399", group:"inscripcion"  },
  inscripcion_rechazada:{ label:"Inscripción rechazada",icon:"✕",  color:"#f87171", group:"inscripcion"  },
  partido_iniciado:     { label:"Partido iniciado",     icon:"▶",  color:"#fbbf24", group:"partido"      },
  partido_finalizado:   { label:"Partido finalizado",   icon:"■",  color:"#60a5fa", group:"partido"      },
  horario_editado:      { label:"Horario editado",      icon:"⏰", color:"#fb923c", group:"calendario"   },
  cancha_asignada:      { label:"Cancha asignada",      icon:"📍", color:"#fb923c", group:"calendario"   },
  jugador_creado:       { label:"Jugador creado",       icon:"👤", color:"#a78bfa", group:"jugador"      },
  jugador_editado:      { label:"Jugador editado",      icon:"✏",  color:"#a78bfa", group:"jugador"      },
  categoria_editada:    { label:"Categoría editada",    icon:"🏷",  color:"#94a3b8", group:"torneo"       },
  torneo_creado:        { label:"Torneo creado",        icon:"🏆", color:"#fbbf24", group:"torneo"       },
  torneo_editado:       { label:"Torneo editado",       icon:"✏",  color:"#94a3b8", group:"torneo"       },
  login:                { label:"Inicio de sesión",     icon:"🔑", color:"#64748b", group:"sesion"       },
  recordatorio_enviado: { label:"Recordatorio enviado", icon:"📨", color:"#60a5fa", group:"sistema"      },
  backup_generado:      { label:"Backup generado",      icon:"💾", color:"#64748b", group:"sistema"      },
  reporte_generado:     { label:"Reporte generado",     icon:"📋", color:"#94a3b8", group:"sistema"      },
};

const ROLE_META = {
  admin:       { label:"Admin",       color:"#fbbf24", bg:"rgba(251,191,36,.15)"  },
  colaborador: { label:"Colaborador", color:"#60a5fa", bg:"rgba(96,165,250,.15)"  },
  sistema:     { label:"Sistema",     color:"#94a3b8", bg:"rgba(148,163,184,.12)" },
};

const AuditoriaView = () => {
  const { useState: useS, useMemo } = React;

  const [search, setSearch]         = useS("");
  const [filterAction, setFilterAction] = useS("todas");
  const [filterRole, setFilterRole]   = useS("todos");
  const [filterTorneo, setFilterTorneo] = useS("todos");
  const [selectedLog, setSelectedLog]  = useS(null);
  const [page, setPage]               = useS(0);
  const PER_PAGE = 10;

  // Stats
  const todayLogs  = AUDIT_LOG.filter(l => l.ts.startsWith("2026-04-25"));
  const actionGroups = {};
  AUDIT_LOG.forEach(l => {
    const g = ACTION_META[l.action]?.group || "otro";
    actionGroups[g] = (actionGroups[g] || 0) + 1;
  });

  const ACTION_FILTERS = [
    { id:"todas",      label:"Todas"         },
    { id:"partido",    label:"Partidos"      },
    { id:"inscripcion",label:"Inscripciones" },
    { id:"jugador",    label:"Jugadores"     },
    { id:"torneo",     label:"Torneos"       },
    { id:"calendario", label:"Calendario"    },
    { id:"sistema",    label:"Sistema"       },
    { id:"sesion",     label:"Sesiones"      },
  ];

  const TORNEOS = ["todos", "Copa de Verano 2026", "Torneo Otoño Pro", "—"];

  const filtered = useMemo(() => {
    return AUDIT_LOG.filter(l => {
      const meta = ACTION_META[l.action] || {};
      const matchSearch  = !search || l.detail.toLowerCase().includes(search.toLowerCase()) || l.user.toLowerCase().includes(search.toLowerCase()) || l.entity.toLowerCase().includes(search.toLowerCase());
      const matchAction  = filterAction === "todas" || meta.group === filterAction;
      const matchRole    = filterRole === "todos" || l.role === filterRole;
      const matchTorneo  = filterTorneo === "todos" || l.torneo === filterTorneo;
      return matchSearch && matchAction && matchRole && matchTorneo;
    });
  }, [search, filterAction, filterRole, filterTorneo]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  // Group by date
  const grouped = {};
  paged.forEach(l => {
    const date = l.ts.split(" ")[0];
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(l);
  });

  const dateLabel = dateStr => {
    if (dateStr === "2026-04-25") return "Hoy — 25 de abril 2026";
    if (dateStr === "2026-04-24") return "Ayer — 24 de abril 2026";
    const [y, m, d] = dateStr.split("-");
    const MONTHS = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    return `${parseInt(d)} de ${MONTHS[parseInt(m)]} ${y}`;
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"Space Grotesk, sans-serif", fontSize:22, fontWeight:700, color:"#f1f5f9", marginBottom:4 }}>
            Auditoría
          </h1>
          <p style={{ fontSize:13, color:"#475569" }}>Registro completo de actividad del sistema</p>
        </div>
        <button style={{ padding:"9px 18px", borderRadius:9, background:"oklch(22% 0.012 250)", border:"1px solid oklch(30% 0.01 250)", color:"#94a3b8", fontFamily:"inherit", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:7 }}>
          ↓ Exportar CSV
        </button>
      </div>

      {/* Stats strip */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12 }}>
        {[
          { label:"Eventos hoy",     value:todayLogs.length,  sub:"últimas 24h",        color:"#a3e635", icon:"📋" },
          { label:"Resultados",      value:actionGroups.partido||0,   sub:"cargados esta semana", color:"#60a5fa", icon:"⚽" },
          { label:"Inscripciones",   value:actionGroups.inscripcion||0, sub:"acciones",           color:"#fbbf24", icon:"✓"  },
          { label:"Usuarios activos",value:2,                 sub:"hoy",                color:"#a78bfa", icon:"👤" },
        ].map(s => (
          <div key={s.label} style={{ background:"oklch(16% 0.012 250)", border:"1px solid oklch(24% 0.01 250)", borderRadius:13, padding:"16px 18px", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:42, height:42, borderRadius:11, background:`${s.color}15`, border:`1px solid ${s.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontFamily:"Space Grotesk, sans-serif", fontSize:24, fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:11, color:"#64748b", marginTop:3 }}>{s.label}</div>
              <div style={{ fontSize:10, color:"#334155" }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:16 }}>
        {/* Main log */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {/* Filters */}
          <div style={{ background:"oklch(16% 0.012 250)", border:"1px solid oklch(24% 0.01 250)", borderRadius:13, padding:"14px 16px", display:"flex", flexDirection:"column", gap:12 }}>
            {/* Search */}
            <div style={{ position:"relative" }}>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Buscar en el log — usuario, detalle, entidad…"
                style={{ width:"100%", padding:"9px 14px 9px 36px", background:"oklch(20% 0.012 250)", border:"1px solid oklch(28% 0.01 250)", borderRadius:9, color:"#e2e8f0", fontFamily:"inherit", fontSize:13, outline:"none" }}
              />
              <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#334155", fontSize:14 }}>🔍</span>
            </div>
            {/* Filter row */}
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
              {/* Action group */}
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                {ACTION_FILTERS.map(f => (
                  <button key={f.id} onClick={() => { setFilterAction(f.id); setPage(0); }} style={{
                    padding:"5px 12px", borderRadius:20, border:"1px solid",
                    borderColor: filterAction===f.id ? "rgba(163,230,53,.4)" : "oklch(28% 0.01 250)",
                    background: filterAction===f.id ? "rgba(163,230,53,.12)" : "transparent",
                    color: filterAction===f.id ? "#a3e635" : "#475569",
                    fontFamily:"inherit", fontSize:11, fontWeight:600, cursor:"pointer",
                  }}>{f.label}</button>
                ))}
              </div>
              <div style={{ flex:1 }} />
              {/* Role filter */}
              <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(0); }}
                style={{ padding:"6px 12px", background:"oklch(20% 0.012 250)", border:"1px solid oklch(28% 0.01 250)", borderRadius:8, color:"#94a3b8", fontFamily:"inherit", fontSize:12, outline:"none", cursor:"pointer" }}>
                <option value="todos">Todos los roles</option>
                <option value="admin">Admin</option>
                <option value="colaborador">Colaborador</option>
                <option value="sistema">Sistema</option>
              </select>
              {/* Torneo filter */}
              <select value={filterTorneo} onChange={e => { setFilterTorneo(e.target.value); setPage(0); }}
                style={{ padding:"6px 12px", background:"oklch(20% 0.012 250)", border:"1px solid oklch(28% 0.01 250)", borderRadius:8, color:"#94a3b8", fontFamily:"inherit", fontSize:12, outline:"none", cursor:"pointer" }}>
                {TORNEOS.map(t => <option key={t} value={t}>{t === "todos" ? "Todos los torneos" : t === "—" ? "Sin torneo" : t}</option>)}
              </select>
            </div>
            <div style={{ fontSize:11, color:"#334155" }}>
              {filtered.length} evento{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
              {filtered.length !== AUDIT_LOG.length && <span style={{ color:"#475569" }}> de {AUDIT_LOG.length} totales</span>}
            </div>
          </div>

          {/* Log entries grouped by date */}
          {Object.entries(grouped).map(([date, logs]) => (
            <div key={date}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, marginTop:4 }}>
                <span style={{ fontSize:11, fontWeight:700, color:"#334155", textTransform:"uppercase", letterSpacing:"0.08em" }}>
                  {dateLabel(date)}
                </span>
                <div style={{ flex:1, height:1, background:"oklch(22% 0.01 250)" }} />
                <span style={{ fontSize:10, color:"#334155" }}>{logs.length} evento{logs.length!==1?"s":""}</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {logs.map(log => (
                  <AuditRow key={log.id} log={log} isSelected={selectedLog?.id === log.id} onClick={() => setSelectedLog(selectedLog?.id===log.id ? null : log)} />
                ))}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:8, padding:"8px 0" }}>
              <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0}
                style={{ padding:"6px 14px", borderRadius:8, border:"1px solid oklch(28% 0.01 250)", background:"oklch(20% 0.012 250)", color:page===0?"#334155":"#94a3b8", cursor:page===0?"not-allowed":"pointer", fontFamily:"inherit", fontSize:12 }}>
                ← Anterior
              </button>
              {Array.from({length: totalPages}).map((_,i) => (
                <button key={i} onClick={() => setPage(i)}
                  style={{ width:32, height:32, borderRadius:8, border:"1px solid", borderColor:page===i?"rgba(163,230,53,.4)":"oklch(28% 0.01 250)", background:page===i?"rgba(163,230,53,.12)":"oklch(20% 0.012 250)", color:page===i?"#a3e635":"#64748b", cursor:"pointer", fontFamily:"Space Grotesk, sans-serif", fontSize:12, fontWeight:700 }}>
                  {i+1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))} disabled={page===totalPages-1}
                style={{ padding:"6px 14px", borderRadius:8, border:"1px solid oklch(28% 0.01 250)", background:"oklch(20% 0.012 250)", color:page===totalPages-1?"#334155":"#94a3b8", cursor:page===totalPages-1?"not-allowed":"pointer", fontFamily:"inherit", fontSize:12 }}>
                Siguiente →
              </button>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {/* Detail panel */}
          {selectedLog ? (
            <LogDetailPanel log={selectedLog} onClose={() => setSelectedLog(null)} />
          ) : (
            <ActivitySummary logs={AUDIT_LOG} />
          )}

          {/* Active users */}
          <div style={{ background:"oklch(16% 0.012 250)", border:"1px solid oklch(24% 0.01 250)", borderRadius:13, padding:"16px 18px" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:14 }}>Usuarios activos hoy</div>
            {[
              { avatar:"AD", name:"Admin",     role:"admin",       actions:7, last:"hace 2 min",  online:true  },
              { avatar:"C1", name:"Collab01",  role:"colaborador", actions:4, last:"hace 18 min", online:true  },
              { avatar:"SI", name:"Sistema",   role:"sistema",     actions:5, last:"hace 1h",     online:false },
            ].map(u => (
              <div key={u.name} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, padding:"10px 12px", background:"oklch(20% 0.012 250)", borderRadius:9, border:"1px solid oklch(26% 0.01 250)" }}>
                <div style={{ position:"relative" }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:ROLE_META[u.role].bg, border:`1px solid ${ROLE_META[u.role].color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:ROLE_META[u.role].color, fontFamily:"Space Grotesk, sans-serif" }}>{u.avatar}</div>
                  <span style={{ position:"absolute", bottom:-2, right:-2, width:8, height:8, borderRadius:"50%", background:u.online?"#a3e635":"#334155", border:"1.5px solid oklch(20% 0.012 250)" }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#e2e8f0" }}>{u.name}</div>
                  <div style={{ fontSize:10, color:"#334155" }}>{u.last}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:14, fontWeight:800, color:"#64748b", fontFamily:"Space Grotesk, sans-serif" }}>{u.actions}</div>
                  <div style={{ fontSize:9, color:"#334155" }}>acciones</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── AUDIT ROW ────────────────────────────────────────────────────────────────
const AuditRow = ({ log, isSelected, onClick }) => {
  const { useState: useS } = React;
  const [hover, setHover] = useS(false);
  const meta = ACTION_META[log.action] || { label:log.action, icon:"•", color:"#64748b" };
  const roleMeta = ROLE_META[log.role] || ROLE_META.sistema;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display:"grid", gridTemplateColumns:"48px 1fr auto",
        gap:0, alignItems:"stretch",
        background: isSelected ? "rgba(163,230,53,.08)" : hover ? "oklch(20% 0.012 250)" : "oklch(17% 0.012 250)",
        border:`1px solid ${isSelected ? "rgba(163,230,53,.3)" : hover ? "oklch(28% 0.01 250)" : "oklch(22% 0.01 250)"}`,
        borderRadius:10, cursor:"pointer", overflow:"hidden",
        transition:"all .12s",
      }}
    >
      {/* Icon column */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", background:`${meta.color}10`, borderRight:`1px solid ${meta.color}20`, padding:"12px 0" }}>
        <span style={{ fontSize:16 }}>{meta.icon}</span>
      </div>

      {/* Main content */}
      <div style={{ padding:"11px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
          <span style={{ fontSize:12, fontWeight:700, color:meta.color }}>{meta.label}</span>
          <span style={{ fontSize:10, padding:"1px 7px", borderRadius:10, background:roleMeta.bg, color:roleMeta.color, fontWeight:700 }}>{log.user}</span>
          {log.cat !== "—" && (
            <span style={{ fontSize:10, padding:"1px 7px", borderRadius:10, background:"oklch(22% 0.01 250)", color:"#475569" }}>{log.cat}</span>
          )}
        </div>
        <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.4 }}>{log.detail}</div>
      </div>

      {/* Timestamp */}
      <div style={{ padding:"11px 14px", display:"flex", flexDirection:"column", alignItems:"flex-end", justifyContent:"center", gap:4, minWidth:80 }}>
        <span style={{ fontSize:11, color:"#334155", fontFamily:"Space Grotesk, sans-serif" }}>{log.ts.split(" ")[1]}</span>
        <span style={{ fontSize:10, color:"#475569", fontFamily:"Space Grotesk, sans-serif" }}>{log.entity}</span>
      </div>
    </div>
  );
};

// ─── LOG DETAIL PANEL ─────────────────────────────────────────────────────────
const LogDetailPanel = ({ log, onClose }) => {
  const meta = ACTION_META[log.action] || { label:log.action, icon:"•", color:"#64748b" };
  const roleMeta = ROLE_META[log.role] || ROLE_META.sistema;
  const [y, m, d] = log.ts.split(" ")[0].split("-");
  const MONTHS = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  return (
    <div style={{ background:"oklch(16% 0.012 250)", border:`1px solid ${meta.color}30`, borderRadius:13, overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"14px 18px", background:`${meta.color}0d`, borderBottom:`1px solid ${meta.color}20`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:`${meta.color}20`, border:`1px solid ${meta.color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>{meta.icon}</div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:meta.color }}>{meta.label}</div>
            <div style={{ fontSize:10, color:"#475569" }}>#{log.id.toString().padStart(6,"0")}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ width:26, height:26, borderRadius:7, background:"oklch(22% 0.01 250)", border:"1px solid oklch(28% 0.01 250)", color:"#475569", cursor:"pointer", fontSize:11 }}>✕</button>
      </div>

      <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:12 }}>
        {/* Detail */}
        <div style={{ padding:"12px 14px", background:"oklch(20% 0.012 250)", borderRadius:10, border:"1px solid oklch(26% 0.01 250)" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#334155", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:6 }}>Detalle</div>
          <div style={{ fontSize:13, color:"#e2e8f0", lineHeight:1.5 }}>{log.detail}</div>
        </div>

        {/* Fields */}
        {[
          { label:"Fecha y hora", value:`${parseInt(d)} ${MONTHS[parseInt(m)]} ${y} · ${log.ts.split(" ")[1]}` },
          { label:"Usuario",      value:log.user },
          { label:"Rol",          value:log.role, custom: <span style={{ padding:"2px 8px", borderRadius:10, background:roleMeta.bg, color:roleMeta.color, fontSize:11, fontWeight:700 }}>{roleMeta.label}</span> },
          { label:"Entidad",      value:log.entity },
          { label:"Categoría",    value:log.cat !== "—" ? log.cat : "—" },
          { label:"Torneo",       value:log.torneo !== "—" ? log.torneo : "—" },
          { label:"IP",           value:log.ip },
        ].map(f => (
          <div key={f.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:11, color:"#475569" }}>{f.label}</span>
            {f.custom || <span style={{ fontSize:12, fontWeight:600, color:"#94a3b8", textAlign:"right", maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.value}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── ACTIVITY SUMMARY ─────────────────────────────────────────────────────────
const ActivitySummary = ({ logs }) => {
  const counts = {};
  logs.forEach(l => {
    const g = ACTION_META[l.action]?.group || "otro";
    counts[g] = (counts[g] || 0) + 1;
  });
  const total = logs.length;
  const items = [
    { id:"partido",    label:"Partidos",      color:"#a3e635" },
    { id:"inscripcion",label:"Inscripciones", color:"#34d399" },
    { id:"jugador",    label:"Jugadores",     color:"#a78bfa" },
    { id:"torneo",     label:"Torneos",       color:"#fbbf24" },
    { id:"sistema",    label:"Sistema",       color:"#64748b" },
    { id:"sesion",     label:"Sesiones",      color:"#475569" },
  ].filter(i => counts[i.id]);

  return (
    <div style={{ background:"oklch(16% 0.012 250)", border:"1px solid oklch(24% 0.01 250)", borderRadius:13, padding:"16px 18px" }}>
      <div style={{ fontSize:12, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:16 }}>
        Distribución de eventos
      </div>
      {/* Stacked bar */}
      <div style={{ display:"flex", height:8, borderRadius:8, overflow:"hidden", marginBottom:16 }}>
        {items.map(i => (
          <div key={i.id} style={{ width:`${(counts[i.id]/total)*100}%`, background:i.color, flexShrink:0 }} />
        ))}
      </div>
      {items.map(i => (
        <div key={i.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ width:10, height:10, borderRadius:3, background:i.color, flexShrink:0 }} />
            <span style={{ fontSize:12, color:"#94a3b8" }}>{i.label}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:60, height:4, borderRadius:4, background:"oklch(22% 0.01 250)", overflow:"hidden" }}>
              <div style={{ width:`${(counts[i.id]/total)*100}%`, height:"100%", background:i.color, borderRadius:4 }} />
            </div>
            <span style={{ fontSize:12, fontWeight:700, color:i.color, fontFamily:"Space Grotesk, sans-serif", minWidth:24, textAlign:"right" }}>{counts[i.id]}</span>
          </div>
        </div>
      ))}
      <div style={{ marginTop:14, paddingTop:12, borderTop:"1px solid oklch(22% 0.01 250)", display:"flex", justifyContent:"space-between", fontSize:11, color:"#334155" }}>
        <span>Total de eventos</span>
        <span style={{ fontWeight:800, color:"#64748b", fontFamily:"Space Grotesk, sans-serif" }}>{total}</span>
      </div>
      <div style={{ marginTop:6, fontSize:11, color:"#334155", textAlign:"center" }}>
        Seleccioná una fila para ver el detalle
      </div>
    </div>
  );
};

Object.assign(window, { AuditoriaView });
