import { prisma } from "@/lib/prisma";
import { computeBookingPrice, type PriceBand } from "./pricing";

/**
 * Motor de disponibilidad de canchas.
 *
 * Calcula, para una sede y un día, la grilla de turnos de cada cancha,
 * marcando cada slot según lo que lo ocupa. Une TRES fuentes en una sola
 * línea de tiempo por cancha:
 *   - Booking      → reservas (sueltas o de turno fijo)
 *   - CourtBlock   → bloqueos (mantenimiento, cierres)
 *   - ScheduleSlot → partidos de torneo (integración con el motor de torneos)
 */

export type SlotState = "free" | "booked" | "fixed" | "match" | "blocked" | "past" | "closed";

export interface AvailabilitySlot {
  startMinute: number;   // minutos desde medianoche
  endMinute: number;
  startLabel: string;    // "08:00"
  endLabel: string;      // "09:30"
  state: SlotState;
  price: number | null;
  // referencias para la UI (según el estado)
  bookingId?: string;
  customerLabel?: string;
  customerPhone?: string;
  matchLabel?: string;
  blockReason?: string;
}

export interface CourtAvailability {
  courtId: string;
  courtName: string;
  isIndoor: boolean;
  surface: string | null;
  bookingPrice: number | null;
  slots: AvailabilitySlot[];
}

export interface VenueAvailability {
  venueId: string;
  venueName: string;
  date: string;          // "YYYY-MM-DD"
  weekday: number;       // 0 = domingo
  isClosed: boolean;
  openLabel: string | null;
  closeLabel: string | null;
  slotMinutes: number;
  priceBands: PriceBand[];   // franjas de precio por hora de la sede
  courts: CourtAvailability[];
}

// ── helpers de tiempo ────────────────────────────────────────────────────────

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** minutos desde medianoche → "HH:MM" */
export function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

/** "HH:MM" → minutos desde medianoche */
export function labelToMinutes(label: string): number {
  const [h, m] = label.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Construye un Date local a partir de "YYYY-MM-DD" + minutos desde medianoche */
export function dateAtMinute(dateStr: string, minute: number): Date {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return new Date(y, mo - 1, d, h, m, 0, 0);
}

/** minutos desde medianoche de un Date (en hora local) */
function minuteOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

// ── motor ────────────────────────────────────────────────────────────────────

/** Por defecto, si una cancha no se puede ocupar, asumimos esta duración para un partido sin fin definido. */
const DEFAULT_MATCH_MINUTES = 90;

/** Horario por defecto cuando la sede todavía no configuró sus horarios de apertura. */
const DEFAULT_SCHEDULE = { openMinute: 8 * 60, closeMinute: 23 * 60, slotMinutes: 90, isClosed: false };

export async function getVenueAvailability(
  venueId: string,
  dateStr: string,
  granularity?: number, // tamaño del cuadrito de la grilla (ej: 30). Si se omite, usa el slot configurado.
): Promise<VenueAvailability> {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const weekday = new Date(y, mo - 1, d).getDay();

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    include: {
      courts: { where: { isActive: true }, orderBy: { name: "asc" } },
      schedules: { where: { weekday } },
      priceRules: { orderBy: { startMinute: "asc" } },
    },
  });

  if (!venue) {
    return {
      venueId, venueName: "", date: dateStr, weekday,
      isClosed: true, openLabel: null, closeLabel: null, slotMinutes: 90, priceBands: [], courts: [],
    };
  }

  const priceBands: PriceBand[] = venue.priceRules.map((r) => ({
    startMinute: r.startMinute,
    endMinute: r.endMinute,
    pricePerHour: Number(r.pricePerHour),
  }));

  // Si la sede no configuró horarios para este día, usamos un horario por defecto
  // para que la grilla sea usable de entrada (después se puede ajustar por sede/día).
  const schedule = venue.schedules[0] ?? DEFAULT_SCHEDULE;
  // Paso de la grilla: la granularidad pedida (ej. 30) o, si no, el slot configurado.
  const step = granularity && granularity > 0 ? granularity : schedule.slotMinutes;
  const base: Omit<VenueAvailability, "courts" | "isClosed"> = {
    venueId,
    venueName: venue.name,
    date: dateStr,
    weekday,
    openLabel: minutesToLabel(schedule.openMinute),
    closeLabel: minutesToLabel(schedule.closeMinute),
    slotMinutes: step,
    priceBands,
  };

  // Día marcado cerrado o sede sin canchas → todo cerrado
  if (schedule.isClosed || venue.courts.length === 0) {
    return {
      ...base,
      isClosed: true,
      courts: venue.courts.map((c) => ({
        courtId: c.id, courtName: c.name, isIndoor: c.isIndoor, surface: c.surface,
        bookingPrice: c.bookingPrice ? Number(c.bookingPrice) : null,
        slots: [],
      })),
    };
  }

  const courtIds = venue.courts.map((c) => c.id);
  const dayStart = dateAtMinute(dateStr, 0);
  const dayEnd = dateAtMinute(dateStr, 24 * 60);

  // Cargamos las 3 fuentes de ocupación del día, para todas las canchas de la sede
  const [bookings, blocks, matchSlots] = await Promise.all([
    prisma.booking.findMany({
      where: {
        courtId: { in: courtIds },
        status: { in: ["PENDING", "CONFIRMED"] },
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
      select: {
        id: true, courtId: true, startTime: true, endTime: true, source: true,
        customerName: true, customerPhone: true,
        playerProfile: { select: { firstName: true, lastName: true, phone: true } },
        price: true,
      },
    }),
    prisma.courtBlock.findMany({
      where: {
        courtId: { in: courtIds },
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
      select: { courtId: true, startTime: true, endTime: true, reason: true },
    }),
    prisma.scheduleSlot.findMany({
      where: {
        courtAssignment: { courtId: { in: courtIds } },
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
      select: {
        startTime: true, endTime: true,
        courtAssignment: { select: { courtId: true } },
        match: {
          select: {
            teams: {
              select: { side: true, team: { select: { players: { select: { playerProfile: { select: { lastName: true } } } } } } },
            },
            stage: { select: { tournamentCategory: { select: { category: { select: { name: true } } } } } },
          },
        },
      },
    }),
  ]);

  const now = new Date();

  const courts: CourtAvailability[] = venue.courts.map((court) => {
    const courtBookings = bookings.filter((b) => b.courtId === court.id);
    const courtBlocks = blocks.filter((b) => b.courtId === court.id);
    const courtMatches = matchSlots.filter((s) => s.courtAssignment?.courtId === court.id);
    const courtPrice = court.bookingPrice ? Number(court.bookingPrice) : null;

    const slots: AvailabilitySlot[] = [];
    for (let m = schedule.openMinute; m + step <= schedule.closeMinute; m += step) {
      const slotStart = dateAtMinute(dateStr, m);
      const slotEnd = dateAtMinute(dateStr, m + step);

      // overlap = startA < endB && endA > startB
      const overlaps = (s: Date, e: Date) => s < slotEnd && e > slotStart;

      const block = courtBlocks.find((b) => overlaps(b.startTime, b.endTime));
      const match = courtMatches.find((s) => overlaps(s.startTime, s.endTime ?? new Date(s.startTime.getTime() + DEFAULT_MATCH_MINUTES * 60000)));
      const booking = courtBookings.find((b) => overlaps(b.startTime, b.endTime));

      // Precio por defecto del cuadrito: prorrateado por las franjas de la sede,
      // con la tarifa base de la cancha como fallback para minutos sin franja.
      const slotPrice = priceBands.length
        ? computeBookingPrice(priceBands, m, m + step, courtPrice)
        : courtPrice;

      let state: SlotState = "free";
      const slot: AvailabilitySlot = {
        startMinute: m,
        endMinute: m + step,
        startLabel: minutesToLabel(m),
        endLabel: minutesToLabel(m + step),
        state,
        price: slotPrice,
      };

      if (block) {
        state = "blocked";
        slot.blockReason = block.reason ?? "Bloqueada";
      } else if (match) {
        state = "match";
        const names = match.match?.teams
          .sort((a, b) => a.side - b.side)
          .map((mt) => mt.team.players.map((p) => p.playerProfile.lastName).join("/"));
        const cat = match.match?.stage.tournamentCategory.category.name;
        slot.matchLabel = names && names.length === 2 ? `${names[0]} vs ${names[1]}${cat ? ` · ${cat}` : ""}` : "Partido de torneo";
      } else if (booking) {
        state = booking.source === "FIXED" ? "fixed" : "booked";
        slot.bookingId = booking.id;
        slot.customerLabel = booking.playerProfile
          ? `${booking.playerProfile.firstName} ${booking.playerProfile.lastName}`
          : booking.customerName ?? "Reservado";
        slot.customerPhone = booking.customerPhone ?? booking.playerProfile?.phone ?? undefined;
        if (booking.price != null) slot.price = Number(booking.price);
      } else if (slotEnd <= now) {
        state = "past";
      }

      slot.state = state;
      slots.push(slot);
    }

    return {
      courtId: court.id,
      courtName: court.name,
      isIndoor: court.isIndoor,
      surface: court.surface,
      bookingPrice: courtPrice,
      slots,
    };
  });

  return { ...base, isClosed: false, courts };
}
