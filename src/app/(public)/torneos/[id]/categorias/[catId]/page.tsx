import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPublicCategoryFixture } from "@/modules/public/queries";
import { RegisterForm } from "./_components/register-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Fixture" };

const G  = "#16a34a";
const GL = "#f0fdf4";

export default async function PublicFixturePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; catId: string }>;
  searchParams: Promise<{ inscripto?: string; espera?: string }>;
}) {
  const { id: tournamentId, catId } = await params;
  const { inscripto, espera } = await searchParams;

  const [tc, session] = await Promise.all([
    getPublicCategoryFixture(catId),
    auth(),
  ]);

  if (!tc || !tc.tournament.isPublic || tc.tournament.id !== tournamentId) notFound();

  const registrationOpen = tc.tournament.status === "REGISTRATION_OPEN";
  const approvedCount = tc._count.registrations;
  const isFull = approvedCount >= tc.maxTeams;

  let myProfile: { id: string; firstName: string; lastName: string } | null = null;
  let alreadyRegistered = false;

  if (session?.user) {
    myProfile = await prisma.playerProfile.findFirst({
      where: { userId: session.user.id },
      select: { id: true, firstName: true, lastName: true },
    });

    if (myProfile) {
      const existing = await prisma.registration.findFirst({
        where: {
          tournamentCategoryId: catId,
          team: { players: { some: { playerProfileId: myProfile.id } } },
          status: { in: ["PENDING", "APPROVED"] },
        },
      });
      const onWaitlist = await prisma.waitlistEntry.findFirst({
        where: {
          tournamentCategoryId: catId,
          team: { players: { some: { playerProfileId: myProfile.id } } },
        },
      });
      alreadyRegistered = !!(existing || onWaitlist);
    }
  }

  const hasFixture = tc.stages.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b", flexWrap: "wrap" }}>
        <Link href="/torneos" style={{ color: "#64748b", textDecoration: "none" }}>Torneos</Link>
        <span>›</span>
        <Link href={`/torneos/${tournamentId}`} style={{ color: "#64748b", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
          {tc.tournament.name}
        </Link>
        <span>›</span>
        <span style={{ color: "#0f172a", fontWeight: 600 }}>{tc.category.name}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, background: GL, fontSize: 20 }}>
            🏆
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif" }}>{tc.category.name}</h1>
            <p style={{ fontSize: 13, color: "#64748b" }}>{tc.tournament.name}</p>
          </div>
        </div>
        {registrationOpen && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b" }}>
            <span>👥</span>
            <span>
              <span style={{ fontWeight: 700, color: "#1e293b" }}>{approvedCount}</span>
              <span style={{ color: "#94a3b8" }}>/{tc.maxTeams}</span>
              <span style={{ marginLeft: 4 }}>parejas inscriptas</span>
            </span>
          </div>
        )}
      </div>

      {/* Success banners */}
      {inscripto && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, borderRadius: 12, background: GL, border: "1px solid #bbf7d0", padding: "14px 16px" }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>✅</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>Solicitud enviada</p>
            <p style={{ fontSize: 12, color: G, marginTop: 2 }}>
              Tu inscripción está pendiente de aprobación por el organizador.
            </p>
          </div>
        </div>
      )}
      {espera && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, borderRadius: 12, background: "#fffbeb", border: "1px solid #fde68a", padding: "14px 16px" }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⏳</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>En lista de espera</p>
            <p style={{ fontSize: 12, color: "#b45309", marginTop: 2 }}>
              El cupo está completo. Quedaste en lista de espera y serás contactado si se libera un lugar.
            </p>
          </div>
        </div>
      )}

      {/* Registration section */}
      {registrationOpen && !inscripto && !espera && (
        <div style={{ borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
              {isFull ? "Lista de espera" : "Inscribirse"}
            </h2>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
              {isFull
                ? "El cupo está completo. Podés anotarte en lista de espera."
                : "Las inscripciones están abiertas. Seleccioná tu compañero/a para solicitar un lugar."}
            </p>
          </div>
          <div style={{ padding: 20 }}>
            {!session?.user ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "16px 0", textAlign: "center" }}>
                <span style={{ fontSize: 32, opacity: 0.3 }}>🔐</span>
                <p style={{ fontSize: 13, color: "#64748b" }}>
                  Necesitás iniciar sesión para inscribirte.
                </p>
                <Link
                  href={`/login?callbackUrl=/torneos/${tournamentId}/categorias/${catId}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 36, padding: "0 20px", borderRadius: 12, background: G, color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}
                >
                  Iniciar sesión
                </Link>
              </div>
            ) : !myProfile ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "16px 0", textAlign: "center" }}>
                <span style={{ fontSize: 32, opacity: 0.3 }}>👤</span>
                <p style={{ fontSize: 13, color: "#64748b" }}>
                  Necesitás un perfil de jugador registrado para inscribirte.
                  Contactá al organizador para que cree tu perfil.
                </p>
              </div>
            ) : alreadyRegistered ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <p style={{ fontSize: 13, color: "#334155" }}>
                  Ya estás inscripto/a en esta categoría.
                </p>
              </div>
            ) : (
              <RegisterForm
                tournamentCategoryId={catId}
                myProfileId={myProfile.id}
              />
            )}
          </div>
        </div>
      )}

      {!hasFixture ? (
        <div style={{ borderRadius: 16, border: "2px dashed #e2e8f0", background: "#fff", padding: "48px 0", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#64748b" }}>El fixture aún no está disponible.</p>
        </div>
      ) : (
        tc.stages.map((stage) => (
          <div key={stage.id}>
            {stage.type === "GROUPS" && (
              <PublicGroupsView stage={stage} format={tc.format} />
            )}
            {stage.type === "SINGLE_ELIMINATION" && stage.bracketNodes.length > 0 && (
              <PublicBracketView stage={stage} />
            )}
            {stage.type === "DOUBLE_ELIMINATION" && (
              <PublicGroupsView stage={stage} format={tc.format} />
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = NonNullable<Awaited<ReturnType<typeof getPublicCategoryFixture>>>["stages"][number];

// ─── Public Groups View ───────────────────────────────────────────────────────

function PublicGroupsView({ stage }: { stage: Stage; format: string }) {
  const isDoubleElim = stage.type === "DOUBLE_ELIMINATION";
  return (
    <div style={{ borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>{isDoubleElim ? "🔀" : "⊞"}</span>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif" }}>{stage.name}</h2>
      </div>
      <div style={{ padding: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {stage.groups.map((group) => (
          <div key={group.id} style={{ borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ background: "#f8fafc", padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif" }}>{group.name}</h3>
            </div>

            {/* Standings */}
            {group.standings.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f1f5f9", background: "rgba(248,250,252,0.5)" }}>
                      {["#", "Equipo", "PJ", "PG", "PP", "SG", "SP", "Pts"].map((h) => (
                        <th key={h} style={{ padding: "8px", textAlign: h === "Equipo" ? "left" : "center", fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.standings.map((s, idx) => {
                      const names = s.team.players.map((p) => p.playerProfile.lastName);
                      return (
                        <tr key={s.id} style={{ borderBottom: "1px solid #f8fafc", background: idx < 2 ? "rgba(240,253,244,0.4)" : undefined }}>
                          <td style={{ padding: "10px 8px", fontWeight: 700, color: idx < 2 ? "#15803d" : "#94a3b8" }}>{s.position}</td>
                          <td style={{ padding: "10px 8px", fontWeight: 600, color: idx < 2 ? "#15803d" : "#475569", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{names.join(" / ")}</td>
                          <td style={{ padding: "10px 8px", textAlign: "center", color: "#64748b" }}>{s.matchesPlayed}</td>
                          <td style={{ padding: "10px 8px", textAlign: "center", color: "#64748b" }}>{s.matchesWon}</td>
                          <td style={{ padding: "10px 8px", textAlign: "center", color: "#64748b" }}>{s.matchesLost}</td>
                          <td style={{ padding: "10px 8px", textAlign: "center", color: "#64748b" }}>{s.setsWon}</td>
                          <td style={{ padding: "10px 8px", textAlign: "center", color: "#64748b" }}>{s.setsLost}</td>
                          <td style={{ padding: "10px 8px", textAlign: "center", fontWeight: 700, color: idx < 2 ? G : "#475569" }}>{s.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Matches */}
            <div style={{ borderTop: "1px solid #f1f5f9" }}>
              {group.matches.map((match, mi) => {
                const t1     = match.teams.find((t) => t.side === 1);
                const t2     = match.teams.find((t) => t.side === 2);
                const done   = match.status === "COMPLETED" || match.status === "WALKOVER";
                const winner = match.result?.winnerId;
                const score  = match.sets.map((s) => `${s.games1}-${s.games2}`).join(", ");
                return (
                  <div key={match.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: mi < group.matches.length - 1 ? "1px solid #f8fafc" : "none" }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{done ? "✅" : "⏱"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: done && winner === t1?.teamId ? "#15803d" : "#475569" }}>
                          {t1?.team.players.map((p) => p.playerProfile.lastName).join("/")}
                        </span>
                        <span style={{ fontSize: 12, color: "#cbd5e1" }}>vs</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: done && winner === t2?.teamId ? "#15803d" : "#475569" }}>
                          {t2?.team.players.map((p) => p.playerProfile.lastName).join("/")}
                        </span>
                      </div>
                      {done && score && <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{score}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Public Bracket View ──────────────────────────────────────────────────────

function PublicBracketView({ stage }: { stage: Stage }) {
  const nodes    = stage.bracketNodes;
  const roundMap = new Map<number, typeof nodes>();
  for (const node of nodes) {
    if (!roundMap.has(node.round)) roundMap.set(node.round, []);
    roundMap.get(node.round)!.push(node);
  }
  const rounds    = Array.from(roundMap.keys()).sort((a, b) => b - a);
  const numRounds = rounds.length;

  const roundLabels: Record<number, string> = {};
  if (numRounds >= 1) roundLabels[rounds[numRounds - 1]] = "Final";
  if (numRounds >= 2) roundLabels[rounds[numRounds - 2]] = "Semifinal";
  if (numRounds >= 3) roundLabels[rounds[numRounds - 3]] = "Cuartos";

  return (
    <div style={{ borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>⎇</span>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif" }}>{stage.name}</h2>
      </div>
      <div style={{ padding: 20, overflowX: "auto" }}>
        <div style={{ display: "flex", gap: 24, minWidth: "max-content" }}>
          {rounds.map((round, colIdx) => {
            const colNodes = (roundMap.get(round) ?? []).sort((a, b) => a.position - b.position);
            const label    = roundLabels[round] ?? `Ronda ${round}`;
            const gap      = Math.pow(2, colIdx) * 76 - 76;
            return (
              <div key={round} style={{ display: "flex", flexDirection: "column", width: 200 }}>
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap }}>
                  {colNodes.map((node) => {
                    if (node.isBye && node.team) {
                      const names = node.team.players.map((p) => p.playerProfile.lastName);
                      return (
                        <div key={node.id} style={{ height: 64, borderRadius: 12, border: "2px dashed #bbf7d0", background: GL, display: "flex", alignItems: "center", padding: "0 12px", gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#15803d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{names.join(" / ")}</span>
                          <span style={{ fontSize: 10, color: G, fontWeight: 700, flexShrink: 0 }}>BYE</span>
                        </div>
                      );
                    }
                    const match = node.match;
                    if (!match) {
                      return (
                        <div key={node.id} style={{ height: 64, borderRadius: 12, border: "2px dashed #e2e8f0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 12, color: "#cbd5e1" }}>Por definir</span>
                        </div>
                      );
                    }
                    const t1     = match.teams.find((t) => t.side === 1);
                    const t2     = match.teams.find((t) => t.side === 2);
                    const done   = match.status === "COMPLETED" || match.status === "WALKOVER";
                    const winner = match.result?.winnerId;
                    return (
                      <div key={node.id} style={{ height: 64, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                        {[t1, t2].map((mt, i) => (
                          <div
                            key={i}
                            style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 10px", gap: 6, background: done && winner === mt?.teamId ? GL : undefined, borderBottom: i === 0 ? "1px solid #f1f5f9" : "none" }}
                          >
                            {done && winner === mt?.teamId && <span style={{ fontSize: 10, flexShrink: 0 }}>🏆</span>}
                            <span style={{
                              fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              color: !mt ? "#cbd5e1" : done && winner === mt?.teamId ? "#15803d" : "#475569",
                              fontStyle: !mt ? "italic" : "normal",
                            }}>
                              {mt ? mt.team.players.map((p) => p.playerProfile.lastName).join(" / ") : "TBD"}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
