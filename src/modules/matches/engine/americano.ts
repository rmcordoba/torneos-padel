import { prisma } from "@/lib/prisma";
import type { FormatEngine } from "./types";

export class AmericanoEngine implements FormatEngine {
  async generateStructure(
    tournamentCategoryId: string,
    teamIds: string[]
  ): Promise<{ stageIds: string[] }> {
    const n = teamIds.length;
    if (n < 2) throw new Error("Se necesitan al menos 2 equipos");

    const stageId = await prisma.$transaction(async (tx) => {
      const stage = await tx.stage.create({
        data: {
          tournamentCategoryId,
          name: "Americano",
          type: "GROUPS",
          order: 1,
          isCompleted: false,
        },
      });

      const group = await tx.group.create({
        data: { stageId: stage.id, name: "Todos contra todos", order: 1 },
      });

      await tx.groupStanding.createMany({
        data: teamIds.map((teamId, idx) => ({
          groupId: group.id,
          teamId,
          position: idx + 1,
        })),
      });

      let matchNumber = 1;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
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
              { matchId: match.id, teamId: teamIds[i], side: 1 },
              { matchId: match.id, teamId: teamIds[j], side: 2 },
            ],
          });
        }
      }

      return stage.id;
    });

    return { stageIds: [stageId] };
  }

  async resolveMatchWinner(matchId: string): Promise<string | null> {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        sets: true,
        teams: true,
        stage: { include: { tournamentCategory: true } },
      },
    });
    if (!match) return null;

    const setsToWin = Math.ceil(match.stage.tournamentCategory.setsPerMatch / 2);
    const side1 = match.teams.find((t) => t.side === 1);
    const side2 = match.teams.find((t) => t.side === 2);
    if (!side1 || !side2) return null;

    const wins: Record<string, number> = {};
    for (const set of match.sets) {
      if (set.games1 > set.games2) wins[side1.teamId] = (wins[side1.teamId] ?? 0) + 1;
      else if (set.games2 > set.games1) wins[side2.teamId] = (wins[side2.teamId] ?? 0) + 1;
    }
    for (const [teamId, count] of Object.entries(wins)) {
      if (count >= setsToWin) return teamId;
    }
    return null;
  }

  async advanceAfterMatch(matchId: string): Promise<void> {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { stage: true },
    });
    if (!match?.groupId) return;
    await this.recalculateGroupStandings(match.groupId);
  }

  async isStageComplete(stageId: string): Promise<boolean> {
    const incomplete = await prisma.match.count({
      where: { stageId, status: { notIn: ["COMPLETED", "WALKOVER", "CANCELLED"] } },
    });
    return incomplete === 0;
  }

  // En americano el ranking es por games ganados totales (no por partidos ganados)
  async recalculateGroupStandings(groupId: string): Promise<void> {
    const matches = await prisma.match.findMany({
      where: { groupId, status: { in: ["COMPLETED", "WALKOVER"] } },
      include: { teams: true, sets: true, result: true },
    });

    const stats: Record<string, {
      played: number; won: number; lost: number;
      sw: number; sl: number; gw: number; gl: number;
    }> = {};

    const ensure = (id: string) => {
      if (!stats[id]) stats[id] = { played: 0, won: 0, lost: 0, sw: 0, sl: 0, gw: 0, gl: 0 };
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
        if (set.games1 > set.games2) { stats[t1.teamId].sw++; stats[t2.teamId].sl++; }
        else if (set.games2 > set.games1) { stats[t2.teamId].sw++; stats[t1.teamId].sl++; }
      }

      if (match.result?.winnerId === t1.teamId) {
        stats[t1.teamId].won++; stats[t2.teamId].lost++;
      } else if (match.result?.winnerId === t2.teamId) {
        stats[t2.teamId].won++; stats[t1.teamId].lost++;
      }
    }

    // Ranking primario: games ganados. Secundario: diferencia de games. Terciario: partidos ganados.
    const sorted = Object.entries(stats).sort(([, a], [, b]) => {
      if (b.gw !== a.gw) return b.gw - a.gw;
      if (b.gw - b.gl !== a.gw - a.gl) return (b.gw - b.gl) - (a.gw - a.gl);
      return b.won - a.won;
    });

    for (let i = 0; i < sorted.length; i++) {
      const [teamId, s] = sorted[i];
      await prisma.groupStanding.upsert({
        where: { groupId_teamId: { groupId, teamId } },
        update: {
          position: i + 1,
          matchesPlayed: s.played, matchesWon: s.won, matchesLost: s.lost,
          setsWon: s.sw, setsLost: s.sl, gamesWon: s.gw, gamesLost: s.gl,
          points: s.gw, // points = games ganados (métrica principal del americano)
        },
        create: {
          groupId, teamId, position: i + 1,
          matchesPlayed: s.played, matchesWon: s.won, matchesLost: s.lost,
          setsWon: s.sw, setsLost: s.sl, gamesWon: s.gw, gamesLost: s.gl,
          points: s.gw,
        },
      });
    }
  }
}
