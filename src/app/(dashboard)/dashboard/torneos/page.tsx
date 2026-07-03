import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getActiveMembership } from "@/lib/active-organizer";
import { listTournamentsByOrganizer } from "@/modules/tournaments/queries";
import { TorneosStatusFilter } from "./_components/torneos-status-filter";
import { Plus, Trophy, Calendar, Users } from "lucide-react";
import type { TournamentStatus } from "@prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Torneos" };

const VALID_STATUSES: TournamentStatus[] = [
  "DRAFT", "PUBLISHED", "REGISTRATION_OPEN", "REGISTRATION_CLOSED",
  "IN_PROGRESS", "COMPLETED", "CANCELLED",
];

const STATUS_LABEL: Record<string, string> = {
  DRAFT:               "Borrador",
  PUBLISHED:           "Publicado",
  REGISTRATION_OPEN:   "Inscripciones abiertas",
  REGISTRATION_CLOSED: "Inscripciones cerradas",
  IN_PROGRESS:         "En curso",
  COMPLETED:           "Finalizado",
  CANCELLED:           "Cancelado",
};

const STATUS_COLOR: Record<string, { bg: string; color: string; border: string }> = {
  DRAFT:               { bg: "rgba(148,163,184,0.12)", color: "#94a3b8", border: "rgba(148,163,184,0.25)" },
  PUBLISHED:           { bg: "rgba(96,165,250,0.12)",  color: "#60a5fa", border: "rgba(96,165,250,0.25)" },
  REGISTRATION_OPEN:   { bg: "rgba(163,230,53,0.12)",  color: "#a3e635", border: "rgba(163,230,53,0.3)"  },
  REGISTRATION_CLOSED: { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24", border: "rgba(251,191,36,0.25)" },
  IN_PROGRESS:         { bg: "rgba(163,230,53,0.15)",  color: "#a3e635", border: "rgba(163,230,53,0.3)"  },
  COMPLETED:           { bg: "rgba(148,163,184,0.12)", color: "#94a3b8", border: "rgba(148,163,184,0.25)" },
  CANCELLED:           { bg: "rgba(248,113,113,0.12)", color: "#f87171", border: "rgba(248,113,113,0.25)" },
};

const PAGE_SIZE = 8;

export default async function TorneosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; pag?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await getActiveMembership(session.user.id);
  if (!membership) redirect("/dashboard");

  const organizer = membership.organizer;

  const { status: statusParam, pag: pagStr } = await searchParams;
  const statusFilter = VALID_STATUSES.includes(statusParam as TournamentStatus)
    ? (statusParam as TournamentStatus)
    : undefined;

  const tournaments = await listTournamentsByOrganizer(organizer.id, statusFilter);

  const totalCount   = tournaments.length;
  const totalPages   = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage  = Math.min(Math.max(1, parseInt(pagStr ?? "1", 10)), totalPages);
  const usePagination = totalCount > PAGE_SIZE;
  const paginated    = usePagination
    ? tournaments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : tournaments;

  // Only used in grouped view (≤ PAGE_SIZE total, no filter)
  const active   = tournaments.filter((t) => ["IN_PROGRESS", "REGISTRATION_OPEN"].includes(t.status));
  const upcoming = tournaments.filter((t) => ["DRAFT", "PUBLISHED", "REGISTRATION_CLOSED"].includes(t.status));
  const past     = tournaments.filter((t) => ["COMPLETED", "CANCELLED"].includes(t.status));

  function pagLink(p: number) {
    const params = new URLSearchParams();
    if (statusParam) params.set("status", statusParam);
    if (p > 1)       params.set("pag", String(p));
    const qs = params.toString();
    return `/dashboard/torneos${qs ? `?${qs}` : ""}`;
  }

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 28, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.02em", lineHeight: 1 }}>
              Torneos
            </h1>
            <span style={{
              fontSize: 11, fontWeight: 700, color: "#a3e635",
              background: "rgba(163,230,53,0.1)", border: "1px solid rgba(163,230,53,0.22)",
              padding: "4px 12px", borderRadius: 100,
            }}>
              {totalCount}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#475569" }}>
            {statusFilter ? `Estado: ${STATUS_LABEL[statusFilter]}` : "Todos tus torneos"}
            {usePagination ? ` · página ${currentPage} de ${totalPages}` : ""}
            {" · "}{organizer.name}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <TorneosStatusFilter current={statusFilter ?? ""} />
          <Link href="/dashboard/torneos/nuevo" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 18px", borderRadius: 10,
            background: "#a3e635", color: "#080e1a",
            fontSize: 13, fontWeight: 800, textDecoration: "none",
            whiteSpace: "nowrap", boxShadow: "0 0 20px rgba(163,230,53,0.3)",
          }}>
            <Plus size={15} /> Nuevo torneo
          </Link>
        </div>
      </div>

      {tournaments.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "80px 40px", borderRadius: 18,
          border: "1px dashed rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.02)", textAlign: "center",
        }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(163,230,53,0.12)", border: "1px solid rgba(163,230,53,0.28)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: "0 0 24px rgba(163,230,53,0.12)" }}>
            <Trophy size={24} color="#a3e635" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#f8fafc", marginBottom: 8, fontFamily: "var(--font-space), sans-serif" }}>
            {statusFilter ? `Sin torneos "${STATUS_LABEL[statusFilter]}"` : "Creá tu primer torneo"}
          </h3>
          <p style={{ fontSize: 13, color: "#475569", maxWidth: 300, marginBottom: 24 }}>
            {statusFilter
              ? "Probá seleccionando otro estado en el filtro."
              : "Gestioná inscripciones, fixtures, resultados y ranking desde un solo lugar."}
          </p>
          {!statusFilter && (
            <Link href="/dashboard/torneos/nuevo" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 22px", borderRadius: 10,
              background: "#a3e635", color: "#080e1a",
              fontSize: 13, fontWeight: 800, textDecoration: "none",
              boxShadow: "0 0 20px rgba(163,230,53,0.3)",
            }}>
              <Plus size={15} /> Crear torneo
            </Link>
          )}
        </div>
      ) : usePagination ? (
        /* Paginated flat list (> PAGE_SIZE total) */
        <>
          <TournamentGroup title="" tournaments={paginated} dotColor="" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {currentPage > 1 ? (
              <Link href={pagLink(currentPage - 1)} style={pagerBtnStyle}>← Anterior</Link>
            ) : (
              <span style={pagerDisabledStyle}>← Anterior</span>
            )}
            <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
              {currentPage} / {totalPages}
            </span>
            {currentPage < totalPages ? (
              <Link href={pagLink(currentPage + 1)} style={pagerBtnStyle}>Siguiente →</Link>
            ) : (
              <span style={pagerDisabledStyle}>Siguiente →</span>
            )}
          </div>
        </>
      ) : statusFilter ? (
        /* Filtered flat list (≤ PAGE_SIZE) */
        <TournamentGroup
          title={STATUS_LABEL[statusFilter]}
          tournaments={tournaments}
          dotColor={STATUS_COLOR[statusFilter]?.color ?? "#94a3b8"}
        />
      ) : (
        /* Default grouped view (≤ PAGE_SIZE, no filter) */
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {active.length > 0 && (
            <TournamentGroup title="En curso · Inscripciones abiertas" tournaments={active} dotColor="#a3e635" />
          )}
          {upcoming.length > 0 && (
            <TournamentGroup title="Próximos" tournaments={upcoming} dotColor="#60a5fa" />
          )}
          {past.length > 0 && (
            <TournamentGroup title="Finalizados" tournaments={past} dotColor="#475569" />
          )}
        </div>
      )}
    </div>
  );
}

const pagerBtnStyle: React.CSSProperties = {
  padding: "8px 16px", borderRadius: 100,
  border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)",
  fontSize: 12, fontWeight: 600, color: "#94a3b8", textDecoration: "none",
  display: "inline-block",
};

const pagerDisabledStyle: React.CSSProperties = {
  padding: "8px 16px", borderRadius: 100,
  border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.02)",
  fontSize: 12, fontWeight: 600, color: "#334155",
  display: "inline-block",
};

function TournamentGroup({
  title,
  tournaments,
  dotColor,
}: {
  title: string;
  tournaments: Awaited<ReturnType<typeof listTournamentsByOrganizer>>;
  dotColor: string;
}) {
  return (
    <div>
      {title && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0, boxShadow: `0 0 8px ${dotColor}` }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {title}
          </span>
          <span style={{ fontSize: 11, color: "#334155" }}>({tournaments.length})</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tournaments.map((t, ti) => {
          const totalPairs = t.categories.reduce((acc, tc) => acc + (tc._count?.registrations ?? 0), 0);
          const sc = STATUS_COLOR[t.status] ?? STATUS_COLOR.DRAFT;
          const isLive = t.status === "IN_PROGRESS";
          const dateStr = new Date(t.startDate).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });

          return (
            <Link
              key={t.id}
              href={`/dashboard/torneos/${t.id}`}
              className={`vib-card vib-in card-d${Math.min(ti, 5)}`}
              style={{
                ["--vib-glow" as string]: `${sc.color}33`,
                position: "relative", overflow: "hidden",
                display: "grid", gridTemplateColumns: "auto 1fr auto",
                alignItems: "center", gap: 16, padding: "16px 18px",
                background: "rgba(12,20,40,0.7)",
                backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.07)",
                textDecoration: "none", cursor: "pointer",
              }}
            >
              {/* Status color bar */}
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: sc.color, boxShadow: `0 0 10px ${sc.color}` }} />

              {/* Avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0, marginLeft: 6,
                background: `${sc.color}1f`, border: `1px solid ${sc.color}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 900, color: sc.color,
                fontFamily: "var(--font-space), sans-serif",
              }}>
                {t.name.slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.name}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 7,
                    background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                    letterSpacing: "0.04em", textTransform: "uppercase", flexShrink: 0,
                    display: "inline-flex", alignItems: "center", gap: 5,
                  }}>
                    {isLive && (
                      <span className="vib-dot" style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: sc.color }} />
                    )}
                    {STATUS_LABEL[t.status]}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "#475569" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Calendar size={12} /> {dateStr}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Trophy size={12} /> {t.categories.length} cat.
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Users size={12} /> {totalPairs} parejas
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <span style={{ color: "#475569", fontSize: 16, marginRight: 4 }}>›</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
