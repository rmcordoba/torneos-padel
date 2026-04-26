"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/modules/audit/actions";
import { sendRegistrationEmail } from "@/lib/email";

export type RegistrationActionState = { error: string } | null;

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
  const first = await prisma.waitlistEntry.findFirst({
    where: { tournamentCategoryId },
    orderBy: { position: "asc" },
  });
  if (!first) return;

  await prisma.$transaction([
    prisma.registration.upsert({
      where: { tournamentCategoryId_teamId: { tournamentCategoryId, teamId: first.teamId } },
      update: { status: "PENDING", updatedAt: new Date() },
      create: { tournamentCategoryId, teamId: first.teamId, status: "PENDING" },
    }),
    prisma.waitlistEntry.delete({ where: { id: first.id } }),
    prisma.waitlistEntry.updateMany({
      where: { tournamentCategoryId, position: { gt: first.position } },
      data: { position: { decrement: 1 } },
    }),
  ]);

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

  const player1Id = formData.get("player1Id") as string;
  const player2Id = formData.get("player2Id") as string;
  const tournamentCategoryId = formData.get("tournamentCategoryId") as string;
  const returnPath = formData.get("returnPath") as string;

  if (!player1Id || !player2Id || !tournamentCategoryId) {
    return { error: "Seleccioná ambos jugadores" };
  }
  if (player1Id === player2Id) {
    return { error: "Los dos jugadores deben ser distintos" };
  }

  const tc = await prisma.tournamentCategory.findUnique({
    where: { id: tournamentCategoryId },
    select: { maxTeams: true, tournamentId: true },
  });
  if (!tc) return { error: "Categoría no encontrada" };

  const teamId = await findOrCreateTeam(player1Id, player2Id);

  // ¿Ya inscriptos?
  const existing = await prisma.registration.findUnique({
    where: { tournamentCategoryId_teamId: { tournamentCategoryId, teamId } },
  });
  if (existing && existing.status !== "REJECTED" && existing.status !== "CANCELLED") {
    return { error: "Esta pareja ya está inscripta o en lista de espera" };
  }

  // Verificar cupo
  const approved = await prisma.registration.count({
    where: { tournamentCategoryId, status: "APPROVED" },
  });
  const isFull = approved >= tc.maxTeams;

  if (isFull) {
    // Agregar a lista de espera
    const lastPos = await prisma.waitlistEntry.findFirst({
      where: { tournamentCategoryId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const existingWaitlist = await prisma.waitlistEntry.findUnique({
      where: { tournamentCategoryId_teamId: { tournamentCategoryId, teamId } },
    });
    if (existingWaitlist) return { error: "Esta pareja ya está en la lista de espera" };

    await prisma.waitlistEntry.create({
      data: { tournamentCategoryId, teamId, position: (lastPos?.position ?? 0) + 1 },
    });
  } else {
    // Inscripción directa aprobada
    await prisma.registration.upsert({
      where: { tournamentCategoryId_teamId: { tournamentCategoryId, teamId } },
      update: { status: "APPROVED", reviewedAt: new Date(), reviewedByUserId: session.user.id },
      create: {
        tournamentCategoryId,
        teamId,
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedByUserId: session.user.id,
      },
    });

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

// ─── Aprobar inscripción pendiente ────────────────────────────────────────────

export async function approveRegistration(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  const registrationId = formData.get("registrationId") as string;
  const returnPath = formData.get("returnPath") as string;

  const reg = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: { tournamentCategory: { select: { maxTeams: true, tournamentId: true } } },
  });
  if (!reg || reg.status !== "PENDING") return;

  // Verificar cupo antes de aprobar
  const approved = await prisma.registration.count({
    where: { tournamentCategoryId: reg.tournamentCategoryId, status: "APPROVED" },
  });
  if (approved >= reg.tournamentCategory.maxTeams) return;

  await prisma.registration.update({
    where: { id: registrationId },
    data: { status: "APPROVED", reviewedAt: new Date(), reviewedByUserId: session.user.id },
  });

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

  const registrationId = formData.get("registrationId") as string;
  const returnPath = formData.get("returnPath") as string;

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

  const registrationId = formData.get("registrationId") as string;
  const returnPath = formData.get("returnPath") as string;

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

  const tournamentCategoryId = formData.get("tournamentCategoryId") as string;
  const partnerId = formData.get("partnerId") as string;

  if (!partnerId) return { error: "Seleccioná tu compañero/a" };

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

  const existing = await prisma.registration.findUnique({
    where: { tournamentCategoryId_teamId: { tournamentCategoryId, teamId } },
  });
  const existingWaitlist = await prisma.waitlistEntry.findUnique({
    where: { tournamentCategoryId_teamId: { tournamentCategoryId, teamId } },
  });

  if (
    existingWaitlist ||
    (existing && existing.status !== "REJECTED" && existing.status !== "CANCELLED")
  ) {
    return { error: "Esta pareja ya tiene una inscripción o está en lista de espera" };
  }

  const approved = await prisma.registration.count({
    where: { tournamentCategoryId, status: "APPROVED" },
  });

  if (approved >= tc.maxTeams) {
    const lastPos = await prisma.waitlistEntry.findFirst({
      where: { tournamentCategoryId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    await prisma.waitlistEntry.create({
      data: {
        tournamentCategoryId,
        teamId,
        position: (lastPos?.position ?? 0) + 1,
      },
    });
    revalidatePath(`/torneos/${tc.tournament.id}/categorias/${tournamentCategoryId}`);
    redirect(`/torneos/${tc.tournament.id}/categorias/${tournamentCategoryId}?espera=1`);
  } else {
    await prisma.registration.upsert({
      where: { tournamentCategoryId_teamId: { tournamentCategoryId, teamId } },
      update: { status: "PENDING", updatedAt: new Date() },
      create: { tournamentCategoryId, teamId, status: "PENDING" },
    });
    revalidatePath(`/torneos/${tc.tournament.id}/categorias/${tournamentCategoryId}`);
    redirect(`/torneos/${tc.tournament.id}/categorias/${tournamentCategoryId}?inscripto=1`);
  }
  return null;
}

// ─── Aprobar todas las inscripciones pendientes ───────────────────────────────

export async function approveAllPending(
  tournamentCategoryId: string,
  returnPath: string
): Promise<{ approved: number; error?: string }> {
  const session = await auth();
  if (!session?.user) return { approved: 0, error: "No autenticado" };

  const tc = await prisma.tournamentCategory.findUnique({
    where: { id: tournamentCategoryId },
    select: { maxTeams: true, tournamentId: true },
  });
  if (!tc) return { approved: 0, error: "Categoría no encontrada" };

  let approvedCount = await prisma.registration.count({
    where: { tournamentCategoryId, status: "APPROVED" },
  });

  const pending = await prisma.registration.findMany({
    where: { tournamentCategoryId, status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });

  let count = 0;
  for (const reg of pending) {
    if (approvedCount >= tc.maxTeams) break;
    await prisma.registration.update({
      where: { id: reg.id },
      data: { status: "APPROVED", reviewedAt: new Date(), reviewedByUserId: session.user.id },
    });
    approvedCount++;
    count++;
  }

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

  const tc = await prisma.tournamentCategory.findUnique({
    where: { id: tournamentCategoryId },
    select: { tournamentId: true },
  });
  if (!tc) return { promoted: 0, error: "Categoría no encontrada" };

  const entries = await prisma.waitlistEntry.findMany({
    where: { tournamentCategoryId },
    orderBy: { position: "asc" },
  });
  if (entries.length === 0) return { promoted: 0 };

  for (const entry of entries) {
    await prisma.registration.upsert({
      where: { tournamentCategoryId_teamId: { tournamentCategoryId, teamId: entry.teamId } },
      update: { status: "PENDING", updatedAt: new Date() },
      create: { tournamentCategoryId, teamId: entry.teamId, status: "PENDING" },
    });
  }
  await prisma.waitlistEntry.deleteMany({ where: { tournamentCategoryId } });

  revalidatePath(returnPath);
  return { promoted: entries.length };
}

// ─── Vaciar lista de espera ───────────────────────────────────────────────────

export async function clearWaitlist(
  tournamentCategoryId: string,
  returnPath: string
): Promise<{ cleared: number; error?: string }> {
  const session = await auth();
  if (!session?.user) return { cleared: 0, error: "No autenticado" };

  const tc = await prisma.tournamentCategory.findUnique({
    where: { id: tournamentCategoryId },
    select: { tournamentId: true },
  });
  if (!tc) return { cleared: 0, error: "Categoría no encontrada" };

  const { count } = await prisma.waitlistEntry.deleteMany({ where: { tournamentCategoryId } });

  if (count > 0) revalidatePath(returnPath);
  return { cleared: count };
}

// ─── Quitar de lista de espera ────────────────────────────────────────────────

export async function removeFromWaitlist(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  const waitlistEntryId = formData.get("waitlistEntryId") as string;
  const returnPath = formData.get("returnPath") as string;

  const entry = await prisma.waitlistEntry.findUnique({ where: { id: waitlistEntryId } });
  if (!entry) return;

  await prisma.$transaction([
    prisma.waitlistEntry.delete({ where: { id: waitlistEntryId } }),
    prisma.waitlistEntry.updateMany({
      where: { tournamentCategoryId: entry.tournamentCategoryId, position: { gt: entry.position } },
      data: { position: { decrement: 1 } },
    }),
  ]);

  revalidatePath(returnPath);
}
