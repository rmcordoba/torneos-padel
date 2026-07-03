import { prisma } from "@/lib/prisma";

/**
 * Reportes de turnos: ocupación e ingresos.
 *
 * Ocupación calculada por TIEMPO (minutos reservados / minutos disponibles),
 * robusto ante distintas duraciones de turno. Los minutos disponibles salen del
 * horario de cada sede (VenueSchedule) × cantidad de canchas × días del rango.
 */

const DEFAULT_OPEN = 8 * 60;
const DEFAULT_CLOSE = 23 * 60;

export interface CourtReportRow {
  courtId: string;
  courtName: string;
  venueName: string;
  bookings: number;
  occupancyPct: number;
  revenuePaid: number;
}

export interface BookingReport {
  from: string;
  to: string;
  days: number;
  bookings: number;        // reservas activas (no canceladas)
  occupancyPct: number;
  bookedHours: number;
  availableHours: number;
  revenuePaid: number;
  revenuePending: number;
  noShows: number;
  bySource: { PUBLIC: number; STAFF: number; FIXED: number };
  byCourt: CourtReportRow[];
  byWeekday: { weekday: number; bookings: number }[];   // 0=domingo
  byHour: { hour: number; bookings: number }[];          // ordenado por hora
}

function pad2(n: number) { return String(n).padStart(2, "0"); }

/** Lista de "YYYY-MM-DD" entre from y to (inclusive). */
function listDays(fromStr: string, toStr: string): string[] {
  const out: string[] = [];
  const [fy, fm, fd] = fromStr.split("-").map(Number);
  const [ty, tm, td] = toStr.split("-").map(Number);
  const cur = new Date(Date.UTC(fy, fm - 1, fd));
  const end = new Date(Date.UTC(ty, tm - 1, td));
  while (cur <= end) {
    out.push(`${cur.getUTCFullYear()}-${pad2(cur.getUTCMonth() + 1)}-${pad2(cur.getUTCDate())}`);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

function weekdayOf(ds: string): number {
  const [y, m, d] = ds.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export async function getBookingReport(
  organizerId: string,
  opts: { from: string; to: string; venueId?: string },
): Promise<BookingReport> {
  const venues = await prisma.venue.findMany({
    where: { organizerId, isActive: true, ...(opts.venueId ? { id: opts.venueId } : {}) },
    select: {
      id: true,
      courts: { where: { isActive: true }, select: { id: true } },
      schedules: { select: { weekday: true, openMinute: true, closeMinute: true, isClosed: true } },
    },
  });

  const days = listDays(opts.from, opts.to);

  // Minutos abiertos por sede (suma sobre los días del rango) → para ocupación
  const venueOpenSum = new Map<string, number>();
  let availableMinutes = 0;
  for (const v of venues) {
    let openSum = 0;
    for (const ds of days) {
      const wd = weekdayOf(ds);
      const sch = v.schedules.find((s) => s.weekday === wd);
      const open = sch ? (sch.isClosed ? 0 : sch.closeMinute - sch.openMinute) : DEFAULT_CLOSE - DEFAULT_OPEN;
      openSum += Math.max(0, open);
    }
    venueOpenSum.set(v.id, openSum);
    availableMinutes += openSum * v.courts.length;
  }

  const fromDt = new Date(`${opts.from}T00:00:00`);
  const toDt = new Date(`${opts.to}T23:59:59.999`);

  const bookings = await prisma.booking.findMany({
    where: {
      organizerId,
      startTime: { gte: fromDt, lte: toDt },
      ...(opts.venueId ? { court: { venueId: opts.venueId } } : {}),
    },
    select: {
      startTime: true, endTime: true, status: true, source: true, paymentStatus: true, price: true,
      court: { select: { id: true, name: true, venueId: true, venue: { select: { name: true } } } },
    },
  });

  const active = bookings.filter((b) => b.status !== "CANCELLED");

  let bookedMinutes = 0, revenuePaid = 0, revenuePending = 0, noShows = 0;
  const bySource = { PUBLIC: 0, STAFF: 0, FIXED: 0 };
  const byWeekday = Array.from({ length: 7 }, (_, i) => ({ weekday: i, bookings: 0 }));
  const byHourMap = new Map<number, number>();
  const byCourtMap = new Map<string, CourtReportRow & { minutes: number }>();

  for (const b of active) {
    const dur = (b.endTime.getTime() - b.startTime.getTime()) / 60000;
    bookedMinutes += dur;
    if (b.status === "NO_SHOW") noShows++;
    bySource[b.source] += 1;

    const price = b.price ? Number(b.price) : 0;
    if (b.paymentStatus === "PAID") revenuePaid += price; else revenuePending += price;

    byWeekday[b.startTime.getDay()].bookings += 1;
    const hr = b.startTime.getHours();
    byHourMap.set(hr, (byHourMap.get(hr) ?? 0) + 1);

    const key = b.court.id;
    const row = byCourtMap.get(key) ?? {
      courtId: b.court.id, courtName: b.court.name, venueName: b.court.venue.name,
      bookings: 0, occupancyPct: 0, revenuePaid: 0, minutes: 0,
    };
    row.bookings += 1;
    row.minutes += dur;
    if (b.paymentStatus === "PAID") row.revenuePaid += price;
    byCourtMap.set(key, row);
  }

  // Ocupación por cancha = minutos de la cancha / minutos abiertos de su sede
  const byCourt: CourtReportRow[] = Array.from(byCourtMap.values()).map((r) => {
    const venueIdOfCourt = bookings.find((b) => b.court.id === r.courtId)?.court.venueId;
    const open = venueIdOfCourt ? venueOpenSum.get(venueIdOfCourt) ?? 0 : 0;
    const occ = open > 0 ? Math.round((r.minutes / open) * 100) : 0;
    return { courtId: r.courtId, courtName: r.courtName, venueName: r.venueName, bookings: r.bookings, occupancyPct: occ, revenuePaid: r.revenuePaid };
  }).sort((a, b) => b.bookings - a.bookings);

  const byHour = Array.from(byHourMap.entries())
    .map(([hour, b]) => ({ hour, bookings: b }))
    .sort((a, b) => a.hour - b.hour);

  return {
    from: opts.from,
    to: opts.to,
    days: days.length,
    bookings: active.length,
    occupancyPct: availableMinutes > 0 ? Math.round((bookedMinutes / availableMinutes) * 100) : 0,
    bookedHours: Math.round(bookedMinutes / 60),
    availableHours: Math.round(availableMinutes / 60),
    revenuePaid,
    revenuePending,
    noShows,
    bySource,
    byCourt,
    byWeekday,
    byHour,
  };
}
