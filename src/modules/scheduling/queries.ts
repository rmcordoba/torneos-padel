import { prisma } from "@/lib/prisma";

export async function getScheduleByOrganizer(organizerId: string, date?: string) {
  const where = {
    tournament: { organizerId },
    ...(date
      ? {
          date: {
            gte: new Date(`${date}T00:00:00`),
            lte: new Date(`${date}T23:59:59`),
          },
        }
      : {}),
  };

  return prisma.scheduleSlot.findMany({
    where,
    include: {
      venue: true,
      courtAssignment: { include: { court: true } },
      match: {
        include: {
          stage: { include: { tournamentCategory: { include: { category: true, tournament: true } } } },
          teams: { include: { team: { include: { players: { include: { playerProfile: true } } } } } },
          result: true,
        },
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function getUnscheduledMatches(organizerId: string) {
  return prisma.match.findMany({
    where: {
      scheduleSlot: null,
      status: { notIn: ["COMPLETED", "WALKOVER", "CANCELLED"] },
      stage: { tournamentCategory: { tournament: { organizerId } } },
    },
    include: {
      stage: { include: { tournamentCategory: { include: { category: true, tournament: true } } } },
      teams: { include: { team: { include: { players: { include: { playerProfile: true } } } } } },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });
}

export async function getScheduleByOrganizerMonth(organizerId: string, year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 0, 23, 59, 59);
  return prisma.scheduleSlot.findMany({
    where: { tournament: { organizerId }, date: { gte: start, lte: end } },
    include: {
      venue: true,
      courtAssignment: { include: { court: true } },
      match: {
        include: {
          stage: { include: { tournamentCategory: { include: { category: true, tournament: true } } } },
          teams: { include: { team: { include: { players: { include: { playerProfile: true } } } } } },
          result: true,
        },
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function getVenuesWithCourts(organizerId: string) {
  return prisma.venue.findMany({
    where: { organizerId, isActive: true },
    include: { courts: { where: { isActive: true }, orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
}
