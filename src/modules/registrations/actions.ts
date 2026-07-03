"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/modules/audit/actions";
import { sendRegistrationEmail } from "@/lib/email";
import { requirePermission, requireTournamentAccessByCategory, PermissionError } from "@/lib/permissions";
import type { Prisma } from "@prisma/client";
import {
  parseWeekdayAvailability,
  organizerRegistrationInputSchema,
  playerRegistrationInputSchema,
  registrationActionInputSchema,
  waitlistActionInputSchema,
} from "./validations";

export type RegistrationActionState = { error: string } | null;

// ─── Helper: lock pesimista sobre la categoría ────────────────────────────────
// Serializa las escrituras concurrentes de una misma categoría para que el
// chequeo de cupo + inserción sea atómico (sin esto, dos inscripciones
// simultáneas pueden superar maxTeams).

async function lockCategoryRow(tx: Prisma.TransactionClient, tournamentCategoryId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM tournament_categories WHERE id = ${tournamentCategoryId} FOR UPDATE`;
}

// ─── Helper: emails de los jugadores de un team ───────────────────────────────

async function getTeamEmails(teamId: string): Promise<string[]> {
  const players = await prisma.teamPlayer.findMany({
    where: { teamId },
    include: { playerProfile: { include: { user: { select: { email: true } } } } },
  });
  return players.map((p) => p.playerProfile.user.email).filter(Boolean) as string[];
}

// ─── Helper: nombre de torneo y categoría ────────────────────────────────────

async function getTournamentCategoryInfo(tournamentCategoryId: string) {
  return prisma.tournamentCategory.findUnique({
    where: { id: tournamentCategoryId },
    select: {
      tournament: { select: { name: true } },
      category: { select: { name: true } },
    },
  });
}

// ─── Buscar o crear team para dos jugadores ───────────────────────────────────

async function findOrCreateTeam(
  player1Id: string,
  player2Id: string
): Promise<string> {
  // Buscar equipos que ya contengan a ambos jugadores
  const teamsWithP1 = await prisma.teamPlayer.findMany({
    where: { playerProfileId: player1Id },
    select: { teamId: true },
  });
  const teamIds = teamsWithP1.map((t) => t.teamId);

  if (teamIds.length > 0) {
    const shared = await prisma.teamPlayer.findFirst({
      where: { playerProfileId: player2Id, teamId: { in: teamIds } },
      select: { teamId: true },
    });
    if (shared) return shared.teamId;
  }

  // Crear nueva pareja
  const team = await prisma.team.create({
    data: {
      players: {
        create: [{ playerProfileId: player1Id }, { playerProfileId: player2Id }],
      },
    },
  });
  return team.id;
}

// ─── Promover primer lugar de la lista de espera ─────────────────────────────

async function promoteNextFromWaitlist(
  tournamentCategoryId: string
): Promise<void> {
  // Selección + promoción atómicas (el lock evita promover dos veces la misma
  // entrada si dos rechazos/cancelaciones llegan a la vez).
  const first = await prisma.$transaction(async (tx) => {
    await lockCategoryRow(tx, tournamentCategoryId);

    const entry = await tx.waitlistEntry.findFirst({
      where: { tournamentCategoryId },
      orderBy: { position: "asc" },
    });
    if (!entry) return null;

    await tx.registration.upsert({
      where: { tournamentCategoryId_teamId: { tournamentCategoryId, teamId: entry.teamId } },
      update: { status: "PENDING", weekdayAvailability: entry.weekdayAvailability, updatedAt: new Date() },
      create: { tournamentCategoryId, teamId: entry.teamId, status: "PENDING", weekdayAvailability: entry.weekdayAvailability },
    });
    await tx.waitlistEntry.delete({ where: { id: entry.id } });
    await tx.waitlistEntry.updateMany({
      where: { tournamentCategoryId, position: { gt: entry.position } },
      data: { position: { decrement: 1 } },
    });
    return entry;
  });
  if (!first) return;

  const [emails, info] = await Promise.all([
    getTeamEmails(first.teamId),
    getTournamentCategoryInfo(tournamentCategoryId),
  ]);
  if (info) {
    await sendRegistrationEmail({
      to: emails,
      tournamentName: info.tournament.name,
      categoryName: info.category.name,
      status: "waitlist_promoted",
    });
  }
}

// ─── Crear inscripción (por organizador — aprobación directa) ─────────────────

export async function createRegistrationByOrganizer(
  _prev: RegistrationActionState,
  formData: FormData
): Promise<RegistrationActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const parsed = organizerRegistrationInputSchema.safeParse({
    player1Id: formData.get("player1Id"),
    player2Id: formData.get("player2Id"),
    tournamentCategoryId: formData.get("tournamentCategoryId"),
    returnPath: formData.get("returnPath"),
  });
  if (!parsed.success) {
    return { error: "Seleccioná ambos jugadores" };
  }
  const { player1Id, player2Id, tournamentCategoryId, returnPath } = parsed.data;
  const weekdayAvailability = parseWeekdayAvailability(formData);

  if (player1Id === player2Id) {
    return { error: "Los dos jugadores deben ser distintos" };
  }

  try {
    await requireTournamentAccessByCategory(session.user.id, tournamentCategoryId, "MANAGE_REGISTRATIONS");
  } catch (e) {
    return { error: e instanceof PermissionError ? e.message : "Sin permisos" };
  }

  const tc = await prisma.tournamentCategory.findUnique({
    where: { id: tournamentCategoryId },
    select: { maxTeams: true, tournamentId: true },
  });
  if (!tc) return { error: "Categoría no encontrada" };

  const teamId = await findOrCreateTeam(player1Id, player2Id);

  // Chequeo de cupo + escritura de forma atómica (lock sobre la categoría)
  const outcome = await prisma.$transaction(async (tx) => {
    await lockCategoryRow(tx, tournamentCategoryId);

    // ¿Ya inscriptos?
    const existing = await tx.registration.findUnique({
      where: { tournamentCategoryId_teamId: { tournamentCategoryId, teamId } },
    });
    if (existing && existing.status !== "REJECTED" && existing.status !== "CANCELLED") {
      return { error: "Esta pareja ya está inscripta o en lista de espera" as string };
    }

    // Verificar cupo
    const approved = await tx.registration.count({
      where: { tournamentCategoryId, status: "APPROVED" },
    });

    if (approved >= tc.maxTeams) {
      // Agregar a lista de espera
      const existingWaitlist = await tx.waitlistEntry.findUnique({
        where: { tournamentCategoryId_teamId: { tournamentCategoryId, teamId } },
      });
      if (existingWaitlist) return { error: "Esta pareja ya está en la lista de espera" as string };

      const lastPos = await tx.waitlistEntry.findFirst({
        where: { tournamentCategoryId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      await tx.waitlistEntry.create({
        data: { tournamentCategoryId, teamId, position: (lastPos?.position ?? 0) + 1, weekdayAvailability },
      });
      return { waitlisted: true };
    }

    // Inscripción directa aprobada
    await tx.registration.upsert({
      where: { tournamentCategoryId_teamId: { tournamentCategoryId, teamId } },
      update: { status: "APPROVED", weekdayAvailability, reviewedAt: new Date(), reviewedByUserId: session.user.id },
      create: {
        tournamentCategoryId,
        teamId,
        status: "APPROVED",
        weekdayAvailability,
        reviewedAt: new Date(),
        reviewedByUserId: session.user.id,
      },
    });
    return { approved: true };
  });

  if ("error" in outcome && outcome.error) return { error: outcome.error };

  // Audit best-effort fuera de la transacción (no anula la inscripción si falla)
  if ("approved" in outcome && outcome.approved) {
    await createAuditLog({
      userId: session.user.id,
      tournamentId: tc.tournamentId,
      entity: "Registration",
      entityId: `${tournamentCategoryId}:${teamId}`,
      action: "APPROVE",
      after: { status: "APPROVED", tournamentCategoryId, teamId },
    });
  }

  revalidatePath(returnPath);
  return null;
}

// ─── Helper: verifica que el usuario puede gestionar la categoría de esa inscripción ──

async function assertRegistrationAccess(userId: string, registrationId: string): Promise<boolean> {
  const reg = await prisma.registration.findUnique({
    where: { id: registrationId },
    select: { tournamentCategoryId: true },
  });
  if (!reg) return false;
  try {
    await requireTournamentAccessByCategory(userId, reg.tournamentCategoryId, "MANAGE_REGISTRATIONS");
    return true;
  } catch {
    return false;
  }
}

// ─── Aprobar inscripción pendiente ────────────────────────────────────────────

export async function approveRegistration(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  const parsed = registrationActionInputSchema.safeParse({
    registrationId: formData.get("registrationId"),
    returnPath: formData.get("returnPath"),
  });
  if (!parsed.success) return;
  const { registrationId, returnPath } = parsed.data;

  if (!await assertRegistrationAccess(session.user.id, registrationId)) return;

  // Chequeo de cupo + aprobación atómicos (lock sobre la categoría)
  const reg = await prisma.$transaction(async (tx) => {
    const current = await tx.registration.findUnique({
      where: { id: registrationId },
      include: { tournamentCategory: { select: { maxTeams: true, tournamentId: true } } },
    });
    if (!current || current.status !== "PENDING") return null;

    await lockCategoryRow(tx, current.tournamentCategoryId);

    // Verificar cupo antes de aprobar
    const approved = await tx.registration.count({
      where: { tournamentCategoryId: current.tournamentCategoryId, status: "APPROVED" },
    });
    if (approved >= current.tournamentCategory.maxTeams) return null;

    await tx.registration.update({
      where: { id: registrationId },
      data: { status: "APPROVED", reviewedAt: new Date(), reviewedByUserId: session.user.id },
    });
    return current;
  });
  if (!reg) return;

  await createAuditLog({
    userId: session.user.id,
    tournamentId: reg.tournamentCategory.tournamentId,
    entity: "Registration",
    entityId: registrationId,
    action: "APPROVE",
    before: { status: "PENDING" },
    after: { status: "APPROVED" },
  });

  const [emails, info] = await Promise.all([
    getTeamEmails(reg.teamId),
    getTournamentCategoryInfo(reg.tournamentCategoryId),
  ]);
  if (info) {
    await sendRegistrationEmail({
      to: emails,
      tournamentName: info.tournament.name,
      categoryName: info.category.name,
      status: "approved",
    });
  }

  revalidatePath(returnPath);
}

// ─── Rechazar inscripción ─────────────────────────────────────────────────────

export async function rejectRegistration(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  const parsed = registrationActionInputSchema.safeParse({
    registrationId: formData.get("registrationId"),
    returnPath: formData.get("returnPath"),
  });
  if (!parsed.success) return;
  const { registrationId, returnPath } = parsed.data;

  if (!await assertRegistrationAccess(session.user.id, registrationId)) return;

  const reg = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { tournamentCategory: { select: { tournamentId: true } } },
  });
  if (!reg) return;

  await prisma.registration.update({
    where: { id: registrationId },
    data: { status: "REJECTED", reviewedAt: new Date(), reviewedByUserId: session.user.id },
  });

  await createAuditLog({
    userId: session.user.id,
    tournamentId: reg.tournamentCategory.tournamentId,
    entity: "Registration",
    entityId: registrationId,
    action: "REJECT",
    before: { status: reg.status },
    after: { status: "REJECTED" },
  });

  // Si estaba aprobada, liberar cupo y promover lista de espera
  if (reg.status === "APPROVED") {
    await promoteNextFromWaitlist(reg.tournamentCategoryId);
  }

  const [emails, info] = await Promise.all([
    getTeamEmails(reg.teamId),
    getTournamentCategoryInfo(reg.tournamentCategoryId),
  ]);
  if (info) {
    await sendRegistrationEmail({
      to: emails,
      tournamentName: info.tournament.name,
      categoryName: info.category.name,
      status: "rejected",
    });
  }

  revalidatePath(returnPath);
}

// ─── Cancelar inscripción aprobada ────────────────────────────────────────────

export async function cancelRegistration(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  const parsed = registrationActionInputSchema.safeParse({
    registrationId: formData.get("registrationId"),
    returnPath: formData.get("returnPath"),
  });
  if (!parsed.success) return;
  const { registrationId, returnPath } = parsed.data;

  if (!await assertRegistrationAccess(session.user.id, registrationId)) return;

  const reg = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { tournamentCategory: { select: { tournamentId: true } } },
  });
  if (!reg) return;

  await prisma.registration.update({
    where: { id: registrationId },
    data: { status: "CANCELLED", reviewedAt: new Date(), reviewedByUserId: session.user.id },
  });

  await createAuditLog({
    userId: session.user.id,
    tournamentId: reg.tournamentCategory.tournamentId,
    entity: "Registration",
    entityId: registrationId,
    action: "CANCEL",
    before: { status: reg.status },
    after: { status: "CANCELLED" },
  });

  if (reg.status === "APPROVED") {
    await promoteNextFromWaitlist(reg.tournamentCategoryId);
  }

  const [emails, info] = await Promise.all([
    getTeamEmails(reg.teamId),
    getTournamentCategoryInfo(reg.tournamentCategoryId),
  ]);
  if (info) {
    await sendRegistrationEmail({
      to: emails,
      tournamentName: info.tournament.name,
      categoryName: info.category.name,
      status: "cancelled",
    });
  }

  revalidatePath(returnPath);
}

// ─── Inscripción pública (por el jugador mismo) ───────────────────────────────

export async function createRegistrationByPlayer(
  _prev: RegistrationActionState,
  formData: FormData
): Promise<RegistrationActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Debés iniciar sesión para inscribirte" };

  const parsed = playerRegistrationInputSchema.safeParse({
    tournamentCategoryId: formData.get("tournamentCategoryId"),
    partnerId: formData.get("partnerId"),
  });
  if (!parsed.success) return { error: "Seleccioná tu compañero/a" };
  const { tournamentCategoryId, partnerId } = parsed.data;
  const weekdayAvailability = parseWeekdayAvailability(formData);

  const myProfile = await prisma.playerProfile.findFirst({
    where: { userId: session.user.id },
  });
  if (!myProfile) {
    return { error: "No tenés un perfil de jugador registrado. Contactá al organizador." };
  }
  if (myProfile.id === partnerId) return { error: "No podés inscribirte con vos mismo" };

  const tc = await prisma.tournamentCategory.findUnique({
    where: { id: tournamentCategoryId },
    select: {
      maxTeams: true,
      tournamentId: true,
      tournament: { select: { id: true, status: true } },
    },
  });
  if (!tc) return { error: "Categoría no encontrada" };
  if (tc.tournament.status !== "REGISTRATION_OPEN") {
    return { error: "Las inscripciones no están abiertas" };
  }

  const partnerProfile = await prisma.playerProfile.findUnique({ where: { id: partnerId } });
  if (!partnerProfile) return { error: "Jugador no encontrado" };

  const teamId = await findOrCreateTeam(myProfile.id, partnerId);

  // Chequeo de duplicados + cupo + escritura de forma atómica.
  // El redirect va afuera: lanza NEXT_REDIRECT y abortaría la transacción.
  const outcome = await prisma.$transaction(async (tx) => {
    await lockCategoryRow(tx, tournamentCategoryId);

    const existing = await tx.registration.findUnique({
      where: { tournamentCategoryId_teamId: { tournamentCategoryId, teamId } },
    });
    const existingWaitlist = await tx.waitlistEntry.findUnique({
      where: { tournamentCategoryId_teamId: { tournamentCategoryId, teamId } },
    });

    if (
      existingWaitlist ||
      (existing && existing.status !== "REJECTED" && existing.status !== "CANCELLED")
    ) {
      return { error: "Esta pareja ya tiene una inscripción o está en lista de espera" as string };
    }

    const approved = await tx.registration.count({
      where: { tournamentCategoryId, status: "APPROVED" },
    });

    if (approved >= tc.maxTeams) {
      const lastPos = await tx.waitlistEntry.findFirst({
        where: { tournamentCategoryId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      await tx.waitlistEntry.create({
        data: {
          tournamentCategoryId,
          teamId,
          position: (lastPos?.position ?? 0) + 1,
          weekdayAvailability,
        },
      });
      return { waitlisted: true };
    }

    await tx.registration.upsert({
      where: { tournamentCategoryId_teamId: { tournamentCategoryId, teamId } },
      update: { status: "PENDING", weekdayAvailability, updatedAt: new Date() },
      create: { tournamentCategoryId, teamId, status: "PENDING", weekdayAvailability },
    });
    return { registered: true };
  });

  if ("error" in outcome && outcome.error) return { error: outcome.error };

  const basePath = `/torneos/${tc.tournament.id}/categorias/${tournamentCategoryId}`;
  revalidatePath(basePath);
  redirect(`${basePath}?${"waitlisted" in outcome && outcome.waitlisted ? "espera=1" : "inscripto=1"}`);
}

// ─── Aprobar todas las inscripciones pendientes ───────────────────────────────

export async function approveAllPending(
  tournamentCategoryId: string,
  returnPath: string
): Promise<{ approved: number; error?: string }> {
  const session = await auth();
  if (!session?.user) return { approved: 0, error: "No autenticado" };

  try {
    await requireTournamentAccessByCategory(session.user.id, tournamentCategoryId, "MANAGE_REGISTRATIONS");
  } catch (e) {
    return { approved: 0, error: e instanceof PermissionError ? e.message : "Sin permisos" };
  }

  const tc = await prisma.tournamentCategory.findUnique({
    where: { id: tournamentCategoryId },
    select: { maxTeams: true, tournamentId: true },
  });
  if (!tc) return { approved: 0, error: "Categoría no encontrada" };

  // Aprobación masiva atómica: o se aprueban todas las que entran en el cupo,
  // o ninguna (y el lock evita carreras con otras inscripciones).
  const count = await prisma.$transaction(async (tx) => {
    await lockCategoryRow(tx, tournamentCategoryId);

    const approvedCount = await tx.registration.count({
      where: { tournamentCategoryId, status: "APPROVED" },
    });
    const available = tc.maxTeams - approvedCount;
    if (available <= 0) return 0;

    const pending = await tx.registration.findMany({
      where: { tournamentCategoryId, status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: available,
      select: { id: true },
    });
    if (pending.length === 0) return 0;

    await tx.registration.updateMany({
      where: { id: { in: pending.map((r) => r.id) } },
      data: { status: "APPROVED", reviewedAt: new Date(), reviewedByUserId: session.user.id },
    });
    return pending.length;
  });

  if (count > 0) {
    await createAuditLog({
      userId: session.user.id,
      tournamentId: tc.tournamentId,
      entity: "Registration",
      entityId: tournamentCategoryId,
      action: "APPROVE",
      after: { bulkApproved: count },
    });
    revalidatePath(returnPath);
  }

  return { approved: count };
}

// ─── Promover toda la lista de espera a inscripciones pendientes ──────────────

export async function promoteAllWaitlist(
  tournamentCategoryId: string,
  returnPath: string
): Promise<{ promoted: number; error?: string }> {
  const session = await auth();
  if (!session?.user) return { promoted: 0, error: "No autenticado" };

  try {
    await requireTournamentAccessByCategory(session.user.id, tournamentCategoryId, "MANAGE_REGISTRATIONS");
  } catch (e) {
    return { promoted: 0, error: e instanceof PermissionError ? e.message : "Sin permisos" };
  }

  const tc = await prisma.tournamentCategory.findUnique({
    where: { id: tournamentCategoryId },
    select: { tournamentId: true },
  });
  if (!tc) return { promoted: 0, error: "Categoría no encontrada" };

  // Promoción atómica: upserts + vaciado de la lista en una sola transacción
  const promoted = await prisma.$transaction(async (tx) => {
    await lockCategoryRow(tx, tournamentCategoryId);

    const entries = await tx.waitlistEntry.findMany({
      where: { tournamentCategoryId },
      orderBy: { position: "asc" },
    });
    if (entries.length === 0) return 0;

    for (const entry of entries) {
      await tx.registration.upsert({
        where: { tournamentCategoryId_teamId: { tournamentCategoryId, teamId: entry.teamId } },
        update: { status: "PENDING", weekdayAvailability: entry.weekdayAvailability, updatedAt: new Date() },
        create: { tournamentCategoryId, teamId: entry.teamId, status: "PENDING", weekdayAvailability: entry.weekdayAvailability },
      });
    }
    await tx.waitlistEntry.deleteMany({ where: { tournamentCategoryId } });
    return entries.length;
  });

  if (promoted > 0) revalidatePath(returnPath);
  return { promoted };
}

// ─── Vaciar lista de espera ───────────────────────────────────────────────────

export async function clearWaitlist(
  tournamentCategoryId: string,
  returnPath: string
): Promise<{ cleared: number; error?: string }> {
  const session = await auth();
  if (!session?.user) return { cleared: 0, error: "No autenticado" };

  try {
    await requireTournamentAccessByCategory(session.user.id, tournamentCategoryId, "MANAGE_REGISTRATIONS");
  } catch (e) {
    return { cleared: 0, error: e instanceof PermissionError ? e.message : "Sin permisos" };
  }

  const tc = await prisma.tournamentCategory.findUnique({
    where: { id: tournamentCategoryId },
    select: { tournamentId: true },
  });
  if (!tc) return { cleared: 0, error: "Categoría no encontrada" };

  const { count } = await prisma.waitlistEntry.deleteMany({ where: { tournamentCategoryId } });

  if (count > 0) revalidatePath(returnPath);
  return { cleared: count };
}

// ─── Actualizar disponibilidad horaria de una inscripción ─────────────────────

export async function updateRegistrationAvailability(
  formData: FormData
): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  const parsed = registrationActionInputSchema.safeParse({
    registrationId: formData.get("registrationId"),
    returnPath: formData.get("returnPath"),
  });
  if (!parsed.success) return;
  const { registrationId, returnPath } = parsed.data;
  const weekdayAvailability = parseWeekdayAvailability(formData);

  if (!await assertRegistrationAccess(session.user.id, registrationId)) return;

  await prisma.registration.update({
    where: { id: registrationId },
    data: { weekdayAvailability },
  });

  revalidatePath(returnPath);
}

// ─── Quitar de lista de espera ────────────────────────────────────────────────

export async function removeFromWaitlist(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  const parsed = waitlistActionInputSchema.safeParse({
    waitlistEntryId: formData.get("waitlistEntryId"),
    returnPath: formData.get("returnPath"),
  });
  if (!parsed.success) return;
  const { waitlistEntryId, returnPath } = parsed.data;

  const entry = await prisma.waitlistEntry.findUnique({ where: { id: waitlistEntryId } });
  if (!entry) return;

  try {
    await requireTournamentAccessByCategory(session.user.id, entry.tournamentCategoryId, "MANAGE_REGISTRATIONS");
  } catch { return; }

  await prisma.$transaction([
    prisma.waitlistEntry.delete({ where: { id: waitlistEntryId } }),
    prisma.waitlistEntry.updateMany({
      where: { tournamentCategoryId: entry.tournamentCategoryId, position: { gt: entry.position } },
      data: { position: { decrement: 1 } },
    }),
  ]);

  revalidatePath(returnPath);
}
