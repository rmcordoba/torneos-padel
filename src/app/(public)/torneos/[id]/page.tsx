import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicTournament } from "@/modules/public/queries";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Torneo — PádelPro" };

const MAX = 1140;
const G   = "#16a34a";

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED:            "Próximamente",
  REGISTRATION_OPEN:    "Inscripciones abiertas",
  REGISTRATION_CLOSED:  "Inscripciones cerradas",
  IN_PROGRESS:          "En curso",
  COMPLETED:            "Finalizado",
};
const STATUS_STYLE: Record<string, { bg: string; color: string; dot?: boolean }> = {
  PUBLISHED:            { bg: "#dbeafe", color: "#2563eb" },
  REGISTRATION_OPEN:    { bg: "#dbeafe", color: "#2563eb" },
  REGISTRATION_CLOSED:  { bg: "#fef9c3", color: "#92400e" },
  IN_PROGRESS:          { bg: "#dcfce7", color: G, dot: true },
  COMPLETED:            { bg: "#f1f5f9", color: "#94a3b8" },
};
const FORMAT_LABEL: Record<string, string> = {
  SINGLE_ELIMINATION: "Eliminación directa",
  GROUP_PLAYOFF:      "Grupos + Playoff",
  DOUBLE_ELIMINATION: "Doble eliminación",
  ROUND_ROBIN:        "Liga",
  AMERICANO:          "Americano",
  MEXICANO:           "Mexicano",
};
const FORMAT_COLOR: Record<string, string> = {
  SINGLE_ELIMINATION: "#3b82f6",
  GROUP_PLAYOFF:      "#8b5cf6",
  DOUBLE_ELIMINATION: "#f97316",
  ROUND_ROBIN:        "#14b8a6",
  AMERICANO:          "#7c3aed",
  MEXICANO:           "#ec4899",
};
const CAT_STATUS: Record<string, { bg: string; color: string }> = {
  DRAFT:              { bg: "#f1f5f9", color: "#94a3b8" },
  REGISTRATION_OPEN:  { bg: "#dbeafe", color: "#2563eb" },
  REGISTRATION_CLOSED:{ bg: "#fef9c3", color: "#92400e" },
  SEEDING:            { bg: "#fef9c3", color: "#92400e" },
  IN_PROGRESS:        { bg: "#dcfce7", color: G },
  COMPLETED:          { bg: "#f1f5f9", color: "#64748b" },
  CANCELLED:          { bg: "#fee2e2", color: "#dc2626" },
};
const CAT_STATUS_LABEL: Record<string, string> = {
  DRAFT:              "Borrador",
  REGISTRATION_OPEN:  "Abierta",
  REGISTRATION_CLOSED:"Cerrada",
  SEEDING:            "Clasificación",
  IN_PROGRESS:        "En curso",
  COMPLETED:          "Finalizada",
  CANCELLED:          "Cancelada",
};

export default async function PublicTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }     = await params;
  const tournament = await getPublicTournament(id);
  if (!tournament) notFound();

  const startFmt = new Date(tournament.startDate).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const endFmt   = new Date(tournament.endDate).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

  const s = STATUS_STYLE[tournament.status] ?? { bg: "#f1f5f9", color: "#64748b" };
  const registrationOpen = tournament.status === "REGISTRATION_OPEN";
  const isCompleted      = tournament.status === "COMPLETED";

  return (
    <div>
      {/* ── Hero ── */}
      <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #0f172a, #1a2744 65%, #14532d)", paddingTop: 36 }}>
        <div style={{ position: "relative", maxWidth: MAX, margin: "0 auto", padding: "0 24px" }}>
          {/* Breadcrumb */}
          <Link href="/torneos" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#64748b", textDecoration: "none", marginBottom: 12 }}>
            ← Volver a torneos
          </Link>

          {/* Status + dates */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", padding: "4px 10px", borderRadius: 20, background: s.bg + "22", color: s.color }}>
              {s.dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block", animation: "pulse 1.4s infinite" }} />}
              {STATUS_LABEL[tournament.status] ?? tournament.status}
            </span>
            <span style={{ fontSize: 12, color: "#64748b", textTransform: "capitalize" }}>{startFmt} → {endFmt}</span>
          </div>

          {/* Title + CTA */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", fontFamily: "Space Grotesk, sans-serif", marginBottom: 4, lineHeight: 1.1 }}>
                {tournament.name}
              </h1>
              {tournament.description && (
                <p style={{ color: "#94a3b8", fontSize: 14, maxWidth: 520 }}>{tournament.description}</p>
              )}
              <p style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>📍 {tournament.organizer.name}</p>
            </div>
            {registrationOpen && tournament.categories.length > 0 && (
              <Link
                href={`/torneos/${id}/categorias/${tournament.categories[0].id}`}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 40, padding: "0 20px", borderRadius: 12, background: G, color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", boxShadow: "0 2px 12px rgba(22,163,74,.35)", flexShrink: 0 }}
              >
                ✍ Pre-inscribirse
              </Link>
            )}
          </div>

          {/* Tab */}
          <div style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,0.08)", margin: "0 -24px", padding: "0 24px" }}>
            <span style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#a3e635", borderBottom: "2px solid #a3e635", marginBottom: -1 }}>
              Información
            </span>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: MAX, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>

          {/* Main: categories */}
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              👥 Categorías
            </h2>

            {tournament.categories.length === 0 ? (
              <div style={{ borderRadius: 16, border: "2px dashed #e2e8f0", background: "#fff", padding: "40px 0", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#94a3b8" }}>Sin categorías publicadas.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {tournament.categories.map((tc) => {
                  const cs       = CAT_STATUS[tc.status] ?? { bg: "#f1f5f9", color: "#94a3b8" };
                  const fColor   = FORMAT_COLOR[tc.format] ?? "#64748b";
                  const canRegister = tc.status === "REGISTRATION_OPEN" && registrationOpen;
                  return (
                    <Link
                      key={tc.id}
                      href={`/torneos/${id}/categorias/${tc.id}`}
                      style={{ display: "block", borderRadius: 14, border: "1px solid #e2e8f0", background: "#fff", padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", textDecoration: "none", transition: "box-shadow .15s, transform .15s" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif" }}>
                          {tc.category.name}
                        </h3>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", padding: "2px 8px", borderRadius: 20, background: cs.bg, color: cs.color }}>
                          {CAT_STATUS_LABEL[tc.status] ?? tc.status}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: fColor, marginBottom: 12 }}>
                        ⎇ {FORMAT_LABEL[tc.format] ?? tc.format}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "#94a3b8" }}>{tc.maxTeams} parejas · cupo</span>
                        <span style={{ fontWeight: 700, color: canRegister ? G : "#cbd5e1" }}>
                          {canRegister ? "Inscribirse →" : "Ver →"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Info card */}
            <div style={{ borderRadius: 16, background: "#fff", border: "1px solid #e2e8f0", padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>
                Información
              </div>
              {[
                { icon: "📅", label: "Inicio",       value: new Date(tournament.startDate).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) },
                { icon: "🏁", label: "Cierre",       value: endFmt },
                { icon: "📍", label: "Organizador",  value: tournament.organizer.name },
                { icon: "🏷", label: "Categorías",   value: `${tournament.categories.length} categoría${tournament.categories.length !== 1 ? "s" : ""}` },
              ].map((f) => (
                <div key={f.label} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 2 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>{f.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA card */}
            {registrationOpen && (
              <div style={{ borderRadius: 16, border: "1px solid #bbf7d0", padding: 20, background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif", marginBottom: 6 }}>
                  ¿Querés participar?
                </div>
                <p style={{ fontSize: 12, color: "#15803d", lineHeight: 1.6, marginBottom: 16 }}>
                  Mandá tu solicitud de inscripción. El organizador la confirma en 24–48hs.
                </p>
                {tournament.categories.length > 0 && (
                  <Link
                    href={`/torneos/${id}/categorias/${tournament.categories[0].id}`}
                    style={{ display: "flex", width: "100%", height: 40, alignItems: "center", justifyContent: "center", borderRadius: 12, background: G, color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}
                  >
                    ✍ Pre-inscribirse
                  </Link>
                )}
              </div>
            )}

            {/* Completed notice */}
            {isCompleted && (
              <div style={{ borderRadius: 16, background: "#fff", border: "1px solid #e2e8f0", padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
                  Torneo finalizado
                </div>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
                  Consultá los cuadros y resultados finales en cada categoría.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
