import { z } from "zod";

export const createOrganizerSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  description: z.string().max(500).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  website: z.string().url().optional().or(z.literal("")),
});

export const updateOrganizerSchema = createOrganizerSchema.partial();

export type CreateOrganizerInput = z.infer<typeof createOrganizerSchema>;
export type UpdateOrganizerInput = z.infer<typeof updateOrganizerSchema>;

// ─── Self-service: alta de club ───────────────────────────────────────────────

/** Slugs que no se pueden usar como identificador de club (colisionan con rutas). */
export const RESERVED_SLUGS = [
  "c", "dashboard", "admin", "login", "register", "registrar-club",
  "api", "torneos", "cuadros", "agenda", "ranking", "jugadores",
  "reservas", "perfil", "forgot-password", "reset-password", "_next",
];

const slugField = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones");

/**
 * Schema del form de alta de club. Si el usuario ya está logueado, los campos de
 * cuenta (email/password/nombre) no son requeridos.
 */
export function createClubSchema(isLoggedIn: boolean) {
  const base = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
    slug: slugField,
  });

  if (isLoggedIn) return base;

  return base.extend({
    firstName: z.string().min(1, "Ingresá tu nombre").max(50),
    lastName: z.string().min(1, "Ingresá tu apellido").max(50),
    email: z.string().email("Email inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
  });
}
