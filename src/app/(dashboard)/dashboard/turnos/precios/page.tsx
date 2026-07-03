import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActiveMembership } from "@/lib/active-organizer";
import { getBookingVenues } from "@/modules/bookings/queries";
import { PreciosClient } from "./_components/precios-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Precios por franja" };

export default async function PreciosPage({
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
    <PreciosClient
      venues={venues.map((v) => ({
        id: v.id,
        name: v.name,
        priceRules: v.priceRules.map((r) => ({
          startMinute: r.startMinute,
          endMinute: r.endMinute,
          pricePerHour: Number(r.pricePerHour),
        })),
      }))}
      activeVenueId={activeVenueId}
    />
  );
}
