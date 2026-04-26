"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrganizersByUser } from "@/modules/organizers/queries";
import { z } from "zod";

export type ConfigActionState = { error?: string; fieldErrors?: Record<string, string[]>; success?: string } | null;

async function resolveOrganizer(userId: string) {
  const memberships = await getOrganizersByUser(userId);
  if (!memberships.length) throw new Error("Sin organización");
  return memberships[0];
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

export async function removeCollaborator(membershipId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  await prisma.userOrganizer.delete({ where: { id: membershipId } });
  revalidatePath("/dashboard/configuracion");
}

export async function updateCollaboratorPermissions(
  membershipId: string,
  permissions: string[]
): Promise<void> {
  await prisma.userOrganizer.update({
    where: { id: membershipId },
    data: { permissions: permissions as any },
  });
  revalidatePath("/dashboard/configuracion");
}
