import { z } from "zod";
import { WeekdayTimeBand } from "@prisma/client";

// ─── Disponibilidad horaria (partidos entre semana) ───────────────────────────

/** Orden y etiquetas de las franjas horarias para días L–V. */
export const WEEKDAY_TIME_BANDS = [
  { value: WeekdayTimeBand.MORNING, label: "Mañana", range: "08:00–14:00" },
  { value: WeekdayTimeBand.AFTERNOON, label: "Tarde", range: "14:00–18:00" },
  { value: WeekdayTimeBand.EVENING, label: "Noche", range: "18:00–00:00" },
] as const;

export const ALL_TIME_BANDS = WEEKDAY_TIME_BANDS.map((b) => b.value);

export const weekdayAvailabilitySchema = z
  .array(z.nativeEnum(WeekdayTimeBand))
  .max(3)
  .transform((bands) => Array.from(new Set(bands))); // dedup

/** Parsea las franjas enviadas en un FormData (checkboxes name="weekdayAvailability"). */
export function parseWeekdayAvailability(formData: FormData): WeekdayTimeBand[] {
  const raw = formData.getAll("weekdayAvailability").map((v) => String(v));
  const parsed = weekdayAvailabilitySchema.safeParse(raw);
  return parsed.success ? parsed.data : [];
}

export const createRegistrationSchema = z.object({
  tournamentCategoryId: z.string().cuid(),
  teamId: z.string().cuid(),
  notes: z.string().max(500).optional(),
  weekdayAvailability: weekdayAvailabilitySchema.optional(),
});

// ─── Schemas de las server actions (inputs de FormData) ───────────────────────

// Path interno para revalidatePath/redirects: relativo, sin protocolo ni "//"
const internalPathSchema = z
  .string()
  .max(500)
  .refine((p) => p.startsWith("/") && !p.startsWith("//"), "Path inválido");

export const organizerRegistrationInputSchema = z.object({
  player1Id: z.string().cuid(),
  player2Id: z.string().cuid(),
  tournamentCategoryId: z.string().cuid(),
  returnPath: internalPathSchema,
});

export const playerRegistrationInputSchema = z.object({
  tournamentCategoryId: z.string().cuid(),
  partnerId: z.string().cuid(),
});

export const registrationActionInputSchema = z.object({
  registrationId: z.string().cuid(),
  returnPath: internalPathSchema,
});

export const waitlistActionInputSchema = z.object({
  waitlistEntryId: z.string().cuid(),
  returnPath: internalPathSchema,
});

export const reviewRegistrationSchema = z.object({
  registrationId: z.string().cuid(),
  action: z.enum(["APPROVE", "REJECT"]),
  notes: z.string().max(500).optional(),
});

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
export type ReviewRegistrationInput = z.infer<typeof reviewRegistrationSchema>;
