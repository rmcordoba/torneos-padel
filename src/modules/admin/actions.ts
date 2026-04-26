"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SystemRole } from "@prisma/client";

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
