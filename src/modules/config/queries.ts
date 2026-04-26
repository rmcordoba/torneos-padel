import { prisma } from "@/lib/prisma";

export async function getOrganizerConfig(organizerId: string) {
  return prisma.organizer.findUnique({
    where: { id: organizerId },
    include: {
      settings: true,
      members: {
        include: { user: { select: { id: true, email: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getCategoriesByOrganizer(organizerId: string) {
  return prisma.category.findMany({
    where: { organizerId },
    orderBy: { name: "asc" },
  });
}
