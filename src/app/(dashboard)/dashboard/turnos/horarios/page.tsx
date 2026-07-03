import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActiveMembership } from "@/lib/active-organizer";
import { getBookingVenues } from "@/modules/bookings/queries";
import { HorariosClient } from "./_components/horarios-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Horarios de sede" };

export default async function HorariosPage({
  searchParams,
}: {
  searchParams: Promise<{ venue?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await getActiveMembership(session.user.id);
  if (!membership) redirect("/dashboard");
  const organizerId = membership.organizerId;

  const { venue: venueParam } = await searchParams;
  const venues = await getBookingVenues(organizerId);
  const activeVenueId = venues.find((v) => v.id === venueParam)?.id ?? venues[0]?.id ?? null;

  return (
    <HorariosClient
      venues={venues.map((v) => ({
        id: v.id,
        name: v.name,
        schedules: v.schedules.map((s) => ({
          weekday: s.weekday,
          openMinute: s.openMinute,
          closeMinute: s.closeMinute,
          slotMinutes: s.slotMinutes,
          isClosed: s.isClosed,
        })),
      }))}
      activeVenueId={activeVenueId}
    />
  );
}
