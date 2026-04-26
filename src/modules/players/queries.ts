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

/** Players who have registered in at least one tournament of this organizer */
export async function getPlayersByOrganizer(
  organizerId: string,
  search?: string
) {
  return prisma.playerProfile.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { dni: { contains: search, mode: "insensitive" } },
              { user: { email: { contains: search, mode: "insensitive" } } },
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
    },
    include: {
      user: { select: { email: true } },
      _count: { select: { teamPlayers: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 60,
  });
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
