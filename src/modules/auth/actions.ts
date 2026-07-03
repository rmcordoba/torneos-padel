"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from "./validations";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimitByIp } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";

// Los tokens de reset se guardan hasheados (SHA-256): si alguien lee la DB
// no puede usarlos. El token en claro solo viaja en el email al usuario.
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export async function loginWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function login(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Máx. 10 intentos de login por IP cada 5 minutos
  if (!(await rateLimitByIp("login", 10, 5 * 60 * 1000))) {
    return { error: "Demasiados intentos. Esperá unos minutos y volvé a intentar." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
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
    throw error; // re-throw redirects
  }
}

export async function register(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Máx. 5 registros por IP por hora (frena creación masiva de cuentas)
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
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Cuenta creada, pero no se pudo iniciar sesión automáticamente." };
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

// ─── Forgot password ──────────────────────────────────────────────────────────

export async function forgotPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  // Máx. 3 solicitudes de reset por IP cada 15 minutos (frena spam de emails)
  if (!(await rateLimitByIp("forgot-password", 3, 15 * 60 * 1000))) {
    return { error: "Demasiadas solicitudes. Esperá unos minutos y volvé a intentar." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true },
  });

  // Silenciar: no revelar si el email existe
  if (user) {
    // Eliminar tokens anteriores del mismo usuario
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Se persiste el hash, no el token en claro
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token: hashToken(token), expiresAt },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name ?? user.email,
      resetUrl: `${appUrl}/reset-password?token=${token}`,
    });
  }

  return { error: "__sent__" }; // señal especial para mostrar el mensaje de éxito
}

// ─── Reset password ───────────────────────────────────────────────────────────

export async function resetPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  // Máx. 10 intentos de canje de token por IP cada 15 minutos
  if (!(await rateLimitByIp("reset-password", 10, 15 * 60 * 1000))) {
    return { error: "Demasiados intentos. Esperá unos minutos y volvé a intentar." };
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { token: hashToken(parsed.data.token) },
    include: { user: { select: { id: true } } },
  });

  if (!record || record.expiresAt < new Date()) {
    return { error: "El enlace expiró o es inválido. Solicitá uno nuevo." };
  }

  const hashed = await bcrypt.hash(parsed.data.password, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
    prisma.passwordResetToken.delete({ where: { id: record.id } }),
  ]);

  return { error: "__reset_ok__" }; // señal de éxito
}

// ─── Change password (autenticado) ───────────────────────────────────────────

export async function changePassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  if (!user?.password) {
    return { error: "Tu cuenta usa inicio de sesión externo (Google). No podés cambiar la contraseña aquí." };
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!valid) return { fieldErrors: { currentPassword: ["Contraseña actual incorrecta"] } };

  const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } });

  return { error: "__changed__" }; // señal de éxito
}
