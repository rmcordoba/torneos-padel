"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFormatEngine } from "./engine";
import { createAuditLog } from "@/modules/audit/actions";

export type MatchActionState = { error: string } | null;

// ─── Avanzar grupos al playoff ────────────────────────────────────────────────

export async function classifyToPlayoff(
  groupStageId: string
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const membership = await prisma.userOrganizer.findFirst({
    where: { userId: session.user.id, isActive: true },
  });
  if (!membership) return { error: "Sin permisos" };

  const stage = await prisma.stage.findFirst({
    where: {
      id: groupStageId,
      tournamentCategory: { tournament: { organizerId: membership.organizerId } },
    },
    include: {
      tournamentCategory: true,
      groups: {
        include: {
          matches: { select: { id: true, status: true } },
        },
      },
    },
  });

  if (!stage || stage.type !== "GROUPS") return { error: "Etapa no válida" };

  const allDone = stage.groups.every((g) =>
    g.matches.every((m) => m.status === "COMPLETED" || m.status === "WALKOVER")
  );
  if (!allDone) return { error: "Hay partidos de grupos sin completar" };

  const engine = getFormatEngine(stage.tournamentCategory.format);
  if (!engine.classifyGroupsToPlayoff) return { error: "Este formato no soporta clasificación" };

  await engine.classifyGroupsToPlayoff(groupStageId);

  const tc = stage.tournamentCategory;
  revalidatePath(
    `/dashboard/torneos/${tc.tournamentId}/categorias/${tc.id}/fixture`
  );
  return {};
}

// ─── Generar fixture ──────────────────────────────────────────────────────────

export async function generateFixture(
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
    include: {
      tournament: true,
      registrations: {
        where: { status: "APPROVED" },
        include: { team: true },
      },
    },
  });

  if (!tc) return { error: "Categoría no encontrada" };

  const existingStage = await prisma.stage.findFirst({
    where: { tournamentCategoryId },
  });
  if (existingStage) return { error: "El fixture ya fue generado para esta categoría" };

  const teamIds = tc.registrations.map((r) => r.teamId);
  if (teamIds.length < 2) return { error: "Se necesitan al menos 2 equipos aprobados" };

  const engine = getFormatEngine(tc.format);
  await engine.generateStructure(tournamentCategoryId, teamIds);

  // Update category status to IN_PROGRESS
  await prisma.tournamentCategory.update({
    where: { id: tournamentCategoryId },
    data: { status: "IN_PROGRESS" },
  });

  revalidatePath(`/dashboard/torneos/${tc.tournamentId}/categorias/${tournamentCategoryId}`);
  redirect(`/dashboard/torneos/${tc.tournamentId}/categorias/${tournamentCategoryId}/fixture`);
}

// ─── Cargar resultado de un partido ──────────────────────────────────────────

export async function recordMatchResult(
  _prev: MatchActionState,
  formData: FormData
): Promise<MatchActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const membership = await prisma.userOrganizer.findFirst({
    where: { userId: session.user.id, isActive: true },
  });
  if (!membership) return { error: "Sin permisos" };

  const matchId = formData.get("matchId") as string;
  const returnPath = formData.get("returnPath") as string;
  const isWalkover = formData.get("isWalkover") === "true";
  const isRetired = formData.get("isRetired") === "true";
  const retiredTeamId = (formData.get("retiredTeamId") as string) || null;
  const walkoverId = (formData.get("walkoverId") as string) || null;

  // Parse sets from formData: sets[0][games1], sets[0][games2], etc.
  const setsRaw: { games1: number; games2: number; tiebreak1?: number; tiebreak2?: number }[] = [];
  let i = 0;
  while (formData.has(`sets[${i}][games1]`)) {
    setsRaw.push({
      games1: Number(formData.get(`sets[${i}][games1]`)),
      games2: Number(formData.get(`sets[${i}][games2]`)),
      tiebreak1: formData.has(`sets[${i}][tiebreak1]`)
        ? Number(formData.get(`sets[${i}][tiebreak1]`))
        : undefined,
      tiebreak2: formData.has(`sets[${i}][tiebreak2]`)
        ? Number(formData.get(`sets[${i}][tiebreak2]`))
        : undefined,
    });
    i++;
  }

  if (!isWalkover && setsRaw.length === 0) {
    return { error: "Ingresá al menos un set" };
  }

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      stage: { tournamentCategory: { tournament: { organizerId: membership.organizerId } } },
    },
    include: {
      stage: {
        include: {
          tournamentCategory: {
            include: { tournament: true },
          },
        },
      },
      teams: true,
    },
  });

  if (!match) return { error: "Partido no encontrado" };
  if (match.status === "COMPLETED") return { error: "El partido ya tiene resultado cargado" };

  const engine = getFormatEngine(match.stage.tournamentCategory.format);

  await prisma.$transaction(async (tx) => {
    // Delete existing sets if editing
    await tx.matchSet.deleteMany({ where: { matchId } });

    if (!isWalkover && setsRaw.length > 0) {
      await tx.matchSet.createMany({
        data: setsRaw.map((s, idx) => ({
          matchId,
          setNumber: idx + 1,
          games1: s.games1,
          games2: s.games2,
          tiebreak1: s.tiebreak1 ?? null,
          tiebreak2: s.tiebreak2 ?? null,
        })),
      });
    }

    // Determine winner from setsRaw (avoid querying uncommitted sets)
    let winnerId: string | null = null;
    if (isWalkover && walkoverId) {
      winnerId = walkoverId;
    } else if (isRetired && retiredTeamId) {
      const otherTeam = match.teams.find((t) => t.teamId !== retiredTeamId);
      winnerId = otherTeam?.teamId ?? null;
    } else {
      const setsToWin = Math.ceil(match.stage.tournamentCategory.setsPerMatch / 2);
      const side1Team = match.teams.find((t) => t.side === 1);
      const side2Team = match.teams.find((t) => t.side === 2);
      const wins: Record<string, number> = {};
      for (const s of setsRaw) {
        if (s.games1 > s.games2 && side1Team) wins[side1Team.teamId] = (wins[side1Team.teamId] ?? 0) + 1;
        else if (s.games2 > s.games1 && side2Team) wins[side2Team.teamId] = (wins[side2Team.teamId] ?? 0) + 1;
      }
      for (const [id, count] of Object.entries(wins)) {
        if (count >= setsToWin) { winnerId = id; break; }
      }
    }

    // Upsert result
    await tx.matchResult.upsert({
      where: { matchId },
      update: {
        winnerId,
        isWalkover,
        isRetired,
        retiredTeamId,
        recordedById: session.user.id,
      },
      create: {
        matchId,
        winnerId,
        isWalkover,
        isRetired,
        retiredTeamId,
        recordedById: session.user.id,
      },
    });

    await tx.match.update({
      where: { id: matchId },
      data: {
        status: isWalkover ? "WALKOVER" : "COMPLETED",
        completedAt: new Date(),
      },
    });
  });

  // Advance bracket / standings (outside transaction for simplicity)
  await engine.advanceAfterMatch(matchId);

  // Mark stage completed if all its matches are done, then check category completion
  const stageComplete = await engine.isStageComplete(match.stageId);
  if (stageComplete) {
    await prisma.stage.update({
      where: { id: match.stageId },
      data: { isCompleted: true },
    });

    const tcFormat = match.stage.tournamentCategory.format;
    // GROUP_PLAYOFF and DOUBLE_ELIMINATION always have 2 stages; don't complete the
    // category until both exist and are done (avoids premature completion when only
    // the groups stage has finished but the SE stage hasn't been created yet).
    const minStages = tcFormat === "GROUP_PLAYOFF" || tcFormat === "DOUBLE_ELIMINATION" ? 2 : 1;
    const allStages = await prisma.stage.findMany({
      where: { tournamentCategoryId: match.stage.tournamentCategoryId },
      select: { isCompleted: true },
    });
    if (allStages.length >= minStages && allStages.every((s) => s.isCompleted)) {
      await prisma.tournamentCategory.update({
        where: { id: match.stage.tournamentCategoryId },
        data: { status: "COMPLETED" },
      });
      revalidatePath(`/dashboard/torneos/${match.stage.tournamentCategory.tournament.id}`);
    }
  }

  await createAuditLog({
    userId: session.user.id,
    tournamentId: match.stage.tournamentCategory.tournament.id,
    entity: "Match",
    entityId: matchId,
    action: "RESULT_RECORDED",
    after: {
      status: isWalkover ? "WALKOVER" : "COMPLETED",
      isWalkover,
      isRetired,
    },
  });

  revalidatePath(returnPath);
  return null;
}

// ─── Editar resultado de un partido ya completado ────────────────────────────

export async function editMatchResult(
  _prev: MatchActionState,
  formData: FormData
): Promise<MatchActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const membership = await prisma.userOrganizer.findFirst({
    where: { userId: session.user.id, isActive: true },
  });
  if (!membership) return { error: "Sin permisos" };

  const matchId = formData.get("matchId") as string;
  const returnPath = formData.get("returnPath") as string;
  const isWalkover = formData.get("isWalkover") === "true";
  const isRetired = formData.get("isRetired") === "true";
  const retiredTeamId = (formData.get("retiredTeamId") as string) || null;
  const walkoverId = (formData.get("walkoverId") as string) || null;

  const setsRaw: { games1: number; games2: number; tiebreak1?: number; tiebreak2?: number }[] = [];
  let i = 0;
  while (formData.has(`sets[${i}][games1]`)) {
    setsRaw.push({
      games1: Number(formData.get(`sets[${i}][games1]`)),
      games2: Number(formData.get(`sets[${i}][games2]`)),
      tiebreak1: formData.has(`sets[${i}][tiebreak1]`) ? Number(formData.get(`sets[${i}][tiebreak1]`)) : undefined,
      tiebreak2: formData.has(`sets[${i}][tiebreak2]`) ? Number(formData.get(`sets[${i}][tiebreak2]`)) : undefined,
    });
    i++;
  }

  if (!isWalkover && setsRaw.length === 0) return { error: "Ingresá al menos un set" };

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      stage: { tournamentCategory: { tournament: { organizerId: membership.organizerId } } },
    },
    include: {
      stage: { include: { tournamentCategory: { include: { tournament: true } } } },
      teams: true,
    },
  });
  if (!match) return { error: "Partido no encontrado" };

  const engine = getFormatEngine(match.stage.tournamentCategory.format);

  await prisma.$transaction(async (tx) => {
    await tx.matchSet.deleteMany({ where: { matchId } });

    if (!isWalkover && setsRaw.length > 0) {
      await tx.matchSet.createMany({
        data: setsRaw.map((s, idx) => ({
          matchId,
          setNumber: idx + 1,
          games1: s.games1,
          games2: s.games2,
          tiebreak1: s.tiebreak1 ?? null,
          tiebreak2: s.tiebreak2 ?? null,
        })),
      });
    }

    let winnerId: string | null = null;
    if (isWalkover && walkoverId) {
      winnerId = walkoverId;
    } else if (isRetired && retiredTeamId) {
      const otherTeam = match.teams.find((t) => t.teamId !== retiredTeamId);
      winnerId = otherTeam?.teamId ?? null;
    } else {
      const setsToWin = Math.ceil(match.stage.tournamentCategory.setsPerMatch / 2);
      const side1Team = match.teams.find((t) => t.side === 1);
      const side2Team = match.teams.find((t) => t.side === 2);
      const wins: Record<string, number> = {};
      for (const s of setsRaw) {
        if (s.games1 > s.games2 && side1Team) wins[side1Team.teamId] = (wins[side1Team.teamId] ?? 0) + 1;
        else if (s.games2 > s.games1 && side2Team) wins[side2Team.teamId] = (wins[side2Team.teamId] ?? 0) + 1;
      }
      for (const [id, count] of Object.entries(wins)) {
        if (count >= setsToWin) { winnerId = id; break; }
      }
    }

    await tx.matchResult.upsert({
      where: { matchId },
      update: { winnerId, isWalkover, isRetired, retiredTeamId, recordedById: session.user.id },
      create: { matchId, winnerId, isWalkover, isRetired, retiredTeamId, recordedById: session.user.id },
    });

    await tx.match.update({
      where: { id: matchId },
      data: { status: isWalkover ? "WALKOVER" : "COMPLETED", completedAt: new Date() },
    });
  });

  await engine.advanceAfterMatch(matchId);

  await createAuditLog({
    userId: session.user.id,
    tournamentId: match.stage.tournamentCategory.tournament.id,
    entity: "Match",
    entityId: matchId,
    action: "RESULT_MODIFIED",
    after: { status: isWalkover ? "WALKOVER" : "COMPLETED", isWalkover, isRetired },
  });

  revalidatePath(returnPath);
  return null;
}
