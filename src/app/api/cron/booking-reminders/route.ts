import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBookingReminderEmail } from "@/lib/email";
import { isCronAuthorized } from "@/lib/cron-auth";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function pad2(n: number) { return String(n).padStart(2, "0"); }
function dateHuman(d: Date) { return `${DAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`; }
function timeLabel(d: Date) { return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }

/**
 * Recordatorio de turnos — pensado para correr UNA vez por día (cron diario).
 * Envía un email a cada reserva activa cuyo turno es MAÑANA y cuyo cliente tiene email
 * (las reservas de mostrador sin email se recuerdan por WhatsApp manualmente).
 *
 * Programar (ej. Vercel Cron en vercel.json):
 *   { "path": "/api/cron/booking-reminders", "schedule": "0 13 * * *" }   // 10:00 ART
 * Protegido con CRON_SECRET vía header  Authorization: Bearer <CRON_SECRET>
 * (obligatorio en producción; ver src/lib/cron-auth.ts).
 */
export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);

  const bookings = await prisma.booking.findMany({
    where: {
      startTime: { gte: start, lte: end },
      status: { in: ["CONFIRMED", "PENDING"] },
    },
    select: {
      startTime: true,
      endTime: true,
      price: true,
      court: { select: { name: true, venue: { select: { name: true, organizer: { select: { name: true } } } } } },
      playerProfile: { select: { firstName: true, user: { select: { email: true } } } },
    },
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const b of bookings) {
    const email = b.playerProfile?.user.email;
    if (!email) { skipped++; continue; }

    // Un email que falla no aborta el resto de los recordatorios
    try {
      await sendBookingReminderEmail({
        to: email,
        customerName: b.playerProfile?.firstName ?? "jugador",
        clubName: b.court.venue.organizer.name,
        venueName: b.court.venue.name,
        courtName: b.court.name,
        dateLabel: dateHuman(b.startTime),
        timeLabel: `${timeLabel(b.startTime)} – ${timeLabel(b.endTime)}`,
        price: b.price ? Number(b.price) : null,
      });
      sent++;
    } catch (e) {
      failed++;
      logError("cron:booking-reminders", e, { email });
    }
  }

  return NextResponse.json({ ok: true, date: dateHuman(start), total: bookings.length, sent, skipped, failed });
}
