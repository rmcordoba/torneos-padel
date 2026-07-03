import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActiveMembership } from "@/lib/active-organizer";
import { getBookingVenues, getVenueAvailability, getDayBookingStats } from "@/modules/bookings/queries";
import { TurnosGrid } from "./_components/turnos-grid";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Turnos" };

function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export default async function TurnosPage({
  searchParams,
}: {
  searchParams: Promise<{ venue?: string; date?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await getActiveMembership(session.user.id);
  if (!membership) redirect("/dashboard");
  const organizerId = membership.organizerId;

  const { venue: venueParam, date: dateParam } = await searchParams;
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayStr();

  const venues = await getBookingVenues(organizerId);
  const activeVenueId = venues.find((v) => v.id === venueParam)?.id ?? venues[0]?.id ?? null;

  const [availability, stats] = activeVenueId
    ? await Promise.all([
        getVenueAvailability(activeVenueId, date, 30), // grilla en cuadritos de 30 min
        getDayBookingStats(organizerId, date),
      ])
    : [null, { totalBookings: 0, revenuePaid: 0 }];

  return (
    <TurnosGrid
      venues={venues.map((v) => ({ id: v.id, name: v.name }))}
      activeVenueId={activeVenueId}
      date={date}
      availability={availability}
      stats={stats}
    />
  );
}
