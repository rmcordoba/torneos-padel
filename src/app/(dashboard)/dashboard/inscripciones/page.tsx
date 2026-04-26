import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOrganizersByUser } from "@/modules/organizers/queries";
import { getAllPendingRegistrations } from "@/modules/registrations/queries";
import { approveRegistration, rejectRegistration } from "@/modules/registrations/actions";
import { ClipboardList, ChevronRight, Check, X, Trophy } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Inscripciones" };

export default async function InscripcionesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await getOrganizersByUser(session.user.id);
  if (memberships.length === 0) redirect("/dashboard");

  const organizer = memberships[0].organizer;
  const registrations = await getAllPendingRegistrations(organizer.id);

  return (
    <div style={{ maxWidth: 800, display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div>
        <h1 className="page-title">Inscripciones pendientes</h1>
        <p style={{ fontSize: 13, color: "var(--text-dimmer)", marginTop: 4 }}>
          {registrations.length === 0
            ? "Todo al día — no hay inscripciones que revisar"
            : `${registrations.length} inscripción${registrations.length !== 1 ? "es" : ""} esperando aprobación`}
        </p>
      </div>

      {registrations.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "80px 40px", borderRadius: 12,
          border: "1px dashed var(--border-strong)", textAlign: "center",
        }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--accent-15)", border: "1px solid var(--accent-30)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <ClipboardList size={22} color="var(--accent)" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, fontFamily: "Space Grotesk, sans-serif" }}>
            Todo al día
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-faint)", maxWidth: 280 }}>
            No hay inscripciones pendientes de revisión.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {groupByCategory(registrations).map(({ tournamentName, categoryName, tournamentId, catId, items }) => (
            <div key={catId} style={{ background: "var(--bg-surface)", borderRadius: 12, border: "1px solid var(--border-default)", overflow: "hidden" }}>

              {/* Header categoría */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 18px", borderBottom: "1px solid var(--border-subtle)",
                background: "var(--bg-elevated)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent-15)", border: "1px solid var(--accent-30)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Trophy size={14} color="var(--accent)" />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{categoryName}</p>
                    <p style={{ fontSize: 11, color: "var(--text-dimmer)" }}>{tournamentName}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                    background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)",
                    letterSpacing: "0.05em", textTransform: "uppercase",
                  }}>
                    {items.length} pendiente{items.length !== 1 ? "s" : ""}
                  </span>
                  <Link
                    href={`/dashboard/torneos/${tournamentId}/categorias/${catId}`}
                    style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}
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
                  const accentColors = ["#a3e635", "#60a5fa"];

                  return (
                    <div
                      key={reg.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "14px 18px",
                        borderBottom: idx < items.length - 1 ? "1px solid var(--border-subtle)" : "none",
                      }}
                    >
                      {/* Avatares */}
                      <div style={{ display: "flex", gap: -4, flexShrink: 0 }}>
                        {names.slice(0, 2).map((name, i) => {
                          const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                          const ac = accentColors[i];
                          return (
                            <div key={i} style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: `${ac}22`, border: `1px solid ${ac}44`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 10, fontWeight: 800, color: ac,
                              fontFamily: "Space Grotesk, sans-serif",
                              marginLeft: i > 0 ? -6 : 0,
                            }}>
                              {initials}
                            </div>
                          );
                        })}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                          {names.join(" / ")}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-dimmer)", marginTop: 2 }}>
                          Solicitado el{" "}
                          {new Date(reg.createdAt).toLocaleDateString("es-AR", {
                            day: "numeric", month: "long",
                          })}
                        </p>
                      </div>

                      {/* Acciones */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <form action={approveRegistration}>
                          <input type="hidden" name="registrationId" value={reg.id} />
                          <input type="hidden" name="returnPath" value={returnPath} />
                          <button type="submit" style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "6px 12px", borderRadius: 7,
                            background: "rgba(163,230,53,0.15)", color: "#a3e635",
                            fontSize: 11, fontWeight: 700, cursor: "pointer",
                            border: "1px solid rgba(163,230,53,0.3)",
                          }}>
                            <Check size={12} /> Aprobar
                          </button>
                        </form>
                        <form action={rejectRegistration}>
                          <input type="hidden" name="registrationId" value={reg.id} />
                          <input type="hidden" name="returnPath" value={returnPath} />
                          <button type="submit" style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "6px 12px", borderRadius: 7,
                            background: "rgba(248,113,113,0.15)", color: "#f87171",
                            fontSize: 11, fontWeight: 700, cursor: "pointer",
                            border: "1px solid rgba(248,113,113,0.3)",
                          }}>
                            <X size={12} /> Rechazar
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
