import { prisma } from "@/lib/prisma";

export async function getRankingTablesByOrganizer(organizerId: string) {
  return prisma.rankingTable.findMany({
    where: { organizerId, isActive: true },
    include: {
      rules: { orderBy: { placement: "asc" } },
      _count: { select: { entries: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getRankingEntries(rankingTableId: string) {
  return prisma.rankingEntry.findMany({
    where: { rankingTableId },
    include: {
      playerProfile: { include: { user: { select: { email: true } } } },
      team: { include: { players: { include: { playerProfile: true } } } },
    },
    orderBy: { position: "asc" },
  });
}

export async function getCategoriesForOrganizer(organizerId: string) {
  return prisma.category.findMany({
    where: { organizerId, isActive: true },
    orderBy: { name: "asc" },
  });
}
