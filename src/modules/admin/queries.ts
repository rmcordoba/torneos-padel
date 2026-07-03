import { prisma } from "@/lib/prisma";

export async function getAdminStats() {
  const [totalOrganizers, activeOrganizers, totalUsers, totalTournaments, recentLogs] =
    await Promise.all([
      prisma.organizer.count(),
      prisma.organizer.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.tournament.count(),
      prisma.auditLog.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);
  return { totalOrganizers, activeOrganizers, totalUsers, totalTournaments, recentLogs };
}

export async function getAllOrganizersAdmin() {
  return prisma.organizer.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          tournaments: true,
          members: true,
        },
      },
    },
  });
}

export async function getAllUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      organizerMemberships: {
        include: { organizer: { select: { name: true } } },
      },
    },
  });
}

const USER_PAGE_SIZE = 10;

export async function getUsersPage({ page = 1 }: { page?: number } = {}) {
  const skip = (page - 1) * USER_PAGE_SIZE;
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        organizerMemberships: {
          include: { organizer: { select: { name: true } } },
        },
      },
      skip,
      take: USER_PAGE_SIZE,
    }),
    prisma.user.count(),
  ]);
  return { users, total, page, pageSize: USER_PAGE_SIZE };
}

export async function getGlobalAuditLogs(limit = 300) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user:       { select: { name: true, email: true } },
      organizer:  { select: { name: true } },
      tournament: { select: { name: true } },
    },
  });
}
