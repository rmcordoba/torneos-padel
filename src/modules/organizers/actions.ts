"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth, signIn } from "@/lib/auth";
import { ACTIVE_ORG_COOKIE } from "@/lib/active-organizer";
import { TRIAL_DAYS } from "@/lib/subscription";
import { createClubSchema, RESERVED_SLUGS } from "./validations";

export type OrganizerActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

/**
 * Cambia el organizador activo del usuario (el club sobre el que opera el
 * dashboard). Valida que tenga una membresía activa en ese organizador.
 */
export async function setActiveOrganizer(organizerId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const membership = await prisma.userOrganizer.findUnique({
    where: { userId_organizerId: { userId: session.user.id, organizerId } },
    select: { isActive: true },
  });
  if (!membership?.isActive) return;

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organizerId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/dashboard");
}

/**
 * Alta self-service de un club. Si no hay sesión, crea la cuenta del owner.
 * Crea Organizer + OrganizerSettings + UserOrganizer(OWNER), deja el club activo
 * y redirige al dashboard.
 */
export async function createClub(
  _prev: OrganizerActionState,
  formData: FormData
): Promise<OrganizerActionState> {
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  const raw = Object.fromEntries(formData);
  const parsed = createClubSchema(isLoggedIn).safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, slug } = parsed.data;

  if (RESERVED_SLUGS.includes(slug)) {
    return { fieldErrors: { slug: ["Este identificador está reservado, elegí otro"] } };
  }

  const slugTaken = await prisma.organizer.findUnique({ where: { slug }, select: { id: true } });
  if (slugTaken) {
    return { fieldErrors: { slug: ["Ya existe un club con este identificador"] } };
  }

  // Resolver / crear el usuario owner
  let ownerUserId: string;
  let createdCredentials: { email: string; password: string } | null = null;

  if (isLoggedIn) {
    ownerUserId = session!.user!.id;
  } else {
    // En esta rama el schema incluyó los campos de cuenta (ver createClubSchema).
    const { email, password, firstName, lastName } = parsed.data as {
      name: string; slug: string;
      email: string; password: string; firstName: string; lastName: string;
    };
    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) {
      return { fieldErrors: { email: ["Este email ya está registrado. Iniciá sesión primero."] } };
    }
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: `${firstName} ${lastName}`,
        playerProfile: { create: { firstName, lastName } },
      },
      select: { id: true },
    });
    ownerUserId = user.id;
    createdCredentials = { email, password };
  }

  // Plan default para el trial inicial.
  const defaultPlan =
    (await prisma.plan.findFirst({ where: { isDefault: true }, select: { id: true } })) ??
    (await prisma.plan.findFirst({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true } }));

  const organizer = await prisma.organizer.create({
    data: {
      name,
      slug,
      settings: { create: {} },
      members: { create: { userId: ownerUserId, role: "OWNER" } },
      ...(defaultPlan
        ? {
            subscription: {
              create: {
                planId: defaultPlan.id,
                status: "TRIALING",
                trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
              },
            },
          }
        : {}),
    },
    select: { id: true },
  });

  // Dejar el nuevo club como activo
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organizer.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  if (createdCredentials) {
    await signIn("credentials", {
      email: createdCredentials.email,
      password: createdCredentials.password,
      redirectTo: "/dashboard",
    });
    return null; // signIn lanza el redirect
  }

  redirect("/dashboard");
}
