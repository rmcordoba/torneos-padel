"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export type PlayerActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

const playerSchema = z.object({
  firstName: z.string().min(1, "Requerido").max(80),
  lastName: z.string().min(1, "Requerido").max(80),
  phone: z.string().max(30).optional(),
  dni: z.string().max(20).optional(),
  birthDate: z.coerce.date().optional().nullable(),
});

const createPlayerSchema = playerSchema.extend({
  email: z.string().email("Email inválido"),
});

// ─── Crear jugador ─────────────────────────────────────────────────────────────

export async function createPlayer(
  _prev: PlayerActionState,
  formData: FormData
): Promise<PlayerActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const raw = {
    email: formData.get("email"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") || undefined,
    dni: formData.get("dni") || undefined,
    birthDate: formData.get("birthDate") || undefined,
  };

  const parsed = createPlayerSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { email, firstName, lastName, phone, dni, birthDate } = parsed.data;

  // Si hay DNI, verificar que no exista
  if (dni) {
    const existing = await prisma.playerProfile.findUnique({ where: { dni } });
    if (existing) return { fieldErrors: { dni: ["Ya existe un jugador con ese DNI"] } };
  }

  // Buscar o crear User
  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const hasProfile = await prisma.playerProfile.findUnique({ where: { userId: user.id } });
    if (hasProfile) {
      return { fieldErrors: { email: ["Ya existe un jugador con ese email"] } };
    }
  } else {
    user = await prisma.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`,
        systemRole: "PLAYER",
      },
    });
  }

  const profile = await prisma.playerProfile.create({
    data: {
      userId: user.id,
      firstName,
      lastName,
      phone: phone || null,
      dni: dni || null,
      birthDate: birthDate || null,
    },
  });

  redirect(`/dashboard/jugadores/${profile.id}`);
}

// ─── Editar perfil ─────────────────────────────────────────────────────────────

export async function updatePlayerProfile(
  playerProfileId: string,
  _prev: PlayerActionState,
  formData: FormData
): Promise<PlayerActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const raw = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") || undefined,
    dni: formData.get("dni") || undefined,
    birthDate: formData.get("birthDate") || undefined,
  };

  const parsed = playerSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { firstName, lastName, phone, dni, birthDate } = parsed.data;

  // Si hay DNI, verificar que no lo use otro jugador
  if (dni) {
    const conflict = await prisma.playerProfile.findFirst({
      where: { dni, NOT: { id: playerProfileId } },
    });
    if (conflict) return { fieldErrors: { dni: ["Ya existe un jugador con ese DNI"] } };
  }

  await prisma.playerProfile.update({
    where: { id: playerProfileId },
    data: {
      firstName,
      lastName,
      phone: phone || null,
      dni: dni || null,
      birthDate: birthDate || null,
    },
  });

  revalidatePath(`/dashboard/jugadores/${playerProfileId}`);
  redirect(`/dashboard/jugadores/${playerProfileId}`);
}
