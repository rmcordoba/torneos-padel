// Sitio del club: reusa la página global de torneos (acotada por el scope).
import TorneosPage from "@/app/(public)/torneos/page";
import { resolveClubScope } from "@/lib/club-scope";

export default async function ClubTorneosPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string; bienvenido?: string }>;
}) {
  await resolveClubScope((await params).slug);
  return <TorneosPage searchParams={searchParams} />;
}
