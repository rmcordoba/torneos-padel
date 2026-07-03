import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchPlayers } from "@/modules/players/queries";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) return NextResponse.json([]);

  const players = await searchPlayers(q, 10);

  // No exponer DNI ni otros datos sensibles: solo lo necesario para
  // identificar al jugador en el selector (nombre + email).
  return NextResponse.json(
    players.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.user?.email ?? null,
    }))
  );
}
