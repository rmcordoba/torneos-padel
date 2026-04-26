import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFixtureByCategory } from "@/modules/matches/queries";
import { generateFixture, classifyToPlayoff } from "@/modules/matches/actions";
import { BracketView } from "./_components/bracket-view";
import { GroupsView } from "./_components/groups-view";
import { LosersBracketView } from "./_components/losers-bracket-view";
import { MexicanoView } from "./_components/mexicano-view";
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
      tournament: true,
      category: true,
      registrations: { where: { status: "APPROVED" } },
    },
  });

  if (!tc || tc.tournament.id !== tournamentId) notFound();

  const stages = await getFixtureByCategory(catId);
  const returnPath = `/dashboard/torneos/${tournamentId}/categorias/${catId}/fixture`;

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
        <Link href="/dashboard/torneos" style={{ color: "var(--text-faint)", textDecoration: "none" }}>
          Torneos
        </Link>
        <span style={{ color: "var(--text-darkest)" }}>/</span>
        <Link href={`/dashboard/torneos/${tournamentId}`} style={{ color: "var(--text-faint)", textDecoration: "none" }}>
          {tc.tournament.name}
        </Link>
        <span style={{ color: "var(--text-darkest)" }}>/</span>
        <Link href={`/dashboard/torneos/${tournamentId}/categorias/${catId}`} style={{ color: "var(--text-faint)", textDecoration: "none" }}>
          {tc.category.name}
        </Link>
        <span style={{ color: "var(--text-darkest)" }}>/</span>
        <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Fixture</span>
      </nav>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            Fixture · {tc.category.name}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-faint)" }}>
            {tc.tournament.name} · {FORMAT_LABEL[tc.format] ?? tc.format}
          </p>
        </div>
        <Link
          href="/dashboard/calendario"
          style={{
            padding: "9px 18px", borderRadius: 9,
            border: "1px solid var(--border-default)",
            background: "transparent", color: "var(--text-muted)",
            fontFamily: "inherit", fontSize: 13, fontWeight: 600,
            cursor: "pointer", textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 7,
            transition: "all .12s",
          }}
        >
          📅 Ver agenda
        </Link>
      </div>

      {/* Sin fixture */}
      {!hasFixture && (
        <div style={{
          borderRadius: 14, border: "1px dashed var(--border-default)",
          background: "var(--bg-surface)", padding: "60px 24px", textAlign: "center",
        }}>
          <div style={{ fontSize: 44, marginBottom: 12, opacity: .5 }}>⚡</div>
          <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
            Sin fixture generado
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-faint)", maxWidth: 360, margin: "0 auto 24px" }}>
            {approvedCount < 2
              ? `Se necesitan al menos 2 equipos aprobados. Actualmente hay ${approvedCount}.`
              : `Hay ${approvedCount} equipos aprobados listos para competir.`}
          </p>
          {approvedCount >= 2 && (
            <form action={async () => { "use server"; await generateFixture(catId); }}>
              <button
                type="submit"
                style={{ padding: "10px 28px", borderRadius: 10, background: "var(--accent)", border: "none", color: "#0f172a", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
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
            <p style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, color: "var(--accent)", marginBottom: 4 }}>
              Fase de grupos completada
            </p>
            <p style={{ fontSize: 13, color: "var(--text-faint)" }}>
              Todos los partidos de grupos terminaron. Generá el cuadro de playoff con los clasificados.
            </p>
          </div>
          <form action={async () => { "use server"; await classifyToPlayoff(groupStage.id); }}>
            <button
              type="submit"
              style={{ padding: "10px 22px", borderRadius: 9, background: "var(--accent)", border: "none", color: "#0f172a", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              → Generar playoff
            </button>
          </form>
        </div>
      )}

      {/* Volver */}
      <Link
        href={`/dashboard/torneos/${tournamentId}/categorias/${catId}`}
        style={{ fontSize: 13, color: "var(--text-faint)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        ← Volver a inscripciones
      </Link>
    </div>
  );
}
