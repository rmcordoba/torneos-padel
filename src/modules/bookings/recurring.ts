import { prisma } from "@/lib/prisma";
import { dateAtMinute } from "./availability";

/**
 * Materialización de turnos fijos (RecurringBooking → Booking source=FIXED).
 *
 * En vez de "turnos virtuales", generamos reservas reales hacia adelante. Ventajas:
 *  - heredan el constraint anti-solape de la base
 *  - la grilla de ocupación las ve sin lógica especial
 *  - cancelar UNA fecha = cancelar esa Booking (queda como excepción)
 *
 * Horizonte rodante: materializamos ~HORIZON_WEEKS hacia adelante. La función
 * `ensureRecurringMaterialized` se llama al abrir la pantalla y "rellena" lo que falte,
 * funcionando como un cron perezoso.
 */

const HORIZON_WEEKS = 16; // ~4 meses hacia adelante

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** "YYYY-MM-DD" de hoy (hora local) */
function todayStr(): string {
  const n = new Date();
  return `${n.getFullYear()}-${pad2(n.getMonth() + 1)}-${pad2(n.getDate())}`;
}

/** Lee un valor de columna @db.Date (medianoche UTC) como "YYYY-MM-DD" sin corrimiento de día. */
function dbDateToStr(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** Date apto para columna @db.Date (medianoche UTC) a partir de "YYYY-MM-DD". */
function dateOnlyUTC(ds: string): Date {
  return new Date(`${ds}T00:00:00.000Z`);
}

/** Suma días a un "YYYY-MM-DD" (vía UTC para evitar saltos por DST). */
function addDaysStr(ds: string, n: number): string {
  const [y, m, d] = ds.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

/** Día de la semana (0=domingo) de un "YYYY-MM-DD". */
function weekdayOfStr(ds: string): number {
  const [y, m, d] = ds.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export interface MaterializeResult {
  created: number;
  skipped: number; // fechas omitidas por superposición con otra reserva/partido
}

/** Genera las ocurrencias faltantes de un turno fijo hasta el horizonte. */
export async function materializeRecurring(templateId: string): Promise<MaterializeResult> {
  const t = await prisma.recurringBooking.findUnique({ where: { id: templateId } });
  if (!t || !t.isActive) return { created: 0, skipped: 0 };

  const todayS = todayStr();
  const horizonS = addDaysStr(todayS, HORIZON_WEEKS * 7);

  const validFromS = dbDateToStr(t.validFrom);
  const fromS = validFromS > todayS ? validFromS : todayS;
  const validUntilS = t.validUntil ? dbDateToStr(t.validUntil) : null;
  const toS = validUntilS && validUntilS < horizonS ? validUntilS : horizonS;

  if (fromS > toS) return { created: 0, skipped: 0 };

  // Ocurrencias ya existentes (incluye canceladas → actúan como "excepción" y no se recrean)
  const existing = await prisma.booking.findMany({
    where: { recurringBookingId: t.id },
    select: { date: true },
  });
  const existingDates = new Set(existing.map((e) => dbDateToStr(e.date)));

  const now = Date.now();
  let created = 0;
  let skipped = 0;

  for (let ds = fromS; ds <= toS; ds = addDaysStr(ds, 1)) {
    if (weekdayOfStr(ds) !== t.weekday) continue;
    if (existingDates.has(ds)) continue;

    const startTime = dateAtMinute(ds, t.startMinute);
    const endTime = dateAtMinute(ds, t.startMinute + t.durationMin);
    if (startTime.getTime() < now) continue; // no materializar el pasado

    try {
      await prisma.booking.create({
        data: {
          organizerId: t.organizerId,
          courtId: t.courtId,
          date: dateOnlyUTC(ds),
          startTime,
          endTime,
          status: "CONFIRMED",
          source: "FIXED",
          recurringBookingId: t.id,
          customerName: t.customerName,
          customerPhone: t.customerPhone,
          price: t.price,
        },
      });
      created++;
    } catch {
      // Superposición con una reserva suelta o un partido de torneo → se omite esa fecha.
      // Se reintentará en la próxima materialización si el slot se libera.
      skipped++;
    }
  }

  return { created, skipped };
}

/** Rellena (top-up) las ocurrencias de todos los turnos fijos activos del organizador. */
export async function ensureRecurringMaterialized(organizerId: string): Promise<void> {
  const templates = await prisma.recurringBooking.findMany({
    where: { organizerId, isActive: true },
    select: { id: true },
  });
  for (const t of templates) {
    await materializeRecurring(t.id);
  }
}
