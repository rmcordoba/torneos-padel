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
    <div style={{ maxWidth: 920, display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Breadcrumb */}
      <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        <Link href="/dashboard/torneos" style={{ display: "flex", alignItems: "center", gap: 4, color: "#475569", textDecoration: "none" }}>
          <ChevronLeft size={14} /> Torneos
        </Link>
        <span style={{ color: "#334155" }}>/</span>
        <span style={{ fontWeight: 700, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tournament.name}</span>
      </nav>

      {/* Hero */}
      <div style={{
        borderRadius: 18,
        border: `1px solid ${st.color}33`,
        padding: "30px 32px",
        position: "relative", overflow: "hidden",
        background: `linear-gradient(135deg, ${st.color}1f 0%, rgba(10,18,38,0.85) 45%)`,
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
      }}>
        {/* SVG court bg */}
        <svg style={{ position: "absolute", right: -20, bottom: -10, height: "120%", opacity: 0.08 }} viewBox="0 0 400 200" fill="none">
          <rect x="20" y="20" width="360" height="160" stroke={st.color} strokeWidth="2" />
          <line x1="20" y1="100" x2="380" y2="100" stroke={st.color} strokeWidth="3" />
          <line x1="20" y1="62" x2="380" y2="62" stroke={st.color} strokeWidth="1" />
          <line x1="20" y1="138" x2="380" y2="138" stroke={st.color} strokeWidth="1" />
          <line x1="200" y1="62" x2="200" y2="138" stroke={st.color} strokeWidth="1" />
        </svg>

        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: "4px 11px", borderRadius: 7,
                  background: st.color, color: "#080e1a",
                  letterSpacing: "0.04em", textTransform: "uppercase",
                  display: "inline-flex", alignItems: "center", gap: 5,
                }}>
                  {tournament.status === "IN_PROGRESS" && <span className="vib-dot" style={{ width: 5, height: 5, borderRadius: "50%", background: "#080e1a" }} />}
                  {STATUS_LABEL[tournament.status]}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: tournament.isPublic ? "#a3e635" : "#475569" }}>
                  {tournament.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                  {tournament.isPublic ? "Público" : "Privado"}
                </span>
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 900, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif", letterSpacing: "-0.02em", lineHeight: 1.1 }}>{tournament.name}</h1>
              {tournament.description && (
                <p style={{ fontSize: 13, color: "#64748b", marginTop: 8, maxWidth: 480 }}>{tournament.description}</p>
              )}
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 12, fontWeight: 600, textTransform: "capitalize", display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={13} color={st.color} /> {startFmt} → {endFmt}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <StatusActions tournamentId={tournament.id} status={tournament.status as TournamentStatus} />
              <Link href={`/dashboard/torneos/${tournament.id}/editar`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 14px", borderRadius: 9, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#cbd5e1", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                <Settings2 size={13} /> Editar
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Categorías */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: "#f8fafc", marginBottom: 14, display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-space), sans-serif" }}>
          <Users size={16} color="#a3e635" /> Categorías
          <span style={{ fontSize: 12, fontWeight: 700, color: "#a3e635", background: "rgba(163,230,53,0.1)", border: "1px solid rgba(163,230,53,0.22)", padding: "2px 9px", borderRadius: 100 }}>
            {tournament.categories.length}
          </span>
        </h2>

        {tournament.categories.length === 0 ? (
          <div style={{ borderRadius: 18, border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", padding: "48px 24px", textAlign: "center" }}>
            <Users size={36} color="#334155" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: 13, color: "#475569" }}>Sin categorías configuradas.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
            {tournament.categories.map((tc, ci) => {
              const cst = STATUS_STYLE[tc.status] ?? STATUS_STYLE.DRAFT;
              return (
                <div key={tc.id} className={`vib-in card-d${Math.min(ci, 5)}`} style={{
                  background: "rgba(12,20,40,0.7)",
                  backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                  borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)",
                  overflow: "hidden",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                }}>
                  {/* Header — clickable to inscripciones */}
                  <Link href={`/dashboard/torneos/${tournament.id}/categorias/${tc.id}`} style={{
                    display: "block", padding: "16px 18px", textDecoration: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    background: `linear-gradient(135deg, ${cst.color}14 0%, transparent 60%)`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 11, background: `${cst.color}1f`, border: `1px solid ${cst.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Trophy size={17} color={cst.color} />
                        </div>
                        <div>
                          <p style={{ fontSize: 15, fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif" }}>{tc.category.name}</p>
                          <p style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{FORMAT_LABEL[tc.format] ?? tc.format}</p>
                        </div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 9px", borderRadius: 7, background: cst.bg, color: cst.color, border: `1px solid ${cst.color}44`, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        {STATUS_LABEL[tc.status] ?? tc.status}
                      </span>
                    </div>
                  </Link>

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {[
                      { icon: <Users size={13} />, label: "Cupo", val: `${tc.maxTeams}`, color: "#38bdf8" },
                      { icon: <Swords size={13} />, label: "Sets×Games", val: `${tc.setsPerMatch}×${tc.gamesPerSet}`, color: "#a78bfa" },
                      { icon: <BarChart2 size={13} />, label: "Precio", val: tc.pricePerTeam ? `$${tc.pricePerTeam}` : "Gratis", color: "#a3e635" },
                    ].map((s, i) => (
                      <div key={i} style={{ padding: "12px", textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                        <div style={{ display: "flex", justifyContent: "center", color: s.color, marginBottom: 4, opacity: 0.7 }}>{s.icon}</div>
                        <p className="vib-score" style={{ fontSize: 16, color: "#f1f5f9" }}>{s.val}</p>
                        <p style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 3, fontWeight: 700 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", padding: "12px", gap: 8 }}>
                    {[
                      { href: `/dashboard/torneos/${tournament.id}/categorias/${tc.id}`, icon: <ClipboardList size={13} />, label: "Inscripciones" },
                      { href: `/dashboard/torneos/${tournament.id}/categorias/${tc.id}/fixture`, icon: <Swords size={13} />, label: "Fixture" },
                      { href: "/dashboard/calendario", icon: <Calendar size={13} />, label: "Agenda" },
                    ].map((a) => (
                      <Link key={a.label} href={a.href} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#94a3b8", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
                        {a.icon} {a.label}
                      </Link>
                    ))}
                  </div>

                  {/* Secondary actions: edit + delete */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 12px 12px", gap: 6 }}>
                    <Link
                      href={`/dashboard/torneos/${tournament.id}/categorias/${tc.id}/editar`}
                      title="Editar categoría"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 11px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.07)", background: "transparent", color: "#64748b", fontSize: 11, fontWeight: 700, textDecoration: "none" }}
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
