import { z } from "zod";

const matchSetSchema = z.object({
  setNumber: z.number().int().min(1),
  games1: z.number().int().min(0),
  games2: z.number().int().min(0),
  tiebreak1: z.number().int().min(0).optional(),
  tiebreak2: z.number().int().min(0).optional(),
});

export const recordMatchResultSchema = z.object({
  matchId: z.string().cuid(),
  sets: z.array(matchSetSchema).min(1),
  winnerId: z.string().cuid().optional(),
  isWalkover: z.boolean().default(false),
  isRetired: z.boolean().default(false),
  retiredTeamId: z.string().cuid().optional(),
});

export type RecordMatchResultInput = z.infer<typeof recordMatchResultSchema>;
