"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireMembership, PermissionError } from "@/lib/permissions";
import { hasBookings } from "@/lib/subscription";
import { OrganizerRole } from "@prisma/client";

/** requirePermission + feature gate: el plan del club debe incluir reservas. */
async function requireBookingPermission(
  userId: string,
  permission: "MANAGE_VENUES" | "MANAGE_SCHEDULE",
) {
  const m = await requirePermission(userId, permission);
  if (!(await hasBookings(m.organizerId))) {
    throw new PermissionError("El módulo de reservas no está incluido en el plan de tu club.");
  }
  return m;
}
import { dateAtMinute, minutesToLabel } from "./availability";
import { computeBookingPrice } from "./pricing";
import { materializeRecurring } from "./recurring";
import { sendBookingConfirmationEmail } from "@/lib/email";

const DAYS_HUMAN = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS_HUMAN = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
function dateHuman(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS_HUMAN[dt.getDay()]} ${d} de ${MONTHS_HUMAN[m - 1]}`;
}

export type BookingActionState = { error: string } | { ok: true; id: string } | null;

/**
 * Detecta si un error proviene del constraint anti-solape de la base
 * (EXCLUDE `bookings_no_overlap`, SQLSTATE 23P01). Sirve para mostrar un
 * mensaje amigable en vez del error crudo de Postgres.
 */
function isOverlapError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const anyE = e as { message?: unknown; meta?: unknown; code?: unknown };
  const msg = String(anyE.message ?? "");
  const meta = JSON.stringify(anyE.meta ?? {});
  return (
    msg.includes("bookings_no_overlap") ||
    msg.includes("23P01") ||
    msg.includes("exclusion constraint") ||
    meta.includes("bookings_no_overlap")
  );
}

const OVERLAP_MESSAGE =
  "Ese horario ya fue reservado en esa cancha. Actualizá la grilla y elegí otro turno.";

// ── Validación ───────────────────────────────────────────────────────────────

const createSchema = z.object({
  courtId: z.string().min(1, "Elegí una cancha"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  startMinute: z.coerce.number().int().min(0).max(24 * 60),
  endMinute: z.coerce.number().int().min(1).max(24 * 60),
  customerName: z.string().trim().max(120).optional(),
  customerPhone: z.string().trim().max(40).optional(),
  price: z.coerce.number().nonnegative().optional(),
  notes: z.string().trim().max(500).optional(),
});

/**
 * Precio por defecto de un turno según las franjas horarias de la sede de la cancha,
 * prorrateado por minuto, usando el precio base de la cancha como fallback.
 */
async function resolveBookingPrice(courtId: string, startMinute: number, endMinute: number): Promise<number | null> {
  const court = await prisma.court.findUnique({
    where: { id: courtId },
    select: {
      bookingPrice: true,
      venue: { select: { priceRules: { select: { startMinute: true, endMinute: true, pricePerHour: true } } } },
    },
  });
  if (!court) return null;
  const bands = court.venue.priceRules.map((r) => ({
    startMinute: r.startMinute, endMinute: r.endMinute, pricePerHour: Number(r.pricePerHour),
  }));
  const fallback = court.bookingPrice != null ? Number(court.bookingPrice) : null;
  return computeBookingPrice(bands, startMinute, endMinute, fallback);
}

/** Verifica que la cancha pertenezca al organizador del usuario. Devuelve organizerId. */
async function assertCourtInOrganizer(courtId: string, organizerId: string) {
  const court = await prisma.court.findFirst({
    where: { id: courtId, venue: { organizerId } },
    select: { id: true },
  });
  if (!court) throw new PermissionError("Esa cancha no pertenece a tu organización");
}

// ── Configuración de horarios de una sede (VenueSchedule) ─────────────────────

export type ScheduleConfigState = { error: string } | { ok: true } | null;

export async function saveVenueSchedules(
  _prev: ScheduleConfigState,
  formData: FormData,
): Promise<ScheduleConfigState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  let membership;
  try {
    membership = await requireBookingPermission(session.user.id, "MANAGE_VENUES");
  } catch (e) {
    return { error: e instanceof PermissionError ? e.message : "Sin permisos" };
  }

  const venueId = String(formData.get("venueId") ?? "");
  const venue = await prisma.venue.findFirst({
    where: { id: venueId, organizerId: membership.organizerId },
    select: { id: true },
  });
  if (!venue) return { error: "Sede no encontrada" };

  for (let wd = 0; wd < 7; wd++) {
    const isClosed = formData.get(`d${wd}_closed`) === "on";
    const openMinute = Number(formData.get(`d${wd}_open`));
    const closeMinute = Number(formData.get(`d${wd}_close`));
    const slotMinutes = Number(formData.get(`d${wd}_slot`));

    if (!isClosed) {
      if (isNaN(openMinute) || isNaN(closeMinute) || closeMinute <= openMinute) {
        return { error: `Revisá el horario de ${["domingo","lunes","martes","miércoles","jueves","viernes","sábado"][wd]}: el cierre debe ser posterior a la apertura` };
      }
    }

    await prisma.venueSchedule.upsert({
      where: { venueId_weekday: { venueId, weekday: wd } },
      create: {
        venueId, weekday: wd,
        openMinute: isNaN(openMinute) ? 8 * 60 : openMinute,
        closeMinute: isNaN(closeMinute) ? 23 * 60 : closeMinute,
        slotMinutes: isNaN(slotMinutes) ? 90 : slotMinutes,
        isClosed,
      },
      update: {
        openMinute: isNaN(openMinute) ? 8 * 60 : openMinute,
        closeMinute: isNaN(closeMinute) ? 23 * 60 : closeMinute,
        slotMinutes: isNaN(slotMinutes) ? 90 : slotMinutes,
        isClosed,
      },
    });
  }

  revalidatePath("/dashboard/turnos/horarios");
  revalidatePath("/dashboard/turnos");
  return { ok: true };
}

// ── Franjas de precio por hora de una sede (PriceRule) ────────────────────────

export type PriceRulesState = { error: string } | { ok: true } | null;

export async function savePriceRules(
  _prev: PriceRulesState,
  formData: FormData,
): Promise<PriceRulesState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  let membership;
  try {
    membership = await requireBookingPermission(session.user.id, "MANAGE_VENUES");
  } catch (e) {
    return { error: e instanceof PermissionError ? e.message : "Sin permisos" };
  }

  const venueId = String(formData.get("venueId") ?? "");
  const venue = await prisma.venue.findFirst({
    where: { id: venueId, organizerId: membership.organizerId },
    select: { id: true },
  });
  if (!venue) return { error: "Sede no encontrada" };

  // Las franjas llegan serializadas como JSON
  let bands: { startMinute: number; endMinute: number; pricePerHour: number }[];
  try {
    const raw = JSON.parse(String(formData.get("bands") ?? "[]"));
    bands = (Array.isArray(raw) ? raw : []).map((b) => ({
      startMinute: Number(b.startMinute),
      endMinute: Number(b.endMinute),
      pricePerHour: Number(b.pricePerHour),
    }));
  } catch {
    return { error: "Datos de franjas inválidos" };
  }

  // Validación: rangos coherentes, precio no negativo, sin solapamientos
  for (const b of bands) {
    if (!Number.isFinite(b.startMinute) || !Number.isFinite(b.endMinute) || !Number.isFinite(b.pricePerHour)) {
      return { error: "Completá todos los campos de cada franja" };
    }
    if (b.endMinute <= b.startMinute) return { error: "En cada franja, el fin debe ser posterior al inicio" };
    if (b.pricePerHour < 0) return { error: "El precio por hora no puede ser negativo" };
  }
  const sorted = [...bands].sort((a, b) => a.startMinute - b.startMinute);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].startMinute < sorted[i - 1].endMinute) {
      return { error: "Las franjas no pueden superponerse entre sí" };
    }
  }

  // Reemplazamos el set completo de franjas de la sede
  await prisma.$transaction([
    prisma.priceRule.deleteMany({ where: { venueId } }),
    ...(sorted.length
      ? [prisma.priceRule.createMany({ data: sorted.map((b) => ({ venueId, ...b })) })]
      : []),
  ]);

  revalidatePath("/dashboard/turnos/precios");
  revalidatePath("/dashboard/turnos");
  revalidatePath("/reservas");
  return { ok: true };
}

// ── Reserva desde el mostrador (staff) ───────────────────────────────────────

export async function createBooking(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  let membership;
  try {
    membership = await requireBookingPermission(session.user.id, "MANAGE_SCHEDULE");
  } catch (e) {
    return { error: e instanceof PermissionError ? e.message : "Sin permisos" };
  }

  const parsed = createSchema.safeParse({
    courtId: formData.get("courtId"),
    date: formData.get("date"),
    startMinute: formData.get("startMinute"),
    endMinute: formData.get("endMinute"),
    customerName: formData.get("customerName") || undefined,
    customerPhone: formData.get("customerPhone") || undefined,
    price: formData.get("price") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;
  if (data.endMinute <= data.startMinute) return { error: "El horario de fin debe ser posterior al de inicio" };
  if (data.endMinute - data.startMinute < 60) return { error: "El turno mínimo es de 1 hora" };

  try {
    await assertCourtInOrganizer(data.courtId, membership.organizerId);
  } catch (e) {
    return { error: e instanceof PermissionError ? e.message : "Sin permisos" };
  }

  const startTime = dateAtMinute(data.date, data.startMinute);
  const endTime = dateAtMinute(data.date, data.endMinute);

  // Si el mostrador no fijó un precio, lo calculamos según las franjas de la sede.
  const price = data.price ?? await resolveBookingPrice(data.courtId, data.startMinute, data.endMinute);

  try {
    const booking = await prisma.booking.create({
      data: {
        organizerId: membership.organizerId,
        courtId: data.courtId,
        date: dateAtMinute(data.date, 0),
        startTime,
        endTime,
        status: "CONFIRMED",
        source: "STAFF",
        customerName: data.customerName ?? null,
        customerPhone: data.customerPhone ?? null,
        price: price ?? null,
        notes: data.notes ?? null,
        createdByUserId: session.user.id,
      },
      select: { id: true },
    });
    revalidatePath("/dashboard/turnos");
    return { ok: true, id: booking.id };
  } catch (e) {
    if (isOverlapError(e)) return { error: OVERLAP_MESSAGE };
    console.error("createBooking error", e);
    return { error: "No se pudo crear la reserva. Intentá de nuevo." };
  }
}

// ── Reserva self-service desde la web (cliente logueado) ─────────────────────

export async function createPublicBooking(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Necesitás iniciar sesión para reservar" };

  const profile = await prisma.playerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return { error: "Necesitás un perfil de jugador para reservar" };

  const courtId = String(formData.get("courtId") ?? "");
  const date = String(formData.get("date") ?? "");
  const startMinute = Number(formData.get("startMinute"));
  const endMinute = Number(formData.get("endMinute"));

  if (!courtId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(startMinute) || isNaN(endMinute) || endMinute <= startMinute) {
    return { error: "Datos de la reserva inválidos" };
  }

  // El organizer se deriva de la cancha (multi-club)
  const court = await prisma.court.findUnique({
    where: { id: courtId },
    select: {
      bookingPrice: true, name: true,
      venue: {
        select: {
          name: true, organizerId: true, organizer: { select: { name: true } },
          priceRules: { select: { startMinute: true, endMinute: true, pricePerHour: true } },
        },
      },
    },
  });
  if (!court) return { error: "Cancha no encontrada" };

  // Precio prorrateado según las franjas de la sede (fallback: precio base de la cancha)
  const bands = court.venue.priceRules.map((r) => ({
    startMinute: r.startMinute, endMinute: r.endMinute, pricePerHour: Number(r.pricePerHour),
  }));
  const price = computeBookingPrice(bands, startMinute, endMinute, court.bookingPrice != null ? Number(court.bookingPrice) : null);

  // No permitir reservar en el pasado
  const startTime = dateAtMinute(date, startMinute);
  if (startTime.getTime() < Date.now()) return { error: "No se puede reservar un horario que ya pasó" };

  try {
    const booking = await prisma.booking.create({
      data: {
        organizerId: court.venue.organizerId,
        courtId,
        date: dateAtMinute(date, 0),
        startTime,
        endTime: dateAtMinute(date, endMinute),
        status: "CONFIRMED",
        source: "PUBLIC",
        playerProfileId: profile.id,
        price: price ?? null,
        paymentStatus: "UNPAID", // se paga en el club
      },
      select: { id: true },
    });

    // Email de confirmación (no bloquea la respuesta si falla)
    if (session.user.email) {
      await sendBookingConfirmationEmail({
        to: session.user.email,
        customerName: session.user.name?.split(" ")[0] ?? "jugador",
        clubName: court.venue.organizer.name,
        venueName: court.venue.name,
        courtName: court.name,
        dateLabel: dateHuman(date),
        timeLabel: `${minutesToLabel(startMinute)} – ${minutesToLabel(endMinute)}`,
        price,
      });
    }

    revalidatePath("/reservas");
    return { ok: true, id: booking.id };
  } catch (e) {
    if (isOverlapError(e)) return { error: OVERLAP_MESSAGE };
    console.error("createPublicBooking error", e);
    return { error: "No se pudo crear la reserva. Intentá de nuevo." };
  }
}

// ── Gestión de una reserva ───────────────────────────────────────────────────

/** Carga la reserva y valida que sea del organizador del usuario. */
async function loadOwnBooking(userId: string, bookingId: string) {
  const membership = await requireBookingPermission(userId, "MANAGE_SCHEDULE");
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, organizerId: membership.organizerId },
    select: { id: true },
  });
  if (!booking) throw new PermissionError("Reserva no encontrada");
  return membership;
}

export async function cancelBooking(bookingId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };
  try {
    await loadOwnBooking(session.user.id, bookingId);
  } catch (e) {
    return { error: e instanceof PermissionError ? e.message : "Sin permisos" };
  }
  // Cancelar libera el slot (el constraint solo bloquea PENDING/CONFIRMED)
  await prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });
  revalidatePath("/dashboard/turnos");
  return {};
}

export async function setBookingPayment(
  bookingId: string,
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID",
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };
  try {
    await loadOwnBooking(session.user.id, bookingId);
  } catch (e) {
    return { error: e instanceof PermissionError ? e.message : "Sin permisos" };
  }
  await prisma.booking.update({ where: { id: bookingId }, data: { paymentStatus } });
  revalidatePath("/dashboard/turnos");
  return {};
}

export async function markNoShow(bookingId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };
  try {
    await loadOwnBooking(session.user.id, bookingId);
  } catch (e) {
    return { error: e instanceof PermissionError ? e.message : "Sin permisos" };
  }
  await prisma.booking.update({ where: { id: bookingId }, data: { status: "NO_SHOW" } });
  revalidatePath("/dashboard/turnos");
  return {};
}

// ── Bloqueo de cancha (mantenimiento) ────────────────────────────────────────

export async function createCourtBlock(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  let membership;
  try {
    membership = await requireBookingPermission(session.user.id, "MANAGE_SCHEDULE");
  } catch (e) {
    return { error: e instanceof PermissionError ? e.message : "Sin permisos" };
  }

  const courtId = String(formData.get("courtId") ?? "");
  const date = String(formData.get("date") ?? "");
  const startMinute = Number(formData.get("startMinute"));
  const endMinute = Number(formData.get("endMinute"));
  const reason = (String(formData.get("reason") ?? "").trim()) || null;

  if (!courtId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(startMinute) || isNaN(endMinute) || endMinute <= startMinute) {
    return { error: "Datos del bloqueo inválidos" };
  }

  try {
    await assertCourtInOrganizer(courtId, membership.organizerId);
  } catch (e) {
    return { error: e instanceof PermissionError ? e.message : "Sin permisos" };
  }

  await prisma.courtBlock.create({
    data: {
      courtId,
      date: dateAtMinute(date, 0),
      startTime: dateAtMinute(date, startMinute),
      endTime: dateAtMinute(date, endMinute),
      reason,
      createdByUserId: session.user.id,
    },
  });
  revalidatePath("/dashboard/turnos");
  return { ok: true, id: "" };
}

// ── Turnos fijos (recurrentes) — SOLO admins (OWNER/ORGANIZER) ────────────────

/** Helper exportable: ¿el usuario puede administrar turnos fijos? */
export async function canManageRecurring(userId: string): Promise<boolean> {
  try {
    const m = await requireMembership(userId);
    return m.role === OrganizerRole.OWNER || m.role === OrganizerRole.ORGANIZER;
  } catch {
    return false;
  }
}

/** Requiere que el usuario sea admin (OWNER/ORGANIZER) del organizador. Devuelve la membresía. */
async function requireRecurringAdmin(userId: string) {
  const m = await requireMembership(userId);
  if (m.role !== OrganizerRole.OWNER && m.role !== OrganizerRole.ORGANIZER) {
    throw new PermissionError("Solo los administradores pueden gestionar turnos fijos");
  }
  return m;
}

export type RecurringActionState =
  | { error: string }
  | { ok: true; created: number; skipped: number }
  | null;

const recurringSchema = z.object({
  courtId: z.string().min(1, "Elegí una cancha"),
  weekday: z.coerce.number().int().min(0).max(6),
  startMinute: z.coerce.number().int().min(0).max(24 * 60),
  durationMin: z.coerce.number().int().min(30).max(8 * 60),
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de inicio inválida"),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  customerName: z.string().trim().min(1, "Ingresá el nombre del cliente").max(120),
  customerPhone: z.string().trim().max(40).optional(),
  price: z.coerce.number().nonnegative().optional(),
});

export async function createRecurringBooking(
  _prev: RecurringActionState,
  formData: FormData,
): Promise<RecurringActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  let membership;
  try {
    membership = await requireRecurringAdmin(session.user.id);
  } catch (e) {
    return { error: e instanceof PermissionError ? e.message : "Sin permisos" };
  }

  const parsed = recurringSchema.safeParse({
    courtId: formData.get("courtId"),
    weekday: formData.get("weekday"),
    startMinute: formData.get("startMinute"),
    durationMin: formData.get("durationMin"),
    validFrom: formData.get("validFrom"),
    validUntil: formData.get("validUntil") || undefined,
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone") || undefined,
    price: formData.get("price") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const data = parsed.data;
  if (data.validUntil && data.validUntil < data.validFrom) {
    return { error: "La fecha de fin no puede ser anterior a la de inicio" };
  }

  try {
    await assertCourtInOrganizer(data.courtId, membership.organizerId);
  } catch (e) {
    return { error: e instanceof PermissionError ? e.message : "Sin permisos" };
  }

  const template = await prisma.recurringBooking.create({
    data: {
      organizerId: membership.organizerId,
      courtId: data.courtId,
      weekday: data.weekday,
      startMinute: data.startMinute,
      durationMin: data.durationMin,
      validFrom: new Date(`${data.validFrom}T00:00:00.000Z`),
      validUntil: data.validUntil ? new Date(`${data.validUntil}T00:00:00.000Z`) : null,
      customerName: data.customerName,
      customerPhone: data.customerPhone ?? null,
      price: data.price ?? null,
      createdByUserId: session.user.id,
    },
    select: { id: true },
  });

  // Generar las ocurrencias hacia adelante
  const result = await materializeRecurring(template.id);

  revalidatePath("/dashboard/turnos/fijos");
  revalidatePath("/dashboard/turnos");
  return { ok: true, created: result.created, skipped: result.skipped };
}

/** "Elimina" un turno fijo: lo desactiva y borra sus ocurrencias futuras (las pasadas quedan como historial). */
export async function deleteRecurringBooking(templateId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  let membership;
  try {
    membership = await requireRecurringAdmin(session.user.id);
  } catch (e) {
    return { error: e instanceof PermissionError ? e.message : "Sin permisos" };
  }

  const template = await prisma.recurringBooking.findFirst({
    where: { id: templateId, organizerId: membership.organizerId },
    select: { id: true },
  });
  if (!template) return { error: "Turno fijo no encontrado" };

  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);

  await prisma.$transaction([
    prisma.booking.deleteMany({
      where: { recurringBookingId: templateId, date: { gte: todayUtc } },
    }),
    prisma.recurringBooking.update({
      where: { id: templateId },
      data: { isActive: false },
    }),
  ]);

  revalidatePath("/dashboard/turnos/fijos");
  revalidatePath("/dashboard/turnos");
  return {};
}
