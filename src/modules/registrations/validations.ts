import { z } from "zod";

export const createRegistrationSchema = z.object({
  tournamentCategoryId: z.string().cuid(),
  teamId: z.string().cuid(),
  notes: z.string().max(500).optional(),
});

export const reviewRegistrationSchema = z.object({
  registrationId: z.string().cuid(),
  action: z.enum(["APPROVE", "REJECT"]),
  notes: z.string().max(500).optional(),
});

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
export type ReviewRegistrationInput = z.infer<typeof reviewRegistrationSchema>;
