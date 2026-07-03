import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getActiveMembership } from "@/lib/active-organizer";
import { getAllPendingRegistrations } from "@/modules/registrations/queries";
import { listTournamentsByOrganizer } from "@/modules/tournaments/queries";
import { approveRegistration, rejectRegistration } from "@/modules/registrations/actions";
import { ClipboardList, ChevronRight, Check, X, Trophy, Clock } from "lucide-react";
import { WEEKDAY_TIME_BANDS } from "@/modules/registrations/validations";
import { InscribirParejaForm } from "./_components/inscribir-pareja-form";
import { InscripcionesFilters } from "./_components/inscripciones-filters";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Inscripciones" };

const REGS_PER_PAGE = 4;

export default async function InscripcionesPage({
  searchParams,
}: {
  searchParams: Promise<{ showAll?: string; from?: string; to?: string; pag?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await getActiveMembership(session.user.id);
  if (!membership) redirect("/dashboard");

  const organizer = membership.organizer;

  const { showAll: showAllParam, from: fromStr, to: toStr, pag: pagStr } = await searchParams;
  const showAll = showAllParam === "1";
  const fromDate = fromStr ? new Date(fromStr + "T00:00:00.000Z") : undefined;
  const toDate   = toStr   ? new Date(toStr   + "T23:59:59.999Z") : undefined;

  const [registrations, tournamentsRaw] = await Promise.all([
    getAllPendingRegistrations(organizer.id, { showAll, from: fromDate, to: toDate }),
    listTournamentsByOrganizer(organizer.id),
  ]);

  const tournaments = tournamentsRaw.map((t) => ({
    id: t.id,
    name: t.name,
    hasWeekdayPlay: t.hasWeekdayPlay,
    categories: t.categories.map((tc) => ({ id: tc.id, name: tc.category.name })),
  }));

  const totalRegs   = registrations.length;
  const totalPages  = Math.max(1, Math.ceil(totalRegs / REGS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, parseInt(pagStr ?? "1", 10)), totalPages);
  const pageRegs    = registrations.slice((currentPage - 1) * REGS_PER_PAGE, currentPage * REGS_PER_PAGE);

  function pagLink(p: number) {
    const params = new URLSearchParams();
    if (showAll)  params.set("showAll", "1");
    if (fromStr)  params.set("from", fromStr);
    if (toStr)    params.set("to", toStr);
    if (p > 1)    params.set("pag", String(p));
    const qs = params.toString();
    return `/dashboard/inscripciones${qs ? `?${qs}` : ""}`;
  }

  // Build context label for header
  const today = new Date();
  const todayLabel = today.toLocaleDateString("es-AR", { day: "numeric", month: "long" });
  let filterLabel: string;
  if (showAll) {
    filterLabel = "todas las fechas";
  } else if (fromStr || toStr) {
    const fmtDate = (s: string) =>
      new Date(s + "T00:00:00Z").toLocaleDateString("es-AR", { day: "numeric", month: "short" });
    const parts = [fromStr && `desde ${fmtDate(fromStr)}`, toStr && `hasta ${fmtDate(toStr)}`].filter(Boolean);
    filterLabel = parts.join(" ");
  } else {
    filterLabel = `hoy (${todayLabel})`;
  }

  return (
    <div style={{ maxWidth: 840, display: "flex", flexDirection: "column", gap: 22 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 28, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.02em", lineHeight: 1 }}>
              Inscripciones
            </h1>
            {registrations.length > 0 && (
              <span className="vib-live-card" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 8,
                background: "#fbbf24", color: "#080e1a",
                fontSize: 12, fontWeight: 900, letterSpacing: "0.04em",
              }}>
                <span className="vib-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#080e1a" }} />
                {registrations.length} PENDIENTE{registrations.length !== 1 ? "S" : ""}
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "#475569" }}>
            {registrations.length === 0
              ? `Todo al día — ${filterLabel}`
              : `Esperando tu aprobación · ${filterLabel}`}
          </p>
        </div>
        <InscribirParejaForm tournaments={tournaments} />
      </div>

      {/* Filters */}
      <InscripcionesFilters showAll={showAll} from={fromStr} to={toStr} />

      {registrations.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "80px 40px", borderRadius: 18,
          border: "1px dashed rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.02)", textAlign: "center",
        }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(163,230,53,0.12)", border: "1px solid rgba(163,230,53,0.28)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: "0 0 24px rgba(163,230,53,0.12)" }}>
            <ClipboardList size={24} color="#a3e635" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#f8fafc", marginBottom: 8, fontFamily: "var(--font-space), sans-serif" }}>
            ¡Todo al día! 🎉
          </h3>
          <p style={{ fontSize: 13, color: "#475569", maxWidth: 280 }}>
            No hay inscripciones pendientes para {filterLabel}.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {groupByCategory(pageRegs).map(({ tournamentName, categoryName, tournamentId, catId, items }, gi) => (
            <div key={catId} className={`vib-in card-d${Math.min(gi, 5)}`} style={{
              background: "rgba(12,20,40,0.7)",
              backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
              borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}>

              {/* Header categoría */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "linear-gradient(135deg, rgba(163,230,53,0.08) 0%, transparent 60%)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(163,230,53,0.14)", border: "1px solid rgba(163,230,53,0.28)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Trophy size={16} color="#a3e635" />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif" }}>{categoryName}</p>
                    <p style={{ fontSize: 11, color: "#475569" }}>{tournamentName}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 900, padding: "3px 10px", borderRadius: 7,
                    background: "#fbbf24", color: "#080e1a",
                    letterSpacing: "0.04em",
                  }}>
                    {items.length} PEND.
                  </span>
                  <Link
                    href={`/dashboard/torneos/${tournamentId}/categorias/${catId}`}
                    style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 700, color: "#a3e635", textDecoration: "none" }}
                  >
                    Ver todo <ChevronRight size={12} />
                  </Link>
                </div>
              </div>

              {/* Rows */}
              <div>
                {items.map((reg, idx) => {
                  const names = reg.team.players.map(
                    (tp) => `${tp.playerProfile.firstName} ${tp.playerProfile.lastName}`
                  );
                  const returnPath = `/dashboard/inscripciones`;
                  const accentColors = ["#a3e635", "#38bdf8"];

                  return (
                    <div
                      key={reg.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "14px 18px",
                        borderBottom: idx < items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      }}
                    >
                      {/* Avatares */}
                      <div style={{ display: "flex", flexShrink: 0 }}>
                        {names.slice(0, 2).map((name, i) => {
                          const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                          const ac = accentColors[i];
                          return (
                            <div key={i} style={{
                              width: 36, height: 36, borderRadius: 10,
                              background: `${ac}22`, border: `1.5px solid ${ac}55`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 11, fontWeight: 900, color: ac,
                              fontFamily: "var(--font-space), sans-serif",
                              marginLeft: i > 0 ? -8 : 0,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                            }}>
                              {initials}
                            </div>
                          );
                        })}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", fontFamily: "var(--font-space), sans-serif" }}>
                          {names.join(" / ")}
                        </p>
                        <p style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                          Solicitado el{" "}
                          {new Date(reg.createdAt).toLocaleDateString("es-AR", {
                            day: "numeric", month: "long",
                          })}
                        </p>
                        {reg.weekdayAvailability.length > 0 && (
                          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                            <Clock size={11} color="#a3e635" style={{ flexShrink: 0 }} />
                            {reg.weekdayAvailability.length === WEEKDAY_TIME_BANDS.length ? (
                              <span style={availChip}>Disp. total (L–V)</span>
                            ) : (
                              WEEKDAY_TIME_BANDS
                                .filter((b) => reg.weekdayAvailability.includes(b.value))
                                .map((b) => <span key={b.value} style={availChip}>{b.label} {b.range}</span>)
                            )}
                          </div>
                        )}
                      </div>

                      {/* Acciones */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <form action={approveRegistration}>
                          <input type="hidden" name="registrationId" value={reg.id} />
                          <input type="hidden" name="returnPath" value={returnPath} />
                          <button type="submit" style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "8px 14px", borderRadius: 9,
                            background: "#a3e635", color: "#080e1a",
                            fontSize: 12, fontWeight: 800, cursor: "pointer",
                            border: "none", boxShadow: "0 0 16px rgba(163,230,53,0.25)",
                            transition: "transform .1s",
                          }}>
                            <Check size={13} /> Aprobar
                          </button>
                        </form>
                        <form action={rejectRegistration}>
                          <input type="hidden" name="registrationId" value={reg.id} />
                          <input type="hidden" name="returnPath" value={returnPath} />
                          <button type="submit" style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "8px 12px", borderRadius: 9,
                            background: "rgba(244,63,94,0.12)", color: "#fb7185",
                            fontSize: 12, fontWeight: 700, cursor: "pointer",
                            border: "1px solid rgba(244,63,94,0.3)",
                          }}>
                            <X size={13} />
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
              {currentPage > 1 ? (
                <Link href={pagLink(currentPage - 1)} style={pagBtn}>← Anterior</Link>
              ) : (
                <span style={pagBtnDisabled}>← Anterior</span>
              )}

              <span style={{ fontSize: 12, color: "#475569" }}>
                Página {currentPage} de {totalPages} · {totalRegs} pendiente{totalRegs !== 1 ? "s" : ""}
              </span>

              {currentPage < totalPages ? (
                <Link href={pagLink(currentPage + 1)} style={pagBtn}>Siguiente →</Link>
              ) : (
                <span style={pagBtnDisabled}>Siguiente →</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const availChip: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
  background: "rgba(163,230,53,0.10)", border: "1px solid rgba(163,230,53,0.22)",
  color: "#a3e635",
};

const pagBtn: React.CSSProperties = {
  padding: "8px 16px", borderRadius: 100,
  border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)",
  fontSize: 12, fontWeight: 600, color: "#94a3b8", textDecoration: "none",
};
const pagBtnDisabled: React.CSSProperties = {
  padding: "8px 16px", borderRadius: 100,
  border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.02)",
  fontSize: 12, fontWeight: 600, color: "#334155",
};

// ─── helpers ─────────────────────────────────────────────────────────────────

type PendingReg = Awaited<ReturnType<typeof getAllPendingRegistrations>>[number];

function groupByCategory(regs: PendingReg[]) {
  const map = new Map<string, {
    tournamentName: string;
    categoryName: string;
    tournamentId: string;
    catId: string;
    items: PendingReg[];
  }>();
  for (const reg of regs) {
    const key = reg.tournamentCategoryId;
    if (!map.has(key)) {
      map.set(key, {
        tournamentName: reg.tournamentCategory.tournament.name,
        categoryName: reg.tournamentCategory.category.name,
        tournamentId: reg.tournamentCategory.tournament.id,
        catId: reg.tournamentCategoryId,
        items: [],
      });
    }
    map.get(key)!.items.push(reg);
  }
  return Array.from(map.values());
}
