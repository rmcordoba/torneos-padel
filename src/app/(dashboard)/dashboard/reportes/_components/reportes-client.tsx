"use client";

import { useState, useRef, useCallback, Fragment } from "react";

/* ── design tokens ── */
const A   = "#a3e635";
const C   = { bg: "#1a1f2d", border: "#2d3347" };
const HDR = "#202536";
const ROW = "#262c3e";
const T   = { hi: "#f1f5f9", md: "#94a3b8", lo: "#64748b", xlo: "#475569" };

/* ── types ── */
export type RegistrationRow = {
  tournamentId: string;
  tournamentName: string;
  categoryName: string;
  tournamentCategoryId: string;
  total: number;
  approved: number;
  pending: number;
  rejected: number;
};

export type MatchRow = {
  tournamentId: string;
  tournamentName: string;
  categoryName: string;
  stageName: string;
  stageType: string;
  total: number;
  played: number;
  pending: number;
};

export type ChampionRow = {
  tournamentName: string;
  categoryName: string;
  startDate: string;
  endDate: string;
  champions: string[];
  format: string;
};

/* ── micro components ── */

function DataRow({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...style,
        background: hover ? "#242a3b" : "transparent",
        boxShadow: hover ? "inset 3px 0 0 rgba(163,230,53,.45)" : "inset 3px 0 0 transparent",
        transition: "background .1s, box-shadow .1s",
      }}
    >
      {children}
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: string }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 13, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: T.lo, marginTop: 3, fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  );
}

function StatusNum({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 14, fontWeight: 800, color, fontFamily: "var(--font-space), sans-serif" }}>{value}</span>
    </div>
  );
}

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const clr = pct === 100 ? A : pct > 50 ? "#60a5fa" : "#fbbf24";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: "#2b3145", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: clr, borderRadius: 3, transition: "width .3s" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: clr, minWidth: 34, textAlign: "right", fontFamily: "var(--font-space), sans-serif" }}>{pct}%</span>
    </div>
  );
}

function DownloadCsvBtn({ type }: { type: string }) {
  return (
    <a
      href={`/api/reportes/csv?type=${type}`}
      download
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "7px 16px", borderRadius: 8,
        background: "rgba(163,230,53,.1)", color: A,
        border: "1px solid rgba(163,230,53,.3)",
        textDecoration: "none", fontSize: 12, fontWeight: 700,
        fontFamily: "inherit", flexShrink: 0,
      }}
    >
      ↓ CSV
    </a>
  );
}

function DownloadPdfBtn({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "7px 16px", borderRadius: 8,
        background: "rgba(96,165,250,.1)", color: "#60a5fa",
        border: "1px solid rgba(96,165,250,.3)",
        fontSize: 12, fontWeight: 700,
        fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.65 : 1, flexShrink: 0,
      }}
    >
      {loading ? (
        <>
          <span style={{ width: 10, height: 10, border: "2px solid #60a5fa", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
          Generando…
        </>
      ) : (
        "↓ PDF"
      )}
    </button>
  );
}

function TableContainer({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,.25)" }}>
      {children}
    </div>
  );
}

function ColHeader({ cols, templateCols }: { cols: React.ReactNode[]; templateCols: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: templateCols, alignItems: "center", padding: "11px 20px", background: HDR, borderBottom: `1px solid ${C.border}` }}>
      {cols.map((h, i) => (
        <span key={i} style={{ fontSize: 10, fontWeight: 700, color: T.xlo, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</span>
      ))}
    </div>
  );
}

function TournamentGroupRow({ name }: { name: string }) {
  return (
    <div style={{ padding: "8px 20px", background: "#222839", borderBottom: `1px solid ${ROW}`, display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 16, height: 1, background: "rgba(163,230,53,.3)", flexShrink: 0, borderRadius: 1 }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: T.xlo, textTransform: "uppercase", letterSpacing: "0.07em" }}>{name}</span>
    </div>
  );
}

function SectionHeader({
  title, count, downloadType, onPdfDownload, pdfLoading,
}: {
  title: string; count: number; downloadType: string;
  onPdfDownload: () => void; pdfLoading: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: HDR, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.hi, fontFamily: "var(--font-space), sans-serif" }}>{title}</span>
        <span style={{ fontSize: 11, color: T.lo }}>{count} registro{count !== 1 ? "s" : ""}</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <DownloadPdfBtn onClick={onPdfDownload} loading={pdfLoading} />
        <DownloadCsvBtn type={downloadType} />
      </div>
    </div>
  );
}

/* ── tabs ── */

function TabInscriptos({ rows, onPdfDownload, pdfLoading }: { rows: RegistrationRow[]; onPdfDownload: () => void; pdfLoading: boolean }) {
  const totalSum    = rows.reduce((s, r) => s + r.total, 0);
  const approvedSum = rows.reduce((s, r) => s + r.approved, 0);
  const pendingSum  = rows.reduce((s, r) => s + r.pending, 0);
  const rejectedSum = rows.reduce((s, r) => s + r.rejected, 0);

  const byTournament = rows.reduce<Record<string, { name: string; rows: RegistrationRow[] }>>((acc, row) => {
    if (!acc[row.tournamentId]) acc[row.tournamentId] = { name: row.tournamentName, rows: [] };
    acc[row.tournamentId].rows.push(row);
    return acc;
  }, {});

  const tkeys = Object.keys(byTournament);
  const COLS  = "2fr 72px 88px 88px 88px 110px";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard label="Total inscriptos"  value={totalSum}    color="#60a5fa" icon="👥" />
        <StatCard label="Aprobados"         value={approvedSum} color={A}       icon="✓"  />
        <StatCard label="Pendientes"        value={pendingSum}  color="#fbbf24" icon="⏳" />
        <StatCard label="Rechazados"        value={rejectedSum} color="#f87171" icon="✕"  />
      </div>

      {tkeys.length === 0 ? (
        <TableContainer>
          <div style={{ padding: "56px 0", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: T.lo }}>Sin inscripciones registradas</p>
          </div>
        </TableContainer>
      ) : (
        <TableContainer>
          <SectionHeader title="Inscriptos por categoría" count={rows.length} downloadType="inscripciones" onPdfDownload={onPdfDownload} pdfLoading={pdfLoading} />
          <ColHeader
            templateCols={COLS}
            cols={["Torneo / Categoría", "Total", "Aprobados", "Pendientes", "Rechazados", "Progreso"]}
          />
          {tkeys.map((tid, tIdx) => {
            const t = byTournament[tid];
            return (
              <Fragment key={tid}>
                <TournamentGroupRow name={t.name} />
                {t.rows.map((row, i) => {
                  const isLast = i === t.rows.length - 1 && tIdx === tkeys.length - 1;
                  return (
                    <DataRow
                      key={row.tournamentCategoryId}
                      style={{ display: "grid", gridTemplateColumns: COLS, alignItems: "center", padding: "13px 20px", borderBottom: isLast ? "none" : `1px solid ${ROW}` }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.hi, paddingLeft: 14 }}>{row.categoryName}</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: T.hi, textAlign: "center", fontFamily: "var(--font-space), sans-serif" }}>{row.total}</span>
                      <StatusNum value={row.approved} color={A} />
                      <StatusNum value={row.pending}  color="#fbbf24" />
                      <StatusNum value={row.rejected} color="#f87171" />
                      <ProgressBar value={row.approved} total={row.total} />
                    </DataRow>
                  );
                })}
              </Fragment>
            );
          })}
          <div style={{ display: "grid", gridTemplateColumns: COLS, alignItems: "center", padding: "12px 20px", borderTop: `1px solid ${C.border}`, background: HDR }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.xlo, textTransform: "uppercase", letterSpacing: "0.07em" }}>Total general</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: T.hi, textAlign: "center", fontFamily: "var(--font-space), sans-serif" }}>{totalSum}</span>
            <StatusNum value={approvedSum} color={A} />
            <StatusNum value={pendingSum}  color="#fbbf24" />
            <StatusNum value={rejectedSum} color="#f87171" />
            <span style={{ fontSize: 11, color: T.lo, fontWeight: 700 }}>
              {totalSum > 0 ? Math.round((approvedSum / totalSum) * 100) : 0}% aprobados
            </span>
          </div>
        </TableContainer>
      )}
    </div>
  );
}

function TabPartidos({ rows, onPdfDownload, pdfLoading }: { rows: MatchRow[]; onPdfDownload: () => void; pdfLoading: boolean }) {
  const totalSum  = rows.reduce((s, r) => s + r.total, 0);
  const playedSum = rows.reduce((s, r) => s + r.played, 0);
  const pendSum   = rows.reduce((s, r) => s + r.pending, 0);
  const pctGlobal = totalSum > 0 ? Math.round((playedSum / totalSum) * 100) : 0;

  const byTournament = rows.reduce<Record<string, { name: string; rows: MatchRow[] }>>((acc, row) => {
    if (!acc[row.tournamentId]) acc[row.tournamentId] = { name: row.tournamentName, rows: [] };
    acc[row.tournamentId].rows.push(row);
    return acc;
  }, {});

  const tkeys = Object.keys(byTournament);
  const COLS  = "2fr 72px 88px 88px 120px";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard label="Total partidos" value={totalSum}         color={T.hi}    icon="🎾" />
        <StatCard label="Jugados"        value={playedSum}        color={A}       icon="✓"  />
        <StatCard label="Pendientes"     value={pendSum}          color="#fbbf24" icon="⏳" />
        <StatCard label="Completado"     value={`${pctGlobal}%`} color="#60a5fa" icon="📊" />
      </div>

      {tkeys.length === 0 ? (
        <TableContainer>
          <div style={{ padding: "56px 0", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: T.lo }}>Sin partidos registrados</p>
          </div>
        </TableContainer>
      ) : (
        <TableContainer>
          <SectionHeader title="Partidos por etapa" count={rows.length} downloadType="partidos" onPdfDownload={onPdfDownload} pdfLoading={pdfLoading} />
          <ColHeader
            templateCols={COLS}
            cols={["Torneo / Etapa", "Total", "Jugados", "Pendientes", "Completado"]}
          />
          {tkeys.map((tid, tIdx) => {
            const t = byTournament[tid];
            return (
              <Fragment key={tid}>
                <TournamentGroupRow name={t.name} />
                {t.rows.map((row, i) => {
                  const isLast = i === t.rows.length - 1 && tIdx === tkeys.length - 1;
                  return (
                    <DataRow
                      key={`${row.tournamentId}-${row.categoryName}-${row.stageName}`}
                      style={{ display: "grid", gridTemplateColumns: COLS, alignItems: "center", padding: "13px 20px", borderBottom: isLast ? "none" : `1px solid ${ROW}` }}
                    >
                      <div style={{ paddingLeft: 14 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.hi }}>{row.categoryName}</span>
                        <span style={{ fontSize: 11, color: T.xlo, margin: "0 6px" }}>·</span>
                        <span style={{ fontSize: 12, color: T.lo }}>{row.stageName}</span>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 800, color: T.hi, textAlign: "center", fontFamily: "var(--font-space), sans-serif" }}>{row.total}</span>
                      <StatusNum value={row.played}  color={A} />
                      <StatusNum value={row.pending} color="#fbbf24" />
                      <ProgressBar value={row.played} total={row.total} />
                    </DataRow>
                  );
                })}
              </Fragment>
            );
          })}
          <div style={{ display: "grid", gridTemplateColumns: COLS, alignItems: "center", padding: "12px 20px", borderTop: `1px solid ${C.border}`, background: HDR }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.xlo, textTransform: "uppercase", letterSpacing: "0.07em" }}>Total general</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: T.hi, textAlign: "center", fontFamily: "var(--font-space), sans-serif" }}>{totalSum}</span>
            <StatusNum value={playedSum} color={A} />
            <StatusNum value={pendSum}   color="#fbbf24" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa" }}>{pctGlobal}% completado</span>
          </div>
        </TableContainer>
      )}
    </div>
  );
}

const FORMAT_LABEL: Record<string, string> = {
  SINGLE_ELIMINATION: "Eliminación directa",
  GROUP_PLAYOFF:      "Grupos + Playoff",
  DOUBLE_ELIMINATION: "Doble eliminación",
  ROUND_ROBIN:        "Liga",
  AMERICANO:          "Americano",
  MEXICANO:           "Mexicano",
};

function TabCampeones({ rows, onPdfDownload, pdfLoading }: { rows: ChampionRow[]; onPdfDownload: () => void; pdfLoading: boolean }) {
  const COLS = "2fr 150px 1fr 90px 120px";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {rows.length === 0 ? (
        <TableContainer>
          <div style={{ padding: "72px 0", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.25 }}>🏆</div>
            <p style={{ fontSize: 14, color: T.lo, fontWeight: 600 }}>Sin torneos completados aún</p>
            <p style={{ fontSize: 12, color: T.xlo, marginTop: 4 }}>Los campeones aparecerán aquí cuando se cierren torneos</p>
          </div>
        </TableContainer>
      ) : (
        <TableContainer>
          <SectionHeader title="Campeones por torneo" count={rows.length} downloadType="campeones" onPdfDownload={onPdfDownload} pdfLoading={pdfLoading} />
          <ColHeader
            templateCols={COLS}
            cols={["Torneo", "Categoría", "Campeones 🏆", "Formato", "Fecha"]}
          />
          {rows.map((r, i) => (
            <DataRow
              key={i}
              style={{ display: "grid", gridTemplateColumns: COLS, alignItems: "center", padding: "15px 20px", borderBottom: i < rows.length - 1 ? `1px solid ${ROW}` : "none" }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: T.hi }}>{r.tournamentName}</span>
              <span style={{ fontSize: 12, color: T.md }}>{r.categoryName}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15 }}>🏆</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24" }}>{r.champions.join(" / ")}</span>
              </div>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 12, background: "rgba(163,230,53,.08)", color: T.md, border: "1px solid #31374c", whiteSpace: "nowrap" }}>
                {FORMAT_LABEL[r.format] ?? r.format}
              </span>
              <span style={{ fontSize: 12, color: T.xlo }}>
                {new Date(r.endDate).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </DataRow>
          ))}
        </TableContainer>
      )}
    </div>
  );
}

/* ── main component ── */

const TABS = [
  { id: "inscriptos", label: "Inscriptos", icon: "👥" },
  { id: "partidos",   label: "Partidos",   icon: "🎾" },
  { id: "campeones",  label: "Campeones",  icon: "🏆" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const PDF_FILENAME: Record<TabId, string> = {
  inscriptos: "reporte-inscriptos",
  partidos:   "reporte-partidos",
  campeones:  "reporte-campeones",
};

export function ReportesClient({
  registrations,
  matches,
  champions,
}: {
  registrations: RegistrationRow[];
  matches: MatchRow[];
  champions: ChampionRow[];
}) {
  const [tab, setTab]           = useState<TabId>("inscriptos");
  const [pdfLoading, setPdfLoading] = useState(false);
  const contentRef              = useRef<HTMLDivElement>(null);

  const counts: Record<TabId, number> = {
    inscriptos: registrations.length,
    partidos:   matches.length,
    campeones:  champions.length,
  };

  const handlePdfDownload = useCallback(async () => {
    if (!contentRef.current || pdfLoading) return;
    setPdfLoading(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const { jsPDF }                = await import("jspdf");

      const el     = contentRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#1a1f2e",
      });

      const imgW = canvas.width  / 2;
      const imgH = canvas.height / 2;

      const pdf = new jsPDF({
        orientation: imgW > imgH ? "landscape" : "portrait",
        unit: "px",
        format: [imgW, imgH],
        compress: true,
      });

      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgW, imgH);
      pdf.save(`${PDF_FILENAME[tab]}.pdf`);
    } finally {
      setPdfLoading(false);
    }
  }, [tab, pdfLoading]);

  return (
    <div style={{ maxWidth: 1020 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: "var(--font-space), sans-serif", color: T.hi }}>
          Reportes
        </h1>
        <p style={{ fontSize: 13, color: T.lo, marginTop: 4 }}>
          Estadísticas y resúmenes de torneos, inscripciones y resultados
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "10px 18px", background: "none", border: "none",
                borderBottom: `2px solid ${active ? A : "transparent"}`,
                color: active ? A : T.lo,
                fontFamily: "inherit", fontSize: 13, fontWeight: 600,
                cursor: "pointer", marginBottom: -1, transition: "all .12s",
              }}
            >
              <span style={{ fontSize: 14 }}>{t.icon}</span>
              {t.label}
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
                background: active ? "rgba(163,230,53,.15)" : "#262c3e",
                color: active ? A : T.xlo,
                fontFamily: "var(--font-space), sans-serif",
              }}>
                {counts[t.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content — wrapped with ref for PDF capture */}
      <div ref={contentRef}>
        {tab === "inscriptos" && <TabInscriptos rows={registrations} onPdfDownload={handlePdfDownload} pdfLoading={pdfLoading} />}
        {tab === "partidos"   && <TabPartidos   rows={matches}       onPdfDownload={handlePdfDownload} pdfLoading={pdfLoading} />}
        {tab === "campeones"  && <TabCampeones  rows={champions}     onPdfDownload={handlePdfDownload} pdfLoading={pdfLoading} />}
      </div>
    </div>
  );
}
