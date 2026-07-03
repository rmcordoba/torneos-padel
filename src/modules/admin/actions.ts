"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureSubscription, applyPayment } from "@/modules/billing/payments";
import type { SystemRole } from "@prisma/client";

export type AdminActionState = { error?: string; success?: string } | null;

async function requireSuperAdmin() {
  const session = await auth();
  if (session?.user?.systemRole !== "SUPER_ADMIN") throw new Error("No autorizado");
  return session;
}

export async function toggleOrganizerActive(
  organizerId: string
): Promise<{ error?: string }> {
  try {
    await requireSuperAdmin();
    const org = await prisma.organizer.findUnique({ where: { id: organizerId } });
    if (!org) return { error: "Organizador no encontrado" };
    await prisma.organizer.update({
      where: { id: organizerId },
      data: { isActive: !org.isActive },
    });
    revalidatePath("/admin/organizadores");
    return {};
  } catch {
    return { error: "No autorizado" };
  }
}

export async function toggleUserActive(userId: string): Promise<{ error?: string }> {
  try {
    await requireSuperAdmin();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "Usuario no encontrado" };
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
    revalidatePath("/admin/usuarios");
    return {};
  } catch {
    return { error: "No autorizado" };
  }
}

export async function setUserSystemRole(
  userId: string,
  role: SystemRole
): Promise<{ error?: string }> {
  try {
    const session = await requireSuperAdmin();
    if (userId === session.user.id) return { error: "No podés cambiar tu propio rol" };
    await prisma.user.update({ where: { id: userId }, data: { systemRole: role } });
    revalidatePath("/admin/usuarios");
    return {};
  } catch {
    return { error: "No autorizado" };
  }
}

// ─── Organizer CRUD ───────────────────────────────────────────────────────────

export async function createOrganizer(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    await requireSuperAdmin();
  } catch {
    return { error: "No autorizado" };
  }

  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim().toLowerCase();
  const email = (formData.get("email") as string)?.trim() || undefined;
  const phone = (formData.get("phone") as string)?.trim() || undefined;
  const website = (formData.get("website") as string)?.trim() || undefined;
  const description = (formData.get("description") as string)?.trim() || undefined;
  const ownerEmail = (formData.get("ownerEmail") as string)?.trim().toLowerCase() || undefined;

  if (!name || name.length < 2) return { error: "El nombre debe tener al menos 2 caracteres" };
  if (!slug || !/^[a-z0-9-]+$/.test(slug))
    return { error: "El slug solo puede tener letras minúsculas, números y guiones" };

  let ownerUser: { id: string } | null = null;
  if (ownerEmail) {
    ownerUser = await prisma.user.findUnique({ where: { email: ownerEmail }, select: { id: true } });
    if (!ownerUser) return { error: "No existe un usuario registrado con ese email" };
  }

  try {
    const organizer = await prisma.organizer.create({
      data: { name, slug, email, phone, website, description },
    });

    if (ownerUser) {
      await prisma.userOrganizer.create({
        data: { userId: ownerUser.id, organizerId: organizer.id, role: "OWNER", permissions: [] },
      });
    }

    revalidatePath("/admin/organizadores");
    return { success: "Organizador creado correctamente" };
  } catch (e: unknown) {
    const prismaError = e as { code?: string };
    if (prismaError.code === "P2002") return { error: "Ya existe un organizador con ese slug" };
    return { error: "Error al crear el organizador" };
  }
}

export async function updateOrganizer(
  organizerId: string,
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  try {
    await requireSuperAdmin();
  } catch {
    return { error: "No autorizado" };
  }

  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim().toLowerCase();
  const email = (formData.get("email") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const website = (formData.get("website") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name || name.length < 2) return { error: "El nombre debe tener al menos 2 caracteres" };
  if (!slug || !/^[a-z0-9-]+$/.test(slug))
    return { error: "El slug solo puede tener letras minúsculas, números y guiones" };

  try {
    await prisma.organizer.update({
      where: { id: organizerId },
      data: { name, slug, email, phone, website, description },
    });
    revalidatePath("/admin/organizadores");
    return { success: "Organizador actualizado correctamente" };
  } catch (e: unknown) {
    const prismaError = e as { code?: string };
    if (prismaError.code === "P2002") return { error: "Ya existe un organizador con ese slug" };
    return { error: "Error al actualizar el organizador" };
  }
}

export async function deleteOrganizer(
  organizerId: string
): Promise<{ error?: string }> {
  try {
    await requireSuperAdmin();
  } catch {
    return { error: "No autorizado" };
  }

  const org = await prisma.organizer.findUnique({
    where: { id: organizerId },
    include: { _count: { select: { tournaments: true } } },
  });
  if (!org) return { error: "Organizador no encontrado" };
  if (org._count.tournaments > 0)
    return { error: "No se puede eliminar un organizador con torneos asociados" };

  await prisma.organizer.delete({ where: { id: organizerId } });
  revalidatePath("/admin/organizadores");
  return {};
}

// ─── Suscripciones (cobro manual) ─────────────────────────────────────────────

export async function assignPlan(organizerId: string, planId: string): Promise<{ error?: string }> {
  try {
    await requireSuperAdmin();
    await ensureSubscription(organizerId);
    await prisma.subscription.update({ where: { organizerId }, data: { planId } });
    revalidatePath("/admin/suscripciones");
    return {};
  } catch {
    return { error: "No se pudo asignar el plan" };
  }
}

export async function setTrial(organizerId: string, days: number): Promise<{ error?: string }> {
  try {
    await requireSuperAdmin();
    await ensureSubscription(organizerId);
    const trialEndsAt = new Date(Date.now() + Math.max(1, days) * 24 * 60 * 60 * 1000);
    await prisma.subscription.update({
      where: { organizerId },
      data: { status: "TRIALING", trialEndsAt, canceledAt: null },
    });
    revalidatePath("/admin/suscripciones");
    return {};
  } catch {
    return { error: "No se pudo actualizar el trial" };
  }
}

export async function cancelSubscription(organizerId: string): Promise<{ error?: string }> {
  try {
    await requireSuperAdmin();
    await prisma.subscription.update({
      where: { organizerId },
      data: { status: "CANCELED", canceledAt: new Date() },
    });
    revalidatePath("/admin/suscripciones");
    return {};
  } catch {
    return { error: "No se pudo cancelar la suscripción" };
  }
}

/** Registra un pago manual: extiende el período y deja la suscripción ACTIVE. */
export async function registerPayment(
  organizerId: string,
  formData: FormData
): Promise<{ error?: string }> {
  try {
    const session = await requireSuperAdmin();

    const amount = Number(formData.get("amount"));
    const months = Math.max(1, Number(formData.get("months") || 1));
    const method = (formData.get("method") as string)?.trim() || "transferencia";
    const notes = (formData.get("notes") as string)?.trim() || null;

    if (!Number.isFinite(amount) || amount < 0) return { error: "Monto inválido" };

    await applyPayment({
      organizerId,
      amount,
      months,
      method,
      notes,
      recordedByUserId: session.user.id,
    });

    revalidatePath("/admin/suscripciones");
    return {};
  } catch {
    return { error: "No se pudo registrar el pago" };
  }
}
