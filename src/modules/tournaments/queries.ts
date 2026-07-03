import { prisma } from "@/lib/prisma";
import type { TournamentStatus } from "@prisma/client";

export async function getTournamentById(id: string) {
  return prisma.tournament.findUnique({
    where: { id },
    include: {
      organizer: true,
      categories: { include: { category: true } },
    },
  });
}

export async function listTournamentsByOrganizer(
  organizerId: string,
  status?: TournamentStatus
) {
  return prisma.tournament.findMany({
    where: { organizerId, ...(status ? { status } : {}) },
    include: {
      categories: {
        include: {
          category: true,
          _count: { select: { registrations: true } },
        },
      },
    },
    orderBy: { startDate: "desc" },
  });
}

export async function searchTournamentsByOrganizer(
  organizerId: string,
  query: string,
  limit = 5
) {
  return prisma.tournament.findMany({
    where: {
      organizerId,
      name: { contains: query, mode: "insensitive" },
    },
    select: { id: true, name: true, status: true, startDate: true },
    orderBy: { startDate: "desc" },
    take: limit,
  });
}

export async function listPublicTournaments() {
  return prisma.tournament.findMany({
    where: { isPublic: true, status: { not: "DRAFT" } },
    include: {
      organizer: { select: { name: true, slug: true, logoUrl: true } },
      categories: { include: { category: true } },
    },
    orderBy: { startDate: "desc" },
  });
}

export async function getTournamentForEdit(id: string, organizerId: string) {
  return prisma.tournament.findFirst({
    where: { id, organizerId },
    select: {
      id: true,
      name: true,
      description: true,
      startDate: true,
      endDate: true,
      registrationDeadline: true,
      isPublic: true,
      hasWeekdayPlay: true,
      status: true,
    },
  });
}

export async function getTournamentCategoryWithStages(
  tournamentCategoryId: string
) {
  return prisma.tournamentCategory.findUnique({
    where: { id: tournamentCategoryId },
    include: {
      tournament: true,
      category: true,
      stages: {
        include: {
          groups: { include: { standings: { include: { team: true } } } },
          bracketNodes: { include: { team: true } },
          matches: {
            include: {
              teams: { include: { team: true } },
              sets: true,
              result: true,
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });
}
