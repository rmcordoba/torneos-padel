import RankingPage from "@/app/(public)/ranking/page";
import { resolveClubScope } from "@/lib/club-scope";

export default async function ClubRankingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tabla?: string; pagina?: string }>;
}) {
  await resolveClubScope((await params).slug);
  return <RankingPage searchParams={searchParams} />;
}
