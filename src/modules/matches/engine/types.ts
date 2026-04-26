export interface FormatEngine {
  /** Creates all stages, bracket nodes, and first-round matches in the DB. Returns created stage IDs. */
  generateStructure(
    tournamentCategoryId: string,
    teamIds: string[]
  ): Promise<{ stageIds: string[] }>;

  /** Determines the winner of a match given its sets. Returns teamId or null if undecided. */
  resolveMatchWinner(matchId: string): Promise<string | null>;

  /** After a match result is recorded, advances the winner in the bracket or standings. */
  advanceAfterMatch(matchId: string): Promise<void>;

  /** Returns true if all matches in the stage are completed. */
  isStageComplete(stageId: string): Promise<boolean>;

  /** Recalculates group standings after a match (GROUP_PLAYOFF only). */
  recalculateGroupStandings?(groupId: string): Promise<void>;

  /** Seeds group winners into the playoff bracket when all groups are done (GROUP_PLAYOFF only). */
  classifyGroupsToPlayoff?(groupStageId: string): Promise<void>;
}
