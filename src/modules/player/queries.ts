import { prisma } from "@/lib/prisma";

export async function getPlayerProfile(userId: string) {
  return prisma.playerProfile.findUnique({ where: { userId } });
}

export async function getOpenTournaments() {
  return prisma.tournament.findMany({
    where: {
      isPublic: true,
      categories: { some: { status: "REGISTRATION_OPEN" } },
    },
    include: {
      organizer: { select: { name: true, slug: true } },
      categories: {
        where: { status: "REGISTRATION_OPEN" },
        include: {
          category: { select: { name: true, gender: true } },
          _count: { select: { registrations: true } },
        },
      },
    },
    orderBy: { startDate: "asc" },
  });
}

export async function getPlayerRegistrations(userId: string) {
  const profile = await prisma.playerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return [];

  return prisma.registration.findMany({
    where: {
      team: { players: { some: { playerProfileId: profile.id } } },
    },
    include: {
      tournamentCategory: {
        include: {
          tournament: { select: { name: true, startDate: true, endDate: true } },
          category: { select: { name: true } },
        },
      },
      team: {
        include: {
          players: {
            include: {
              playerProfile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
