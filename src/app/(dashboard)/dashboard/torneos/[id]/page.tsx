import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getTournamentById } from "@/modules/tournaments/queries";
import { StatusActions } from "./_components/status-actions";
import { DeleteCategoryButton } from "./_components/delete-category-button";
import { ChevronLeft, Trophy, Users, Settings2, ClipboardList, Swords, BarChart2, Globe, Lock, Calendar, Pencil } from "lucide-react";
import type { Metadata } from "next";
import type { TournamentStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Detalle del torneo" };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador", PUBLISHED: "Publicado", REGISTRATION_OPEN: "Inscripciones abiertas",
  REGISTRATION_CLOSED: "Inscripciones cerradas", IN_PROGRESS: "En curso",
  COMPLETED: "Finalizado", CANCELLED: "Cancelado",
};
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  DRAFT:                { bg: "rgba(100,116,139,0.15)", color: "#94a3b8" },
  PUBLISHED:            { bg: "rgba(96,165,250,0.15)",  color: "#60a5fa" },
  REGISTRATION_OPEN:    { bg: "rgba(163,230,53,0.15)",  color: "#a3e635" },
  REGISTRATION_CLOSED:  { bg: "rgba(251,191,36,0.15)",  color: "#fbbf24" },
  IN_PROGRESS:          { bg: "rgba(163,230,53,0.15)",  color: "#a3e635" },
  COMPLETED:            { bg: "rgba(100,116,139,0.15)", color: "#94a3b8" },
  CANCELLED:            { bg: "rgba(248,113,113,0.15)", color: "#f87171" },
};
const FORMAT_LABEL: Record<string, string> = {
  SINGLE_ELIMINATION: "Eliminación directa",
  GROUP_PLAYOFF:      "Grupos + Playoff",
  DOUBLE_ELIMINATION: "Doble eliminación",
  ROUND_ROBIN:        "Liga",
  AMERICANO:          "Americano",
  MEXICANO:           "Mexicano",
};

export default async function TorneoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tournament = await getTournamentById(id);
  if (!tournament) notFound();

  const startFmt = new Date(tournament.startDate).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const endFmt = new Date(tournament.endDate).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
  const st = STATUS_STYLE[tournament.status] ?? STATUS_STYLE.DRAFT;

  return (
    <div style={{ maxWidth: 880, display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Breadcrumb */}
      <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        <Link href="/dashboard/torneos" style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-faint)", textDecoration: "none" }}>
          <ChevronLeft size={14} /> Torneos
        </Link>
        <span style={{ color: "var(--border-strong)" }}>/</span>
        <span style={{ fontWeight: 600, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tournament.name}</span>
      </nav>

      {/* Hero */}
      <div style={{ background: "var(--bg-sidebar)", borderRadius: 12, border: "1px solid var(--border-subtle)", padding: "28px 32px", position: "relative", overflow: "hidden" }}>
        {/* SVG bg */}
        <svg style={{ position: "absolute", right: 0, bottom: 0, height: "100%", opacity: 0.06 }} viewBox="0 0 400 200" fill="none">
          <rect x="20" y="20" width="360" height="160" stroke="var(--accent)" strokeWidth="2" />
          <line x1="20" y1="100" x2="380" y2="100" stroke="var(--accent)" strokeWidth="3" />
          <line x1="20" y1="62" x2="380" y2="62" stroke="var(--accent)" strokeWidth="1" />
          <line x1="20" y1="138" x2="380" y2="138" stroke="var(--accent)" strokeWidth="1" />
          <line x1="200" y1="62" x2="200" y2="138" stroke="var(--accent)" strokeWidth="1" />
        </svg>

        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: st.bg, color: st.color, border: `1px solid ${st.color}44` }}>
                  {STATUS_LABEL[tournament.status]}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: tournament.isPublic ? "var(--accent)" : "var(--text-dimmer)" }}>
                  {tournament.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                  {tournament.isPublic ? "Público" : "Privado"}
                </span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", fontFamily: "Space Grotesk, sans-serif" }}>{tournament.name}</h1>
              {tournament.description && (
                <p style={{ fontSize: 13, color: "var(--text-dimmer)", marginTop: 8, maxWidth: 480 }}>{tournament.description}</p>
              )}
              <p style={{ fontSize: 12, color: "var(--accent)", marginTop: 10, fontWeight: 600, textTransform: "capitalize" }}>
                📅 {startFmt} → {endFmt}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <StatusActions tournamentId={tournament.id} status={tournament.status as TournamentStatus} />
              <Link href={`/dashboard/torneos/${tournament.id}/editar`} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--text-muted)", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                <Settings2 size={13} /> Editar
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Categorías */}
      <div>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, fontFamily: "Space Grotesk, sans-serif" }}>
          <Users size={15} color="var(--accent)" /> Categorías ({tournament.categories.length})
        </h2>

        {tournament.categories.length === 0 ? (
          <div style={{ borderRadius: 12, border: "1px dashed var(--border-strong)", padding: "48px 24px", textAlign: "center" }}>
            <Users size={36} color="var(--border-strong)" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: 13, color: "var(--text-faint)" }}>Sin categorías configuradas.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
            {tournament.categories.map((tc) => {
              const cst = STATUS_STYLE[tc.status] ?? STATUS_STYLE.DRAFT;
              return (
                <div key={tc.id} style={{ background: "var(--bg-surface)", borderRadius: 12, border: "1px solid var(--border-default)", overflow: "hidden" }}>
                  {/* Header — clickable to inscripciones */}
                  <Link href={`/dashboard/torneos/${tournament.id}/categorias/${tc.id}`} style={{ display: "block", padding: "16px 18px", textDecoration: "none", borderBottom: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 9, background: "var(--accent-15)", border: "1px solid var(--accent-30)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Trophy size={16} color="var(--accent)" />
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{tc.category.name}</p>
                          <p style={{ fontSize: 11, color: "var(--text-dimmer)", marginTop: 2 }}>{FORMAT_LABEL[tc.format] ?? tc.format}</p>
                        </div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: cst.bg, color: cst.color, border: `1px solid ${cst.color}44`, whiteSpace: "nowrap" }}>
                        {STATUS_LABEL[tc.status] ?? tc.status}
                      </span>
                    </div>
                  </Link>

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid var(--border-subtle)" }}>
                    {[
                      { icon: <Users size={12} />, label: "Cupo", val: `${tc.maxTeams} par.` },
                      { icon: <Swords size={12} />, label: "Partido", val: `${tc.setsPerMatch}×${tc.gamesPerSet}` },
                      { icon: <BarChart2 size={12} />, label: "Precio", val: tc.pricePerTeam ? `$${tc.pricePerTeam}` : "Gratis" },
                    ].map((s, i) => (
                      <div key={i} style={{ padding: "10px 12px", textAlign: "center", borderRight: i < 2 ? "1px solid var(--border-subtle)" : "none" }}>
                        <div style={{ display: "flex", justifyContent: "center", color: "var(--text-darkest)", marginBottom: 2 }}>{s.icon}</div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>{s.val}</p>
                        <p style={{ fontSize: 10, color: "var(--text-dimmer)" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", padding: "10px 12px", gap: 8 }}>
                    <Link href={`/dashboard/torneos/${tournament.id}/categorias/${tc.id}`} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 0", borderRadius: 7, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-faint)", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                      <ClipboardList size={12} /> Inscripciones
                    </Link>
                    <Link href={`/dashboard/torneos/${tournament.id}/categorias/${tc.id}/fixture`} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 0", borderRadius: 7, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-faint)", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                      <Swords size={12} /> Fixture
                    </Link>
                    <Link href="/dashboard/calendario" style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 0", borderRadius: 7, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-faint)", fontSize: 11, fontWeight: 600, textDecoration: "none" }}>
                      <Calendar size={12} /> Agenda
                    </Link>
                  </div>

                  {/* Secondary actions: edit + delete */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 12px 10px", gap: 6 }}>
                    <Link
                      href={`/dashboard/torneos/${tournament.id}/categorias/${tc.id}/editar`}
                      title="Editar categoría"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border-subtle)", background: "transparent", color: "var(--text-dimmer)", fontSize: 11, fontWeight: 600, textDecoration: "none" }}
                    >
                      <Pencil size={11} /> Editar
                    </Link>
                    <DeleteCategoryButton
                      tournamentCategoryId={tc.id}
                      categoryName={tc.category.name}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
