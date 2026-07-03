import TournamentPage from "@/app/(public)/torneos/[id]/page";
import { resolveClubScope } from "@/lib/club-scope";

export default async function ClubTournamentPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  await resolveClubScope(slug);
  return <TournamentPage params={Promise.resolve({ id })} />;
}
