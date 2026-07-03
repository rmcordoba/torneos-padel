import AgendaPage from "@/app/(public)/agenda/page";
import { resolveClubScope } from "@/lib/club-scope";

export default async function ClubAgendaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ year?: string; month?: string; day?: string }>;
}) {
  await resolveClubScope((await params).slug);
  return <AgendaPage searchParams={searchParams} />;
}
