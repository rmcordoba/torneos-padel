import { prisma } from "@/lib/prisma";

export async function searchPlayers(query: string, limit = 10) {
  return prisma.playerProfile.findMany({
    where: {
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { dni: { contains: query, mode: "insensitive" } },
        { user: { email: { contains: query, mode: "insensitive" } } },
      ],
    },
    include: { user: { select: { email: true } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: limit,
  });
}

export async function getPlayerProfileForEdit(playerId: string) {
  return prisma.playerProfile.findUnique({
    where: { id: playerId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      dni: true,
      birthDate: true,
      user: { select: { email: true } },
    },
  });
}

const PLAYER_ORG_PAGE_SIZE = 10;

/** Lean scoped search for the dashboard global search dropdown */
export async function searchPlayersByOrganizer(
  organizerId: string,
  query: string,
  limit = 6
) {
  return prisma.playerProfile.findMany({
    where: {
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { dni: { contains: query, mode: "insensitive" } },
        { user: { email: { contains: query, mode: "insensitive" } } },
      ],
      teamPlayers: {
        some: {
          team: {
            registrations: {
              some: {
                tournamentCategory: {
                  tournament: { organizerId },
                },
              },
            },
          },
        },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      user: { select: { email: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: limit,
  });
}

/** Players who have registered in at least one tournament of this organizer */
export async function getPlayersByOrganizer(
  organizerId: string,
  search?: string,
  page = 1
) {
  const skip = (page - 1) * PLAYER_ORG_PAGE_SIZE;

  const where = {
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { dni: { contains: search, mode: "insensitive" as const } },
            { user: { email: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    teamPlayers: {
      some: {
        team: {
          registrations: {
            some: {
              tournamentCategory: {
                tournament: { organizerId },
              },
            },
          },
        },
      },
    },
  };

  const [players, total] = await prisma.$transaction([
    prisma.playerProfile.findMany({
      where,
      include: {
        user: { select: { email: true } },
        _count: { select: { teamPlayers: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip,
      take: PLAYER_ORG_PAGE_SIZE,
    }),
    prisma.playerProfile.count({ where }),
  ]);

  return { players, total, pageSize: PLAYER_ORG_PAGE_SIZE };
}

export async function getPlayerProfile(playerId: string) {
  return prisma.playerProfile.findUnique({
    where: { id: playerId },
    include: {
      user: { select: { email: true, createdAt: true } },
      teamPlayers: {
        include: {
          team: {
            include: {
              players: {
                include: { playerProfile: true },
              },
              registrations: {
                include: {
                  tournamentCategory: {
                    include: {
                      category: true,
                      tournament: true,
                    },
                  },
                },
                orderBy: { createdAt: "desc" },
              },
            },
          },
        },
      },
    },
  });
}
