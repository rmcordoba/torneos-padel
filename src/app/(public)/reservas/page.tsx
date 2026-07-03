import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getPublicBookingClubs,
  getBookingVenues,
  getVenueAvailability,
} from "@/modules/bookings/queries";
import { ReservasClient } from "./_components/reservas-client";
import { scopedOrg, getPortalScope } from "@/lib/portal-scope";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reservar cancha — PádelPro" };

function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; venue?: string; date?: string }>;
}) {
  const { org: orgParam, venue: venueParam, date: dateParam } = await searchParams;
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayStr();

  const clubs = await getPublicBookingClubs();
  // En el sitio de un club, por defecto la reserva queda acotada a ese club.
  const preferredClub = orgParam ?? scopedOrg();
  const activeClubId = clubs.find((c) => c.id === preferredClub)?.id ?? clubs[0]?.id ?? null;

  const venues = activeClubId ? await getBookingVenues(activeClubId) : [];
  const activeVenueId = venues.find((v) => v.id === venueParam)?.id ?? venues[0]?.id ?? null;

  const availability = activeVenueId ? await getVenueAvailability(activeVenueId, date) : null;

  // ¿El visitante puede reservar? (logueado + con perfil de jugador)
  const session = await auth();
  let canBook = false;
  if (session?.user) {
    const profile = await prisma.playerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    canBook = !!profile;
  }

  return (
    <ReservasClient
      clubs={clubs.map((c) => ({ id: c.id, name: c.name }))}
      activeClubId={activeClubId}
      venues={venues.map((v) => ({ id: v.id, name: v.name }))}
      activeVenueId={activeVenueId}
      date={date}
      availability={availability}
      isLoggedIn={!!session?.user}
      canBook={canBook}
      basePath={getPortalScope().basePath}
    />
  );
}
