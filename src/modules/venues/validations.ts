import { z } from "zod";

export const venueSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(100),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  mapUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});

export const courtSchema = z.object({
  name: z.string().min(1, "Ingresá un nombre").max(60),
  surface: z.string().max(60).optional().or(z.literal("")),
  isIndoor: z.boolean().default(false),
});

export type VenueInput = z.infer<typeof venueSchema>;
export type CourtInput = z.infer<typeof courtSchema>;
