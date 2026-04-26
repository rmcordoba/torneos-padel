"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getOrganizerMember } from "@/modules/organizers/queries";
import { createAuditLog } from "@/modules/audit/actions";
import { CompetitionFormat, type TournamentStatus, type TournamentCategoryStatus } from "@prisma/client";

export type TournamentActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

const categoryInputSchema = z.object({
  categoryId: z.string().cuid(),
  format: z.nativeEnum(CompetitionFormat).default("SINGLE_ELIMINATION"),
  maxTeams: z.coerce.number().int().min(2).max(256),
  minTeams: z.coerce.number().int().min(2).default(4),
  pricePerTeam: z.coerce.number().min(0).optional().nullable(),
  setsPerMatch: z.coerce.number().int().min(1).max(5).default(3),
  gamesPerSet: z.coerce.number().int().min(4).max(10).default(6),
  groupSize: z.coerce.number().int().min(3).max(8).optional().nullable(),
  teamsAdvancePerGroup: z.coerce.number().int().min(1).max(4).optional().nullable(),
  mexicanoRounds: z.coerce.number().int().min(3).max(20).optional().nullable(),
}).refine((d) => d.minTeams <= d.maxTeams, {
  message: "El mínimo de equipos no puede superar el máximo",
  path: ["minTeams"],
});

const createTournamentSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(150, "Máximo 150 caracteres"),
  description: z.string().max(1000).optional(),
  startDate: z.coerce.date({ required_error: "La fecha de inicio es requerida" }),
  endDate: z.coerce.date({ required_error: "La fecha de fin es requerida" }),
  registrationDeadline: z.coerce.date().optional().nullable(),
  venueId: z.string().cuid().optional().nullable(),
  isPublic: z.string().optional().transform((v) => v === "true"),
  categoriesJson: z.string().min(2, "Agregá al menos una categoría"),
});

export async function createTournament(
  _prev: TournamentActionState,
  formData: FormData
): Promise<TournamentActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const raw = Object.fromEntries(formData);
  const parsed = createTournamentSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, description, startDate, endDate, registrationDeadline, venueId, isPublic, categoriesJson } = parsed.data;

  // Parsear categorías
  let categoriesRaw: unknown[];
  try {
    categoriesRaw = JSON.parse(categoriesJson);
  } catch {
    return { fieldErrors: { categoriesJson: ["Formato de categorías inválido"] } };
  }

  const categoriesParsed = z.array(categoryInputSchema).safeParse(categoriesRaw);
  if (!categoriesParsed.success || categoriesParsed.data.length === 0) {
    return { fieldErrors: { categoriesJson: ["Agregá al menos una categoría válida"] } };
  }

  if (startDate > endDate) {
    return { fieldErrors: { endDate: ["La fecha de fin debe ser posterior a la de inicio"] } };
  }

  // Determinar organizador del usuario
  const membership = await prisma.userOrganizer.findFirst({
    where: { userId: session.user.id, isActive: true },
  });
  if (!membership) return { error: "No pertenecés a ningún organizador" };

  // Verificar que todas las categorías pertenecen al organizador
  const categoryIds = categoriesParsed.data.map((c) => c.categoryId);
  const validCategories = await prisma.category.findMany({
    where: { id: { in: categoryIds }, organizerId: membership.organizerId },
  });
  if (validCategories.length !== categoryIds.length) {
    return { error: "Una o más categorías no son válidas para este organizador" };
  }

  // Crear torneo + categorías en una transacción
  const tournament = await prisma.$transaction(async (tx) => {
    const t = await tx.tournament.create({
      data: {
        organizerId: membership.organizerId,
        name,
        description: description || null,
        startDate,
        endDate,
        registrationDeadline: registrationDeadline || null,
        isPublic,
        status: "DRAFT",
        categories: {
          create: categoriesParsed.data.map((cat) => ({
            categoryId: cat.categoryId,
            format: cat.format,
            maxTeams: cat.maxTeams,
            minTeams: cat.minTeams,
            pricePerTeam: cat.pricePerTeam ?? null,
            setsPerMatch: cat.setsPerMatch,
            gamesPerSet: cat.gamesPerSet,
            formatConfig:
              cat.format === "GROUP_PLAYOFF" && cat.groupSize
                ? { groupSize: cat.groupSize, teamsAdvancePerGroup: cat.teamsAdvancePerGroup ?? 2 }
                : cat.format === "MEXICANO"
                ? { rounds: cat.mexicanoRounds ?? 7 }
                : undefined,
          })),
        },
      },
    });

    return t;
  });

  await createAuditLog({
    userId: session.user.id,
    organizerId: membership.organizerId,
    tournamentId: tournament.id,
    entity: "Tournament",
    entityId: tournament.id,
    action: "CREATE",
    after: { name: tournament.name, status: tournament.status },
  });

  redirect(`/dashboard/torneos/${tournament.id}`);
}

// ─── Editar torneo (info básica) ──────────────────────────────────────────────

const updateTournamentSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(150, "Máximo 150 caracteres"),
  description: z.string().max(1000).optional(),
  startDate: z.coerce.date({ required_error: "La fecha de inicio es requerida" }),
  endDate: z.coerce.date({ required_error: "La fecha de fin es requerida" }),
  registrationDeadline: z.coerce.date().optional().nullable(),
  isPublic: z.string().optional().transform((v) => v === "true"),
});

export async function updateTournament(
  tournamentId: string,
  _prev: TournamentActionState,
  formData: FormData
): Promise<TournamentActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const raw = Object.fromEntries(formData);
  const parsed = updateTournamentSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { name, description, startDate, endDate, registrationDeadline, isPublic } = parsed.data;

  if (startDate > endDate) {
    return { fieldErrors: { endDate: ["La fecha de fin debe ser posterior a la de inicio"] } };
  }

  const membership = await prisma.userOrganizer.findFirst({
    where: { userId: session.user.id, isActive: true },
  });
  if (!membership) return { error: "No pertenecés a ningún organizador" };

  const existing = await prisma.tournament.findFirst({
    where: { id: tournamentId, organizerId: membership.organizerId },
  });
  if (!existing) return { error: "Torneo no encontrado" };

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      name,
      description: description || null,
      startDate,
      endDate,
      registrationDeadline: registrationDeadline || null,
      isPublic,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    organizerId: membership.organizerId,
    tournamentId,
    entity: "Tournament",
    entityId: tournamentId,
    action: "UPDATE",
    before: { name: existing.name, isPublic: existing.isPublic },
    after: { name, isPublic },
  });

  revalidatePath(`/dashboard/torneos/${tournamentId}`);
  redirect(`/dashboard/torneos/${tournamentId}`);
}

// ─── Transiciones de estado ───────────────────────────────────────────────────

const VALID_TRANSITIONS: Partial<Record<TournamentStatus, TournamentStatus[]>> = {
  DRAFT: ["PUBLISHED", "CANCELLED"],
  PUBLISHED: ["REGISTRATION_OPEN", "CANCELLED"],
  REGISTRATION_OPEN: ["REGISTRATION_CLOSED", "IN_PROGRESS", "CANCELLED"],
  REGISTRATION_CLOSED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
};

// ─── Editar configuración de categoría ───────────────────────────────────────

const updateCategorySchema = z.object({
  maxTeams:     z.coerce.number().int().min(2).max(256),
  pricePerTeam: z.coerce.number().min(0).optional().nullable().transform((v) => (v == null || isNaN(v as number) ? null : v)),
  setsPerMatch: z.coerce.number().int().min(1).max(5),
  gamesPerSet:  z.coerce.number().int().min(4).max(10),
});

export async function updateTournamentCategory(
  tournamentCategoryId: string,
  _prev: TournamentActionState,
  formData: FormData
): Promise<TournamentActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const raw = Object.fromEntries(formData);
  const parsed = updateCategorySchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { maxTeams, pricePerTeam, setsPerMatch, gamesPerSet } = parsed.data;

  const membership = await prisma.userOrganizer.findFirst({
    where: { userId: session.user.id, isActive: true },
  });
  if (!membership) return { error: "Sin permisos" };

  const tc = await prisma.tournamentCategory.findFirst({
    where: { id: tournamentCategoryId, tournament: { organizerId: membership.organizerId } },
  });
  if (!tc) return { error: "Categoría no encontrada" };

  await prisma.tournamentCategory.update({
    where: { id: tournamentCategoryId },
    data: { maxTeams, pricePerTeam, setsPerMatch, gamesPerSet },
  });

  await createAuditLog({
    userId: session.user.id,
    organizerId: membership.organizerId,
    tournamentId: tc.tournamentId,
    entity: "TournamentCategory",
    entityId: tournamentCategoryId,
    action: "UPDATE",
    before: { maxTeams: tc.maxTeams, pricePerTeam: tc.pricePerTeam, setsPerMatch: tc.setsPerMatch, gamesPerSet: tc.gamesPerSet },
    after: { maxTeams, pricePerTeam, setsPerMatch, gamesPerSet },
  });

  revalidatePath(`/dashboard/torneos/${tc.tournamentId}`);
  revalidatePath(`/dashboard/torneos/${tc.tournamentId}/categorias/${tournamentCategoryId}`);
  redirect(`/dashboard/torneos/${tc.tournamentId}`);
}

// ─── Eliminar categoría ───────────────────────────────────────────────────────

export async function deleteTournamentCategory(
  tournamentCategoryId: string
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const membership = await prisma.userOrganizer.findFirst({
    where: { userId: session.user.id, isActive: true },
  });
  if (!membership) return { error: "Sin permisos" };

  const tc = await prisma.tournamentCategory.findFirst({
    where: { id: tournamentCategoryId, tournament: { organizerId: membership.organizerId } },
    include: { _count: { select: { stages: true } } },
  });
  if (!tc) return { error: "Categoría no encontrada" };

  if (tc._count.stages > 0) {
    return { error: "No se puede eliminar una categoría con fixture generado" };
  }

  await prisma.tournamentCategory.delete({ where: { id: tournamentCategoryId } });

  revalidatePath(`/dashboard/torneos/${tc.tournamentId}`);
  return {};
}

// ─── Transición de estado de categoría ───────────────────────────────────────

const CAT_VALID_TRANSITIONS: Partial<Record<TournamentCategoryStatus, TournamentCategoryStatus[]>> = {
  DRAFT:                ["REGISTRATION_OPEN"],
  REGISTRATION_OPEN:    ["REGISTRATION_CLOSED"],
  REGISTRATION_CLOSED:  ["REGISTRATION_OPEN"],
};

export async function updateTournamentCategoryStatus(
  tournamentCategoryId: string,
  newStatus: TournamentCategoryStatus
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const membership = await prisma.userOrganizer.findFirst({
    where: { userId: session.user.id, isActive: true },
  });
  if (!membership) return { error: "Sin permisos" };

  const tc = await prisma.tournamentCategory.findFirst({
    where: { id: tournamentCategoryId, tournament: { organizerId: membership.organizerId } },
  });
  if (!tc) return { error: "Categoría no encontrada" };

  const allowed = CAT_VALID_TRANSITIONS[tc.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return { error: `Transición ${tc.status} → ${newStatus} no permitida` };
  }

  await prisma.tournamentCategory.update({
    where: { id: tournamentCategoryId },
    data: { status: newStatus },
  });

  revalidatePath(`/dashboard/torneos/${tc.tournamentId}/categorias/${tournamentCategoryId}`);
  revalidatePath(`/dashboard/torneos/${tc.tournamentId}`);
  return {};
}

// ─── Transiciones de estado del torneo ───────────────────────────────────────

export async function updateTournamentStatus(
  tournamentId: string,
  newStatus: TournamentStatus
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const membership = await prisma.userOrganizer.findFirst({
    where: { userId: session.user.id, isActive: true },
  });
  if (!membership) return { error: "Sin permisos" };

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, organizerId: membership.organizerId },
  });
  if (!tournament) return { error: "Torneo no encontrado" };

  const allowed = VALID_TRANSITIONS[tournament.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return { error: `Transición ${tournament.status} → ${newStatus} no permitida` };
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: newStatus },
  });

  await createAuditLog({
    userId: session.user.id,
    organizerId: membership.organizerId,
    tournamentId,
    entity: "Tournament",
    entityId: tournamentId,
    action: "STATUS_CHANGE" as never,
    before: { status: tournament.status },
    after: { status: newStatus },
  });

  revalidatePath(`/dashboard/torneos/${tournamentId}`);
  revalidatePath("/dashboard/torneos");
  return {};
}

// ─── Eliminación permanente de torneo ────────────────────────────────────────

export async function deleteTournament(
  tournamentId: string
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const membership = await prisma.userOrganizer.findFirst({
    where: { userId: session.user.id, isActive: true },
  });
  if (!membership) return { error: "Sin permisos" };

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, organizerId: membership.organizerId },
  });
  if (!tournament) return { error: "Torneo no encontrado" };

  if (tournament.status !== "CANCELLED" && tournament.status !== "DRAFT") {
    return { error: "Solo se pueden eliminar torneos en estado Borrador o Cancelado" };
  }

  await prisma.tournament.delete({ where: { id: tournamentId } });

  revalidatePath("/dashboard/torneos");
  return {};
}
