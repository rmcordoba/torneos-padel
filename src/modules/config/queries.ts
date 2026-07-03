import { prisma } from "@/lib/prisma";

export async function getOrganizerConfig(organizerId: string) {
  return prisma.organizer.findUnique({
    where: { id: organizerId },
    include: {
      settings: true,
      members: {
        include: {
          user: { select: { id: true, email: true, name: true } },
          tournamentAccess: { select: { tournamentId: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getTournamentsByOrganizer(organizerId: string) {
  return prisma.tournament.findMany({
    where: { organizerId },
    select: { id: true, name: true, status: true },
    orderBy: { startDate: "desc" },
  });
}

export async function getCategoriesByOrganizer(organizerId: string) {
  return prisma.category.findMany({
    where: { organizerId },
    orderBy: { name: "asc" },
  });
}
