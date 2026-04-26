"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrganizersByUser } from "@/modules/organizers/queries";

// Default points when no RankingRule is configured
const DEFAULT_POINTS: Record<number, number> = {
  1: 100,
  2: 60,
  3: 40,
  4: 20,
};
const PARTICIPATION_POINTS = 10;

export async function recalculateRanking(
  rankingTableId: string
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const memberships = await getOrganizersByUser(session.user.id);
  if (!memberships.length) return { error: "Sin organización" };
  const organizerId = memberships[0].organizerId;

  const table = await prisma.rankingTable.findFirst({
    where: { id: rankingTableId, organizerId },
    include: { rules: { orderBy: { placement: "asc" } } },
  });
  if (!table) return { error: "Tabla no encontrada" };

  // Points map: placement → points
  const pointsMap: Record<number, number> =
    table.rules.length > 0
      ? Object.fromEntries(table.rules.map((r) => [r.placement, r.points]))
      : DEFAULT_POINTS;

  // Find completed tournament categories for this organizer
  // filtered by categoryId if the table has one
  const completedCategories = await prisma.tournamentCategory.findMany({
    where: {
      tournament: { organizerId },
      status: "COMPLETED",
      ...(table.categoryId ? { categoryId: table.categoryId } : {}),
    },
    include: {
      stages: {
        where: { isCompleted: true },
        include: {
          // SE / GROUP_PLAYOFF: final bracket node (round=1)
          bracketNodes: {
            where: { round: 1 },
            include: {
              team: { include: { players: { include: { playerProfile: true } } } },
              match: {
                include: {
                  teams: {
                    include: { team: { include: { players: { include: { playerProfile: true } } } } },
                  },
                  result: true,
                },
              },
            },
          },
          // Group-based formats: standings + matches
          groups: {
            orderBy: { order: "desc" },
            include: {
              standings: {
                orderBy: { position: "asc" },
                include: {
                  team: { include: { players: { include: { playerProfile: true } } } },
                },
              },
              matches: {
                include: {
                  result: true,
                  teams: {
                    include: { team: { include: { players: { include: { playerProfile: true } } } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Accumulate points per player
  const playerPoints: Record<string, { points: number; played: number; name: string }> = {};

  const addPoints = (playerProfileId: string, firstName: string, lastName: string, pts: number) => {
    if (!playerPoints[playerProfileId]) {
      playerPoints[playerProfileId] = { points: 0, played: 0, name: `${firstName} ${lastName}` };
    }
    playerPoints[playerProfileId].points += pts;
    playerPoints[playerProfileId].played += 1;
  };

  for (const tc of completedCategories) {
    const placedTeams = new Set<string>();

    if (tc.format === "SINGLE_ELIMINATION" || tc.format === "GROUP_PLAYOFF") {
      const seStage = tc.stages.find((s) => s.type === "SINGLE_ELIMINATION");
      const finalNode = seStage?.bracketNodes[0];
      if (finalNode?.team && finalNode.teamId) {
        const pts = pointsMap[1] ?? DEFAULT_POINTS[1] ?? PARTICIPATION_POINTS;
        for (const tp of finalNode.team.players) {
          addPoints(tp.playerProfileId, tp.playerProfile.firstName, tp.playerProfile.lastName, pts);
        }
        placedTeams.add(finalNode.teamId);
      }
      if (finalNode?.match) {
        const runnerUp = finalNode.match.teams.find((mt) => mt.teamId !== finalNode.teamId);
        if (runnerUp) {
          const pts = pointsMap[2] ?? DEFAULT_POINTS[2] ?? PARTICIPATION_POINTS;
          for (const tp of runnerUp.team.players) {
            addPoints(tp.playerProfileId, tp.playerProfile.firstName, tp.playerProfile.lastName, pts);
          }
          placedTeams.add(runnerUp.teamId);
        }
      }
    } else if (tc.format === "ROUND_ROBIN" || tc.format === "AMERICANO") {
      // Single GROUPS stage — standings ordered by position asc
      const groupsStage = tc.stages.find((s) => s.type === "GROUPS");
      const standings = groupsStage?.groups[0]?.standings ?? [];
      for (const standing of standings.slice(0, 2)) {
        if (!standing.team) continue;
        const pts = pointsMap[standing.position] ?? DEFAULT_POINTS[standing.position] ?? PARTICIPATION_POINTS;
        for (const tp of standing.team.players) {
          addPoints(tp.playerProfileId, tp.playerProfile.firstName, tp.playerProfile.lastName, pts);
        }
        placedTeams.add(standing.teamId);
      }
    } else if (tc.format === "MEXICANO") {
      // Aggregate gamesWon across all rounds; top 2 get placement points
      const groupsStage = tc.stages.find((s) => s.type === "GROUPS");
      if (groupsStage) {
        const teamMap = new Map<string, { gw: number; players: Array<{ playerProfileId: string; playerProfile: { firstName: string; lastName: string } }> }>();
        for (const group of groupsStage.groups) {
          for (const match of group.matches) {
            for (const mt of match.teams) {
              if (!teamMap.has(mt.teamId)) teamMap.set(mt.teamId, { gw: 0, players: mt.team.players });
            }
            const t1 = match.teams.find((t) => t.side === 1);
            const t2 = match.teams.find((t) => t.side === 2);
            if (t1 && match.result?.winnerId === t1.teamId) teamMap.get(t1.teamId)!.gw += 2;
            if (t2 && match.result?.winnerId === t2.teamId) teamMap.get(t2.teamId)!.gw += 2;
          }
        }
        const sorted = Array.from(teamMap.entries()).sort(([, a], [, b]) => b.gw - a.gw);
        for (let i = 0; i < Math.min(sorted.length, 2); i++) {
          const [teamId, entry] = sorted[i];
          const placement = i + 1;
          const pts = pointsMap[placement] ?? DEFAULT_POINTS[placement] ?? PARTICIPATION_POINTS;
          for (const tp of entry.players) {
            addPoints(tp.playerProfileId, tp.playerProfile.firstName, tp.playerProfile.lastName, pts);
          }
          placedTeams.add(teamId);
        }
      }
    } else if (tc.format === "DOUBLE_ELIMINATION") {
      // Gran Final: highest-order group in the LB stage
      const deStage = tc.stages.find((s) => s.type === "DOUBLE_ELIMINATION");
      // groups ordered desc → [0] is the Gran Final
      const gfGroup = deStage?.groups[0];
      const gfMatch = gfGroup?.matches.find((m) => m.result?.winnerId);
      if (gfMatch?.result?.winnerId) {
        const winner = gfMatch.teams.find((t) => t.teamId === gfMatch.result!.winnerId);
        const loser = gfMatch.teams.find((t) => t.teamId !== gfMatch.result!.winnerId);
        if (winner?.team) {
          const pts = pointsMap[1] ?? DEFAULT_POINTS[1] ?? PARTICIPATION_POINTS;
          for (const tp of winner.team.players) {
            addPoints(tp.playerProfileId, tp.playerProfile.firstName, tp.playerProfile.lastName, pts);
          }
          placedTeams.add(winner.teamId);
        }
        if (loser?.team) {
          const pts = pointsMap[2] ?? DEFAULT_POINTS[2] ?? PARTICIPATION_POINTS;
          for (const tp of loser.team.players) {
            addPoints(tp.playerProfileId, tp.playerProfile.firstName, tp.playerProfile.lastName, pts);
          }
          placedTeams.add(loser.teamId);
        }
      }
    }

    // Participation points for everyone else (approved registrations not in top 2)
    const participants = await prisma.registration.findMany({
      where: {
        tournamentCategoryId: tc.id,
        status: "APPROVED",
        ...(placedTeams.size > 0
          ? { teamId: { notIn: Array.from(placedTeams) } }
          : {}),
      },
      include: {
        team: { include: { players: { include: { playerProfile: true } } } },
      },
    });

    const pts = pointsMap[99] ?? PARTICIPATION_POINTS;
    for (const reg of participants) {
      for (const tp of reg.team.players) {
        addPoints(tp.playerProfileId, tp.playerProfile.firstName, tp.playerProfile.lastName, pts);
      }
    }
  }

  // Sort by points descending, assign positions
  const sorted = Object.entries(playerPoints).sort(([, a], [, b]) => b.points - a.points);

  await prisma.$transaction(async (tx) => {
    // Clear existing entries
    await tx.rankingEntry.deleteMany({ where: { rankingTableId } });

    // Insert new entries
    for (let i = 0; i < sorted.length; i++) {
      const [playerProfileId, data] = sorted[i];
      await tx.rankingEntry.create({
        data: {
          rankingTableId,
          playerProfileId,
          position: i + 1,
          points: data.points,
          tournamentsPlayed: data.played,
          updatedAt: new Date(),
        },
      });
    }
  });

  revalidatePath("/dashboard/ranking");
  return {};
}

// ─── Reglas de puntuación ─────────────────────────────────────────────────────

export async function addRankingRule(
  rankingTableId: string,
  placement: number,
  points: number,
  description?: string
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const memberships = await getOrganizersByUser(session.user.id);
  if (!memberships.length) return { error: "Sin organización" };

  const table = await prisma.rankingTable.findFirst({
    where: { id: rankingTableId, organizerId: memberships[0].organizerId },
  });
  if (!table) return { error: "Tabla no encontrada" };

  const existing = await prisma.rankingRule.findFirst({
    where: { rankingTableId, placement },
  });

  if (existing) {
    await prisma.rankingRule.update({
      where: { id: existing.id },
      data: { points, description: description || null },
    });
  } else {
    await prisma.rankingRule.create({
      data: { rankingTableId, placement, points, description: description || null },
    });
  }

  revalidatePath("/dashboard/ranking");
  return {};
}

export async function deleteRankingRule(ruleId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  const memberships = await getOrganizersByUser(session.user.id);
  if (!memberships.length) return;

  const rule = await prisma.rankingRule.findFirst({
    where: { id: ruleId, rankingTable: { organizerId: memberships[0].organizerId } },
  });
  if (!rule) return;

  await prisma.rankingRule.delete({ where: { id: ruleId } });
  revalidatePath("/dashboard/ranking");
}

export async function deleteRankingTable(tableId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const memberships = await getOrganizersByUser(session.user.id);
  if (!memberships.length) return { error: "Sin organización" };

  await prisma.rankingTable.deleteMany({
    where: { id: tableId, organizerId: memberships[0].organizerId },
  });

  revalidatePath("/dashboard/ranking");
  return {};
}

export async function createRankingTable(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const memberships = await getOrganizersByUser(session.user.id);
  if (!memberships.length) return { error: "Sin organización" };

  const name = (formData.get("name") as string)?.trim();
  const categoryId = (formData.get("categoryId") as string) || undefined;

  if (!name) return { error: "El nombre es requerido" };

  await prisma.rankingTable.create({
    data: {
      organizerId: memberships[0].organizerId,
      name,
      categoryId: categoryId || null,
      isActive: true,
    },
  });

  revalidatePath("/dashboard/ranking");
  return null;
}
