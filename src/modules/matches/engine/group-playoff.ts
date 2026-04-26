import { prisma } from "@/lib/prisma";
import type { FormatEngine } from "./types";
import { SingleEliminationEngine } from "./single-elimination";

interface GroupConfig {
  groupSize?: number;
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
    const groupSize = config.groupSize ?? 4;
    const numGroups = Math.ceil(teamIds.length / groupSize);

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
        const groupTeams: string[] = [];
        for (let i = g; i < teamIds.length; i += numGroups) {
          groupTeams.push(teamIds[i]);
        }

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

    const stats: Record<string, {
      played: number; won: number; lost: number;
      sw: number; sl: number; gw: number; gl: number; pts: number;
    }> = {};

    const ensure = (id: string) => {
      if (!stats[id]) stats[id] = { played: 0, won: 0, lost: 0, sw: 0, sl: 0, gw: 0, gl: 0, pts: 0 };
    };

    for (const match of matches) {
      const t1 = match.teams.find((t) => t.side === 1);
      const t2 = match.teams.find((t) => t.side === 2);
      if (!t1 || !t2) continue;

      ensure(t1.teamId);
      ensure(t2.teamId);

      stats[t1.teamId].played++;
      stats[t2.teamId].played++;

      for (const set of match.sets) {
        stats[t1.teamId].gw += set.games1;
        stats[t1.teamId].gl += set.games2;
        stats[t2.teamId].gw += set.games2;
        stats[t2.teamId].gl += set.games1;

        if (set.games1 > set.games2) {
          stats[t1.teamId].sw++;
          stats[t2.teamId].sl++;
        } else if (set.games2 > set.games1) {
          stats[t2.teamId].sw++;
          stats[t1.teamId].sl++;
        }
      }

      if (match.result?.winnerId === t1.teamId) {
        stats[t1.teamId].won++;
        stats[t1.teamId].pts += 2;
        stats[t2.teamId].lost++;
      } else if (match.result?.winnerId === t2.teamId) {
        stats[t2.teamId].won++;
        stats[t2.teamId].pts += 2;
        stats[t1.teamId].lost++;
      }
    }

    const sorted = Object.entries(stats).sort(([, a], [, b]) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.sw - b.sl !== a.sw - a.sl) return (b.sw - b.sl) - (a.sw - a.sl);
      return (b.gw - b.gl) - (a.gw - a.gl);
    });

    for (let i = 0; i < sorted.length; i++) {
      const [teamId, s] = sorted[i];
      await prisma.groupStanding.upsert({
        where: { groupId_teamId: { groupId, teamId } },
        update: {
          position: i + 1,
          matchesPlayed: s.played, matchesWon: s.won, matchesLost: s.lost,
          setsWon: s.sw, setsLost: s.sl, gamesWon: s.gw, gamesLost: s.gl, points: s.pts,
        },
        create: {
          groupId, teamId, position: i + 1,
          matchesPlayed: s.played, matchesWon: s.won, matchesLost: s.lost,
          setsWon: s.sw, setsLost: s.sl, gamesWon: s.gw, gamesLost: s.gl, points: s.pts,
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

    // Collect classified teams: top N from each group, interleaved for balanced bracket
    const classified: string[] = [];
    for (let slot = 0; slot < teamsAdvancePerGroup; slot++) {
      for (const group of groupStage.groups) {
        const standing = group.standings[slot];
        if (standing) classified.push(standing.teamId);
      }
    }

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
