import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicTournament } from "@/modules/public/queries";
import { scopedOrg, plink } from "@/lib/portal-scope";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Torneo — PádelPro" };

const MAX   = 1140;
const ACCENT = "#a3e635";
const ACCENT_BG  = "rgba(163,230,53,0.10)";
const ACCENT_BD  = "rgba(163,230,53,0.22)";
const GLASS      = "rgba(12,22,45,0.65)";
const GLASS_BD   = "rgba(255,255,255,0.08)";

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED:            "Próximamente",
  REGISTRATION_OPEN:    "Inscripciones abiertas",
  REGISTRATION_CLOSED:  "Inscripciones cerradas",
  IN_PROGRESS:          "En curso",
  COMPLETED:            "Finalizado",
};
const STATUS_STYLE: Record<string, { bg: string; color: string; border: string; dot?: boolean }> = {
  PUBLISHED:            { color: "#a5b4fc", bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.2)"  },
  REGISTRATION_OPEN:    { color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.2)"  },
  REGISTRATION_CLOSED:  { color: "#fb923c", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.2)"  },
  IN_PROGRESS:          { color: ACCENT,    bg: ACCENT_BG,                border: ACCENT_BD, dot: true    },
  COMPLETED:            { color: "#64748b", bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.2)" },
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
  SINGLE_ELIMINATION: "#60a5fa",
  GROUP_PLAYOFF:      "#a78bfa",
  DOUBLE_ELIMINATION: "#fb923c",
  ROUND_ROBIN:        "#2dd4bf",
  AMERICANO:          "#818cf8",
  MEXICANO:           "#f472b6",
};
const CAT_STATUS: Record<string, { bg: string; color: string; border: string }> = {
  DRAFT:              { color: "#64748b", bg: "rgba(100,116,139,0.10)", border: "rgba(100,116,139,0.15)" },
  REGISTRATION_OPEN:  { color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  border: "rgba(96,165,250,0.2)"   },
  REGISTRATION_CLOSED:{ color: "#fb923c", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.2)"   },
  SEEDING:            { color: "#fb923c", bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.2)"   },
  IN_PROGRESS:        { color: ACCENT,    bg: ACCENT_BG,                border: ACCENT_BD                },
  COMPLETED:          { color: "#64748b", bg: "rgba(100,116,139,0.10)", border: "rgba(100,116,139,0.15)" },
  CANCELLED:          { color: "#f87171", bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.2)"    },
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
  const tournament = await getPublicTournament(id, scopedOrg());
  if (!tournament) notFound();

  const startFmt = new Date(tournament.startDate).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const endFmt   = new Date(tournament.endDate).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

  const s = STATUS_STYLE[tournament.status] ?? { color: "#64748b", bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.2)" };
  const registrationOpen = tournament.status === "REGISTRATION_OPEN";
  const isCompleted      = tournament.status === "COMPLETED";

  return (
    <div>
      {/* ── Hero ── */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, rgba(6,14,30,0.98) 0%, rgba(10,20,40,0.95) 60%, rgba(8,18,36,0.98) 100%)",
        borderBottom: "1px solid rgba(163,230,53,0.08)",
        paddingTop: 36,
      }}>
        {/* Ambient glow */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(ellipse at 75% 40%, rgba(163,230,53,0.06) 0%, transparent 50%)" }} />

        <div style={{ position: "relative", maxWidth: MAX, margin: "0 auto", padding: "0 24px" }}>
          {/* Breadcrumb */}
          <Link href={plink("/torneos")} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#475569", textDecoration: "none", marginBottom: 12, transition: "color .15s" }}>
            ← Volver a torneos
          </Link>

          {/* Status + dates */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.04em", padding: "4px 10px", borderRadius: 20,
              background: s.bg, color: s.color, border: `1px solid ${s.border}`,
            }}>
              {s.dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block", animation: "pulse-dot 1.5s infinite" }} />}
              {STATUS_LABEL[tournament.status] ?? tournament.status}
            </span>
            <span style={{ fontSize: 12, color: "#475569", textTransform: "capitalize" }}>{startFmt} → {endFmt}</span>
          </div>

          {/* Title + CTA */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
            <div>
              <h1 style={{
                fontSize: 32, fontWeight: 800, color: "#f1f5f9",
                fontFamily: "var(--font-space), sans-serif", marginBottom: 4, lineHeight: 1.1,
                textShadow: "0 0 40px rgba(163,230,53,0.10)",
              }}>
                {tournament.name}
              </h1>
              {tournament.description && (
                <p style={{ color: "#64748b", fontSize: 14, maxWidth: 520 }}>{tournament.description}</p>
              )}
              <p style={{ color: "#475569", fontSize: 13, marginTop: 6 }}>📍 {tournament.organizer.name}</p>
            </div>
            {registrationOpen && tournament.categories.length > 0 && (
              <Link
                href={plink(`/torneos/${id}/categorias/${tournament.categories[0].id}`)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  height: 40, padding: "0 20px", borderRadius: 12,
                  background: ACCENT, color: "#0f172a",
                  fontSize: 13, fontWeight: 800, textDecoration: "none",
                  boxShadow: "0 0 20px rgba(163,230,53,0.3)", flexShrink: 0,
                }}
              >
                ✍ Pre-inscribirse
              </Link>
            )}
          </div>

          {/* Tab strip */}
          <div style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,0.07)", margin: "0 -24px", padding: "0 24px" }}>
            <span style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: ACCENT, borderBottom: `2px solid ${ACCENT}`, marginBottom: -1, textShadow: "0 0 10px rgba(163,230,53,0.4)" }}>
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
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", fontFamily: "var(--font-space), sans-serif", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              👥 Categorías
            </h2>

            {tournament.categories.length === 0 ? (
              <div style={{ borderRadius: 16, border: "2px dashed rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "40px 0", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#475569" }}>Sin categorías publicadas.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {tournament.categories.map((tc) => {
                  const cs        = CAT_STATUS[tc.status] ?? CAT_STATUS.DRAFT;
                  const fColor    = FORMAT_COLOR[tc.format] ?? "#64748b";
                  const canRegister = tc.status === "REGISTRATION_OPEN" && registrationOpen;
                  return (
                    <Link
                      key={tc.id}
                      href={plink(`/torneos/${id}/categorias/${tc.id}`)}
                      className="portal-card"
                      style={{
                        display: "block", borderRadius: 14,
                        border: `1px solid ${GLASS_BD}`,
                        background: GLASS,
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        padding: 16,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                        textDecoration: "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", fontFamily: "var(--font-space), sans-serif" }}>
                          {tc.category.name}
                        </h3>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", padding: "2px 8px", borderRadius: 20, background: cs.bg, color: cs.color, border: `1px solid ${cs.border}` }}>
                          {CAT_STATUS_LABEL[tc.status] ?? tc.status}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: fColor, marginBottom: 12 }}>
                        ⎇ {FORMAT_LABEL[tc.format] ?? tc.format}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "#64748b" }}>{tc.maxTeams} parejas · cupo</span>
                        <span style={{ fontWeight: 700, color: canRegister ? ACCENT : "#475569" }}>
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
            <div style={{
              borderRadius: 16, padding: 20,
              background: GLASS,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: `1px solid ${GLASS_BD}`,
              boxShadow: "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>
                Información
              </div>
              {[
                { icon: "📅", label: "Inicio",      value: new Date(tournament.startDate).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }) },
                { icon: "🏁", label: "Cierre",      value: endFmt },
                { icon: "📍", label: "Organizador", value: tournament.organizer.name },
                { icon: "🏷", label: "Categorías",  value: `${tournament.categories.length} categoría${tournament.categories.length !== 1 ? "s" : ""}` },
              ].map((f) => (
                <div key={f.label} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 2 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8" }}>{f.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA card */}
            {registrationOpen && (
              <div style={{
                borderRadius: 16,
                border: `1px solid ${ACCENT_BD}`,
                padding: 20,
                background: ACCENT_BG,
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                boxShadow: "0 0 24px rgba(163,230,53,0.08)",
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", fontFamily: "var(--font-space), sans-serif", marginBottom: 6 }}>
                  ¿Querés participar?
                </div>
                <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginBottom: 16 }}>
                  Mandá tu solicitud de inscripción. El organizador la confirma en 24–48hs.
                </p>
                {tournament.categories.length > 0 && (
                  <Link
                    href={plink(`/torneos/${id}/categorias/${tournament.categories[0].id}`)}
                    style={{ display: "flex", width: "100%", height: 40, alignItems: "center", justifyContent: "center", borderRadius: 12, background: ACCENT, color: "#0f172a", fontSize: 13, fontWeight: 800, textDecoration: "none", boxShadow: "0 0 16px rgba(163,230,53,0.25)" }}
                  >
                    ✍ Pre-inscribirse
                  </Link>
                )}
              </div>
            )}

            {/* Completed notice */}
            {isCompleted && (
              <div style={{
                borderRadius: 16, padding: 20,
                background: GLASS,
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: `1px solid ${GLASS_BD}`,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
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
