import { prisma } from "@/lib/prisma";

// ─── Existing ─────────────────────────────────────────────────────────────────

export async function getPublicTournaments(search?: string) {
  return prisma.tournament.findMany({
    where: {
      isPublic: true,
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

export async function getPublicTournament(id: string) {
  return prisma.tournament.findFirst({
    where: { id, isPublic: true },
    include: {
      organizer: { select: { name: true, slug: true } },
      categories: {
        include: { category: true },
        orderBy: { category: { name: "asc" } },
      },
    },
  });
}

export async function getPublicCategoryFixture(catId: string) {
  return prisma.tournamentCategory.findUnique({
    where: { id: catId },
    include: {
      category: true,
      tournament: { select: { id: true, name: true, isPublic: true, status: true } },
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
export async function getPublicFeaturedTournament() {
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
      where: { isPublic: true, status },
      include,
      orderBy: { startDate: status === "IN_PROGRESS" ? "desc" : "asc" },
    });
    if (t) return t;
  }
  return null;
}

/** Live (IN_PROGRESS) matches from public tournaments */
export async function getPublicLiveMatches() {
  return prisma.match.findMany({
    where: {
      status: "IN_PROGRESS",
      stage: { tournamentCategory: { tournament: { isPublic: true } } },
    },
    include: {
      teams: {
        orderBy: { side: "asc" },
        include: {
          team: { include: { players: { include: { playerProfile: { select: { lastName: true } } } } } },
        },
      },
      stage: {
        include: {
          tournamentCategory: {
            include: {
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

/** Schedule slots for a specific date from public tournaments */
export async function getPublicScheduleForDate(isoDate: string) {
  const start = new Date(`${isoDate}T00:00:00.000Z`);
  const end = new Date(`${isoDate}T23:59:59.999Z`);

  return prisma.scheduleSlot.findMany({
    where: {
      tournament: { isPublic: true },
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

/** Distinct dates that have schedule slots (up to 14 days ahead) */
export async function getPublicScheduleDays() {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() + 14);

  const slots = await prisma.scheduleSlot.findMany({
    where: {
      tournament: { isPublic: true },
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
export async function getPublicRankingTables() {
  return prisma.rankingTable.findMany({
    where: { isActive: true },
    include: {
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

/** Public player directory — players with at least one approved registration in a public tournament */
export async function getPublicPlayerDirectory(search?: string) {
  return prisma.playerProfile.findMany({
    where: {
      teamPlayers: {
        some: {
          team: {
            registrations: {
              some: {
                status: "APPROVED",
                tournamentCategory: { tournament: { isPublic: true } },
              },
            },
          },
        },
      },
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      teamPlayers: {
        include: {
          team: {
            include: {
              registrations: {
                where: {
                  status: "APPROVED",
                  tournamentCategory: { tournament: { isPublic: true } },
                },
                include: {
                  tournamentCategory: {
                    include: {
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
    take: 60,
  });
}
