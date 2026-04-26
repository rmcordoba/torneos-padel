import { prisma } from "@/lib/prisma";
import type { FormatEngine } from "./types";

function nextPow2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(Math.max(n, 2))));
}

export class SingleEliminationEngine implements FormatEngine {
  async generateStructure(
    tournamentCategoryId: string,
    teamIds: string[]
  ): Promise<{ stageIds: string[] }> {
    const n = teamIds.length;
    if (n < 2) throw new Error("Se necesitan al menos 2 equipos");

    const bracketSize = nextPow2(n);
    const numRounds = Math.log2(bracketSize);

    const stageId = await prisma.$transaction(async (tx) => {
      const existingCount = await tx.stage.count({ where: { tournamentCategoryId } });
      const stage = await tx.stage.create({
        data: {
          tournamentCategoryId,
          name: "Eliminación Directa",
          type: "SINGLE_ELIMINATION",
          order: existingCount + 1,
          isCompleted: false,
        },
      });

      // Create all BracketNodes from Final (round=1) down to first round (round=numRounds)
      // round r has 2^(r-1) nodes; parent of (r,p) is (r-1, ceil(p/2))
      const nodeGrid: Record<number, Record<number, string>> = {};

      for (let round = 1; round <= numRounds; round++) {
        const count = Math.pow(2, round - 1);
        nodeGrid[round] = {};

        for (let pos = 1; pos <= count; pos++) {
          const parentId =
            round === 1 ? null : nodeGrid[round - 1][Math.ceil(pos / 2)];

          const node = await tx.bracketNode.create({
            data: {
              stageId: stage.id,
              round,
              position: pos,
              parentNodeId: parentId,
            },
          });
          nodeGrid[round][pos] = node.id;
        }
      }

      // Seed teams into first-round nodes
      // Each node at round=numRounds gets two team slots; missing slot = bye
      const firstRound = numRounds;
      const firstRoundCount = Math.pow(2, numRounds - 1);
      let matchNumber = 1;

      // Track which parent positions have a bye child (to detect double-byes)
      const byeChildCount: Record<number, { count: number; teams: string[] }> = {};

      for (let pos = 1; pos <= firstRoundCount; pos++) {
        const nodeId = nodeGrid[firstRound][pos];
        const team1 = teamIds[(pos - 1) * 2] ?? null;
        const team2 = teamIds[(pos - 1) * 2 + 1] ?? null;
        const parentPos = Math.ceil(pos / 2);

        if (!team1) continue;

        if (!team2) {
          // Bye: mark node and record for parent tracking
          await tx.bracketNode.update({
            where: { id: nodeId },
            data: { teamId: team1, isBye: true },
          });
          if (!byeChildCount[parentPos]) byeChildCount[parentPos] = { count: 0, teams: [] };
          byeChildCount[parentPos].count++;
          byeChildCount[parentPos].teams.push(team1);
        } else {
          // Real match
          const match = await tx.match.create({
            data: {
              stageId: stage.id,
              bracketNodeId: nodeId,
              matchNumber: matchNumber++,
              status: "SCHEDULED",
            },
          });
          await tx.matchTeam.createMany({
            data: [
              { matchId: match.id, teamId: team1, side: 1 },
              { matchId: match.id, teamId: team2, side: 2 },
            ],
          });
        }
      }

      // Handle double-byes: if both children of a parent are byes, create that match immediately
      if (firstRound > 1) {
        for (const [parentPosStr, info] of Object.entries(byeChildCount)) {
          if (info.count === 2 && info.teams.length === 2) {
            const parentPos = Number(parentPosStr);
            const parentRound = firstRound - 1;
            const parentNodeId = nodeGrid[parentRound][parentPos];
            const match = await tx.match.create({
              data: {
                stageId: stage.id,
                bracketNodeId: parentNodeId,
                matchNumber: matchNumber++,
                status: "SCHEDULED",
              },
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

    const { setsPerMatch } = match.stage.tournamentCategory;
    const setsToWin = Math.ceil(setsPerMatch / 2);

    const wins: Record<string, number> = {};
    const side1Team = match.teams.find((t) => t.side === 1);
    const side2Team = match.teams.find((t) => t.side === 2);
    if (!side1Team || !side2Team) return null;

    for (const set of match.sets) {
      if (set.games1 > set.games2) {
        wins[side1Team.teamId] = (wins[side1Team.teamId] ?? 0) + 1;
      } else if (set.games2 > set.games1) {
        wins[side2Team.teamId] = (wins[side2Team.teamId] ?? 0) + 1;
      }
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
        result: true,
        bracketNode: { include: { childNodes: true } },
      },
    });

    if (!match?.result?.winnerId || !match.bracketNode?.parentNodeId) return;

    const winnerId = match.result.winnerId;
    const currentNode = match.bracketNode;

    // Mark winner on the current node
    await prisma.bracketNode.update({
      where: { id: currentNode.id },
      data: { teamId: winnerId },
    });

    // Check if the sibling node also has a team ready (either won their match or is a bye)
    const parentNodeId = currentNode.parentNodeId;
    if (!parentNodeId) return;

    const parentNode = await prisma.bracketNode.findUnique({
      where: { id: parentNodeId },
      include: {
        childNodes: true,
        match: true,
      },
    });

    if (!parentNode) return;

    // Find both children with resolved teams
    const readyChildren = parentNode.childNodes.filter((c) => c.teamId !== null);
    if (readyChildren.length < 2) return;
    if (parentNode.match) return; // match already created

    // Determine sides: left child (odd pos) = side 1, right child (even pos) = side 2
    const leftChild = readyChildren.find((c) => c.position % 2 === 1) ?? readyChildren[0];
    const rightChild = readyChildren.find((c) => c.position % 2 === 0) ?? readyChildren[1];

    const matchCount = await prisma.match.count({ where: { stageId: match.stageId } });

    const newMatch = await prisma.match.create({
      data: {
        stageId: match.stageId,
        bracketNodeId: parentNode.id,
        matchNumber: matchCount + 1,
        status: "SCHEDULED",
      },
    });

    await prisma.matchTeam.createMany({
      data: [
        { matchId: newMatch.id, teamId: leftChild.teamId!, side: 1 },
        { matchId: newMatch.id, teamId: rightChild.teamId!, side: 2 },
      ],
    });
  }

  async isStageComplete(stageId: string): Promise<boolean> {
    const incomplete = await prisma.match.count({
      where: {
        stageId,
        status: { notIn: ["COMPLETED", "WALKOVER", "CANCELLED"] },
      },
    });
    return incomplete === 0;
  }
}
