"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema } from "./validations";
import bcrypt from "bcryptjs";

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

  const callbackUrl = (formData.get("callbackUrl") as string) || "/torneos";

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
