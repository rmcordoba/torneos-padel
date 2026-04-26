import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrganizersByUser } from "@/modules/organizers/queries";
import { getOpenTournaments, getPlayerRegistrations, getPlayerProfile } from "@/modules/player/queries";
import { JugadorClient } from "./_components/jugador-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mi panel" };

export default async function JugadorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // If they're an organizer member, redirect to admin dashboard
  const memberships = await getOrganizersByUser(session.user.id);
  if (memberships.length > 0) redirect("/dashboard");

  const [profile, openTournaments, myRegistrations] = await Promise.all([
    getPlayerProfile(session.user.id),
    getOpenTournaments(),
    getPlayerRegistrations(session.user.id),
  ]);

  const openForClient = openTournaments.map((t) => ({
    id: t.id,
    name: t.name,
    organizerName: t.organizer.name,
    startDate: t.startDate.toISOString(),
    endDate: t.endDate.toISOString(),
    categories: t.categories.map((tc) => ({
      id: tc.id,
      categoryName: tc.category.name,
      spotsLeft: tc.maxTeams - tc._count.registrations,
      totalSpots: tc.maxTeams,
      registered: tc._count.registrations,
      price: tc.pricePerTeam ? tc.pricePerTeam.toString() : null,
    })),
  }));

  const registrationsForClient = myRegistrations.map((r) => {
    const partners = r.team.players
      .filter((tp) => {
        // keep all; we'll exclude the player themselves client-side not needed here
        return true;
      })
      .map((tp) => `${tp.playerProfile.firstName} ${tp.playerProfile.lastName}`);

    return {
      id: r.id,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      tournamentName: r.tournamentCategory.tournament.name,
      categoryName: r.tournamentCategory.category.name,
      startDate: r.tournamentCategory.tournament.startDate.toISOString(),
      partnerName: partners.length > 1 ? partners.filter((_, i) => i !== 0).join(", ") : null,
    };
  });

  return (
    <JugadorClient
      openTournaments={openForClient}
      myRegistrations={registrationsForClient}
      hasProfile={!!profile}
      userName={session.user.name ?? "Jugador"}
    />
  );
}
