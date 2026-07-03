import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/** Cookie que guarda el organizador activo elegido por el usuario. */
export const ACTIVE_ORG_COOKIE = "active_org";

const membershipInclude = {
  organizer: true,
  tournamentAccess: { select: { tournamentId: true } },
} as const;

/**
 * Resuelve la membresía "activa" de un usuario (el club sobre el que opera).
 *
 * Estrategia:
 * 1. Lee la cookie `active_org`. Si el usuario tiene una membresía ACTIVA en ese
 *    organizador → la devuelve.
 * 2. Si no hay cookie / es inválida / ya no tiene acceso → primera membresía activa
 *    (orden `createdAt asc`, consistente con `getOrganizersByUser`).
 *
 * Nunca se confía en el valor crudo de la cookie: siempre se valida contra una
 * membresía activa real.
 *
 * Cacheado por request (React cache): layout, header y páginas comparten
 * una sola consulta.
 */
export const getActiveMembership = cache(async (userId: string) => {
  const cookieStore = await cookies();
  const preferredOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  if (preferredOrgId) {
    const preferred = await prisma.userOrganizer.findFirst({
      where: { userId, organizerId: preferredOrgId, isActive: true },
      include: membershipInclude,
    });
    if (preferred) return preferred;
  }

  return prisma.userOrganizer.findFirst({
    where: { userId, isActive: true },
    include: membershipInclude,
    orderBy: { createdAt: "asc" },
  });
});
