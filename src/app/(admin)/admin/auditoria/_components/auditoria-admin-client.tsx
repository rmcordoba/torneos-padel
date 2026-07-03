"use client";

import { useState, useMemo } from "react";

export type AuditEntry = {
  id: string;
  createdAt: string;
  userName: string;
  userEmail: string;
  organizerName: string | null;
  entity: string;
  entityId: string;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ipAddress: string | null;
  tournamentName: string | null;
};

// ─── Metadata ─────────────────────────────────────────────────────────────────

const ENTITY_LABEL: Record<string, string> = {
  Match: "Partido", Registration: "Inscripción", Tournament: "Torneo",
  TournamentCategory: "Cat. torneo", Venue: "Sede", Court: "Cancha",
  Category: "Categoría", Organizer: "Organización",
};

const ENTITY_ICON: Record<string, string> = {
  Match: "⚽", Registration: "📋", Tournament: "🏆",
  TournamentCategory: "🏷", Venue: "🏟", Court: "🎾",
  Category: "🏷", Organizer: "⚙",
};

const ACTION_LABEL: Record<string, string> = {
  CREATE: "Creación", UPDATE: "Modificación", DELETE: "Eliminación",
  PUBLISH: "Publicación", APPROVE: "Aprobación", REJECT: "Rechazo",
  CANCEL: "Cancelación", RESULT_RECORDED: "Resultado cargado", RESULT_MODIFIED: "Resultado editado",
};

const ACTION_COLOR: Record<string, string> = {
  CREATE: "#a3e635", UPDATE: "#94a3b8", DELETE: "#f87171",
  PUBLISH: "#a78bfa", APPROVE: "#34d399", REJECT: "#f87171",
  CANCEL: "#fb923c", RESULT_RECORDED: "#a3e635", RESULT_MODIFIED: "#fbbf24",
};

const ENTITY_GROUP: Record<string, string> = {
  Match: "partido", Registration: "inscripcion",
  Tournament: "torneo", TournamentCategory: "torneo",
  Venue: "sede", Court: "sede",
  Category: "config", Organizer: "config",
};

const GROUP_FILTERS = [
  { id: "todas",       label: "Todas"          },
  { id: "partido",     label: "Partidos"       },
  { id: "inscripcion", label: "Inscripciones"  },
  { id: "torneo",      label: "Torneos"        },
  { id: "sede",        label: "Sedes"          },
  { id: "config",      label: "Config"         },
];

const DIST_ITEMS = [
  { id: "partido",     label: "Partidos",      color: "#a3e635" },
  { id: "inscripcion", label: "Inscripciones", color: "#34d399" },
  { id: "torneo",      label: "Torneos",       color: "#fbbf24" },
  { id: "sede",        label: "Sedes",         color: "#fb923c" },
  { id: "config",      label: "Config",        color: "#a78bfa" },
];

const PER_PAGE = 15;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGroup(entity: string) { return ENTITY_GROUP[entity] ?? "config"; }
function getColor(action: string) { return ACTION_COLOR[action] ?? "#64748b"; }
function getIcon(entity: string)  { return ENTITY_ICON[entity] ?? "•"; }

function buildDetail(e: AuditEntry): string {
  const after  = (e.after  ?? {}) as Record<string, unknown>;
  const before = (e.before ?? {}) as Record<string, unknown>;
  const label  = ENTITY_LABEL[e.entity] ?? e.entity;
  const name   = (after.name ?? before.name) as string | undefined;

  switch (e.action) {
    case "CREATE":
      return name ? `${label}: "${name}"` : `${label} creado/a`;
    case "UPDATE": {
      const changed = Object.keys(after).filter(k => !["name","id","updatedAt","createdAt"].includes(k));
      return name
        ? (changed.length > 0 ? `${name} — ${changed.slice(0, 2).join(", ")}` : `${name} actualizado/a`)
        : `${label} actualizado/a`;
    }
    case "DELETE":
      return name ? `"${name}" eliminado/a` : `${label} eliminado/a`;
    case "APPROVE": return `${label} aprobada`;
    case "REJECT":  return `${label} rechazada`;
    case "PUBLISH": return name ? `"${name}" publicado/a` : `${label} publicado/a`;
    case "CANCEL":  return `${label} cancelada`;
    case "RESULT_RECORDED": return "Resultado registrado";
    case "RESULT_MODIFIED":  return "Resultado modificado";
    default: return label;
  }
}

function isoTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function dateKey(iso: string) { return iso.slice(0, 10); }

function dateLabel(key: string): string {
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (key === today)     return "Hoy";
  if (key === yesterday) return "Ayer";
  const [y, m, d] = key.split("-");
  const MONTHS = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  return `${parseInt(d)} de ${MONTHS[parseInt(m)]} ${y}`;
}

function exportCSV(entries: AuditEntry[]) {
  const headers = ["Fecha","Hora","Usuario","Email","Organizador","Entidad","Acción","Detalle","Torneo","IP"];
  const rows = entries.map((e) => [
    e.createdAt.slice(0, 10),
    isoTime(e.createdAt),
    e.userName,
    e.userEmail,
    e.organizerName ?? "—",
    ENTITY_LABEL[e.entity] ?? e.entity,
    ACTION_LABEL[e.action] ?? e.action,
    buildDetail(e),
    e.tournamentName ?? "—",
    e.ipAddress ?? "—",
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `auditoria-global-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AuditRow({
  entry, isSelected, onClick,
}: {
  entry: AuditEntry; isSelected: boolean; onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const color  = getColor(entry.action);
  const icon   = getIcon(entry.entity);
  const detail = buildDetail(entry);
  const actionLabel = ACTION_LABEL[entry.action] ?? entry.action;
  const initials = entry.userName.slice(0, 2).toUpperCase();

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid", gridTemplateColumns: "48px 1fr auto",
        alignItems: "stretch", cursor: "pointer", overflow: "hidden",
        borderRadius: 10, transition: "all .12s",
        background: isSelected ? "rgba(163,230,53,.07)" : hover ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${isSelected ? "rgba(163,230,53,.3)" : hover ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)"}`,
      }}
    >
      {/* Icon */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: `${color}12`, borderRight: `1px solid ${color}22`, padding: "12px 0" }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
      </div>

      {/* Content */}
      <div style={{ padding: "11px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color }}>{actionLabel}</span>
          <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, background: "rgba(255,255,255,0.05)", color: "#64748b", fontWeight: 700 }}>
            {initials} · {entry.userName.split("@")[0]}
          </span>
          {entry.organizerName && (
            <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, background: "rgba(96,165,250,.1)", color: "#60a5fa" }}>
              {entry.organizerName}
            </span>
          )}
          {entry.tournamentName && (
            <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, background: "rgba(251,191,36,.1)", color: "#fbbf24" }}>
              {entry.tournamentName}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>{detail}</div>
      </div>

      {/* Timestamp */}
      <div style={{ padding: "11px 14px", display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", gap: 4, minWidth: 78 }}>
        <span style={{ fontSize: 11, color: "#334155", fontFamily: "var(--font-space), sans-serif" }}>{isoTime(entry.createdAt)}</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.13)" }}>{ENTITY_LABEL[entry.entity] ?? entry.entity}</span>
      </div>
    </div>
  );
}

function LogDetailPanel({ entry, onClose }: { entry: AuditEntry; onClose: () => void }) {
  const color       = getColor(entry.action);
  const icon        = getIcon(entry.entity);
  const actionLabel = ACTION_LABEL[entry.action] ?? entry.action;
  const [y, m, d]   = entry.createdAt.slice(0, 10).split("-");
  const MONTHS      = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  return (
    <div style={{ background: "rgba(12,20,40,0.7)", border: `1px solid ${color}30`, borderRadius: 13, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "14px 18px", background: `${color}0c`, borderBottom: `1px solid ${color}20`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}20`, border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color }}>{actionLabel}</div>
            <div style={{ fontSize: 10, color: "#334155" }}>#{entry.id.slice(0, 10)}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b", cursor: "pointer", fontSize: 11 }}
        >
          ✕
        </button>
      </div>

      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Detail string */}
        <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Detalle</div>
          <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.5 }}>{buildDetail(entry)}</div>
        </div>

        {/* Fields */}
        {[
          { label: "Fecha y hora",  value: `${parseInt(d)} ${MONTHS[parseInt(m)]} ${y} · ${isoTime(entry.createdAt)}` },
          { label: "Usuario",       value: entry.userName },
          { label: "Email",         value: entry.userEmail },
          { label: "Organizador",   value: entry.organizerName ?? "—" },
          { label: "Entidad",       value: ENTITY_LABEL[entry.entity] ?? entry.entity },
          { label: "Acción",        value: actionLabel },
          { label: "Torneo",        value: entry.tournamentName ?? "—" },
          { label: "IP",            value: entry.ipAddress ?? "—" },
        ].map((f) => (
          <div key={f.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "#334155", flexShrink: 0 }}>{f.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textAlign: "right", maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {f.value}
            </span>
          </div>
        ))}

        {/* Before / After JSON */}
        {(entry.before || entry.after) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            {entry.before && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Antes</div>
                <pre style={{ fontSize: 11, color: "#f87171", background: "rgba(248,113,113,.05)", border: "1px solid rgba(248,113,113,.15)", borderRadius: 8, padding: "8px 10px", overflowX: "auto", margin: 0, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(entry.before, null, 2)}
                </pre>
              </div>
            )}
            {entry.after && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Después</div>
                <pre style={{ fontSize: 11, color: "#a3e635", background: "rgba(163,230,53,.05)", border: "1px solid rgba(163,230,53,.15)", borderRadius: 8, padding: "8px 10px", overflowX: "auto", margin: 0, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(entry.after, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivitySummary({ entries }: { entries: AuditEntry[] }) {
  const total  = entries.length;
  const counts = Object.fromEntries(DIST_ITEMS.map((i) => [i.id, 0]));
  entries.forEach((e) => {
    const g = getGroup(e.entity);
    if (g in counts) counts[g]++;
  });
  const activeItems = DIST_ITEMS.filter((i) => counts[i.id] > 0);

  return (
    <div style={{ background: "rgba(12,20,40,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 13, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>
        Distribución de eventos
      </div>

      {/* Stacked bar */}
      <div style={{ display: "flex", height: 8, borderRadius: 8, overflow: "hidden", marginBottom: 16, background: "rgba(255,255,255,0.05)" }}>
        {activeItems.map((i) => (
          <div key={i.id} style={{ width: `${(counts[i.id] / total) * 100}%`, background: i.color, flexShrink: 0 }} />
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {activeItems.map((i) => (
          <div key={i.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: i.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#64748b" }}>{i.label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 60, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                <div style={{ width: `${(counts[i.id] / total) * 100}%`, height: "100%", background: i.color, borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: i.color, fontFamily: "var(--font-space), sans-serif", minWidth: 24, textAlign: "right" }}>{counts[i.id]}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", fontSize: 11, color: "#334155" }}>
        <span>Total de eventos</span>
        <span style={{ fontWeight: 800, color: "#64748b", fontFamily: "var(--font-space), sans-serif" }}>{total}</span>
      </div>

      <div style={{ marginTop: 6, fontSize: 11, color: "rgba(255,255,255,0.13)", textAlign: "center" }}>
        Seleccioná una fila para ver el detalle
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AuditoriaAdminClient({ entries }: { entries: AuditEntry[] }) {
  const [search,       setSearch]       = useState("");
  const [filterGroup,  setFilterGroup]  = useState("todas");
  const [filterAction, setFilterAction] = useState("todas");
  const [filterOrg,    setFilterOrg]    = useState("todas");
  const [selected,     setSelected]     = useState<AuditEntry | null>(null);
  const [page,         setPage]         = useState(0);

  // ── Org list for filter ───────────────────────────────────────────────────
  const orgOptions = useMemo(() => {
    const names = Array.from(new Set(entries.map((e) => e.organizerName).filter(Boolean))) as string[];
    return names.sort();
  }, [entries]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const todayKey   = new Date().toISOString().slice(0, 10);
  const todayCount = useMemo(() => entries.filter((e) => e.createdAt.slice(0, 10) === todayKey).length, [entries, todayKey]);
  const matchCount  = useMemo(() => entries.filter((e) => e.entity === "Match").length, [entries]);
  const regCount    = useMemo(() => entries.filter((e) => e.entity === "Registration").length, [entries]);
  const activeOrgs  = useMemo(
    () => new Set(entries.filter((e) => e.createdAt.slice(0, 10) === todayKey).map((e) => e.organizerName).filter(Boolean)).size,
    [entries, todayKey]
  );

  // ── Filter ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return entries.filter((e) => {
      if (q && !e.userName.toLowerCase().includes(q) && !e.userEmail.toLowerCase().includes(q) &&
          !buildDetail(e).toLowerCase().includes(q) && !(ENTITY_LABEL[e.entity] ?? e.entity).toLowerCase().includes(q) &&
          !(e.organizerName ?? "").toLowerCase().includes(q)) return false;
      if (filterGroup  !== "todas" && getGroup(e.entity) !== filterGroup)  return false;
      if (filterAction !== "todas" && e.action           !== filterAction)  return false;
      if (filterOrg    !== "todas" && e.organizerName    !== filterOrg)     return false;
      return true;
    });
  }, [entries, search, filterGroup, filterAction, filterOrg]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged      = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const grouped = useMemo(() => {
    const map = new Map<string, AuditEntry[]>();
    for (const e of paged) {
      const k = dateKey(e.createdAt);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    }
    return map;
  }, [paged]);

  const resetPage = () => setPage(0);

  const A = "#a3e635";

  return (
    <div style={{ maxWidth: 1100, display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 22, fontWeight: 700, color: "#f8fafc", marginBottom: 4 }}>
            Auditoría global
          </h1>
          <p style={{ fontSize: 13, color: "#64748b" }}>Todas las acciones del sistema · {entries.length} registros</p>
        </div>
        <button
          onClick={() => exportCSV(filtered)}
          style={{ padding: "9px 18px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}
        >
          ↓ Exportar CSV
        </button>
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Eventos hoy",    value: todayCount, sub: "últimas 24h",    color: A,         icon: "📋" },
          { label: "Resultados",     value: matchCount, sub: "entidad partido", color: "#60a5fa", icon: "⚽" },
          { label: "Inscripciones",  value: regCount,   sub: "acciones",        color: "#fbbf24", icon: "📝" },
          { label: "Orgs activas",   value: activeOrgs, sub: "hoy",             color: "#a78bfa", icon: "🏢" },
        ].map((s) => (
          <div key={s.label} style={{ background: "rgba(12,20,40,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 13, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: `${s.color}18`, border: `1px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{s.label}</div>
              <div style={{ fontSize: 10, color: "#334155" }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 2-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start" }}>

        {/* ── Left: log ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Filters */}
          <div style={{ background: "rgba(12,20,40,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 13, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                placeholder="Buscar — usuario, organizador, detalle…"
                style={{ width: "100%", boxSizing: "border-box", padding: "9px 14px 9px 36px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, color: "#e2e8f0", fontFamily: "inherit", fontSize: 13, outline: "none" }}
              />
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#334155", fontSize: 14 }}>🔍</span>
            </div>

            {/* Group pills */}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
              {GROUP_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setFilterGroup(f.id); resetPage(); }}
                  style={{ padding: "5px 12px", borderRadius: 20, border: "1px solid", fontFamily: "inherit", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all .1s",
                    borderColor: filterGroup === f.id ? "rgba(163,230,53,.4)" : "rgba(255,255,255,0.08)",
                    background:  filterGroup === f.id ? "rgba(163,230,53,.12)" : "transparent",
                    color:       filterGroup === f.id ? A : "#334155",
                  }}
                >
                  {f.label}
                </button>
              ))}

              <div style={{ flex: 1 }} />

              {/* Org select */}
              {orgOptions.length > 1 && (
                <select
                  value={filterOrg}
                  onChange={(e) => { setFilterOrg(e.target.value); resetPage(); }}
                  style={{ padding: "6px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#64748b", fontFamily: "inherit", fontSize: 12, outline: "none", cursor: "pointer" }}
                >
                  <option value="todas">Todos los organizadores</option>
                  {orgOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              )}

              {/* Action select */}
              <select
                value={filterAction}
                onChange={(e) => { setFilterAction(e.target.value); resetPage(); }}
                style={{ padding: "6px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#64748b", fontFamily: "inherit", fontSize: 12, outline: "none", cursor: "pointer" }}
              >
                <option value="todas">Todas las acciones</option>
                {Object.entries(ACTION_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: 11, color: "#334155" }}>
              {filtered.length} evento{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
              {filtered.length !== entries.length && (
                <span style={{ color: "rgba(255,255,255,0.16)" }}> de {entries.length} totales</span>
              )}
            </div>
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div style={{ padding: "60px 0", textAlign: "center", background: "rgba(12,20,40,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>🛡</div>
              <p style={{ fontSize: 14, color: "#64748b" }}>Sin registros de auditoría</p>
              <p style={{ fontSize: 12, color: "#334155", marginTop: 4 }}>
                {entries.length === 0 ? "Las acciones del sistema quedarán registradas aquí." : "Probá cambiando los filtros."}
              </p>
            </div>
          )}

          {/* Log entries grouped by date */}
          {Array.from(grouped.entries()).map(([dk, dayEntries]) => (
            <div key={dk}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {dateLabel(dk)}
                </span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
                <span style={{ fontSize: 10, color: "#334155" }}>{dayEntries.length} evento{dayEntries.length !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {dayEntries.map((e) => (
                  <AuditRow
                    key={e.id}
                    entry={e}
                    isSelected={selected?.id === e.id}
                    onClick={() => setSelected(selected?.id === e.id ? null : e)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, padding: "8px 0" }}>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: page === 0 ? "#334155" : "#64748b", cursor: page === 0 ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: 12 }}
              >
                ← Anterior
              </button>

              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                const p = totalPages <= 7 ? i : i < 3 ? i : i === 3 ? page : page + i - 3;
                if (p >= totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid", fontFamily: "var(--font-space), sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer",
                      borderColor: page === p ? "rgba(163,230,53,.4)" : "rgba(255,255,255,0.08)",
                      background:  page === p ? "rgba(163,230,53,.12)" : "rgba(255,255,255,0.04)",
                      color:       page === p ? A : "#64748b",
                    }}
                  >
                    {p + 1}
                  </button>
                );
              })}

              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: page === totalPages - 1 ? "#334155" : "#64748b", cursor: page === totalPages - 1 ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: 12 }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>

        {/* ── Right panel ────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "sticky", top: 20 }}>
          {selected ? (
            <LogDetailPanel entry={selected} onClose={() => setSelected(null)} />
          ) : (
            <ActivitySummary entries={entries} />
          )}

          {/* Orgs activas hoy */}
          <div style={{ background: "rgba(12,20,40,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 13, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>
              Organizadores activos hoy
            </div>
            {(() => {
              const todayEntries = entries.filter((e) => e.createdAt.slice(0, 10) === todayKey);
              const orgMap = new Map<string, { count: number; lastAt: string }>();
              for (const e of todayEntries) {
                const key = e.organizerName ?? "Sin organización";
                const existing = orgMap.get(key);
                orgMap.set(key, {
                  count: (existing?.count ?? 0) + 1,
                  lastAt: existing ? (e.createdAt > existing.lastAt ? e.createdAt : existing.lastAt) : e.createdAt,
                });
              }
              const orgs = Array.from(orgMap.entries())
                .map(([name, v]) => ({ name, ...v }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

              if (orgs.length === 0) {
                return <p style={{ fontSize: 12, color: "#334155", textAlign: "center", padding: "12px 0" }}>Sin actividad hoy</p>;
              }

              return orgs.map((o) => {
                const initials = o.name.slice(0, 2).toUpperCase();
                const minsAgo  = Math.floor((Date.now() - new Date(o.lastAt).getTime()) / 60000);
                const lastStr  = minsAgo < 60 ? `hace ${minsAgo}m` : `hace ${Math.floor(minsAgo / 60)}h`;
                return (
                  <div key={o.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 9, border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(96,165,250,.12)", border: "1px solid rgba(96,165,250,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#60a5fa", fontFamily: "var(--font-space), sans-serif", flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.name}</div>
                      <div style={{ fontSize: 10, color: "#334155" }}>{lastStr}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#64748b", fontFamily: "var(--font-space), sans-serif" }}>{o.count}</div>
                      <div style={{ fontSize: 9, color: "#334155" }}>acciones</div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
