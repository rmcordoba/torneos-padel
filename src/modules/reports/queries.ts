import { prisma } from "@/lib/prisma";

export async function getRegistrationReport(organizerId: string) {
  const tournamentCategories = await prisma.tournamentCategory.findMany({
    where: { tournament: { organizerId } },
    include: {
      tournament: { select: { id: true, name: true } },
      category: { select: { name: true } },
      _count: {
        select: {
          registrations: true,
        },
      },
    },
    orderBy: [
      { tournament: { startDate: "desc" } },
      { category: { name: "asc" } },
    ],
  });

  // Count by status per category
  const withStatusCounts = await Promise.all(
    tournamentCategories.map(async (tc) => {
      const counts = await prisma.registration.groupBy({
        by: ["status"],
        where: { tournamentCategoryId: tc.id },
        _count: true,
      });
      const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count]));
      return {
        tournamentId: tc.tournament.id,
        tournamentName: tc.tournament.name,
        categoryName: tc.category.name,
        tournamentCategoryId: tc.id,
        total: tc._count.registrations,
        approved: byStatus["APPROVED"] ?? 0,
        pending: byStatus["PENDING"] ?? 0,
        rejected: byStatus["REJECTED"] ?? 0,
      };
    })
  );

  return withStatusCounts;
}

export async function getMatchReport(organizerId: string) {
  const stages = await prisma.stage.findMany({
    where: { tournamentCategory: { tournament: { organizerId } } },
    include: {
      tournamentCategory: {
        include: {
          tournament: { select: { id: true, name: true } },
          category: { select: { name: true } },
        },
      },
      _count: { select: { matches: true } },
    },
  });

  const withMatchCounts = await Promise.all(
    stages.map(async (stage) => {
      const [played, pending] = await Promise.all([
        prisma.match.count({
          where: { stageId: stage.id, result: { isNot: null } },
        }),
        prisma.match.count({
          where: { stageId: stage.id, result: null },
        }),
      ]);
      return {
        tournamentId: stage.tournamentCategory.tournament.id,
        tournamentName: stage.tournamentCategory.tournament.name,
        categoryName: stage.tournamentCategory.category.name,
        stageName: stage.name,
        stageType: stage.type,
        total: stage._count.matches,
        played,
        pending,
      };
    })
  );

  return withMatchCounts;
}

export async function getChampionsReport(organizerId: string) {
  const completed = await prisma.tournamentCategory.findMany({
    where: { status: "COMPLETED", tournament: { organizerId } },
    include: {
      tournament: { select: { name: true, startDate: true, endDate: true } },
      category: { select: { name: true } },
      stages: {
        include: {
          bracketNodes: {
            where: { round: 1, teamId: { not: null } },
            include: {
              team: { include: { players: { include: { playerProfile: { select: { firstName: true, lastName: true } } } } } },
            },
          },
          groups: {
            orderBy: { order: "desc" },
            take: 1, // último grupo (Gran Final para DE, único para liga/americano)
            include: {
              standings: {
                where: { position: 1 },
                include: {
                  team: { include: { players: { include: { playerProfile: { select: { firstName: true, lastName: true } } } } } },
                },
              },
              matches: {
                where: { status: { in: ["COMPLETED", "WALKOVER"] } },
                include: {
                  result: true,
                  teams: {
                    include: {
                      team: { include: { players: { include: { playerProfile: { select: { firstName: true, lastName: true } } } } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { tournament: { startDate: "desc" } },
  });

  const results: {
    tournamentName: string;
    categoryName: string;
    startDate: Date;
    endDate: Date;
    champions: string[];
    format: string;
  }[] = [];

  for (const tc of completed) {
    const base = {
      tournamentName: tc.tournament.name,
      categoryName: tc.category.name,
      startDate: tc.tournament.startDate,
      endDate: tc.tournament.endDate,
      format: tc.format,
    };

    if (tc.format === "SINGLE_ELIMINATION" || tc.format === "GROUP_PLAYOFF") {
      // Campeón = teamId en el nodo final del bracket SINGLE_ELIMINATION
      const seStage = tc.stages.find((s) => s.type === "SINGLE_ELIMINATION");
      const finalNode = seStage?.bracketNodes[0];
      if (finalNode?.team) {
        results.push({
          ...base,
          champions: finalNode.team.players.map((tp) => `${tp.playerProfile.firstName} ${tp.playerProfile.lastName}`),
        });
      }
    } else if (tc.format === "ROUND_ROBIN" || tc.format === "AMERICANO") {
      // Campeón = posición 1 en el GroupStanding del único grupo
      const groupsStage = tc.stages.find((s) => s.type === "GROUPS");
      const topStanding = groupsStage?.groups[0]?.standings[0];
      if (topStanding?.team) {
        results.push({
          ...base,
          champions: topStanding.team.players.map((tp) => `${tp.playerProfile.firstName} ${tp.playerProfile.lastName}`),
        });
      }
    } else if (tc.format === "MEXICANO") {
      // Campeón = ganador con más games sumados de todos los partidos
      const groupsStage = tc.stages.find((s) => s.type === "GROUPS");
      if (groupsStage) {
        const wins: Record<string, { gw: number; team: { players: { playerProfile: { firstName: string; lastName: string } }[] } }> = {};
        for (const g of groupsStage.groups) {
          for (const m of g.matches) {
            for (const mt of m.teams) {
              if (!wins[mt.teamId]) wins[mt.teamId] = { gw: 0, team: mt.team };
            }
            const t1 = m.teams.find((t) => t.side === 1);
            const t2 = m.teams.find((t) => t.side === 2);
            if (m.result?.winnerId === t1?.teamId && t1) wins[t1.teamId].gw += 2;
            if (m.result?.winnerId === t2?.teamId && t2) wins[t2.teamId].gw += 2;
          }
        }
        const champion = Object.values(wins).sort((a, b) => b.gw - a.gw)[0];
        if (champion) {
          results.push({
            ...base,
            champions: champion.team.players.map((tp) => `${tp.playerProfile.firstName} ${tp.playerProfile.lastName}`),
          });
        }
      }
    } else if (tc.format === "DOUBLE_ELIMINATION") {
      // Campeón = ganador de la Gran Final (último grupo del stage DOUBLE_ELIMINATION)
      const deStage = tc.stages.find((s) => s.type === "DOUBLE_ELIMINATION");
      const gfGroup = deStage?.groups[0]; // ya viene ordenado desc, así que es el último
      const gfMatch = gfGroup?.matches.find((m) => m.result?.winnerId);
      if (gfMatch?.result?.winnerId) {
        const winnerSide = gfMatch.teams.find((t) => t.teamId === gfMatch.result!.winnerId);
        if (winnerSide?.team) {
          results.push({
            ...base,
            champions: winnerSide.team.players.map((tp) => `${tp.playerProfile.firstName} ${tp.playerProfile.lastName}`),
          });
        }
      }
    }
  }

  return results;
}
