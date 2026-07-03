import CuadrosPage from "@/app/(public)/cuadros/page";
import { resolveClubScope } from "@/lib/club-scope";

export default async function ClubCuadrosPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tournamentId?: string; catId?: string; estado?: string; buscar?: string }>;
}) {
  await resolveClubScope((await params).slug);
  return <CuadrosPage searchParams={searchParams} />;
}
