import { prisma } from "@/lib/prisma";
import { dateAtMinute } from "./availability";

export { getVenueAvailability } from "./availability";
export type {
  VenueAvailability,
  CourtAvailability,
  AvailabilitySlot,
  SlotState,
} from "./availability";

/** Clubes (organizadores) con canchas activas, para la reserva pública. */
export async function getPublicBookingClubs() {
  return prisma.organizer.findMany({
    where: {
      isActive: true,
      venues: { some: { isActive: true, courts: { some: { isActive: true } } } },
    },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
}

/** Sedes (con sus canchas activas) del organizador, para armar la grilla de turnos. */
export async function getBookingVenues(organizerId: string) {
  return prisma.venue.findMany({
    where: { organizerId, isActive: true },
    select: {
      id: true,
      name: true,
      courts: {
        where: { isActive: true },
        select: { id: true, name: true, isIndoor: true, surface: true, bookingPrice: true },
        orderBy: { name: "asc" },
      },
      schedules: { select: { weekday: true, openMinute: true, closeMinute: true, slotMinutes: true, isClosed: true } },
      priceRules: { select: { startMinute: true, endMinute: true, pricePerHour: true }, orderBy: { startMinute: "asc" } },
    },
    orderBy: { name: "asc" },
  });
}

/** Reservas activas de un día (para la vista de lista del dashboard). */
export async function getBookingsForDay(organizerId: string, dateStr: string) {
  const dayStart = dateAtMinute(dateStr, 0);
  const dayEnd = dateAtMinute(dateStr, 24 * 60);

  return prisma.booking.findMany({
    where: {
      organizerId,
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
      status: { notIn: ["CANCELLED"] },
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      source: true,
      paymentStatus: true,
      price: true,
      customerName: true,
      customerPhone: true,
      notes: true,
      court: { select: { id: true, name: true, venue: { select: { name: true } } } },
      playerProfile: { select: { firstName: true, lastName: true, phone: true } },
    },
    orderBy: [{ startTime: "asc" }],
  });
}

/** Turnos fijos activos del organizador, con su cancha y cantidad de ocurrencias futuras. */
export async function getRecurringBookings(organizerId: string) {
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);

  const templates = await prisma.recurringBooking.findMany({
    where: { organizerId, isActive: true },
    select: {
      id: true,
      weekday: true,
      startMinute: true,
      durationMin: true,
      validFrom: true,
      validUntil: true,
      customerName: true,
      customerPhone: true,
      price: true,
      court: { select: { id: true, name: true, venue: { select: { name: true } } } },
      _count: {
        select: { bookings: { where: { date: { gte: todayUtc }, status: { in: ["CONFIRMED", "PENDING"] } } } },
      },
    },
    orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
  });

  return templates;
}

/** Métricas rápidas del día (ocupación e ingresos marcados como pagados). */
export async function getDayBookingStats(organizerId: string, dateStr: string) {
  const dayStart = dateAtMinute(dateStr, 0);
  const dayEnd = dateAtMinute(dateStr, 24 * 60);

  const [total, paid] = await Promise.all([
    prisma.booking.count({
      where: {
        organizerId,
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
        status: { in: ["CONFIRMED", "PENDING", "COMPLETED"] },
      },
    }),
    prisma.booking.aggregate({
      where: {
        organizerId,
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
        paymentStatus: "PAID",
      },
      _sum: { price: true },
    }),
  ]);

  return {
    totalBookings: total,
    revenuePaid: paid._sum.price ? Number(paid._sum.price) : 0,
  };
}
