import { z } from "zod";
import { CompetitionFormat } from "@prisma/client";

export const createTournamentSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(1000).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  registrationDeadline: z.coerce.date().optional(),
});

export const createTournamentCategorySchema = z.object({
  tournamentId: z.string().cuid(),
  categoryId: z.string().cuid(),
  format: z.nativeEnum(CompetitionFormat).default("SINGLE_ELIMINATION"),
  maxTeams: z.number().int().min(2).max(256),
  minTeams: z.number().int().min(2).default(4),
  pricePerTeam: z.number().min(0).optional(),
  setsPerMatch: z.number().int().min(1).max(5).default(3),
  gamesPerSet: z.number().int().min(4).max(10).default(6),
  hasTiebreak: z.boolean().default(true),
  tiebreakAt: z.number().int().default(6),
  tiebreakGames: z.number().int().default(7),
  formatConfig: z.record(z.unknown()).optional(),
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type CreateTournamentCategoryInput = z.infer<
  typeof createTournamentCategorySchema
>;
