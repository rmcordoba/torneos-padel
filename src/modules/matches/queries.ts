import { prisma } from "@/lib/prisma";

export async function getFixtureByCategory(tournamentCategoryId: string) {
  const stages = await prisma.stage.findMany({
    where: { tournamentCategoryId },
    orderBy: { order: "asc" },
    include: {
      groups: {
        orderBy: { order: "asc" },
        include: {
          standings: {
            orderBy: { position: "asc" },
            include: { team: { include: { players: { include: { playerProfile: true } } } } },
          },
          matches: {
            orderBy: { matchNumber: "asc" },
            include: {
              teams: { include: { team: { include: { players: { include: { playerProfile: true } } } } } },
              sets: { orderBy: { setNumber: "asc" } },
              result: true,
            },
          },
        },
      },
      bracketNodes: {
        orderBy: [{ round: "asc" }, { position: "asc" }],
        include: {
          team: { include: { players: { include: { playerProfile: true } } } },
          match: {
            include: {
              teams: { include: { team: { include: { players: { include: { playerProfile: true } } } } } },
              sets: { orderBy: { setNumber: "asc" } },
              result: true,
            },
          },
        },
      },
    },
  });
  return stages;
}

export async function getMatchById(id: string) {
  return prisma.match.findUnique({
    where: { id },
    include: {
      teams: { include: { team: { include: { players: { include: { playerProfile: true } } } } } },
      sets: { orderBy: { setNumber: "asc" } },
      result: true,
      scheduleSlot: { include: { courtAssignment: { include: { court: true } }, venue: true } },
    },
  });
}

export async function getMatchesByStage(stageId: string) {
  return prisma.match.findMany({
    where: { stageId },
    include: {
      teams: { include: { team: true } },
      sets: { orderBy: { setNumber: "asc" } },
      result: true,
      group: true,
    },
    orderBy: { matchNumber: "asc" },
  });
}

export async function getPendingMatchesByOrganizer(organizerId: string) {
  return prisma.match.findMany({
    where: {
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      stage: {
        tournamentCategory: {
          tournament: { organizerId },
        },
      },
    },
    include: {
      teams: { include: { team: true } },
      scheduleSlot: { include: { venue: true, courtAssignment: { include: { court: true } } } },
    },
    orderBy: { scheduledAt: "asc" },
  });
}
