import { prisma } from "@/lib/prisma";
import type { FormatEngine } from "./types";
import { SingleEliminationEngine } from "./single-elimination";
import { computeGroupStandings, distributeIntoGroups, distributeIntoNumGroups, rankClassified, type GroupMatchData } from "./logic";

interface GroupConfig {
  /** Tamaño objetivo de grupo; la cantidad de grupos se deriva (modo clásico). */
  groupSize?: number;
  /** Cantidad EXACTA de grupos; el tamaño se deriva balanceado ±1. Tiene prioridad sobre groupSize. */
  numGroups?: number;
  teamsAdvancePerGroup?: number;
}

export class GroupPlayoffEngine implements FormatEngine {
  private elimEngine = new SingleEliminationEngine();

  async generateStructure(
    tournamentCategoryId: string,
    teamIds: string[]
  ): Promise<{ stageIds: string[] }> {
    const tc = await prisma.tournamentCategory.findUniqueOrThrow({
      where: { id: tournamentCategoryId },
    });
    const config = (tc.formatConfig ?? {}) as GroupConfig;
    const groupDistribution = config.numGroups
      ? distributeIntoNumGroups(teamIds, config.numGroups)
      : distributeIntoGroups(teamIds, config.groupSize ?? 4);
    const numGroups = groupDistribution.length;

    const stageId = await prisma.$transaction(async (tx) => {
      const stage = await tx.stage.create({
        data: {
          tournamentCategoryId,
          name: "Fase de Grupos",
          type: "GROUPS",
          order: 1,
          isCompleted: false,
        },
      });

      // Create groups and distribute teams round-robin style
      for (let g = 0; g < numGroups; g++) {
        const group = await tx.group.create({
          data: {
            stageId: stage.id,
            name: `Grupo ${String.fromCharCode(65 + g)}`,
            order: g + 1,
          },
        });

        // Teams for this group (interleaved distribution for balance)
        const groupTeams = groupDistribution[g];

        // Initialize standings for each team in the group
        await tx.groupStanding.createMany({
          data: groupTeams.map((teamId, idx) => ({
            groupId: group.id,
            teamId,
            position: idx + 1,
          })),
        });

        // Round-robin matches: each team plays every other team once
        let matchNumber = 1;
        for (let i = 0; i < groupTeams.length; i++) {
          for (let j = i + 1; j < groupTeams.length; j++) {
            const match = await tx.match.create({
              data: {
                stageId: stage.id,
                groupId: group.id,
                matchNumber: matchNumber++,
                status: "SCHEDULED",
              },
            });
            await tx.matchTeam.createMany({
              data: [
                { matchId: match.id, teamId: groupTeams[i], side: 1 },
                { matchId: match.id, teamId: groupTeams[j], side: 2 },
              ],
            });
          }
        }
      }

      // Create the playoff stage as a placeholder (teams TBD after groups finish)
      await tx.stage.create({
        data: {
          tournamentCategoryId,
          name: "Eliminación Directa",
          type: "SINGLE_ELIMINATION",
          order: 2,
          isCompleted: false,
        },
      });

      return stage.id;
    });

    return { stageIds: [stageId] };
  }

  async resolveMatchWinner(matchId: string): Promise<string | null> {
    return this.elimEngine.resolveMatchWinner(matchId);
  }

  async advanceAfterMatch(matchId: string): Promise<void> {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { stage: true },
    });
    if (!match) return;

    if (match.stage.type === "GROUPS" && match.groupId) {
      await this.recalculateGroupStandings(match.groupId);
    } else if (match.stage.type === "SINGLE_ELIMINATION") {
      await this.elimEngine.advanceAfterMatch(matchId);
    }
  }

  async isStageComplete(stageId: string): Promise<boolean> {
    return this.elimEngine.isStageComplete(stageId);
  }

  async recalculateGroupStandings(groupId: string): Promise<void> {
    const matches = await prisma.match.findMany({
      where: { groupId, status: "COMPLETED" },
      include: { teams: true, sets: true, result: true },
    });

    const matchData: GroupMatchData[] = [];
    for (const match of matches) {
      const t1 = match.teams.find((t) => t.side === 1);
      const t2 = match.teams.find((t) => t.side === 2);
      if (!t1 || !t2) continue;
      matchData.push({
        side1TeamId: t1.teamId,
        side2TeamId: t2.teamId,
        winnerId: match.result?.winnerId ?? null,
        sets: match.sets,
      });
    }

    const sorted = computeGroupStandings(matchData);

    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i];
      await prisma.groupStanding.upsert({
        where: { groupId_teamId: { groupId, teamId: s.teamId } },
        update: {
          position: i + 1,
          matchesPlayed: s.played, matchesWon: s.won, matchesLost: s.lost,
          setsWon: s.setsWon, setsLost: s.setsLost, gamesWon: s.gamesWon, gamesLost: s.gamesLost, points: s.points,
        },
        create: {
          groupId, teamId: s.teamId, position: i + 1,
          matchesPlayed: s.played, matchesWon: s.won, matchesLost: s.lost,
          setsWon: s.setsWon, setsLost: s.setsLost, gamesWon: s.gamesWon, gamesLost: s.gamesLost, points: s.points,
        },
      });
    }
  }

  async classifyGroupsToPlayoff(groupStageId: string): Promise<void> {
    const groupStage = await prisma.stage.findUniqueOrThrow({
      where: { id: groupStageId },
      include: {
        groups: {
          include: {
            standings: { orderBy: { position: "asc" } },
          },
        },
        tournamentCategory: true,
      },
    });

    const config = (groupStage.tournamentCategory.formatConfig ?? {}) as GroupConfig;
    const teamsAdvancePerGroup = config.teamsAdvancePerGroup ?? 2;

    // Clasificados ordenados por mérito (1ros primero, desempeño promedio como
    // desempate): el orden es la siembra del playoff, así los byes del cuadro
    // les tocan a los mejores.
    const classified = rankClassified(
      groupStage.groups.flatMap((g) =>
        g.standings.map((s) => ({
          teamId: s.teamId,
          position: s.position,
          points: s.points,
          matchesPlayed: s.matchesPlayed,
          setsWon: s.setsWon,
          setsLost: s.setsLost,
          gamesWon: s.gamesWon,
          gamesLost: s.gamesLost,
        }))
      ),
      teamsAdvancePerGroup
    );

    // Find the playoff stage
    const playoffStage = await prisma.stage.findFirst({
      where: {
        tournamentCategoryId: groupStage.tournamentCategoryId,
        type: "SINGLE_ELIMINATION",
        order: 2,
      },
    });

    if (!playoffStage) throw new Error("Playoff stage not found");

    // Delete the placeholder playoff stage and recreate with real bracket
    await prisma.stage.delete({ where: { id: playoffStage.id } });

    // Mark group stage as completed
    await prisma.stage.update({
      where: { id: groupStageId },
      data: { isCompleted: true },
    });

    // Generate elimination bracket with classified teams
    await this.elimEngine.generateStructure(
      groupStage.tournamentCategoryId,
      classified
    );
  }
}
