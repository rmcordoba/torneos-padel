"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrganizersByUser } from "@/modules/organizers/queries";
import { venueSchema, courtSchema } from "./validations";

export type VenueConfigState = { error?: string; fieldErrors?: Record<string, string[]> } | null;

const PATH = "/dashboard/configuracion";

async function getOrganizerId(userId: string): Promise<string | null> {
  const m = await getOrganizersByUser(userId);
  return m[0]?.organizerId ?? null;
}

export async function createVenueConfig(
  _prev: VenueConfigState,
  formData: FormData
): Promise<VenueConfigState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const parsed = venueSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    mapUrl: formData.get("mapUrl") || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const organizerId = await getOrganizerId(session.user.id);
  if (!organizerId) return { error: "Sin organización" };

  await prisma.venue.create({ data: { organizerId, ...parsed.data } });
  revalidatePath(PATH);
  return null;
}

export async function updateVenueConfig(
  venueId: string,
  _prev: VenueConfigState,
  formData: FormData
): Promise<VenueConfigState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const parsed = venueSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    mapUrl: formData.get("mapUrl") || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const organizerId = await getOrganizerId(session.user.id);
  if (!organizerId) return { error: "Sin organización" };

  await prisma.venue.updateMany({ where: { id: venueId, organizerId }, data: parsed.data });
  revalidatePath(PATH);
  return null;
}

export async function deleteVenueConfig(venueId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  const organizerId = await getOrganizerId(session.user.id);
  if (!organizerId) return;
  await prisma.venue.updateMany({ where: { id: venueId, organizerId }, data: { isActive: false } });
  revalidatePath(PATH);
}

export async function createCourtConfig(
  venueId: string,
  _prev: VenueConfigState,
  formData: FormData
): Promise<VenueConfigState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const parsed = courtSchema.safeParse({
    name: formData.get("name"),
    surface: formData.get("surface") || undefined,
    isIndoor: formData.get("isIndoor") === "true",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const organizerId = await getOrganizerId(session.user.id);
  if (!organizerId) return { error: "Sin organización" };

  const venue = await prisma.venue.findFirst({ where: { id: venueId, organizerId } });
  if (!venue) return { error: "Sede no encontrada" };

  await prisma.court.create({ data: { venueId, ...parsed.data } });
  revalidatePath(PATH);
  return null;
}

export async function updateCourtConfig(
  courtId: string,
  _prev: VenueConfigState,
  formData: FormData
): Promise<VenueConfigState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const parsed = courtSchema.safeParse({
    name: formData.get("name"),
    surface: formData.get("surface") || undefined,
    isIndoor: formData.get("isIndoor") === "true",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  await prisma.court.update({ where: { id: courtId }, data: parsed.data });
  revalidatePath(PATH);
  return null;
}

export async function deleteCourtConfig(courtId: string): Promise<void> {
  await prisma.court.update({ where: { id: courtId }, data: { isActive: false } });
  revalidatePath(PATH);
}
