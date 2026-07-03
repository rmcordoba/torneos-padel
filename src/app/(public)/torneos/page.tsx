import Link from "next/link";
import { getPublicSliderTournaments, getPublicTournamentsPage } from "@/modules/public/queries";
import { scopedOrg, plink, getPortalScope } from "@/lib/portal-scope";
import { TorneosSlider } from "./_components/torneos-slider";
import type { Metadata } from "next";
import type { CSSProperties } from "react";

export const metadata: Metadata = { title: "Torneos — PádelPro" };

const MAX    = 1140;
const ACCENT = "#a3e635";

const FILTER_TABS = [
  { label: "Todos",           value: ""                    },
  { label: "En curso",        value: "IN_PROGRESS"         },
  { label: "Inscripciones",   value: "REGISTRATION_OPEN"   },
  { label: "Cerradas",        value: "REGISTRATION_CLOSED" },
  { label: "Próximamente",    value: "PUBLISHED"           },
  { label: "Finalizados",     value: "COMPLETED"           },
] as const;

const FILTER_LABEL: Record<string, string> = Object.fromEntries(
  FILTER_TABS.map((f) => [f.value, f.label])
);

// Status config: text badge + hero gradient + accent for the card header
const STATUS: Record<string, {
  label:    string;
  color:    string;
  bg:       string;
  border:   string;
  hero:     string;   // gradient for card header zone
  dot?:     boolean;
}> = {
  PUBLISHED: {
    label:  "Próximamente",
    color:  "#a5b4fc",
    bg:     "rgba(99,102,241,0.12)",
    border: "rgba(99,102,241,0.22)",
    hero:   "linear-gradient(135deg, rgba(99,102,241,0.22) 0%, transparent 65%)",
  },
  REGISTRATION_OPEN: {
    label:  "Inscripciones abiertas",
    color:  "#38bdf8",
    bg:     "rgba(56,189,248,0.12)",
    border: "rgba(56,189,248,0.22)",
    hero:   "linear-gradient(135deg, rgba(56,189,248,0.2) 0%, transparent 65%)",
  },
  REGISTRATION_CLOSED: {
    label:  "Inscripciones cerradas",
    color:  "#fb923c",
    bg:     "rgba(249,115,22,0.12)",
    border: "rgba(249,115,22,0.22)",
    hero:   "linear-gradient(135deg, rgba(249,115,22,0.18) 0%, transparent 65%)",
  },
  IN_PROGRESS: {
    label:  "En curso",
    color:  ACCENT,
    bg:     "rgba(163,230,53,0.12)",
    border: "rgba(163,230,53,0.25)",
    hero:   "linear-gradient(135deg, rgba(163,230,53,0.22) 0%, transparent 65%)",
    dot:    true,
  },
  COMPLETED: {
    label:  "Finalizado",
    color:  "#64748b",
    bg:     "rgba(100,116,139,0.10)",
    border: "rgba(100,116,139,0.18)",
    hero:   "linear-gradient(135deg, rgba(100,116,139,0.14) 0%, transparent 65%)",
  },
  CANCELLED: {
    label:  "Cancelado",
    color:  "#f87171",
    bg:     "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.22)",
    hero:   "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, transparent 65%)",
  },
};

const FALLBACK = STATUS.COMPLETED;

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? FALLBACK;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 100, fontSize: 10, fontWeight: 700,
      letterSpacing: "0.05em", textTransform: "uppercase",
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      whiteSpace: "nowrap", flexShrink: 0,
    }}>
      {s.dot && (
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, flexShrink: 0, animation: "pulse-dot 1.5s infinite" }} />
      )}
      {s.label}
    </span>
  );
}

export default async function PublicTorneosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; bienvenido?: string }>;
}) {
  const { q, status, page: pageStr, bienvenido } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1") || 1);

  const organizerId = scopedOrg();
  const [sliderTournaments, { tournaments, total, pageSize }] = await Promise.all([
    getPublicSliderTournaments(organizerId),
    getPublicTournamentsPage({ search: q?.trim(), status: status || undefined, page, organizerId }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  const filterHref = (s: string) => {
    const p = new URLSearchParams();
    if (s) p.set("status", s);
    if (q) p.set("q", q);
    return plink(`/torneos${p.toString() ? `?${p.toString()}` : ""}`);
  };

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    return plink(`/torneos${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const dateFmt = (d: Date | string, short = false) =>
    new Date(d).toLocaleDateString("es-AR", short
      ? { day: "numeric", month: "short" }
      : { day: "numeric", month: "short", year: "numeric" }
    );

  // Pagination ellipsis
  const pageNumbers: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    if (page > 3) pageNumbers.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pageNumbers.push(i);
    if (page < totalPages - 2) pageNumbers.push("…");
    pageNumbers.push(totalPages);
  }

  const btnBase: CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    height: 36, minWidth: 36, padding: "0 12px", borderRadius: 100,
    fontSize: 13, fontWeight: 600, textDecoration: "none",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)", color: "#64748b",
    transition: "all .15s",
  };

  return (
    <div>
      {/* ── Welcome ── */}
      {bienvenido === "1" && (
        <div style={{ background: "rgba(163,230,53,0.08)", borderBottom: "1px solid rgba(163,230,53,0.15)" }}>
          <div style={{ maxWidth: MAX, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>🎾</span>
            <p style={{ fontSize: 13, fontWeight: 600, color: ACCENT }}>¡Bienvenido a PádelPro! Tu cuenta fue creada exitosamente.</p>
          </div>
        </div>
      )}

      {/* ── Hero slider ── */}
      {sliderTournaments.length > 0 && !q && (
        <TorneosSlider tournaments={sliderTournaments} basePath={getPortalScope().basePath} />
      )}

      {/* ── Grid section ── */}
      <div style={{ maxWidth: MAX, margin: "0 auto", padding: "40px 24px" }}>

        {/* Section header */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {!q && (
            <h2 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 20, fontWeight: 800, color: "#f8fafc", flexShrink: 0 }}>
              {status ? (FILTER_LABEL[status] ?? "Torneos") : "Torneos"}
            </h2>
          )}
          <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>
            {q
              ? `${total} resultado${total !== 1 ? "s" : ""} para "${q}"`
              : `${total} torneo${total !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Filter pills */}
        {!q && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
            {FILTER_TABS.map((tab) => {
              const isActive = tab.value === (status ?? "");
              return (
                <Link
                  key={tab.value}
                  href={filterHref(tab.value)}
                  style={{
                    display: "inline-flex", alignItems: "center",
                    padding: "7px 18px", borderRadius: 100, fontSize: 13, fontWeight: 600,
                    textDecoration: "none", transition: "all .15s",
                    background: isActive ? ACCENT : "rgba(255,255,255,0.05)",
                    color: isActive ? "#080e1a" : "#64748b",
                    border: `1px solid ${isActive ? "transparent" : "rgba(255,255,255,0.08)"}`,
                    boxShadow: isActive ? "0 0 20px rgba(163,230,53,0.3)" : "none",
                  }}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {tournaments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.12 }}>🎾</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#64748b", fontFamily: "var(--font-space), sans-serif", marginBottom: 8 }}>Sin torneos</h3>
            <p style={{ fontSize: 14, color: "#475569" }}>
              {status ? "No hay torneos con este estado." : q ? `Sin resultados para "${q}".` : "Los torneos aparecerán aquí cuando sean publicados."}
            </p>
            {status && (
              <Link href={plink("/torneos")} style={{ display: "inline-block", marginTop: 20, fontSize: 13, color: ACCENT, fontWeight: 700, textDecoration: "none" }}>
                ← Ver todos
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20, marginBottom: 40 }}>
            {tournaments.map((t, i) => {
              const s = STATUS[t.status] ?? FALLBACK;
              const delayClass = i < 6 ? `card-d${i}` : "";
              return (
                <Link
                  key={t.id}
                  href={plink(`/torneos/${t.id}`)}
                  className={`t-card card-animate ${delayClass}`}
                >
                  {/* ── Card Header Zone — status color gradient ── */}
                  <div style={{
                    padding: "18px 20px 16px",
                    background: s.hero,
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
                      <StatusBadge status={t.status} />
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", textAlign: "right", lineHeight: 1.3 }}>
                        {t.organizer.name}
                      </span>
                    </div>
                    <h3 style={{
                      fontSize: 18, fontWeight: 800, color: "#f8fafc",
                      fontFamily: "var(--font-space), sans-serif", lineHeight: 1.25,
                    }}>
                      {t.name}
                    </h3>
                  </div>

                  {/* ── Card Body ── */}
                  <div style={{ padding: "14px 20px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
                      <span style={{ color: "#475569" }}>📅</span>
                      <span>{dateFmt(t.startDate, true)} → {dateFmt(t.endDate)}</span>
                    </div>
                  </div>

                  {/* ── Card Footer ── */}
                  <div style={{
                    padding: "12px 20px 18px",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                  }}>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {t.categories.slice(0, 3).map((tc) => (
                        <span key={tc.id} style={{
                          fontSize: 11, padding: "3px 9px", borderRadius: 100,
                          background: "rgba(255,255,255,0.05)",
                          color: "#64748b", border: "1px solid rgba(255,255,255,0.07)",
                        }}>
                          {tc.category.name}
                        </span>
                      ))}
                      {t.categories.length > 3 && (
                        <span style={{ fontSize: 11, color: "#475569", padding: "3px 0" }}>
                          +{t.categories.length - 3}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: s.color, fontWeight: 700, flexShrink: 0 }}>
                      Ver →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
            {page > 1
              ? <Link href={pageHref(page - 1)} style={btnBase}>← Anterior</Link>
              : <span style={{ ...btnBase, opacity: 0.3 }}>← Anterior</span>}

            {pageNumbers.map((n, i) =>
              n === "…"
                ? <span key={`e-${i}`} style={{ color: "#475569", fontSize: 13, padding: "0 4px" }}>…</span>
                : <Link key={n} href={pageHref(n)} style={{
                    ...btnBase,
                    ...(n === page ? { background: ACCENT, color: "#080e1a", border: "none", fontWeight: 800, boxShadow: "0 0 16px rgba(163,230,53,0.35)" } : {}),
                  }}>{n}</Link>
            )}

            {page < totalPages
              ? <Link href={pageHref(page + 1)} style={btnBase}>Siguiente →</Link>
              : <span style={{ ...btnBase, opacity: 0.3 }}>Siguiente →</span>}
          </div>
        )}
      </div>
    </div>
  );
}
