import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveMembership } from "@/lib/active-organizer";
import { searchPlayersByOrganizer } from "@/modules/players/queries";
import { searchTournamentsByOrganizer } from "@/modules/tournaments/queries";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ players: [], tournaments: [] }, { status: 401 });
  }

  const membership = await getActiveMembership(session.user.id);
  if (!membership) {
    return NextResponse.json({ players: [], tournaments: [] });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ players: [], tournaments: [] });
  }

  const [players, tournaments] = await Promise.all([
    searchPlayersByOrganizer(membership.organizerId, q),
    searchTournamentsByOrganizer(membership.organizerId, q),
  ]);

  return NextResponse.json({
    players: players.map((p) => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      email: p.user?.email ?? null,
    })),
    tournaments: tournaments.map((t) => ({
      id: t.id,
      name: t.name,
      status: t.status,
    })),
  });
}
