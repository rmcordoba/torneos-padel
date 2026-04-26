import { prisma } from "@/lib/prisma";

export async function getDashboardStats(organizerId: string) {
  const [
    totalTournaments,
    activeTournaments,
    pendingRegistrations,
    totalPlayers,
    pendingMatches,
  ] = await Promise.all([
    prisma.tournament.count({ where: { organizerId } }),
    prisma.tournament.count({
      where: {
        organizerId,
        status: { in: ["IN_PROGRESS", "REGISTRATION_OPEN"] },
      },
    }),
    prisma.registration.count({
      where: {
        status: "PENDING",
        tournamentCategory: { tournament: { organizerId } },
      },
    }),
    prisma.playerProfile.count({
      where: {
        teamPlayers: {
          some: {
            team: {
              registrations: {
                some: {
                  tournamentCategory: { tournament: { organizerId } },
                },
              },
            },
          },
        },
      },
    }),
    prisma.match.count({
      where: {
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        stage: {
          tournamentCategory: { tournament: { organizerId } },
        },
      },
    }),
  ]);

  return {
    totalTournaments,
    activeTournaments,
    pendingRegistrations,
    totalPlayers,
    pendingMatches,
  };
}

export async function getRecentTournaments(organizerId: string, limit = 5) {
  return prisma.tournament.findMany({
    where: { organizerId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      categories: {
        include: {
          category: true,
          _count: { select: { registrations: true } },
        },
      },
    },
  });
}

export async function getUpcomingMatches(organizerId: string, limit = 5) {
  return prisma.match.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { gte: new Date() },
      stage: {
        tournamentCategory: { tournament: { organizerId } },
      },
    },
    orderBy: { scheduledAt: "asc" },
    take: limit,
    include: {
      teams: { include: { team: { include: { players: { include: { playerProfile: true } } } } } },
      scheduleSlot: {
        include: {
          venue: true,
          courtAssignment: { include: { court: true } },
        },
      },
      stage: {
        include: {
          tournamentCategory: {
            include: { tournament: true, category: true },
          },
        },
      },
    },
  });
}
