import { prisma } from "@/lib/prisma";

export async function getOrganizerById(id: string) {
  return prisma.organizer.findUnique({
    where: { id },
    include: { settings: true, venues: true, categories: true },
  });
}

export async function getOrganizersByUser(userId: string) {
  return prisma.userOrganizer.findMany({
    where: { userId, isActive: true },
    include: { organizer: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getOrganizerMember(userId: string, organizerId: string) {
  return prisma.userOrganizer.findUnique({
    where: { userId_organizerId: { userId, organizerId } },
  });
}

export async function listOrganizers() {
  return prisma.organizer.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getOrganizerForTournamentForm(organizerId: string) {
  return prisma.organizer.findUnique({
    where: { id: organizerId },
    include: {
      venues: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: { courts: { where: { isActive: true } } },
      },
      categories: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
      settings: true,
    },
  });
}
