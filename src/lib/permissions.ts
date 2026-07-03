import { prisma } from "@/lib/prisma";
import { OrganizerPermission, OrganizerRole } from "@prisma/client";
import { getActiveMembership } from "@/lib/active-organizer";
import { canWrite } from "@/lib/subscription";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Membership = {
  id: string;
  userId: string;
  organizerId: string;
  role: OrganizerRole;
  permissions: OrganizerPermission[];
  tournamentAccess: { tournamentId: string }[];
};

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionError";
  }
}

// ─── Core helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the active membership for a user (the club they are operating on),
 * or throws PermissionError. The active organizer is resolved from the
 * `active_org` cookie, falling back to the first active membership.
 */
export async function requireMembership(userId: string): Promise<Membership> {
  const m = await getActiveMembership(userId);
  if (!m) throw new PermissionError("No pertenecés a ningún organizador");
  return m;
}

/** OWNER/ORGANIZER bypass all permission checks. COLLABORATORs must have the permission. */
export function hasPermission(m: Membership, permission: OrganizerPermission): boolean {
  if (m.role === OrganizerRole.OWNER || m.role === OrganizerRole.ORGANIZER) return true;
  return m.permissions.includes(permission);
}

/**
 * Returns true if the member can access a specific tournament.
 *
 * Rules:
 * - OWNER / ORGANIZER: always
 * - COLLABORATOR with no access grants (empty array): all tournaments (backward-compatible)
 * - COLLABORATOR with access grants: only those tournaments, OR tournaments they created
 */
export function canAccessTournament(
  m: Membership,
  tournamentId: string,
  createdByUserId?: string | null
): boolean {
  if (m.role === OrganizerRole.OWNER || m.role === OrganizerRole.ORGANIZER) return true;
  if (createdByUserId && createdByUserId === m.userId) return true;
  if (m.tournamentAccess.length === 0) return true;
  return m.tournamentAccess.some((a) => a.tournamentId === tournamentId);
}

// ─── Guard combos ─────────────────────────────────────────────────────────────

/**
 * Requires membership + specific permission. Returns the membership on success.
 * Throws PermissionError on failure.
 */
export async function requirePermission(
  userId: string,
  permission: OrganizerPermission
): Promise<Membership> {
  const m = await requireMembership(userId);
  if (!hasPermission(m, permission)) {
    throw new PermissionError("No tenés permiso para realizar esta acción");
  }
  // Gating de suscripción: los permisos de escritura (MANAGE_*) quedan bloqueados
  // cuando la suscripción del club no es writable (vencida + fuera de gracia).
  // Los reads (sin permiso o VIEW_REPORTS) no pasan por acá / no se bloquean.
  if (permission.startsWith("MANAGE_") && !(await canWrite(m.organizerId))) {
    throw new PermissionError(
      "La suscripción del club está vencida. Renovala para volver a editar."
    );
  }
  return m;
}

/**
 * Bloquea escrituras cuando la suscripción del club no es writable (vencida fuera
 * de gracia / cancelada). Para acciones que no pasan por requirePermission
 * (venues, config, rankings, players). Lanza PermissionError.
 */
export async function requireWritable(organizerId: string): Promise<void> {
  if (!(await canWrite(organizerId))) {
    throw new PermissionError(
      "La suscripción del club está vencida. Renovala para volver a editar."
    );
  }
}

/**
 * Requires membership + permission + access to a specific tournament.
 * Fetches the tournament to get createdByUserId.
 * Throws PermissionError on failure, returns { membership, tournament } on success.
 */
export async function requireTournamentAccess(
  userId: string,
  tournamentId: string,
  permission: OrganizerPermission
) {
  const m = await requirePermission(userId, permission);

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, organizerId: m.organizerId },
    select: { id: true, createdByUserId: true },
  });
  if (!tournament) throw new PermissionError("Torneo no encontrado");

  if (!canAccessTournament(m, tournamentId, tournament.createdByUserId)) {
    throw new PermissionError("No tenés acceso a este torneo");
  }

  return { membership: m, tournament };
}

/**
 * Same as requireTournamentAccess but resolves from a tournamentCategoryId.
 */
export async function requireTournamentAccessByCategory(
  userId: string,
  tournamentCategoryId: string,
  permission: OrganizerPermission
) {
  const m = await requirePermission(userId, permission);

  const tc = await prisma.tournamentCategory.findFirst({
    where: { id: tournamentCategoryId, tournament: { organizerId: m.organizerId } },
    select: { id: true, tournamentId: true, tournament: { select: { createdByUserId: true } } },
  });
  if (!tc) throw new PermissionError("Categoría no encontrada");

  if (!canAccessTournament(m, tc.tournamentId, tc.tournament.createdByUserId)) {
    throw new PermissionError("No tenés acceso a este torneo");
  }

  return { membership: m, tc };
}

/**
 * Same as requireTournamentAccess but resolves from a matchId.
 */
export async function requireTournamentAccessByMatch(
  userId: string,
  matchId: string,
  permission: OrganizerPermission
) {
  const m = await requirePermission(userId, permission);

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      stage: { tournamentCategory: { tournament: { organizerId: m.organizerId } } },
    },
    select: {
      id: true,
      stage: {
        select: {
          tournamentCategory: {
            select: {
              tournamentId: true,
              tournament: { select: { createdByUserId: true } },
            },
          },
        },
      },
    },
  });
  if (!match) throw new PermissionError("Partido no encontrado");

  const { tournamentId, tournament } = match.stage.tournamentCategory;
  if (!canAccessTournament(m, tournamentId, tournament.createdByUserId)) {
    throw new PermissionError("No tenés acceso a este torneo");
  }

  return { membership: m, match };
}

/** Filters a list of tournaments to only those accessible by the member. */
export function filterAccessibleTournaments<T extends { id: string; createdByUserId?: string | null }>(
  m: Membership,
  tournaments: T[]
): T[] {
  if (m.role === OrganizerRole.OWNER || m.role === OrganizerRole.ORGANIZER) return tournaments;
  if (m.tournamentAccess.length === 0) return tournaments;
  return tournaments.filter((t) => canAccessTournament(m, t.id, t.createdByUserId));
}
