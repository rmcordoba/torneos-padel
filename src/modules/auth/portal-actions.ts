"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema } from "./validations";
import { rateLimitByIp } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";

// Solo aceptar paths relativos internos como callback (anti open-redirect).
function safeCallbackUrl(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}

export type PortalAuthState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export async function loginPortal(
  _prev: PortalAuthState,
  formData: FormData
): Promise<PortalAuthState> {
  const raw = Object.fromEntries(formData);
  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Máx. 10 intentos de login por IP cada 5 minutos
  if (!(await rateLimitByIp("login", 10, 5 * 60 * 1000))) {
    return { error: "Demasiados intentos. Esperá unos minutos y volvé a intentar." };
  }

  const callbackUrl = safeCallbackUrl(formData.get("callbackUrl"), "/torneos");

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email o contraseña incorrectos" };
        default:
          return { error: "Error al iniciar sesión. Intentá de nuevo." };
      }
    }
    throw error; // re-throw NEXT_REDIRECT
  }
}

export async function registerPortal(
  _prev: PortalAuthState,
  formData: FormData
): Promise<PortalAuthState> {
  const raw = Object.fromEntries(formData);
  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Máx. 5 registros por IP por hora
  if (!(await rateLimitByIp("register", 5, 60 * 60 * 1000))) {
    return { error: "Demasiados intentos. Esperá unos minutos y volvé a intentar." };
  }

  const { email, password, firstName, lastName } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return { fieldErrors: { email: ["Este email ya está registrado"] } };
  }

  const hashed = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      password: hashed,
      name: `${firstName} ${lastName}`,
      playerProfile: { create: { firstName, lastName } },
    },
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/torneos?bienvenido=1",
    });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Cuenta creada. Iniciá sesión para continuar." };
    }
    throw error;
  }
}

export async function logoutPortal() {
  await signOut({ redirectTo: "/torneos" });
}
