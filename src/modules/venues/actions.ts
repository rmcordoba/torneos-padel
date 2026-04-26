"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrganizersByUser } from "@/modules/organizers/queries";
import { venueSchema, courtSchema } from "./validations";
import { createAuditLog } from "@/modules/audit/actions";

export type VenueActionState = { error?: string; fieldErrors?: Record<string, string[]> } | null;

async function resolveOrganizerIdOrThrow(userId: string): Promise<string> {
  const memberships = await getOrganizersByUser(userId);
  if (!memberships.length) throw new Error("Sin organización");
  return memberships[0].organizerId;
}

// ─── Venue ────────────────────────────────────────────────────────────────────

export async function createVenue(
  _prev: VenueActionState,
  formData: FormData
): Promise<VenueActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const parsed = venueSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    mapUrl: formData.get("mapUrl") || undefined,
  });

  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const organizerId = await resolveOrganizerIdOrThrow(session.user.id);

  const venue = await prisma.venue.create({
    data: { organizerId, ...parsed.data },
  });

  await createAuditLog({
    userId: session.user.id,
    organizerId,
    entity: "Venue",
    entityId: venue.id,
    action: "CREATE",
    after: { name: venue.name },
  });

  redirect(`/dashboard/sedes/${venue.id}`);
}

export async function updateVenue(
  venueId: string,
  _prev: VenueActionState,
  formData: FormData
): Promise<VenueActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const parsed = venueSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    mapUrl: formData.get("mapUrl") || undefined,
  });

  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const organizerId = await resolveOrganizerIdOrThrow(session.user.id);

  await prisma.venue.updateMany({
    where: { id: venueId, organizerId },
    data: parsed.data,
  });

  await createAuditLog({
    userId: session.user.id,
    organizerId,
    entity: "Venue",
    entityId: venueId,
    action: "UPDATE",
    after: parsed.data,
  });

  revalidatePath(`/dashboard/sedes/${venueId}`);
  revalidatePath("/dashboard/sedes");
  redirect(`/dashboard/sedes/${venueId}`);
}

export async function deleteVenue(venueId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  const organizerId = await resolveOrganizerIdOrThrow(session.user.id);

  const venue = await prisma.venue.findFirst({ where: { id: venueId, organizerId } });

  await prisma.venue.updateMany({
    where: { id: venueId, organizerId },
    data: { isActive: false },
  });

  if (venue) {
    await createAuditLog({
      userId: session.user.id,
      organizerId,
      entity: "Venue",
      entityId: venueId,
      action: "DELETE",
      before: { name: venue.name },
    });
  }

  revalidatePath("/dashboard/sedes");
  redirect("/dashboard/sedes");
}

// ─── Court ────────────────────────────────────────────────────────────────────

export async function createCourt(
  venueId: string,
  _prev: VenueActionState,
  formData: FormData
): Promise<VenueActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const parsed = courtSchema.safeParse({
    name: formData.get("name"),
    surface: formData.get("surface") || undefined,
    isIndoor: formData.get("isIndoor") === "true",
  });

  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const organizerId = await resolveOrganizerIdOrThrow(session.user.id);
  const venue = await prisma.venue.findFirst({ where: { id: venueId, organizerId } });
  if (!venue) return { error: "Sede no encontrada" };

  await prisma.court.create({ data: { venueId, ...parsed.data } });

  revalidatePath(`/dashboard/sedes/${venueId}`);
  return null;
}

export async function updateCourt(
  courtId: string,
  venueId: string,
  _prev: VenueActionState,
  formData: FormData
): Promise<VenueActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const parsed = courtSchema.safeParse({
    name: formData.get("name"),
    surface: formData.get("surface") || undefined,
    isIndoor: formData.get("isIndoor") === "true",
  });

  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  await prisma.court.update({
    where: { id: courtId },
    data: parsed.data,
  });

  revalidatePath(`/dashboard/sedes/${venueId}`);
  return null;
}

export async function deleteCourt(courtId: string, venueId: string): Promise<void> {
  await prisma.court.update({
    where: { id: courtId },
    data: { isActive: false },
  });
  revalidatePath(`/dashboard/sedes/${venueId}`);
}
