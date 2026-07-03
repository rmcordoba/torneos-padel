"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveMembership } from "@/lib/active-organizer";
import { requireMembership, requireWritable, PermissionError } from "@/lib/permissions";
import { z } from "zod";

export type ConfigActionState = { error?: string; fieldErrors?: Record<string, string[]>; success?: string } | null;

async function resolveOrganizer(userId: string) {
  const membership = await getActiveMembership(userId);
  if (!membership) throw new Error("Sin organización");
  await requireWritable(membership.organizerId);
  return membership;
}

// ─── Organizer info ───────────────────────────────────────────────────────────

const organizerSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
});

export async function updateOrganizerInfo(
  _prev: ConfigActionState,
  formData: FormData
): Promise<ConfigActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const parsed = organizerSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    website: formData.get("website") || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const membership = await resolveOrganizer(session.user.id);
  await prisma.organizer.update({
    where: { id: membership.organizerId },
    data: parsed.data,
  });

  revalidatePath("/dashboard/configuracion");
  return { success: "Información guardada correctamente" };
}

// ─── Organizer settings ───────────────────────────────────────────────────────

export async function updateOrganizerSettings(
  _prev: ConfigActionState,
  formData: FormData
): Promise<ConfigActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const membership = await resolveOrganizer(session.user.id);

  await prisma.organizerSettings.upsert({
    where: { organizerId: membership.organizerId },
    update: {
      defaultSetsPerMatch: Number(formData.get("defaultSetsPerMatch")) || 3,
      defaultGamesPerSet: Number(formData.get("defaultGamesPerSet")) || 6,
      defaultMaxTeamsPerCat: Number(formData.get("defaultMaxTeamsPerCat")) || 16,
      allowPublicRegistration: formData.get("allowPublicRegistration") === "true",
      requirePayment: formData.get("requirePayment") === "true",
    },
    create: {
      organizerId: membership.organizerId,
      defaultSetsPerMatch: Number(formData.get("defaultSetsPerMatch")) || 3,
      defaultGamesPerSet: Number(formData.get("defaultGamesPerSet")) || 6,
      defaultMaxTeamsPerCat: Number(formData.get("defaultMaxTeamsPerCat")) || 16,
      allowPublicRegistration: formData.get("allowPublicRegistration") === "true",
      requirePayment: formData.get("requirePayment") === "true",
    },
  });

  revalidatePath("/dashboard/configuracion");
  return { success: "Configuración guardada correctamente" };
}

// ─── Categories CRUD ──────────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(80),
  gender: z.enum(["MALE", "FEMALE", "MIXED", "OPEN"]).default("OPEN"),
  level: z.string().max(20).optional().or(z.literal("")),
  description: z.string().max(200).optional().or(z.literal("")),
});

export async function createCategory(
  _prev: ConfigActionState,
  formData: FormData
): Promise<ConfigActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    gender: formData.get("gender") || "OPEN",
    level: formData.get("level") || undefined,
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const membership = await resolveOrganizer(session.user.id);

  try {
    await prisma.category.create({
      data: { organizerId: membership.organizerId, ...parsed.data },
    });
  } catch {
    return { error: "Ya existe una categoría con ese nombre" };
  }

  revalidatePath("/dashboard/configuracion");
  return null;
}

export async function updateCategory(
  categoryId: string,
  _prev: ConfigActionState,
  formData: FormData
): Promise<ConfigActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    gender: formData.get("gender") || "OPEN",
    level: formData.get("level") || undefined,
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  await prisma.category.update({ where: { id: categoryId }, data: parsed.data });
  revalidatePath("/dashboard/configuracion");
  return null;
}

export async function toggleCategoryActive(categoryId: string, active: boolean): Promise<void> {
  await prisma.category.update({ where: { id: categoryId }, data: { isActive: active } });
  revalidatePath("/dashboard/configuracion");
}

// ─── Collaborators ────────────────────────────────────────────────────────────

export async function inviteCollaborator(
  _prev: ConfigActionState,
  formData: FormData
): Promise<ConfigActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) return { error: "Ingresá un email" };

  const membership = await resolveOrganizer(session.user.id);
  if (membership.role !== "OWNER" && membership.role !== "ORGANIZER") {
    return { error: "Sin permisos para invitar colaboradores" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "No existe un usuario registrado con ese email" };

  const existing = await prisma.userOrganizer.findUnique({
    where: { userId_organizerId: { userId: user.id, organizerId: membership.organizerId } },
  });
  if (existing) return { error: "Este usuario ya pertenece a la organización" };

  await prisma.userOrganizer.create({
    data: {
      userId: user.id,
      organizerId: membership.organizerId,
      role: "COLLABORATOR",
      permissions: ["MANAGE_REGISTRATIONS", "MANAGE_RESULTS"],
    },
  });

  revalidatePath("/dashboard/configuracion");
  return null;
}

export async function removeCollaborator(membershipId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  let myMembership;
  try {
    myMembership = await requireMembership(session.user.id);
    await requireWritable(myMembership.organizerId);
  } catch (e) {
    return { error: e instanceof PermissionError ? e.message : "Sin permisos" };
  }

  if (myMembership.role !== "OWNER" && myMembership.role !== "ORGANIZER") {
    return { error: "Sin permisos para eliminar colaboradores" };
  }

  // Ensure the target membership belongs to the same organizer
  const target = await prisma.userOrganizer.findFirst({
    where: { id: membershipId, organizerId: myMembership.organizerId },
  });
  if (!target) return { error: "Colaborador no encontrado" };

  // OWNER cannot be removed this way
  if (target.role === "OWNER") return { error: "No se puede eliminar al propietario" };

  await prisma.userOrganizer.delete({ where: { id: membershipId } });
  revalidatePath("/dashboard/configuracion");
  return {};
}

export async function updateCollaboratorPermissions(
  membershipId: string,
  permissions: string[]
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  let myMembership;
  try {
    myMembership = await requireMembership(session.user.id);
    await requireWritable(myMembership.organizerId);
  } catch (e) {
    return { error: e instanceof PermissionError ? e.message : "Sin permisos" };
  }

  if (myMembership.role !== "OWNER" && myMembership.role !== "ORGANIZER") {
    return { error: "Sin permisos para modificar colaboradores" };
  }

  const target = await prisma.userOrganizer.findFirst({
    where: { id: membershipId, organizerId: myMembership.organizerId },
  });
  if (!target) return { error: "Colaborador no encontrado" };
  if (target.role === "OWNER") return { error: "No se pueden modificar los permisos del propietario" };

  const validPermissions = [
    "MANAGE_TOURNAMENTS","MANAGE_REGISTRATIONS","MANAGE_RESULTS",
    "MANAGE_SCHEDULE","MANAGE_VENUES","MANAGE_CATEGORIES","VIEW_REPORTS","MANAGE_COLLABORATORS",
  ];
  const filtered = permissions.filter((p) => validPermissions.includes(p));

  await prisma.userOrganizer.update({
    where: { id: membershipId },
    data: { permissions: filtered as any },
  });
  revalidatePath("/dashboard/configuracion");
  return {};
}

export async function updateCollaboratorTournamentAccess(
  membershipId: string,
  tournamentIds: string[]
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  let myMembership;
  try {
    myMembership = await requireMembership(session.user.id);
    await requireWritable(myMembership.organizerId);
  } catch (e) {
    return { error: e instanceof PermissionError ? e.message : "Sin permisos" };
  }

  if (myMembership.role !== "OWNER" && myMembership.role !== "ORGANIZER") {
    return { error: "Sin permisos para modificar acceso a torneos" };
  }

  const target = await prisma.userOrganizer.findFirst({
    where: { id: membershipId, organizerId: myMembership.organizerId },
  });
  if (!target) return { error: "Colaborador no encontrado" };

  // Verify all tournament IDs belong to this organizer
  if (tournamentIds.length > 0) {
    const count = await prisma.tournament.count({
      where: { id: { in: tournamentIds }, organizerId: myMembership.organizerId },
    });
    if (count !== tournamentIds.length) return { error: "Uno o más torneos no son válidos" };
  }

  // Replace all existing access grants for this membership
  await prisma.$transaction([
    prisma.tournamentAccess.deleteMany({ where: { userOrganizerId: membershipId } }),
    ...(tournamentIds.length > 0
      ? [prisma.tournamentAccess.createMany({
          data: tournamentIds.map((tournamentId) => ({ userOrganizerId: membershipId, tournamentId })),
        })]
      : []),
  ]);

  revalidatePath("/dashboard/configuracion");
  return {};
}
