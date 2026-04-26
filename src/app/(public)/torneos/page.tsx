import Link from "next/link";
import { getPublicTournaments, getPublicFeaturedTournament } from "@/modules/public/queries";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Torneos — PádelPro" };

const MAX = 1140;
const G   = "#16a34a";

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED:            "Próximamente",
  REGISTRATION_OPEN:    "Inscripciones",
  REGISTRATION_CLOSED:  "Inscripciones cerradas",
  IN_PROGRESS:          "En curso",
  COMPLETED:            "Finalizado",
};

const STATUS_STYLE: Record<string, { bg: string; color: string; dot?: boolean }> = {
  PUBLISHED:            { bg: "#dbeafe", color: "#2563eb" },
  REGISTRATION_OPEN:    { bg: "#dbeafe", color: "#2563eb" },
  REGISTRATION_CLOSED:  { bg: "#f1f5f9", color: "#64748b" },
  IN_PROGRESS:          { bg: "#dcfce7", color: G, dot: true },
  COMPLETED:            { bg: "#f1f5f9", color: "#94a3b8" },
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

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg: "#f1f5f9", color: "#64748b" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      letterSpacing: "0.04em", textTransform: "uppercase",
      background: s.bg, color: s.color,
    }}>
      {s.dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, animation: "pulse 1.4s infinite", display: "inline-block" }} />}
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export default async function PublicTorneosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; bienvenido?: string }>;
}) {
  const { q, bienvenido } = await searchParams;
  const [featured, tournaments] = await Promise.all([
    getPublicFeaturedTournament(),
    getPublicTournaments(q?.trim()),
  ]);

  const others = q
    ? tournaments
    : tournaments.filter((t) => t.id !== featured?.id);

  const startFmt = (d: Date | string) =>
    new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  const endFmt = (d: Date | string) =>
    new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div>
      {/* Welcome banner */}
      {bienvenido === "1" && (
        <div style={{ background: "#f0fdf4", borderBottom: "1px solid #bbf7d0" }}>
          <div style={{ maxWidth: MAX, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18 }}>🎾</span>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#15803d" }}>
              ¡Bienvenido a PádelPro! Tu cuenta fue creada exitosamente.
            </p>
          </div>
        </div>
      )}

      {/* ── Hero: featured tournament ── */}
      {featured && !q && (
        <div style={{
          position: "relative", overflow: "hidden",
          background: "linear-gradient(135deg, #0f172a 0%, #1a2744 55%, #14532d 100%)",
          padding: "52px 0 44px",
        }}>
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "radial-gradient(circle at 80% 50%, rgba(163,230,53,.06) 0%, transparent 60%)",
          }} />

          <div style={{ position: "relative", maxWidth: MAX, margin: "0 auto", padding: "0 24px" }}>
            {/* Status + dates */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <StatusBadge status={featured.status} />
              <span style={{ fontSize: 12, color: "#64748b" }}>
                {startFmt(featured.startDate)} → {endFmt(featured.endDate)}
              </span>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: 42, fontWeight: 800, color: "#fff", marginBottom: 8, fontFamily: "Space Grotesk, sans-serif", lineHeight: 1.1 }}>
              {featured.name}
            </h1>
            {featured.description && (
              <p style={{ color: "#94a3b8", fontSize: 15, marginBottom: 4, maxWidth: 560 }}>{featured.description}</p>
            )}
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 32 }}>
              📍 {featured.organizer.name}
            </p>

            {/* Category cards */}
            {featured.categories.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 32 }}>
                {featured.categories.map((tc) => {
                  const approved = tc._count.registrations;
                  const pct = tc.maxTeams > 0 ? Math.min(100, Math.round((approved / tc.maxTeams) * 100)) : 0;
                  const barColor = pct >= 100 ? "#dc2626" : pct > 75 ? "#f97316" : G;
                  const cs = CAT_STATUS[tc.status] ?? { bg: "#f1f5f9", color: "#64748b" };
                  const available = tc.maxTeams - approved;
                  const catLabel = tc.status === "REGISTRATION_OPEN" ? "Abierta" :
                    tc.status === "REGISTRATION_CLOSED" ? "Cerrada" :
                    tc.status === "IN_PROGRESS" ? "En curso" :
                    tc.status === "COMPLETED" ? "Finalizada" : tc.status;
                  return (
                    <Link
                      key={tc.id}
                      href={`/torneos/${featured.id}/categorias/${tc.id}`}
                      style={{
                        display: "block", borderRadius: 12, padding: "14px",
                        background: "rgba(255,255,255,0.06)",
                        backdropFilter: "blur(6px)",
                        border: "1px solid rgba(255,255,255,0.09)",
                        textDecoration: "none", transition: "background .15s",
                      }}
                    >
                      <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, marginBottom: 8 }}>
                        {tc.category.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{ flex: 1, height: 6, background: "#334155", borderRadius: 6, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 6 }} />
                        </div>
                        <span style={{ fontSize: 11, color: "#64748b" }}>{approved}/{tc.maxTeams}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                          padding: "2px 8px", borderRadius: 20,
                          background: cs.bg + "33", color: cs.color,
                        }}>
                          {catLabel}
                        </span>
                        <span style={{ fontSize: 11, color: "#64748b" }}>
                          {available > 0 ? `${available} libre${available !== 1 ? "s" : ""}` : "Sin cupo"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <Link
                href={`/torneos/${featured.id}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  height: 40, padding: "0 20px", borderRadius: 10,
                  background: G, color: "#fff", fontSize: 13, fontWeight: 700,
                  textDecoration: "none", boxShadow: "0 2px 12px rgba(22,163,74,.35)",
                }}
              >
                Ver torneo →
              </Link>
              {featured.status === "REGISTRATION_OPEN" && (
                <Link
                  href={`/torneos/${featured.id}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    height: 40, padding: "0 20px", borderRadius: 10,
                    background: "rgba(255,255,255,0.12)", color: "#fff",
                    border: "1px solid rgba(255,255,255,0.2)",
                    fontSize: 13, fontWeight: 700, textDecoration: "none",
                  }}
                >
                  ✍ Pre-inscribirse
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Other tournaments ── */}
      <div style={{ maxWidth: MAX, margin: "0 auto", padding: "40px 24px" }}>
        {!q && others.length > 0 && (
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif", marginBottom: 20 }}>
            {featured ? "Otros torneos" : "Torneos"}
          </h2>
        )}
        {q && (
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
            {others.length === 0
              ? `Sin resultados para "${q}"`
              : `${others.length} resultado${others.length !== 1 ? "s" : ""} para "${q}"`}
          </p>
        )}

        {others.length === 0 && !q && !featured ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "96px 0", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}>🌐</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif" }}>
              Sin torneos publicados
            </h3>
            <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 8 }}>
              Los torneos aparecerán aquí cuando sean publicados.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {others.map((t) => {
              const topBar =
                t.status === "IN_PROGRESS" ? G :
                t.status === "REGISTRATION_OPEN" ? "#3b82f6" : "#e2e8f0";
              return (
                <Link
                  key={t.id}
                  href={`/torneos/${t.id}`}
                  style={{
                    display: "block", borderRadius: 16, background: "#fff",
                    border: "1px solid #e2e8f0", overflow: "hidden",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    textDecoration: "none", transition: "box-shadow .15s, transform .15s",
                  }}
                >
                  <div style={{ height: 4, background: topBar }} />
                  <div style={{ padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1.3 }}>
                        {t.name}
                      </h3>
                      <StatusBadge status={t.status} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                      📍 {t.organizer.name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>
                      📅 {startFmt(t.startDate)} → {endFmt(t.endDate)}
                    </div>
                    {t.categories.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {t.categories.map((tc) => (
                          <span key={tc.id} style={{
                            fontSize: 11, padding: "3px 10px", borderRadius: 20,
                            background: "#f8fafc", color: "#64748b", border: "1px solid #f1f5f9",
                          }}>
                            {tc.category.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
