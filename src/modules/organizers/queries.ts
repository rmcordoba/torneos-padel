import { cache } from "react";
import { prisma } from "@/lib/prisma";

export async function getOrganizerById(id: string) {
  return prisma.organizer.findUnique({
    where: { id },
    include: { settings: true, venues: true, categories: true },
  });
}

/** Cacheado por request: dashboard layout, portal layout y páginas lo comparten. */
export const getOrganizersByUser = cache(async (userId: string) => {
  return prisma.userOrganizer.findMany({
    where: { userId, isActive: true },
    include: { organizer: true },
    orderBy: { createdAt: "asc" },
  });
});

export async function getOrganizerMember(userId: string, organizerId: string) {
  return prisma.userOrganizer.findUnique({
    where: { userId_organizerId: { userId, organizerId } },
  });
}

/** Resuelve un club por su slug público (solo activos). Para el sitio /c/[slug].
 *  Cacheado por request: el layout y la página del club comparten una sola query. */
export const getOrganizerBySlug = cache(async (slug: string) => {
  return prisma.organizer.findFirst({
    where: { slug, isActive: true },
    select: { id: true, name: true, slug: true, logoUrl: true, coverUrl: true, description: true },
  });
});

export async function listOrganizers() {
  return prisma.organizer.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getOrganizerForTournamentForm(organizerId: string) {
  return prisma.organizer.findUnique({
    where: { id: organizerId },
    include: {
      venues: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: { courts: { where: { isActive: true } } },
      },
      categories: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
      settings: true,
    },
  });
}
