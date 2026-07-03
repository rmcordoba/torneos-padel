import JugadoresPage from "@/app/(public)/jugadores/page";
import { resolveClubScope } from "@/lib/club-scope";

export default async function ClubJugadoresPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; cat?: string; page?: string }>;
}) {
  await resolveClubScope((await params).slug);
  return <JugadoresPage searchParams={searchParams} />;
}
