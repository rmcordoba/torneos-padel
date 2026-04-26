"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type PlayerProfileState = { error?: string; fieldErrors?: Record<string, string[]> } | null;

export async function upsertPlayerProfile(
  _prev: PlayerProfileState,
  formData: FormData,
): Promise<PlayerProfileState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const birthDateRaw = (formData.get("birthDate") as string)?.trim() || null;
  const dni = (formData.get("dni") as string)?.trim() || null;

  const fieldErrors: Record<string, string[]> = {};
  if (!firstName) fieldErrors.firstName = ["Requerido"];
  if (!lastName) fieldErrors.lastName = ["Requerido"];
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const birthDate = birthDateRaw ? new Date(birthDateRaw) : null;

  try {
    await prisma.playerProfile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, firstName, lastName, phone, birthDate, dni },
      update: { firstName, lastName, phone, birthDate, dni },
    });
    revalidatePath("/dashboard/perfil");
    revalidatePath("/dashboard/jugador");
    return { error: "__saved__" };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("dni")) return { fieldErrors: { dni: ["Este DNI ya está registrado"] } };
    return { error: "Error al guardar el perfil" };
  }
}

export type RegistrationState = { error?: string; success?: boolean } | null;

export async function registerForTournamentCategory(
  _prev: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const tournamentCategoryId = formData.get("tournamentCategoryId") as string;
  const partnerEmail = (formData.get("partnerEmail") as string)?.trim() || null;

  if (!tournamentCategoryId) return { error: "Categoría requerida" };

  const myProfile = await prisma.playerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!myProfile) return { error: "Completá tu perfil antes de inscribirte" };

  const tc = await prisma.tournamentCategory.findUnique({
    where: { id: tournamentCategoryId },
    include: { _count: { select: { registrations: true } } },
  });
  if (!tc) return { error: "Categoría no encontrada" };
  if (tc.status !== "REGISTRATION_OPEN") return { error: "Las inscripciones no están abiertas" };
  if (tc._count.registrations >= tc.maxTeams) return { error: "La categoría está completa" };

  const existing = await prisma.registration.findFirst({
    where: {
      tournamentCategoryId,
      team: { players: { some: { playerProfileId: myProfile.id } } },
    },
  });
  if (existing) return { error: "Ya estás inscripto en esta categoría" };

  let partnerProfileId: string | null = null;
  if (partnerEmail) {
    const partnerUser = await prisma.user.findUnique({
      where: { email: partnerEmail },
      include: { playerProfile: true },
    });
    if (!partnerUser) return { error: "No se encontró un usuario con ese email" };
    if (!partnerUser.playerProfile) return { error: "Tu compañero/a aún no completó su perfil" };
    if (partnerUser.id === session.user.id) return { error: "No podés inscribirte con vos mismo/a" };
    partnerProfileId = partnerUser.playerProfile.id;

    const partnerExisting = await prisma.registration.findFirst({
      where: {
        tournamentCategoryId,
        team: { players: { some: { playerProfileId: partnerProfileId } } },
      },
    });
    if (partnerExisting) return { error: "Tu compañero/a ya está inscripto en esta categoría" };
  }

  await prisma.$transaction(async (tx) => {
    const team = await tx.team.create({ data: {} });
    await tx.teamPlayer.create({ data: { teamId: team.id, playerProfileId: myProfile.id } });
    if (partnerProfileId) {
      await tx.teamPlayer.create({ data: { teamId: team.id, playerProfileId: partnerProfileId } });
    }
    await tx.registration.create({
      data: { tournamentCategoryId, teamId: team.id, status: "PENDING" },
    });
  });

  revalidatePath("/dashboard/jugador");
  return { success: true };
}
