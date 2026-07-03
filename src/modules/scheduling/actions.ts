"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTournamentAccess, requireTournamentAccessByMatch, PermissionError } from "@/lib/permissions";
import { effectiveEnd, overlaps, checkVenueHours } from "./logic";

export type ScheduleActionState = { error: string } | null;

// ─── Validación de input ──────────────────────────────────────────────────────

const optionalString = (schema: z.ZodString) =>
  z.preprocess((v) => (v ? v : null), schema.nullable());

const assignScheduleSchema = z.object({
  matchId: z.string().cuid(),
  tournamentId: z.string().cuid(),
  venueId: z.string().cuid(),
  courtId: optionalString(z.string().cuid()),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: optionalString(z.string().regex(/^\d{2}:\d{2}$/)),
  reason: optionalString(z.string().max(300)),
});

// ─── Detección de conflictos ──────────────────────────────────────────────────
// Devuelve un mensaje de error si hay conflicto, o null si el horario es válido.

async function findScheduleConflict(params: {
  matchId: string;
  venueId: string;
  courtId: string | null;
  dayStart: Date; // fecha a las 00:00 (como se guarda en ScheduleSlot.date)
  start: Date;
  end: Date; // fin efectivo (real o asumido)
}): Promise<string | null> {
  const { matchId, venueId, courtId, dayStart, start, end } = params;

  // 1) Horario de la sede (si está configurado para ese día)
  const weekday = start.getDay();
  const venueSchedule = await prisma.venueSchedule.findUnique({
    where: { venueId_weekday: { venueId, weekday } },
  });
  if (venueSchedule) {
    const hoursError = checkVenueHours(start, end, venueSchedule);
    if (hoursError) return hoursError;
  }

  if (courtId) {
    // 2) Otro partido asignado a la misma cancha
    const courtSlots = await prisma.scheduleSlot.findMany({
      where: {
        date: dayStart,
        matchId: { not: matchId },
        courtAssignment: { courtId },
      },
      select: { startTime: true, endTime: true },
    });
    for (const slot of courtSlots) {
      if (overlaps(start, end, slot.startTime, effectiveEnd(slot.startTime, slot.endTime))) {
        return "La cancha ya tiene otro partido asignado en ese horario";
      }
    }

    // 3) Reserva de alquiler activa en esa cancha
    const booking = await prisma.booking.findFirst({
      where: {
        courtId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startTime: { lt: end },
        endTime: { gt: start },
      },
      select: { id: true },
    });
    if (booking) return "La cancha tiene una reserva de alquiler en ese horario";

    // 4) Bloqueo de cancha (mantenimiento, evento, etc.)
    const block = await prisma.courtBlock.findFirst({
      where: {
        courtId,
        startTime: { lt: end },
        endTime: { gt: start },
      },
      select: { reason: true },
    });
    if (block) {
      return block.reason
        ? `La cancha está bloqueada en ese horario (${block.reason})`
        : "La cancha está bloqueada en ese horario";
    }
  }

  // 5) Jugadores del partido con otro partido solapado (en cualquier sede)
  const matchTeams = await prisma.matchTeam.findMany({
    where: { matchId },
    select: { team: { select: { players: { select: { playerProfileId: true } } } } },
  });
  const playerIds = matchTeams.flatMap((mt) => mt.team.players.map((p) => p.playerProfileId));

  if (playerIds.length > 0) {
    const playerSlots = await prisma.scheduleSlot.findMany({
      where: {
        date: dayStart,
        matchId: { not: matchId },
        match: {
          teams: {
            some: { team: { players: { some: { playerProfileId: { in: playerIds } } } } },
          },
        },
      },
      select: { startTime: true, endTime: true },
    });
    for (const slot of playerSlots) {
      if (overlaps(start, end, slot.startTime, effectiveEnd(slot.startTime, slot.endTime))) {
        return "Un jugador de este partido ya tiene otro partido asignado en ese horario";
      }
    }
  }

  return null;
}

// ─── Asignar / reprogramar horario ────────────────────────────────────────────

export async function assignSchedule(
  _prev: ScheduleActionState,
  formData: FormData
): Promise<ScheduleActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const parsed = assignScheduleSchema.safeParse({
    matchId: formData.get("matchId"),
    tournamentId: formData.get("tournamentId"),
    venueId: formData.get("venueId"),
    courtId: formData.get("courtId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { error: "Completá los campos obligatorios" };

  const { matchId, tournamentId, venueId, courtId, date, startTime, endTime, reason } = parsed.data;

  try {
    await requireTournamentAccess(session.user.id, tournamentId, "MANAGE_SCHEDULE");
  } catch (e) {
    return { error: e instanceof PermissionError ? e.message : "Sin permisos" };
  }

  // La sede debe pertenecer al organizador del torneo (evita cruces entre clubes)
  const [tournament, venue] = await Promise.all([
    prisma.tournament.findUnique({ where: { id: tournamentId }, select: { organizerId: true } }),
    prisma.venue.findUnique({ where: { id: venueId }, select: { organizerId: true } }),
  ]);
  if (!tournament || !venue || venue.organizerId !== tournament.organizerId) {
    return { error: "Sede inválida para este torneo" };
  }

  const startDt = new Date(`${date}T${startTime}`);
  const endDt = endTime ? new Date(`${date}T${endTime}`) : null;

  if (isNaN(startDt.getTime())) return { error: "Fecha/hora inválida" };
  if (endDt && endDt <= startDt) return { error: "La hora de fin debe ser posterior a la de inicio" };

  const dayStart = new Date(`${date}T00:00:00`);
  const conflict = await findScheduleConflict({
    matchId,
    venueId,
    courtId,
    dayStart,
    start: startDt,
    end: effectiveEnd(startDt, endDt),
  });
  if (conflict) return { error: conflict };

  await prisma.$transaction(async (tx) => {
    // Remove existing slot if any
    const existing = await tx.scheduleSlot.findFirst({ where: { matchId } });
    if (existing) {
      await tx.courtAssignment.deleteMany({ where: { scheduleSlotId: existing.id } });
      await tx.scheduleSlot.delete({ where: { id: existing.id } });

      // Historial de reprogramación (solo si cambió el horario)
      if (existing.startTime.getTime() !== startDt.getTime()) {
        await tx.rescheduleHistory.create({
          data: {
            matchId,
            previousDate: existing.startTime,
            newDate: startDt,
            reason,
            requestedById: session.user.id,
          },
        });
      }
    }

    const slot = await tx.scheduleSlot.create({
      data: {
        tournamentId,
        venueId,
        matchId,
        date: dayStart,
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

// ─── Quitar asignación ────────────────────────────────────────────────────────

export async function unscheduleMatch(matchId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  try {
    await requireTournamentAccessByMatch(session.user.id, matchId, "MANAGE_SCHEDULE");
  } catch { return; }

  const slot = await prisma.scheduleSlot.findFirst({ where: { matchId } });
  if (!slot) return;

  await prisma.$transaction([
    prisma.courtAssignment.deleteMany({ where: { scheduleSlotId: slot.id } }),
    prisma.scheduleSlot.delete({ where: { id: slot.id } }),
    prisma.match.update({ where: { id: matchId }, data: { scheduledAt: null } }),
    prisma.rescheduleHistory.create({
      data: {
        matchId,
        previousDate: slot.startTime,
        newDate: null,
        requestedById: session.user.id,
      },
    }),
  ]);

  revalidatePath("/dashboard/calendario");
}
