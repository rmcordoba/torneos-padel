import { prisma } from "@/lib/prisma";
import type { RegistrationStatus } from "@prisma/client";

export async function getRegistrationsByTournamentCategory(
  tournamentCategoryId: string,
  status?: RegistrationStatus
) {
  return prisma.registration.findMany({
    where: { tournamentCategoryId, ...(status ? { status } : {}) },
    include: {
      team: { include: { players: { include: { playerProfile: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getWaitlist(tournamentCategoryId: string) {
  return prisma.waitlistEntry.findMany({
    where: { tournamentCategoryId },
    include: {
      team: { include: { players: { include: { playerProfile: true } } } },
    },
    orderBy: { position: "asc" },
  });
}

export async function countApprovedRegistrations(tournamentCategoryId: string) {
  return prisma.registration.count({
    where: { tournamentCategoryId, status: "APPROVED" },
  });
}

export async function getNextWaitlistPosition(tournamentCategoryId: string): Promise<number> {
  const last = await prisma.waitlistEntry.findFirst({
    where: { tournamentCategoryId },
    orderBy: { position: "desc" },
  });
  return (last?.position ?? 0) + 1;
}

export async function getCategoryWithRegistrationCounts(tournamentCategoryId: string) {
  const [tc, approved, pending, waitlist] = await Promise.all([
    prisma.tournamentCategory.findUnique({
      where: { id: tournamentCategoryId },
      include: {
        category: true,
        tournament: { select: { id: true, name: true, organizerId: true } },
      },
    }),
    prisma.registration.count({ where: { tournamentCategoryId, status: "APPROVED" } }),
    prisma.registration.count({ where: { tournamentCategoryId, status: "PENDING" } }),
    prisma.waitlistEntry.count({ where: { tournamentCategoryId } }),
  ]);
  return tc ? { ...tc, counts: { approved, pending, waitlist } } : null;
}

export async function getAllPendingRegistrations(organizerId: string) {
  return prisma.registration.findMany({
    where: {
      status: "PENDING",
      tournamentCategory: { tournament: { organizerId } },
    },
    include: {
      team: { include: { players: { include: { playerProfile: true } } } },
      tournamentCategory: {
        include: {
          tournament: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
