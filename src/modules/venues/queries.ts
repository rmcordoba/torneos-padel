import { prisma } from "@/lib/prisma";

export async function getVenuesByOrganizer(organizerId: string) {
  return prisma.venue.findMany({
    where: { organizerId, isActive: true },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { courts: { where: { isActive: true } } } },
    },
  });
}

export async function getVenueById(venueId: string, organizerId: string) {
  return prisma.venue.findFirst({
    where: { id: venueId, organizerId },
    include: {
      courts: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
    },
  });
}
