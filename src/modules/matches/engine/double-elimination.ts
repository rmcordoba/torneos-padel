import { prisma } from "@/lib/prisma";
import type { FormatEngine } from "./types";
import { SingleEliminationEngine } from "./single-elimination";

function nextPow2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(Math.max(n, 2))));
}

// Dado el round de un nodo en el WB (1=Final, numWBRounds=primera ronda)
// devuelve el índice 0-based del grupo LB al que va el perdedor.
// Fórmula: lbGroupIndex = 0 si r==numWBRounds, sino 2*(numWBRounds - r) - 1
function lbGroupIndexForWbRound(wbRound: number, numWBRounds: number): number {
  if (wbRound === numWBRounds) return 0;
  return 2 * (numWBRounds - wbRound) - 1;
}

// El slot dentro del grupo LB para el perdedor del WB.
// G0 (primera ronda): slot = wbPosition (simple 1:1)
// Grupos drop-in (G1, G3, ...) : slot = 2 * wbPosition (fills even slots, lado 2)
function lbSlotForWbDrop(wbPosition: number, lbGroupIndex: number): number {
  return lbGroupIndex === 0 ? wbPosition : 2 * wbPosition;
}

export class DoubleEliminationEngine implements FormatEngine {
  private elimEngine = new SingleEliminationEngine();

  async generateStructure(
    tournamentCategoryId: string,
    teamIds: string[]
  ): Promise<{ stageIds: string[] }> {
    const n = teamIds.length;
    if (n < 4) throw new Error("La doble eliminación requiere al menos 4 equipos");

    const bracketSize = nextPow2(n);
    const numWBRounds = Math.log2(bracketSize);
    const numLBRounds = 2 * (numWBRounds - 1); // Rondas de cuadro B sin contar la Gran Final

    const [wbStageId, lbStageId] = await prisma.$transaction(async (tx) => {
      // ─── Cuadro A (ganadores) ───────────────────────────────────────────────
      // Reutilizamos el mismo árbol de BracketNodes que SingleElimination.
      // Pero lo creamos manualmente aquí para tener los IDs y no duplicar lógica.
      const wbStage = await tx.stage.create({
        data: {
          tournamentCategoryId,
          name: "Cuadro A — Ganadores",
          type: "SINGLE_ELIMINATION",
          order: 1,
          isCompleted: false,
        },
      });

      // Misma lógica de SingleEliminationEngine.generateStructure
      const nodeGrid: Record<number, Record<number, string>> = {};
      for (let round = 1; round <= numWBRounds; round++) {
        const count = Math.pow(2, round - 1);
        nodeGrid[round] = {};
        for (let pos = 1; pos <= count; pos++) {
          const parentId = round === 1 ? null : nodeGrid[round - 1][Math.ceil(pos / 2)];
          const node = await tx.bracketNode.create({
            data: { stageId: wbStage.id, round, position: pos, parentNodeId: parentId },
          });
          nodeGrid[round][pos] = node.id;
        }
      }

      const firstRound = numWBRounds;
      const firstRoundCount = Math.pow(2, numWBRounds - 1);
      let matchNumber = 1;
      const byeChildCount: Record<number, { count: number; teams: string[] }> = {};

      for (let pos = 1; pos <= firstRoundCount; pos++) {
        const nodeId = nodeGrid[firstRound][pos];
        const team1 = teamIds[(pos - 1) * 2] ?? null;
        const team2 = teamIds[(pos - 1) * 2 + 1] ?? null;
        const parentPos = Math.ceil(pos / 2);

        if (!team1) continue;

        if (!team2) {
          await tx.bracketNode.update({ where: { id: nodeId }, data: { teamId: team1, isBye: true } });
          if (!byeChildCount[parentPos]) byeChildCount[parentPos] = { count: 0, teams: [] };
          byeChildCount[parentPos].count++;
          byeChildCount[parentPos].teams.push(team1);
        } else {
          const match = await tx.match.create({
            data: { stageId: wbStage.id, bracketNodeId: nodeId, matchNumber: matchNumber++, status: "SCHEDULED" },
          });
          await tx.matchTeam.createMany({
            data: [
              { matchId: match.id, teamId: team1, side: 1 },
              { matchId: match.id, teamId: team2, side: 2 },
            ],
          });
        }
      }

      if (firstRound > 1) {
        for (const [parentPosStr, info] of Object.entries(byeChildCount)) {
          if (info.count === 2 && info.teams.length === 2) {
            const parentNodeId = nodeGrid[firstRound - 1][Number(parentPosStr)];
            const match = await tx.match.create({
              data: { stageId: wbStage.id, bracketNodeId: parentNodeId, matchNumber: matchNumber++, status: "SCHEDULED" },
            });
            await tx.matchTeam.createMany({
              data: [
                { matchId: match.id, teamId: info.teams[0], side: 1 },
                { matchId: match.id, teamId: info.teams[1], side: 2 },
              ],
            });
          }
        }
      }

      // ─── Cuadro B (perdedores) + Gran Final ────────────────────────────────
      // Cada grupo = una ronda del cuadro B.
      // Grupo numLBRounds+1 = Gran Final.
      // Usamos GroupStanding.position como "slot" para asignar equipos.
      const lbStage = await tx.stage.create({
        data: {
          tournamentCategoryId,
          name: "Cuadro B — Perdedores",
          type: "DOUBLE_ELIMINATION",
          order: 2,
          isCompleted: false,
        },
      });

      // Crear grupos vacíos: rondas LB (1..numLBRounds) + Gran Final
      for (let i = 0; i < numLBRounds; i++) {
        const isLbFinal = i === numLBRounds - 1;
        await tx.group.create({
          data: {
            stageId: lbStage.id,
            name: isLbFinal ? "Final del Cuadro B" : `Cuadro B — Ronda ${i + 1}`,
            order: i + 1,
          },
        });
      }

      // Gran Final (grupo numLBRounds + 1)
      await tx.group.create({
        data: {
          stageId: lbStage.id,
          name: "Gran Final",
          order: numLBRounds + 1,
        },
      });

      return [wbStage.id, lbStage.id];
    });

    return { stageIds: [wbStageId, lbStageId] };
  }

  async resolveMatchWinner(matchId: string): Promise<string | null> {
    return this.elimEngine.resolveMatchWinner(matchId);
  }

  async advanceAfterMatch(matchId: string): Promise<void> {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        result: true,
        bracketNode: { include: { childNodes: true } },
        stage: {
          include: {
            tournamentCategory: {
              include: { stages: { include: { groups: true } } },
            },
          },
        },
        group: true,
      },
    });
    if (!match) return;

    const stages = match.stage.tournamentCategory.stages;
    const wbStage = stages.find((s) => s.type === "SINGLE_ELIMINATION");
    const lbStage = stages.find((s) => s.type === "DOUBLE_ELIMINATION");
    if (!wbStage || !lbStage) return;

    const lbGroups = lbStage.groups.sort((a, b) => a.order - b.order);

    const maxRoundRow = await prisma.bracketNode.aggregate({
      where: { stageId: wbStage.id },
      _max: { round: true },
    });
    const numWBRoundsReal = maxRoundRow._max.round ?? 1;
    const numLBRounds = 2 * (numWBRoundsReal - 1);

    // ─── Partido del Cuadro A ─────────────────────────────────────────────────
    if (match.stageId === wbStage.id && match.bracketNode) {
      const winnerId = match.result?.winnerId ?? null;
      if (!winnerId) return;

      const loserId = match.bracketNode.childNodes
        ? await this.getLoserId(matchId, winnerId)
        : null;

      const currentNode = match.bracketNode;
      const wbRound = currentNode.round;

      // Marcar ganador en el nodo actual
      await prisma.bracketNode.update({
        where: { id: currentNode.id },
        data: { teamId: winnerId },
      });

      // ── Avanzar ganador en cuadro A ────────────────────────────────────────
      if (currentNode.parentNodeId) {
        const parentNode = await prisma.bracketNode.findUnique({
          where: { id: currentNode.parentNodeId },
          include: { childNodes: true, match: true },
        });
        if (parentNode) {
          const readyChildren = parentNode.childNodes.filter((c) => c.teamId !== null);
          if (readyChildren.length >= 2 && !parentNode.match) {
            const left = readyChildren.find((c) => c.position % 2 === 1) ?? readyChildren[0];
            const right = readyChildren.find((c) => c.position % 2 === 0) ?? readyChildren[1];
            const matchCount = await prisma.match.count({ where: { stageId: wbStage.id } });
            const newMatch = await prisma.match.create({
              data: {
                stageId: wbStage.id,
                bracketNodeId: parentNode.id,
                matchNumber: matchCount + 1,
                status: "SCHEDULED",
              },
            });
            await prisma.matchTeam.createMany({
              data: [
                { matchId: newMatch.id, teamId: left.teamId!, side: 1 },
                { matchId: newMatch.id, teamId: right.teamId!, side: 2 },
              ],
            });
          }
        }
      } else {
        // Es la final del cuadro A → el ganador va a la Gran Final (slot 1)
        const gfGroup = lbGroups[numLBRounds]; // índice numLBRounds = Gran Final
        if (gfGroup) {
          await this.assignToLbSlot(lbStage.id, gfGroup.id, winnerId, 1);
          await this.tryCreateLbMatch(lbStage.id, gfGroup.id, numLBRounds, numLBRounds);
        }
      }

      // ── Enviar perdedor al cuadro B ────────────────────────────────────────
      if (loserId) {
        const lbGroupIdx = lbGroupIndexForWbRound(wbRound, numWBRoundsReal);
        const slot = lbSlotForWbDrop(currentNode.position, lbGroupIdx);
        const lbGroup = lbGroups[lbGroupIdx];
        if (lbGroup) {
          await this.assignToLbSlot(lbStage.id, lbGroup.id, loserId, slot);
          await this.tryCreateLbMatch(lbStage.id, lbGroup.id, lbGroupIdx, numLBRounds);
        }
      }
      return;
    }

    // ─── Partido del Cuadro B ─────────────────────────────────────────────────
    if (match.stageId === lbStage.id && match.group) {
      const winnerId = match.result?.winnerId ?? null;
      if (!winnerId) return;

      const currentGroupIdx = match.group.order - 1; // 0-based
      const nextGroupIdx = currentGroupIdx + 1;

      // Número de partido dentro del grupo (1-based)
      const matchNumInGroup = match.matchNumber ?? 1;

      if (nextGroupIdx > numLBRounds) {
        // Este era el partido de la Gran Final → torneo terminado
        return;
      }

      // Calcular slot en el siguiente grupo
      let nextSlot: number;
      if (nextGroupIdx === numLBRounds) {
        // El próximo es la Gran Final: el ganador del LB va al slot 2
        nextSlot = 2;
      } else if (nextGroupIdx % 2 === 1) {
        // Próximo es un grupo drop-in (odd): el ganador LB va a slot impar
        nextSlot = 2 * matchNumInGroup - 1;
      } else {
        // Próximo es un grupo puro (even): slot secuencial
        nextSlot = matchNumInGroup;
      }

      const nextGroup = lbGroups[nextGroupIdx];
      if (!nextGroup) return;

      await this.assignToLbSlot(lbStage.id, nextGroup.id, winnerId, nextSlot);
      await this.tryCreateLbMatch(lbStage.id, nextGroup.id, nextGroupIdx, numLBRounds);
    }
  }

  // Asignar un equipo a un slot en un grupo LB (usando GroupStanding como contenedor)
  private async assignToLbSlot(
    lbStageId: string,
    groupId: string,
    teamId: string,
    slot: number
  ): Promise<void> {
    await prisma.groupStanding.upsert({
      where: { groupId_teamId: { groupId, teamId } },
      update: { position: slot },
      create: { groupId, teamId, position: slot },
    });
  }

  // Intentar crear un partido en un grupo LB si el par de slots está completo
  private async tryCreateLbMatch(
    lbStageId: string,
    groupId: string,
    groupIdx: number,
    numLBRounds: number
  ): Promise<void> {
    const standings = await prisma.groupStanding.findMany({
      where: { groupId },
      orderBy: { position: "asc" },
    });

    // Buscar pares (1,2), (3,4), (5,6), ...
    const slotMap = new Map<number, string>(standings.map((s) => [s.position, s.teamId]));

    // Obtener matches ya creados para no duplicar
    const existingMatches = await prisma.match.findMany({
      where: { groupId },
      include: { teams: true },
    });

    for (let pairIdx = 1; ; pairIdx++) {
      const slot1 = 2 * pairIdx - 1;
      const slot2 = 2 * pairIdx;
      const team1 = slotMap.get(slot1);
      const team2 = slotMap.get(slot2);
      if (!team1) break; // no hay más pares
      if (!team2) continue; // aún falta el compañero de este par

      // Verificar si ya existe un partido con estos dos equipos en este grupo
      const alreadyExists = existingMatches.some(
        (m) =>
          m.teams.some((t) => t.teamId === team1) &&
          m.teams.some((t) => t.teamId === team2)
      );
      if (alreadyExists) continue;

      const newMatch = await prisma.match.create({
        data: {
          stageId: lbStageId,
          groupId,
          matchNumber: pairIdx,
          status: "SCHEDULED",
        },
      });
      await prisma.matchTeam.createMany({
        data: [
          { matchId: newMatch.id, teamId: team1, side: 1 },
          { matchId: newMatch.id, teamId: team2, side: 2 },
        ],
      });
    }
  }

  private async getLoserId(matchId: string, winnerId: string): Promise<string | null> {
    const matchTeams = await prisma.matchTeam.findMany({ where: { matchId } });
    const loser = matchTeams.find((t) => t.teamId !== winnerId);
    return loser?.teamId ?? null;
  }

  async isStageComplete(stageId: string): Promise<boolean> {
    const incomplete = await prisma.match.count({
      where: { stageId, status: { notIn: ["COMPLETED", "WALKOVER", "CANCELLED"] } },
    });
    return incomplete === 0;
  }
}
