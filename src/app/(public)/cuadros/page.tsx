import Link from "next/link";
import { getPublicFeaturedTournament, getPublicCategoryFixture } from "@/modules/public/queries";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cuadros — PádelPro" };

const MAX = 1140;
const G   = "#16a34a";

export default async function CuadrosPage({
  searchParams,
}: {
  searchParams: Promise<{ catId?: string }>;
}) {
  const { catId } = await searchParams;
  const featured  = await getPublicFeaturedTournament();

  if (!featured) {
    return (
      <div style={{ maxWidth: MAX, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎾</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif", marginBottom: 8 }}>Sin torneos activos</h2>
        <p style={{ fontSize: 13, color: "#94a3b8" }}>Los cuadros estarán disponibles cuando haya un torneo en curso.</p>
      </div>
    );
  }

  const categories  = featured.categories;
  const activeCatId = catId ?? categories[0]?.id;
  const activeCat   = categories.find((c) => c.id === activeCatId) ?? categories[0];
  const fixture     = activeCatId ? await getPublicCategoryFixture(activeCatId) : null;

  return (
    <div style={{ maxWidth: MAX, margin: "0 auto", padding: "32px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif", marginBottom: 4 }}>
          Cuadros
        </h1>
        <p style={{ fontSize: 13, color: "#94a3b8" }}>{featured.name} · Actualizado en tiempo real</p>
      </div>

      {/* Category selector */}
      {categories.length > 0 ? (
        <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
          {categories.map((tc) => {
            const active = tc.id === activeCatId;
            return (
              <Link
                key={tc.id}
                href={`/cuadros?catId=${tc.id}`}
                style={{
                  display: "inline-block", padding: "8px 16px", borderRadius: 40,
                  fontSize: 13, fontWeight: 600, textDecoration: "none",
                  border: `1px solid ${active ? G : "#e2e8f0"}`,
                  background: active ? "#f0fdf4" : "#fff",
                  color: active ? "#15803d" : "#64748b",
                  boxShadow: active ? "0 0 0 3px #d1fae5" : "none",
                }}
              >
                {tc.category.name}
              </Link>
            );
          })}
        </div>
      ) : (
        <div style={{ borderRadius: 16, border: "2px dashed #e2e8f0", background: "#fff", padding: "40px 0", textAlign: "center", marginBottom: 32 }}>
          <p style={{ fontSize: 13, color: "#94a3b8" }}>No hay categorías configuradas para este torneo.</p>
        </div>
      )}

      {/* Fixture */}
      {fixture ? (
        fixture.stages.length === 0 ? (
          <div style={{ borderRadius: 16, border: "2px dashed #e2e8f0", background: "#fff", padding: "56px 0", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 13, color: "#64748b" }}>El fixture aún no está disponible para esta categoría.</p>
            <p style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4 }}>Se publicará una vez que comiencen los partidos.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {fixture.stages.map((stage) => (
              <div key={stage.id}>
                {stage.type === "GROUPS" && <PublicGroupsView stage={stage} />}
                {stage.type === "SINGLE_ELIMINATION" && stage.bracketNodes.length > 0 && <PublicBracketView stage={stage} />}
                {stage.type === "DOUBLE_ELIMINATION" && <PublicGroupsView stage={stage} />}
              </div>
            ))}
          </div>
        )
      ) : activeCat ? (
        <div style={{ borderRadius: 16, border: "2px dashed #e2e8f0", background: "#fff", padding: "56px 0", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "#94a3b8" }}>Seleccioná una categoría para ver el cuadro.</p>
        </div>
      ) : null}

      {activeCat && (
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Link href={`/torneos/${featured.id}/categorias/${activeCat.id}`} style={{ fontSize: 13, color: G, fontWeight: 600, textDecoration: "none" }}>
            Ver página completa de {activeCat.category.name} →
          </Link>
        </div>
      )}
    </div>
  );
}

type CatFixture = NonNullable<Awaited<ReturnType<typeof getPublicCategoryFixture>>>;
type Stage = CatFixture["stages"][number];

function PublicGroupsView({ stage }: { stage: Stage }) {
  return (
    <div style={{ borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>⊞</span>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif" }}>{stage.name}</h2>
      </div>
      <div style={{ padding: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {stage.groups.map((group) => (
          <div key={group.id} style={{ borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ background: "#f8fafc", padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", fontFamily: "Space Grotesk, sans-serif" }}>{group.name}</h3>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Clasifican top 2</span>
            </div>

            {group.standings.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f1f5f9", background: "rgba(248,250,252,0.5)" }}>
                      {["#", "Pareja", "PJ", "PG", "PP", "Pts"].map((h) => (
                        <th key={h} style={{ padding: "8px 8px", textAlign: h === "Pareja" ? "left" : "center", fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.standings.map((s, idx) => {
                      const names = s.team.players.map((p) => p.playerProfile.lastName);
                      return (
                        <tr key={s.id} style={{ borderBottom: "1px solid #f8fafc", background: idx < 2 ? "rgba(240,253,244,0.4)" : undefined }}>
                          <td style={{ padding: "10px 8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {idx < 2 && <span style={{ width: 6, height: 6, borderRadius: "50%", background: G, flexShrink: 0 }} />}
                              <span style={{ fontWeight: 700, fontSize: 12, color: idx < 2 ? "#15803d" : "#94a3b8" }}>{s.position}</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 8px", fontWeight: 600, color: idx < 2 ? "#15803d" : "#475569", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {names.join(" / ")}
                          </td>
                          <td style={{ padding: "10px 8px", textAlign: "center", color: "#64748b" }}>{s.matchesPlayed}</td>
                          <td style={{ padding: "10px 8px", textAlign: "center", color: "#64748b" }}>{s.matchesWon}</td>
                          <td style={{ padding: "10px 8px", textAlign: "center", color: "#64748b" }}>{s.matchesLost}</td>
                          <td style={{ padding: "10px 8px", textAlign: "center", fontWeight: 700, color: idx < 2 ? G : "#475569" }}>{s.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

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
    <div style={{ borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
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
                        <div key={node.id} style={{ height: 64, borderRadius: 12, border: "2px dashed #bbf7d0", background: "#f0fdf4", display: "flex", alignItems: "center", padding: "0 12px", gap: 8 }}>
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
                            style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 10px", gap: 6, background: done && winner === mt?.teamId ? "#f0fdf4" : undefined, borderBottom: i === 0 ? "1px solid #f1f5f9" : "none" }}
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
