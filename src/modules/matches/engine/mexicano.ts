import { prisma } from "@/lib/prisma";
import type { FormatEngine } from "./types";

interface MexicanoConfig {
  rounds?: number;
}

export class MexicanoEngine implements FormatEngine {
  async generateStructure(
    tournamentCategoryId: string,
    teamIds: string[]
  ): Promise<{ stageIds: string[] }> {
    const n = teamIds.length;
    if (n < 4) throw new Error("El mexicano requiere al menos 4 equipos");

    const tc = await prisma.tournamentCategory.findUniqueOrThrow({
      where: { id: tournamentCategoryId },
    });
    const config = (tc.formatConfig ?? {}) as MexicanoConfig;
    const totalRounds = config.rounds ?? 7;

    // Mezcla aleatoria para la ronda 1
    const shuffled = [...teamIds].sort(() => Math.random() - 0.5);

    const stageId = await prisma.$transaction(async (tx) => {
      const stage = await tx.stage.create({
        data: {
          tournamentCategoryId,
          name: "Mexicano",
          type: "GROUPS",
          order: 1,
          isCompleted: false,
          // guardamos totalRounds en el nombre no, lo guardamos vía el TC formatConfig
        },
      });

      await this.createRound(tx, stage.id, shuffled, 1);

      return stage.id;
    });

    return { stageIds: [stageId] };
  }

  private async createRound(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    stageId: string,
    orderedTeams: string[],
    roundNumber: number
  ): Promise<void> {
    const group = await tx.group.create({
      data: {
        stageId,
        name: `Ronda ${roundNumber}`,
        order: roundNumber,
      },
    });

    // Emparejar: 1° vs 2°, 3° vs 4°, etc.
    // Si hay cantidad impar, el último descansa (sin partido esta ronda)
    for (let i = 0; i + 1 < orderedTeams.length; i += 2) {
      const match = await tx.match.create({
        data: {
          stageId,
          groupId: group.id,
          matchNumber: Math.floor(i / 2) + 1,
          status: "SCHEDULED",
        },
      });
      await tx.matchTeam.createMany({
        data: [
          { matchId: match.id, teamId: orderedTeams[i], side: 1 },
          { matchId: match.id, teamId: orderedTeams[i + 1], side: 2 },
        ],
      });
    }
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
      include: {
        stage: { include: { tournamentCategory: true, groups: { include: { matches: true } } } },
        group: true,
      },
    });
    if (!match?.stage || !match.group) return;

    const config = (match.stage.tournamentCategory.formatConfig ?? {}) as MexicanoConfig;
    const totalRounds = config.rounds ?? 7;
    const currentRoundNumber = match.group.order;

    // Verificar si la ronda actual está completa
    const currentGroupMatches = match.stage.groups
      .find((g) => g.id === match.groupId)?.matches ?? [];
    const allDone = currentGroupMatches.every(
      (m) => m.status === "COMPLETED" || m.status === "WALKOVER" || m.status === "CANCELLED"
    );
    if (!allDone) return;

    // Si ya se jugaron todas las rondas, no generar más
    if (currentRoundNumber >= totalRounds) return;

    // Calcular standings acumulados para armar la próxima ronda
    const standings = await this.computeAggregateStandings(match.stage.id);
    const orderedTeams = standings.map((s) => s.teamId);

    await prisma.$transaction(async (tx) => {
      await this.createRound(tx, match.stage.id, orderedTeams, currentRoundNumber + 1);
    });
  }

  async isStageComplete(stageId: string): Promise<boolean> {
    const stage = await prisma.stage.findUnique({
      where: { id: stageId },
      include: {
        groups: { include: { matches: true } },
        tournamentCategory: true,
      },
    });
    if (!stage) return false;

    const config = (stage.tournamentCategory.formatConfig ?? {}) as MexicanoConfig;
    const totalRounds = config.rounds ?? 7;
    const roundsPlayed = stage.groups.length;

    if (roundsPlayed < totalRounds) return false;

    const incomplete = await prisma.match.count({
      where: { stageId, status: { notIn: ["COMPLETED", "WALKOVER", "CANCELLED"] } },
    });
    return incomplete === 0;
  }

  // Calcula standings acumulados a partir de todos los partidos del stage
  async computeAggregateStandings(
    stageId: string
  ): Promise<{ teamId: string; gamesWon: number; gamesLost: number; matchesWon: number; matchesPlayed: number }[]> {
    const matches = await prisma.match.findMany({
      where: { stageId, status: { in: ["COMPLETED", "WALKOVER"] } },
      include: { teams: true, sets: true, result: true },
    });

    // Recopilar todos los teams que participan en este stage
    const allTeamIds = new Set<string>();
    for (const m of matches) {
      for (const t of m.teams) allTeamIds.add(t.teamId);
    }

    // También incluir equipos que aún no han jugado (ronda inicial)
    const allGroups = await prisma.group.findMany({
      where: { stageId },
      include: { matches: { include: { teams: true } } },
    });
    for (const g of allGroups) {
      for (const m of g.matches) {
        for (const t of m.teams) allTeamIds.add(t.teamId);
      }
    }

    const stats: Record<string, { gw: number; gl: number; won: number; played: number }> = {};
    for (const id of allTeamIds) {
      stats[id] = { gw: 0, gl: 0, won: 0, played: 0 };
    }

    for (const match of matches) {
      const t1 = match.teams.find((t) => t.side === 1);
      const t2 = match.teams.find((t) => t.side === 2);
      if (!t1 || !t2) continue;

      stats[t1.teamId].played++;
      stats[t2.teamId].played++;

      for (const set of match.sets) {
        stats[t1.teamId].gw += set.games1;
        stats[t1.teamId].gl += set.games2;
        stats[t2.teamId].gw += set.games2;
        stats[t2.teamId].gl += set.games1;
      }

      if (match.result?.winnerId === t1.teamId) stats[t1.teamId].won++;
      else if (match.result?.winnerId === t2.teamId) stats[t2.teamId].won++;
    }

    return Object.entries(stats)
      .sort(([, a], [, b]) => {
        if (b.gw !== a.gw) return b.gw - a.gw;
        if (b.gw - b.gl !== a.gw - a.gl) return (b.gw - b.gl) - (a.gw - a.gl);
        return b.won - a.won;
      })
      .map(([teamId, s]) => ({
        teamId,
        gamesWon: s.gw,
        gamesLost: s.gl,
        matchesWon: s.won,
        matchesPlayed: s.played,
      }));
  }
}
