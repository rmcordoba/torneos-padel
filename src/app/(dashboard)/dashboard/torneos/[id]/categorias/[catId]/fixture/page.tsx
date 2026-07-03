import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFixtureByCategory } from "@/modules/matches/queries";
import { getScheduledMatchesByCategory } from "@/modules/scheduling/queries";
import { generateFixture, classifyToPlayoff } from "@/modules/matches/actions";
import { BracketView } from "./_components/bracket-view";
import { GroupsView } from "./_components/groups-view";
import { LosersBracketView } from "./_components/losers-bracket-view";
import { MexicanoView } from "./_components/mexicano-view";
import { GenerarImagenBtn, type MatchForImage } from "./_components/fixture-image-generator";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Fixture" };

const FORMAT_LABEL: Record<string, string> = {
  SINGLE_ELIMINATION: "Eliminación directa",
  GROUP_PLAYOFF:      "Grupos + Playoff",
  DOUBLE_ELIMINATION: "Doble eliminación",
  ROUND_ROBIN:        "Liga (todos contra todos)",
  AMERICANO:          "Americano",
  MEXICANO:           "Mexicano",
};

export default async function FixturePage({
  params,
}: {
  params: Promise<{ id: string; catId: string }>;
}) {
  const { id: tournamentId, catId } = await params;

  const session = await auth();
  if (!session?.user) redirect("/login");

  const tc = await prisma.tournamentCategory.findUnique({
    where: { id: catId },
    include: {
      tournament: { include: { organizer: { select: { name: true } } } },
      category: true,
      registrations: { where: { status: "APPROVED" } },
    },
  });

  if (!tc || tc.tournament.id !== tournamentId) notFound();

  const [stages, scheduledSlots] = await Promise.all([
    getFixtureByCategory(catId),
    getScheduledMatchesByCategory(catId),
  ]);
  const returnPath = `/dashboard/torneos/${tournamentId}/categorias/${catId}/fixture`;

  const matchesForImage: MatchForImage[] = scheduledSlots
    .filter((s) => s.match != null)
    .map((s) => {
      const teams = s.match!.teams;
      const toNames = (side: 1 | 2) =>
        (teams.find((t) => t.side === side)?.team.players ?? []).map(
          (tp: { playerProfile: { firstName: string; lastName: string } }) =>
            `${tp.playerProfile.firstName[0]}. ${tp.playerProfile.lastName}`
        );
      return {
        id:         s.id,
        date:       s.date.toISOString().slice(0, 10),
        startTime:  s.startTime.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
        venueName:  s.venue.name,
        courtName:  s.courtAssignment?.court.name ?? null,
        team1:      toNames(1),
        team2:      toNames(2),
      };
    });

  const hasFixture   = stages.length > 0;
  const approvedCount = tc.registrations.length;

  const groupStage   = stages.find((s) => s.type === "GROUPS");
  const playoffStage = stages.find((s) => s.type === "SINGLE_ELIMINATION" && s.order === 2);
  const allGroupMatchesDone =
    tc.format === "GROUP_PLAYOFF" &&
    groupStage !== undefined &&
    groupStage.groups.every((g) =>
      g.matches.length > 0 &&
      g.matches.every((m) => m.status === "COMPLETED" || m.status === "WALKOVER")
    );
  const playoffIsPlaceholder = playoffStage !== undefined && playoffStage.bracketNodes.length === 0;

  return (
    <div style={{ maxWidth: 1100, display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Breadcrumb */}
      <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
        <Link href="/dashboard/torneos" style={{ color: "#475569", textDecoration: "none" }}>
          Torneos
        </Link>
        <span style={{ color: "#334155" }}>/</span>
        <Link href={`/dashboard/torneos/${tournamentId}`} style={{ color: "#475569", textDecoration: "none" }}>
          {tc.tournament.name}
        </Link>
        <span style={{ color: "#334155" }}>/</span>
        <Link href={`/dashboard/torneos/${tournamentId}/categorias/${catId}`} style={{ color: "#475569", textDecoration: "none" }}>
          {tc.category.name}
        </Link>
        <span style={{ color: "#334155" }}>/</span>
        <span style={{ color: "#94a3b8", fontWeight: 700 }}>Fixture</span>
      </nav>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 28, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.02em", marginBottom: 6 }}>
            Fixture · {tc.category.name}
          </h1>
          <p style={{ fontSize: 13, color: "#475569" }}>
            {tc.tournament.name} · <span style={{ color: "#a3e635", fontWeight: 600 }}>{FORMAT_LABEL[tc.format] ?? tc.format}</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {matchesForImage.length > 0 && (
            <GenerarImagenBtn
              tournamentName={tc.tournament.name}
              categoryName={tc.category.name}
              organizerName={tc.tournament.organizer.name}
              matches={matchesForImage}
            />
          )}
          <Link
            href="/dashboard/calendario"
            style={{
              padding: "9px 18px", borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)", color: "#94a3b8",
              fontFamily: "inherit", fontSize: 13, fontWeight: 700,
              cursor: "pointer", textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 7,
            }}
          >
            📅 Ver agenda
          </Link>
        </div>
      </div>

      {/* Sin fixture */}
      {!hasFixture && (
        <div style={{
          borderRadius: 18, border: "1px dashed rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.02)", padding: "64px 24px", textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 14, opacity: .3 }}>⚡</div>
          <h3 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 18, fontWeight: 800, color: "#f8fafc", marginBottom: 8 }}>
            Sin fixture generado
          </h3>
          <p style={{ fontSize: 13, color: "#475569", maxWidth: 360, margin: "0 auto 24px" }}>
            {approvedCount < 2
              ? `Se necesitan al menos 2 equipos aprobados. Actualmente hay ${approvedCount}.`
              : `Hay ${approvedCount} equipos aprobados listos para competir.`}
          </p>
          {approvedCount >= 2 && (
            <form action={async () => { "use server"; await generateFixture(catId); }}>
              <button
                type="submit"
                style={{ padding: "12px 30px", borderRadius: 12, background: "#a3e635", border: "none", color: "#080e1a", fontFamily: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 0 24px rgba(163,230,53,0.3)" }}
              >
                ⚡ Generar fixture
              </button>
            </form>
          )}
        </div>
      )}

      {/* Contenido */}
      {hasFixture && (
        <>
          {(tc.format === "MEXICANO" || tc.format === "AMERICANO") &&
            stages.map((stage) =>
              stage.type === "GROUPS" ? (
                <MexicanoView
                  key={stage.id}
                  stage={stage}
                  returnPath={returnPath}
                  formatLabel={tc.format === "MEXICANO" ? "Mexicano" : "Americano"}
                />
              ) : null
            )}

          {tc.format === "ROUND_ROBIN" &&
            stages.map((stage) =>
              stage.type === "GROUPS" ? (
                <GroupsView key={stage.id} stage={stage} returnPath={returnPath} />
              ) : null
            )}

          {tc.format === "SINGLE_ELIMINATION" &&
            stages.map((stage) =>
              stage.type === "SINGLE_ELIMINATION" ? (
                <BracketView key={stage.id} stage={stage} returnPath={returnPath} />
              ) : null
            )}

          {tc.format === "GROUP_PLAYOFF" &&
            stages.map((stage) => (
              <div key={stage.id} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {stage.type === "GROUPS" && (
                  <GroupsView stage={stage} returnPath={returnPath} />
                )}
                {stage.type === "SINGLE_ELIMINATION" && !playoffIsPlaceholder && (
                  <BracketView stage={stage} returnPath={returnPath} />
                )}
              </div>
            ))}

          {tc.format === "DOUBLE_ELIMINATION" &&
            stages.map((stage) => (
              <div key={stage.id} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {stage.type === "SINGLE_ELIMINATION" && (
                  <BracketView stage={stage} returnPath={returnPath} />
                )}
                {stage.type === "DOUBLE_ELIMINATION" && (
                  <LosersBracketView stage={stage} returnPath={returnPath} />
                )}
              </div>
            ))}
        </>
      )}

      {/* Avanzar al playoff */}
      {allGroupMatchesDone && playoffIsPlaceholder && groupStage && (
        <div style={{
          borderRadius: 14,
          border: "1px solid rgba(163,230,53,.3)",
          background: "rgba(163,230,53,.08)",
          padding: "20px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          flexWrap: "wrap",
        }}>
          <div>
            <p style={{ fontFamily: "var(--font-space), sans-serif", fontWeight: 800, color: "#a3e635", marginBottom: 4 }}>
              Fase de grupos completada
            </p>
            <p style={{ fontSize: 13, color: "#64748b" }}>
              Todos los partidos de grupos terminaron. Generá el cuadro de playoff con los clasificados.
            </p>
          </div>
          <form action={async () => { "use server"; await classifyToPlayoff(groupStage.id); }}>
            <button
              type="submit"
              style={{ padding: "11px 24px", borderRadius: 11, background: "#a3e635", border: "none", color: "#080e1a", fontFamily: "inherit", fontSize: 13, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 0 20px rgba(163,230,53,0.3)" }}
            >
              → Generar playoff
            </button>
          </form>
        </div>
      )}

      {/* Volver */}
      <Link
        href={`/dashboard/torneos/${tournamentId}/categorias/${catId}`}
        style={{ fontSize: 13, color: "#475569", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        ← Volver a inscripciones
      </Link>
    </div>
  );
}
