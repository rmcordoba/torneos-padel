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
        tournament: { select: { id: true, name: true, organizerId: true, hasWeekdayPlay: true } },
      },
    }),
    prisma.registration.count({ where: { tournamentCategoryId, status: "APPROVED" } }),
    prisma.registration.count({ where: { tournamentCategoryId, status: "PENDING" } }),
    prisma.waitlistEntry.count({ where: { tournamentCategoryId } }),
  ]);
  return tc ? { ...tc, counts: { approved, pending, waitlist } } : null;
}

export async function getAllPendingRegistrations(
  organizerId: string,
  opts: { showAll?: boolean; from?: Date; to?: Date } = {}
) {
  const { showAll, from, to } = opts;

  let createdAt: object | undefined;
  if (!showAll) {
    if (from || to) {
      createdAt = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };
    } else {
      const start = new Date();
      start.setUTCHours(0, 0, 0, 0);
      const end = new Date();
      end.setUTCHours(23, 59, 59, 999);
      createdAt = { gte: start, lte: end };
    }
  }

  return prisma.registration.findMany({
    where: {
      status: "PENDING",
      tournamentCategory: { tournament: { organizerId } },
      ...(createdAt ? { createdAt } : {}),
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
