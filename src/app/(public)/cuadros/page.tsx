import Link from "next/link";
import { Search } from "lucide-react";
import {
  getPublicTournamentsForCuadros,
  getPublicCategoryFixture,
} from "@/modules/public/queries";
import { scopedOrg, plink } from "@/lib/portal-scope";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cuadros — PádelPro" };

const MAX        = 1400;
const ACCENT     = "#a3e635";
const ACCENT_BG  = "rgba(163,230,53,0.10)";
const ACCENT_BD  = "rgba(163,230,53,0.22)";
const GLASS      = "rgba(10,20,42,0.75)";
const GLASS_BD   = "rgba(255,255,255,0.08)";
const CARD_H     = 80; // bracket match card height

// Status config for tournament selector sidebar
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot?: boolean }> = {
  IN_PROGRESS:         { label: "En curso",   color: ACCENT,    bg: ACCENT_BG,               dot: true },
  REGISTRATION_OPEN:   { label: "Inscripciones", color: "#60a5fa", bg: "rgba(96,165,250,0.12)"       },
  REGISTRATION_CLOSED: { label: "Inscripciones", color: "#a78bfa", bg: "rgba(167,139,250,0.12)"      },
  PUBLISHED:           { label: "Publicado",  color: "#64748b", bg: "rgba(100,116,139,0.12)"         },
  COMPLETED:           { label: "Finalizado", color: "#64748b", bg: "rgba(100,116,139,0.12)"         },
};

const ESTADO_STATUSES: Record<string, string[]> = {
  activos:     ["IN_PROGRESS", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "PUBLISHED"],
  finalizados: ["COMPLETED"],
  todos:       [],
};

const STATUS_PRIORITY: Record<string, number> = {
  IN_PROGRESS: 0, REGISTRATION_OPEN: 1, REGISTRATION_CLOSED: 2, PUBLISHED: 3, COMPLETED: 4,
};

const FORMAT_LABEL: Record<string, string> = {
  SINGLE_ELIMINATION: "Eliminación directa",
  GROUP_PLAYOFF:      "Grupos + Playoff",
  DOUBLE_ELIMINATION: "Doble eliminación",
  ROUND_ROBIN:        "Liga",
  AMERICANO:          "Americano",
  MEXICANO:           "Mexicano",
};

export default async function CuadrosPage({
  searchParams,
}: {
  searchParams: Promise<{
    tournamentId?: string;
    catId?: string;
    estado?: string;
    buscar?: string;
  }>;
}) {
  const { tournamentId: tIdParam, catId, estado: estadoParam, buscar: buscarParam } = await searchParams;

  const estadoKey = estadoParam && estadoParam in ESTADO_STATUSES ? estadoParam : "activos";
  const statuses  = ESTADO_STATUSES[estadoKey];

  const organizerId = scopedOrg();
  const { tournaments: rawTournaments, statusGroups } = await getPublicTournamentsForCuadros({
    search:   buscarParam,
    statuses: statuses.length > 0 ? statuses : undefined,
    organizerId,
  });

  const tournaments = [...rawTournaments].sort(
    (a, b) => (STATUS_PRIORITY[a.status] ?? 5) - (STATUS_PRIORITY[b.status] ?? 5),
  );

  const countFor = (keys: string[]) =>
    statusGroups.filter((g) => keys.includes(g.status)).reduce((s, g) => s + g._count._all, 0);

  const activosCount     = countFor(ESTADO_STATUSES.activos);
  const finalizadosCount = countFor(ESTADO_STATUSES.finalizados);
  const totalCount       = statusGroups.reduce((s, g) => s + g._count._all, 0);

  const tabs = [
    { key: "activos",     label: "Activos",    count: activosCount     },
    { key: "finalizados", label: "Finalizados", count: finalizadosCount },
    { key: "todos",       label: "Todos",       count: totalCount       },
  ];

  const base = `estado=${estadoKey}${buscarParam ? `&buscar=${encodeURIComponent(buscarParam)}` : ""}`;

  const activeTournament = tournaments.find((t) => t.id === tIdParam) ?? tournaments[0];
  const categories       = activeTournament?.categories ?? [];
  const activeCatId      = catId ?? categories[0]?.id;
  const activeCat        = categories.find((c) => c.id === activeCatId) ?? categories[0];
  const fixture          = activeCatId ? await getPublicCategoryFixture(activeCatId, organizerId) : null;
  const hasLive          = tournaments.some((t) => t.status === "IN_PROGRESS");

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (totalCount === 0) {
    return (
      <div style={{ maxWidth: MAX, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.1 }}>⎇</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#94a3b8", fontFamily: "var(--font-space), sans-serif", marginBottom: 8 }}>
          Sin cuadros disponibles
        </h2>
        <p style={{ fontSize: 14, color: "#475569" }}>Los cuadros estarán disponibles cuando haya un torneo en curso.</p>
        <Link href={plink("/torneos")} style={{ display: "inline-block", marginTop: 20, fontSize: 13, color: ACCENT, fontWeight: 700, textDecoration: "none" }}>
          ← Ver torneos
        </Link>
      </div>
    );
  }

  // ── Full layout ──────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: MAX, margin: "0 auto", padding: "0 24px 48px" }}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: "32px 0 28px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        marginBottom: 28,
        display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h1 style={{
              fontFamily: "var(--font-space), sans-serif",
              fontSize: 28, fontWeight: 900, color: "#f8fafc",
              letterSpacing: "-0.02em", lineHeight: 1,
            }}>
              Cuadros
            </h1>
            {hasLive && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 12px", borderRadius: 100,
                background: ACCENT_BG, border: `1px solid ${ACCENT_BD}`,
                fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.06em",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT, animation: "pulse-dot 1.5s infinite" }} />
                En vivo
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "#475569" }}>
            Resultados y cuadros actualizados en tiempo real
          </p>
        </div>

        {/* Status tabs */}
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", padding: 4, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
          {tabs.map((tab) => {
            const active = estadoKey === tab.key;
            return (
              <Link
                key={tab.key}
                href={plink(`/cuadros?estado=${tab.key}${buscarParam ? `&buscar=${encodeURIComponent(buscarParam)}` : ""}`)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                  textDecoration: "none", transition: "all .15s",
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  color: active ? "#f1f5f9" : "#64748b",
                  boxShadow: active ? "0 1px 4px rgba(0,0,0,0.2)" : "none",
                }}
              >
                {tab.label}
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 8,
                  background: active ? ACCENT_BD : "rgba(255,255,255,0.06)",
                  color: active ? ACCENT : "#64748b",
                }}>
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Two-column layout ────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24, alignItems: "start" }}>

        {/* ══ LEFT SIDEBAR — tournament + search ══════════════════════════════ */}
        <div style={{ position: "sticky", top: 76 }}>
          <div style={{
            background: GLASS, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${GLASS_BD}`,
            borderRadius: 18,
            boxShadow: "0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
            overflow: "hidden",
          }}>
            {/* Search */}
            <div style={{ padding: "14px 14px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <form action="/cuadros" method="GET">
                <input type="hidden" name="estado" value={estadoKey} />
                <div style={{ position: "relative" }}>
                  <input
                    type="search"
                    name="buscar"
                    defaultValue={buscarParam ?? ""}
                    placeholder="Buscar torneo..."
                    style={{
                      width: "100%", height: 38, padding: "0 12px 0 36px",
                      borderRadius: 10, fontSize: 13, color: "#e2e8f0",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.05)",
                      outline: "none", boxSizing: "border-box",
                    }}
                  />
                  <Search style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#475569", pointerEvents: "none" }} />
                </div>
              </form>

              {buscarParam && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{tournaments.length} resultado{tournaments.length !== 1 ? "s" : ""}</span>
                  <Link href={plink(`/cuadros?estado=${estadoKey}`)} style={{ fontSize: 11, color: ACCENT, fontWeight: 600, textDecoration: "none" }}>✕ Limpiar</Link>
                </div>
              )}
            </div>

            {/* Tournament list */}
            {tournaments.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 28, opacity: 0.2, marginBottom: 10 }}>⎇</div>
                <p style={{ fontSize: 13, color: "#64748b" }}>
                  {buscarParam ? `Sin resultados para "${buscarParam}"` : "Sin torneos"}
                </p>
                {!buscarParam && estadoKey !== "todos" && (
                  <Link href={plink("/cuadros?estado=todos")} style={{ fontSize: 12, color: ACCENT, fontWeight: 600, textDecoration: "none", display: "inline-block", marginTop: 8 }}>
                    Ver todos →
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ maxHeight: "calc(100vh - 300px)", overflowY: "auto", padding: "8px" }}>
                {tournaments.map((t) => {
                  const isActive = t.id === activeTournament?.id;
                  const cfg      = STATUS_CFG[t.status] ?? STATUS_CFG.PUBLISHED;
                  return (
                    <Link
                      key={t.id}
                      href={plink(`/cuadros?${base}&tournamentId=${t.id}`)}
                      style={{
                        display: "block", padding: "12px 14px", borderRadius: 12, marginBottom: 4,
                        textDecoration: "none", transition: "all .15s",
                        background: isActive ? "rgba(163,230,53,0.08)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isActive ? ACCENT_BD : "rgba(255,255,255,0.05)"}`,
                        borderLeft: `3px solid ${isActive ? ACCENT : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      {/* Status badge + name */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                        <span style={{
                          fontFamily: "var(--font-space), sans-serif",
                          fontSize: 13, fontWeight: 700, lineHeight: 1.3,
                          color: isActive ? "#f8fafc" : "#94a3b8",
                          overflow: "hidden", display: "-webkit-box",
                          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        }}>
                          {t.name}
                        </span>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0,
                          fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 20,
                          background: cfg.bg, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.05em",
                        }}>
                          {cfg.dot && <span style={{ width: 4, height: 4, borderRadius: "50%", background: cfg.color, animation: "pulse-dot 1.5s infinite" }} />}
                          {cfg.label}
                        </span>
                      </div>
                      {/* Organizer + categories count */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 11, color: "#475569" }}>{t.organizer?.name ?? ""}</span>
                        <span style={{ fontSize: 10, color: "#334155", fontWeight: 600 }}>
                          {t.categories.length} cat.
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ══ RIGHT — fixture display ══════════════════════════════════════════ */}
        <div>
          {!activeTournament ? (
            <div style={{ borderRadius: 18, border: "2px dashed rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", padding: "64px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "#64748b" }}>Seleccioná un torneo para ver el cuadro.</p>
            </div>
          ) : (
            <>
              {/* ── Tournament header ──────────────────────────────────────────── */}
              <div style={{
                marginBottom: 20,
                background: GLASS, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                border: `1px solid ${GLASS_BD}`,
                borderRadius: 18,
                padding: "20px 24px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <h2 style={{
                      fontFamily: "var(--font-space), sans-serif",
                      fontSize: 18, fontWeight: 800, color: "#f8fafc", marginBottom: 4,
                    }}>
                      {activeTournament.name}
                    </h2>
                    <p style={{ fontSize: 12, color: "#475569" }}>{activeTournament.organizer?.name}</p>
                  </div>
                  <Link
                    href={plink(`/torneos/${activeTournament.id}`)}
                    style={{ fontSize: 12, color: ACCENT, fontWeight: 600, textDecoration: "none" }}
                  >
                    Ver torneo completo →
                  </Link>
                </div>

                {/* Category selector */}
                {categories.length > 0 && (
                  <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {categories.map((tc) => {
                      const isActive = tc.id === activeCatId;
                      const fmtLabel = FORMAT_LABEL[tc.format] ?? tc.format;
                      return (
                        <Link
                          key={tc.id}
                          href={plink(`/cuadros?${base}&tournamentId=${activeTournament.id}&catId=${tc.id}`)}
                          style={{
                            display: "inline-flex", flexDirection: "column", gap: 2,
                            padding: "10px 16px", borderRadius: 12, textDecoration: "none",
                            border: `1px solid ${isActive ? ACCENT_BD : "rgba(255,255,255,0.07)"}`,
                            background: isActive ? ACCENT_BG : "rgba(255,255,255,0.04)",
                            transition: "all .15s",
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? ACCENT : "#94a3b8" }}>
                            {tc.category.name}
                          </span>
                          <span style={{ fontSize: 10, color: "#475569", fontWeight: 500 }}>
                            {fmtLabel}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Fixture content ────────────────────────────────────────────── */}
              {!fixture || fixture.stages.length === 0 ? (
                <div style={{
                  borderRadius: 18, border: "2px dashed rgba(255,255,255,0.07)",
                  background: "rgba(255,255,255,0.02)", padding: "64px 24px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.15 }}>📋</div>
                  <p style={{ fontSize: 14, color: "#64748b", marginBottom: 6 }}>
                    {!activeCat ? "Seleccioná una categoría para ver el cuadro." : "El fixture aún no está disponible."}
                  </p>
                  {activeCat && (
                    <p style={{ fontSize: 12, color: "#334155" }}>
                      Se publicará una vez que comiencen los partidos.
                    </p>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {fixture.stages.map((stage) => (
                    <div key={stage.id}>
                      {stage.type === "GROUPS"             && <GroupsView stage={stage} />}
                      {stage.type === "SINGLE_ELIMINATION" && stage.bracketNodes.length > 0 && <BracketView stage={stage} />}
                      {stage.type === "DOUBLE_ELIMINATION" && <GroupsView stage={stage} />}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════════════ */
type CatFixture = NonNullable<Awaited<ReturnType<typeof getPublicCategoryFixture>>>;
type Stage      = CatFixture["stages"][number];
type Match      = Stage["groups"][number]["matches"][number];

/* ═══════════════════════════════════════════════════════════════════════════
   MATCH RESULT ROW — shared by groups and bracket
═══════════════════════════════════════════════════════════════════════════ */
function MatchRow({ match }: { match: Match }) {
  const t1     = match.teams.find((t) => t.side === 1);
  const t2     = match.teams.find((t) => t.side === 2);
  const done   = match.status === "COMPLETED" || match.status === "WALKOVER";
  const winner = match.result?.winnerId;
  const score  = match.sets.map((s) => `${s.games1}–${s.games2}`).join(", ");

  function TeamLine({ mt, side }: { mt: typeof t1; side: number }) {
    const isWinner = done && winner === mt?.teamId;
    const lastName = mt?.team.players.map((p) => p.playerProfile.lastName).join("/") ?? "TBD";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
          background: isWinner ? "#a3e635" : "rgba(255,255,255,0.1)",
        }} />
        <span style={{
          fontSize: 12, fontWeight: isWinner ? 700 : 400,
          color: isWinner ? "#f1f5f9" : "#64748b",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {lastName}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "11px 16px",
      background: done ? "transparent" : "rgba(255,255,255,0.01)",
    }}>
      <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
        {done ? "✅" : "⏱"}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
        <TeamLine mt={t1} side={1} />
        <span style={{ fontSize: 11, color: "#334155", flexShrink: 0, fontWeight: 600 }}>vs</span>
        <TeamLine mt={t2} side={2} />
      </div>
      {done && score && (
        <span style={{
          fontSize: 11, fontWeight: 700, color: "#64748b",
          fontFamily: "var(--font-space), sans-serif", flexShrink: 0,
          background: "rgba(255,255,255,0.05)", padding: "3px 8px", borderRadius: 6,
        }}>
          {score}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   GROUPS VIEW
═══════════════════════════════════════════════════════════════════════════ */
function GroupsView({ stage }: { stage: Stage }) {
  return (
    <div>
      {/* Stage header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, fontSize: 16,
          background: "rgba(163,230,53,0.1)", border: "1px solid rgba(163,230,53,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          ⊞
        </div>
        <div>
          <h2 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 16, fontWeight: 800, color: "#f8fafc" }}>
            {stage.name}
          </h2>
          <p style={{ fontSize: 11, color: "#475569" }}>Clasifican los 2 primeros de cada grupo</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
        {stage.groups.map((group) => (
          <div key={group.id} style={{
            background: "rgba(10,20,42,0.75)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16, overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}>
            {/* Group name header */}
            <div style={{
              padding: "14px 20px 12px",
              background: "rgba(255,255,255,0.03)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <h3 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 14, fontWeight: 800, color: "#f8fafc" }}>
                {group.name}
              </h3>
              <span style={{
                fontSize: 10, fontWeight: 700, color: "#a3e635",
                background: "rgba(163,230,53,0.1)", border: "1px solid rgba(163,230,53,0.2)",
                padding: "2px 8px", borderRadius: 20,
              }}>
                Top 2 clasifican
              </span>
            </div>

            {/* Standings table */}
            {group.standings.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                      {["Pos", "Pareja", "PJ", "PG", "PP", "Pts"].map((h) => (
                        <th key={h} style={{
                          padding: "8px 12px",
                          textAlign: h === "Pareja" ? "left" : "center",
                          fontSize: 10, fontWeight: 700, color: "#334155",
                          textTransform: "uppercase", letterSpacing: "0.06em",
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.standings.map((s, idx) => {
                      const qualify = idx < 2;
                      const names   = s.team.players.map((p) => p.playerProfile.lastName).join(" / ");
                      return (
                        <tr
                          key={s.id}
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                            background: qualify ? "rgba(163,230,53,0.03)" : "transparent",
                          }}
                        >
                          {/* Position */}
                          <td style={{ padding: "12px", textAlign: "center" }}>
                            <div style={{
                              width: 26, height: 26, borderRadius: 8, margin: "0 auto",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              background: qualify ? "rgba(163,230,53,0.15)" : "rgba(255,255,255,0.05)",
                              fontSize: 12, fontWeight: 800,
                              color: qualify ? "#a3e635" : "#475569",
                              fontFamily: "var(--font-space), sans-serif",
                            }}>
                              {s.position}
                            </div>
                          </td>

                          {/* Name */}
                          <td style={{
                            padding: "12px",
                            fontSize: 13, fontWeight: qualify ? 700 : 400,
                            color: qualify ? "#f1f5f9" : "#64748b",
                            maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {qualify && (
                              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#a3e635", marginRight: 8, verticalAlign: "middle" }} />
                            )}
                            {names}
                          </td>

                          {/* Stats */}
                          {[s.matchesPlayed, s.matchesWon, s.matchesLost].map((v, i) => (
                            <td key={i} style={{ padding: "12px 8px", textAlign: "center", fontSize: 13, color: "#64748b" }}>
                              {v}
                            </td>
                          ))}

                          {/* Points */}
                          <td style={{
                            padding: "12px", textAlign: "center",
                            fontFamily: "var(--font-space), sans-serif",
                            fontSize: 14, fontWeight: 800,
                            color: qualify ? "#a3e635" : "#64748b",
                          }}>
                            {s.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Matches */}
            {group.matches.length > 0 && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ padding: "8px 16px", fontSize: 10, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Partidos
                </div>
                {group.matches.map((match, mi) => (
                  <div key={match.id} style={{ borderTop: mi > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <MatchRow match={match} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BRACKET VIEW — single / double elimination
═══════════════════════════════════════════════════════════════════════════ */
function BracketView({ stage }: { stage: Stage }) {
  const nodes    = stage.bracketNodes;
  const roundMap = new Map<number, typeof nodes>();
  for (const node of nodes) {
    if (!roundMap.has(node.round)) roundMap.set(node.round, []);
    roundMap.get(node.round)!.push(node);
  }

  const rounds    = Array.from(roundMap.keys()).sort((a, b) => b - a);
  const numRounds = rounds.length;
  const roundLabels: Record<number, { label: string; emoji: string }> = {};
  if (numRounds >= 1) roundLabels[rounds[numRounds - 1]] = { label: "Final",     emoji: "🏆" };
  if (numRounds >= 2) roundLabels[rounds[numRounds - 2]] = { label: "Semifinal", emoji: "⚡" };
  if (numRounds >= 3) roundLabels[rounds[numRounds - 3]] = { label: "Cuartos",   emoji: "⎇" };
  if (numRounds >= 4) roundLabels[rounds[numRounds - 4]] = { label: "Octavos",   emoji: "⎇" };

  const GAP_BETWEEN_COLS = 40;

  return (
    <div>
      {/* Stage header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, fontSize: 16,
          background: "rgba(163,230,53,0.1)", border: "1px solid rgba(163,230,53,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          ⎇
        </div>
        <div>
          <h2 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 16, fontWeight: 800, color: "#f8fafc" }}>
            {stage.name}
          </h2>
          <p style={{ fontSize: 11, color: "#475569" }}>Cuadro de eliminación directa</p>
        </div>
      </div>

      {/* Bracket grid — horizontal scroll */}
      <div style={{
        background: GLASS, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${GLASS_BD}`,
        borderRadius: 18, overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}>
        <div style={{ overflowX: "auto", padding: "28px 24px 32px" }}>
          <div style={{ display: "flex", gap: GAP_BETWEEN_COLS, minWidth: "max-content", alignItems: "flex-start" }}>
            {rounds.map((round, colIdx) => {
              const colNodes  = (roundMap.get(round) ?? []).sort((a, b) => a.position - b.position);
              const roundInfo = roundLabels[round];
              const label     = roundInfo?.label ?? `Ronda ${round}`;
              const emoji     = roundInfo?.emoji ?? "⎇";
              const isFinal   = colIdx === rounds.length - 1;
              const gap       = Math.pow(2, colIdx) * CARD_H - CARD_H;
              const cardW     = isFinal ? 260 : 220;

              return (
                <div key={round} style={{ display: "flex", flexDirection: "column", width: cardW }}>
                  {/* Round label */}
                  <div style={{
                    textAlign: "center", marginBottom: 16, padding: "8px 0",
                    borderBottom: `2px solid ${isFinal ? "rgba(163,230,53,0.25)" : "rgba(255,255,255,0.07)"}`,
                  }}>
                    <span style={{ fontSize: 14, marginRight: 6 }}>{emoji}</span>
                    <span style={{
                      fontFamily: "var(--font-space), sans-serif",
                      fontSize: 12, fontWeight: 800,
                      color: isFinal ? "#a3e635" : "#64748b",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                    }}>
                      {label}
                    </span>
                  </div>

                  {/* Match cards */}
                  <div style={{ display: "flex", flexDirection: "column", gap }}>
                    {colNodes.map((node) => {
                      // BYE
                      if (node.isBye && node.team) {
                        const names = node.team.players.map((p) => p.playerProfile.lastName).join(" / ");
                        return (
                          <div key={node.id} style={{
                            height: CARD_H, borderRadius: 14,
                            border: `1.5px dashed ${ACCENT_BD}`,
                            background: "rgba(163,230,53,0.04)",
                            display: "flex", alignItems: "center", padding: "0 14px", gap: 10,
                          }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                              background: "rgba(163,230,53,0.12)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 10, fontWeight: 800, color: "#a3e635",
                              fontFamily: "var(--font-space), sans-serif",
                            }}>
                              {node.team.players.map((p) => p.playerProfile.lastName[0]).join("")}
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#a3e635", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {names}
                            </span>
                            <span style={{ fontSize: 9, fontWeight: 800, color: "#a3e635", background: ACCENT_BG, padding: "2px 6px", borderRadius: 6, letterSpacing: "0.04em" }}>
                              BYE
                            </span>
                          </div>
                        );
                      }

                      // Empty slot
                      const match = node.match;
                      if (!match) {
                        return (
                          <div key={node.id} style={{
                            height: CARD_H, borderRadius: 14,
                            border: "1.5px dashed rgba(255,255,255,0.06)",
                            background: "rgba(255,255,255,0.015)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <span style={{ fontSize: 12, color: "#334155", fontStyle: "italic" }}>Por definir</span>
                          </div>
                        );
                      }

                      // Match card
                      const t1     = match.teams.find((t) => t.side === 1);
                      const t2     = match.teams.find((t) => t.side === 2);
                      const done   = match.status === "COMPLETED" || match.status === "WALKOVER";
                      const winner = match.result?.winnerId;
                      const sets   = match.sets;

                      return (
                        <div key={node.id} style={{
                          height: CARD_H, borderRadius: 14, overflow: "hidden",
                          display: "flex", flexDirection: "column",
                          border: done
                            ? "1px solid rgba(163,230,53,0.2)"
                            : "1px solid rgba(255,255,255,0.09)",
                          background: "rgba(8,16,36,0.9)",
                          boxShadow: done
                            ? "0 0 16px rgba(163,230,53,0.06)"
                            : "0 2px 12px rgba(0,0,0,0.3)",
                        }}>
                          {([t1, t2] as const).map((mt, i) => {
                            const isWinner  = done && winner === mt?.teamId;
                            const isLoser   = done && mt && winner !== mt?.teamId;
                            const initials  = mt ? mt.team.players.map((p) => p.playerProfile.lastName[0] ?? "?").join("") : "?";
                            const fullNames = mt ? mt.team.players.map((p) => p.playerProfile.lastName).join(" / ") : null;

                            return (
                              <div
                                key={i}
                                style={{
                                  flex: 1, display: "flex", alignItems: "center",
                                  padding: "0 12px", gap: 8,
                                  background: isWinner
                                    ? "rgba(163,230,53,0.09)"
                                    : "transparent",
                                  borderBottom: i === 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                                  borderLeft: isWinner
                                    ? "3px solid #a3e635"
                                    : "3px solid transparent",
                                  opacity: isLoser ? 0.55 : 1,
                                }}
                              >
                                {/* Avatar */}
                                <div style={{
                                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                  background: isWinner ? "rgba(163,230,53,0.2)" : "rgba(255,255,255,0.06)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 9, fontWeight: 800,
                                  color: isWinner ? "#a3e635" : mt ? "#64748b" : "#334155",
                                  fontFamily: "var(--font-space), sans-serif",
                                }}>
                                  {initials}
                                </div>

                                {/* Name */}
                                <span style={{
                                  flex: 1, fontSize: 12,
                                  fontWeight: isWinner ? 700 : mt ? 500 : 400,
                                  color: isWinner ? "#f1f5f9" : mt ? "#94a3b8" : "#334155",
                                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                  fontStyle: !mt ? "italic" : "normal",
                                }}>
                                  {fullNames ?? "TBD"}
                                </span>

                                {/* Score boxes */}
                                {done && sets.length > 0 && (
                                  <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                                    {sets.map((s, si) => {
                                      const myG  = i === 0 ? s.games1 : s.games2;
                                      const wonS = i === 0 ? s.games1 > s.games2 : s.games2 > s.games1;
                                      return (
                                        <div key={si} style={{
                                          width: 22, height: 22, borderRadius: 6,
                                          background: wonS ? "rgba(163,230,53,0.2)" : "rgba(255,255,255,0.04)",
                                          display: "flex", alignItems: "center", justifyContent: "center",
                                          fontSize: 11, fontWeight: wonS ? 900 : 400,
                                          color: wonS ? "#a3e635" : "#475569",
                                          fontFamily: "var(--font-space), sans-serif",
                                        }}>
                                          {myG}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Trophy */}
                                {isWinner && (
                                  <span style={{ fontSize: 13, flexShrink: 0 }}>🏆</span>
                                )}
                              </div>
                            );
                          })}
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
    </div>
  );
}
