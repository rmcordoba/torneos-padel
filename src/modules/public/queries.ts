import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { TournamentStatus } from "@prisma/client";

// Cuando se pasa `organizerId`, todas las queries quedan acotadas a ese club
// (sitio público por club, /c/[slug]). Sin él → comportamiento global (portal raíz).
function orgScope(organizerId?: string) {
  return organizerId ? { organizerId } : {};
}

// ─── Existing ─────────────────────────────────────────────────────────────────

/** Tournaments for the Cuadros page with status/search filter and status counts for tabs. */
export async function getPublicTournamentsForCuadros({
  search,
  statuses,
  organizerId,
}: {
  search?: string;
  statuses?: string[];
  organizerId?: string;
} = {}) {
  const baseWhere = {
    isPublic: true,
    ...orgScope(organizerId),
    status: { notIn: ["DRAFT" as TournamentStatus, "CANCELLED" as TournamentStatus] },
  };

  const statusWhere: { in: TournamentStatus[] } | { notIn: TournamentStatus[] } = statuses?.length
    ? { in: statuses as TournamentStatus[] }
    : { notIn: ["DRAFT", "CANCELLED"] as TournamentStatus[] };

  const [tournaments, statusGroups] = await Promise.all([
    prisma.tournament.findMany({
      where: {
        isPublic: true,
        ...orgScope(organizerId),
        status: statusWhere,
        ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
      },
      include: {
        organizer: { select: { name: true, slug: true } },
        categories: {
          include: {
            category: true,
            _count: { select: { registrations: { where: { status: "APPROVED" as const } } } },
          },
          orderBy: { category: { name: "asc" as const } },
        },
      },
      orderBy: { startDate: "desc" },
      take: 24,
    }),
    prisma.tournament.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: { _all: true },
    }),
  ]);

  return { tournaments, statusGroups };
}

export async function getPublicTournaments(search?: string, organizerId?: string) {
  return prisma.tournament.findMany({
    where: {
      isPublic: true,
      ...orgScope(organizerId),
      status: { notIn: ["DRAFT", "CANCELLED"] },
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    },
    include: {
      organizer: { select: { name: true, slug: true } },
      categories: {
        include: {
          category: true,
          _count: { select: { registrations: { where: { status: "APPROVED" } } } },
        },
        orderBy: { category: { name: "asc" } },
      },
    },
    orderBy: { startDate: "desc" },
    take: 40,
  });
}

export async function getPublicTournament(id: string, organizerId?: string) {
  return prisma.tournament.findFirst({
    where: { id, isPublic: true, ...orgScope(organizerId) },
    include: {
      organizer: { select: { name: true, slug: true } },
      categories: {
        include: { category: true },
        orderBy: { category: { name: "asc" } },
      },
    },
  });
}

export async function getPublicCategoryFixture(catId: string, organizerId?: string) {
  return prisma.tournamentCategory.findFirst({
    where: { id: catId, ...(organizerId ? { tournament: { organizerId } } : {}) },
    include: {
      category: true,
      tournament: { select: { id: true, name: true, isPublic: true, status: true, hasWeekdayPlay: true } },
      _count: { select: { registrations: { where: { status: "APPROVED" } } } },
      stages: {
        orderBy: { order: "asc" },
        include: {
          groups: {
            orderBy: { order: "asc" },
            include: {
              standings: {
                orderBy: { position: "asc" },
                include: {
                  team: { include: { players: { include: { playerProfile: true } } } },
                },
              },
              matches: {
                orderBy: { matchNumber: "asc" },
                include: {
                  teams: { include: { team: { include: { players: { include: { playerProfile: true } } } } } },
                  sets: { orderBy: { setNumber: "asc" } },
                  result: true,
                },
              },
            },
          },
          bracketNodes: {
            orderBy: [{ round: "asc" }, { position: "asc" }],
            include: {
              team: { include: { players: { include: { playerProfile: true } } } },
              match: {
                include: {
                  teams: { include: { team: { include: { players: { include: { playerProfile: true } } } } } },
                  sets: { orderBy: { setNumber: "asc" } },
                  result: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

// ─── New ──────────────────────────────────────────────────────────────────────

/** Featured tournament: IN_PROGRESS first, then REGISTRATION_OPEN, then PUBLISHED */
export async function getPublicFeaturedTournament(organizerId?: string) {
  const include = {
    organizer: { select: { name: true } },
    categories: {
      include: {
        category: true,
        _count: { select: { registrations: { where: { status: "APPROVED" as const } } } },
      },
      orderBy: { category: { name: "asc" as const } },
    },
  };

  for (const status of ["IN_PROGRESS", "REGISTRATION_OPEN", "PUBLISHED"] as const) {
    const t = await prisma.tournament.findFirst({
      where: { isPublic: true, ...orgScope(organizerId), status },
      include,
      orderBy: { startDate: status === "IN_PROGRESS" ? "desc" : "asc" },
    });
    if (t) return t;
  }
  return null;
}

/** All IN_PROGRESS public tournaments for the hero slider */
export async function getPublicSliderTournaments(organizerId?: string) {
  return prisma.tournament.findMany({
    where: { isPublic: true, ...orgScope(organizerId), status: "IN_PROGRESS" },
    include: {
      organizer: { select: { name: true } },
      categories: {
        include: {
          category: true,
          _count: { select: { registrations: { where: { status: "APPROVED" as const } } } },
        },
        orderBy: { category: { name: "asc" as const } },
      },
    },
    orderBy: { startDate: "desc" },
  });
}

const TOURNAMENT_PAGE_SIZE = 3;

/** Paginated public tournaments with optional status filter */
export async function getPublicTournamentsPage({
  search,
  status,
  page = 1,
  organizerId,
}: {
  search?: string;
  status?: string;
  page?: number;
  organizerId?: string;
}) {
  const skip = (page - 1) * TOURNAMENT_PAGE_SIZE;

  const statusFilter = status
    ? (status as any)
    : { notIn: ["DRAFT", "CANCELLED"] as any[] };

  const where = {
    isPublic: true,
    ...orgScope(organizerId),
    status: statusFilter,
    ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const [tournaments, total] = await prisma.$transaction([
    prisma.tournament.findMany({
      where,
      include: {
        organizer: { select: { name: true, slug: true } },
        categories: {
          include: {
            category: true,
            _count: { select: { registrations: { where: { status: "APPROVED" as const } } } },
          },
          orderBy: { category: { name: "asc" as const } },
        },
      },
      orderBy: { startDate: "desc" },
      skip,
      take: TOURNAMENT_PAGE_SIZE,
    }),
    prisma.tournament.count({ where }),
  ]);

  return { tournaments, total, page, pageSize: TOURNAMENT_PAGE_SIZE };
}

/** Live (IN_PROGRESS) matches from public tournaments */
async function _getPublicLiveMatches(organizerId?: string) {
  return prisma.match.findMany({
    where: {
      status: "IN_PROGRESS",
      stage: { tournamentCategory: { tournament: { isPublic: true, ...orgScope(organizerId) } } },
    },
    // Solo lo que consume el ticker (sin Dates: el resultado se serializa en cache)
    select: {
      id: true,
      teams: {
        orderBy: { side: "asc" },
        select: {
          side: true,
          team: { select: { players: { select: { playerProfile: { select: { lastName: true } } } } } },
        },
      },
      stage: {
        select: {
          tournamentCategory: {
            select: {
              tournament: { select: { name: true } },
              category: { select: { name: true } },
            },
          },
        },
      },
    },
    take: 8,
  });
}

/**
 * Ticker "en vivo": corre en el layout de TODAS las páginas públicas, así que
 * se cachea 30s entre requests (unstable_cache, keyed por organizerId).
 */
export const getPublicLiveMatches = unstable_cache(
  _getPublicLiveMatches,
  ["public-live-matches"],
  { revalidate: 30 }
);

/** Schedule slots for a specific date from public tournaments */
export async function getPublicScheduleForDate(isoDate: string, organizerId?: string) {
  const start = new Date(`${isoDate}T00:00:00.000Z`);
  const end = new Date(`${isoDate}T23:59:59.999Z`);

  return prisma.scheduleSlot.findMany({
    where: {
      tournament: { isPublic: true, ...orgScope(organizerId) },
      date: { gte: start, lte: end },
    },
    include: {
      match: {
        include: {
          teams: {
            orderBy: { side: "asc" },
            include: {
              team: { include: { players: { include: { playerProfile: { select: { firstName: true, lastName: true } } } } } },
            },
          },
          result: { select: { winnerId: true } },
          sets: { orderBy: { setNumber: "asc" } },
          stage: {
            include: {
              tournamentCategory: { include: { category: { select: { name: true } } } },
            },
          },
        },
      },
      courtAssignment: { include: { court: { select: { name: true } } } },
      venue: { select: { name: true } },
    },
    orderBy: { startTime: "asc" },
  });
}

/** All schedule slots for a given month from public tournaments */
export async function getPublicScheduleForMonth(year: number, month: number, organizerId?: string) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end   = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  return prisma.scheduleSlot.findMany({
    where: {
      tournament: { isPublic: true, ...orgScope(organizerId) },
      date: { gte: start, lte: end },
    },
    include: {
      match: {
        include: {
          teams: {
            orderBy: { side: "asc" },
            include: {
              team: { include: { players: { include: { playerProfile: { select: { firstName: true, lastName: true } } } } } },
            },
          },
          result: { select: { winnerId: true } },
          sets: { orderBy: { setNumber: "asc" } },
          stage: {
            include: {
              tournamentCategory: {
                include: {
                  category: { select: { name: true } },
                  tournament: { select: { name: true } },
                },
              },
            },
          },
        },
      },
      courtAssignment: { include: { court: { select: { name: true } } } },
      venue: { select: { name: true } },
    },
    orderBy: { startTime: "asc" },
  });
}

/** Distinct dates that have schedule slots (up to 14 days ahead) */
export async function getPublicScheduleDays(organizerId?: string) {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() + 14);

  const slots = await prisma.scheduleSlot.findMany({
    where: {
      tournament: { isPublic: true, ...orgScope(organizerId) },
      date: { gte: now, lte: end },
    },
    select: { date: true },
    distinct: ["date"],
    orderBy: { date: "asc" },
    take: 14,
  });

  return slots.map((s) => s.date);
}

/** Active ranking tables with top entries */
export async function getPublicRankingTables(organizerId?: string) {
  return prisma.rankingTable.findMany({
    where: { isActive: true, ...orgScope(organizerId) },
    include: {
      rules: { orderBy: { placement: "asc" } },
      entries: {
        orderBy: { position: "asc" },
        take: 30,
        include: {
          playerProfile: { select: { id: true, firstName: true, lastName: true } },
          team: {
            include: {
              players: { include: { playerProfile: { select: { firstName: true, lastName: true } } } },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

const PLAYER_PAGE_SIZE = 10;

/** Distinct category names that have at least one approved registration in a public tournament */
export async function getPublicPlayerCategories(organizerId?: string): Promise<string[]> {
  const cats = await prisma.category.findMany({
    where: {
      ...orgScope(organizerId),
      tournamentCategories: {
        some: {
          tournament: { isPublic: true, ...orgScope(organizerId) },
          registrations: { some: { status: "APPROVED" } },
        },
      },
    },
    select: { name: true },
    orderBy: { name: "asc" },
  });
  return [...new Set(cats.map((c) => c.name))];
}

/** Public player directory with pagination and optional category filter.
 *  category = undefined → all with approved registrations
 *  category = "sin-categoria" → no approved registrations in public tournaments
 *  category = "<name>" → approved in that specific category */
export async function getPublicPlayerDirectory({
  search,
  category,
  page = 1,
  organizerId,
}: {
  search?: string;
  category?: string;
  page?: number;
  organizerId?: string;
}) {
  const skip = (page - 1) * PLAYER_PAGE_SIZE;

  const approvedPublic = {
    status: "APPROVED" as const,
    tournamentCategory: { tournament: { isPublic: true, ...orgScope(organizerId) } },
  };

  let teamPlayersClause: object;
  if (category === "sin-categoria") {
    teamPlayersClause = {
      none: {
        team: { registrations: { some: approvedPublic } },
      },
    };
  } else if (category) {
    teamPlayersClause = {
      some: {
        team: {
          registrations: {
            some: {
              status: "APPROVED" as const,
              tournamentCategory: {
                tournament: { isPublic: true, ...orgScope(organizerId) },
                category: { name: category },
              },
            },
          },
        },
      },
    };
  } else {
    teamPlayersClause = {
      some: {
        team: { registrations: { some: approvedPublic } },
      },
    };
  }

  const searchClause = search
    ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : null;

  const where = searchClause
    ? { AND: [{ teamPlayers: teamPlayersClause }, searchClause] }
    : { teamPlayers: teamPlayersClause };

  const [players, total] = await prisma.$transaction([
    prisma.playerProfile.findMany({
      where,
      include: {
        teamPlayers: {
          include: {
            team: {
              include: {
                registrations: {
                  where: {
                    status: "APPROVED",
                    tournamentCategory: { tournament: { isPublic: true, ...orgScope(organizerId) } },
                  },
                  include: {
                    tournamentCategory: {
                      select: {
                        tournament: { select: { name: true, startDate: true, endDate: true } },
                        category: { select: { name: true } },
                      },
                    },
                  },
                  orderBy: { createdAt: "desc" },
                  take: 6,
                },
              },
            },
          },
        },
        rankingEntries: {
          orderBy: { position: "asc" },
          take: 3,
          include: { rankingTable: { select: { name: true } } },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip,
      take: PLAYER_PAGE_SIZE,
    }),
    prisma.playerProfile.count({ where }),
  ]);

  return { players, total, page, pageSize: PLAYER_PAGE_SIZE };
}
