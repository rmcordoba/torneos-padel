"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ScheduleActionState = { error: string } | null;

export async function assignSchedule(
  _prev: ScheduleActionState,
  formData: FormData
): Promise<ScheduleActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const membership = await prisma.userOrganizer.findFirst({
    where: { userId: session.user.id, isActive: true },
  });
  if (!membership) return { error: "Sin permisos" };

  const matchId = formData.get("matchId") as string;
  const tournamentId = formData.get("tournamentId") as string;
  const venueId = formData.get("venueId") as string;
  const courtId = formData.get("courtId") as string | null;
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = (formData.get("endTime") as string) || null;

  if (!matchId || !venueId || !date || !startTime) {
    return { error: "Completá los campos obligatorios" };
  }

  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, organizerId: membership.organizerId },
  });
  if (!tournament) return { error: "Torneo no encontrado" };

  const startDt = new Date(`${date}T${startTime}`);
  const endDt = endTime ? new Date(`${date}T${endTime}`) : null;

  if (isNaN(startDt.getTime())) return { error: "Fecha/hora inválida" };

  await prisma.$transaction(async (tx) => {
    // Remove existing slot if any
    const existing = await tx.scheduleSlot.findFirst({ where: { matchId } });
    if (existing) {
      await tx.courtAssignment.deleteMany({ where: { scheduleSlotId: existing.id } });
      await tx.scheduleSlot.delete({ where: { id: existing.id } });
    }

    const slot = await tx.scheduleSlot.create({
      data: {
        tournamentId,
        venueId,
        matchId,
        date: new Date(`${date}T00:00:00`),
        startTime: startDt,
        endTime: endDt,
      },
    });

    if (courtId) {
      await tx.courtAssignment.create({
        data: { scheduleSlotId: slot.id, courtId },
      });
    }

    await tx.match.update({
      where: { id: matchId },
      data: { scheduledAt: startDt },
    });
  });

  revalidatePath("/dashboard/calendario");
  return null;
}

export async function unscheduleMatch(matchId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  const membership = await prisma.userOrganizer.findFirst({
    where: { userId: session.user.id, isActive: true },
  });
  if (!membership) return;

  // Verify the match belongs to this organizer
  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      stage: { tournamentCategory: { tournament: { organizerId: membership.organizerId } } },
    },
  });
  if (!match) return;

  const slot = await prisma.scheduleSlot.findFirst({ where: { matchId } });
  if (!slot) return;

  await prisma.courtAssignment.deleteMany({ where: { scheduleSlotId: slot.id } });
  await prisma.scheduleSlot.delete({ where: { id: slot.id } });
  await prisma.match.update({ where: { id: matchId }, data: { scheduledAt: null } });

  revalidatePath("/dashboard/calendario");
}
