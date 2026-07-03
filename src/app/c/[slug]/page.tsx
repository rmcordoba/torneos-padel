// Home del club → muestra el listado de torneos del club.
import TorneosPage from "@/app/(public)/torneos/page";
import { resolveClubScope } from "@/lib/club-scope";

export default async function ClubHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string; bienvenido?: string }>;
}) {
  await resolveClubScope((await params).slug);
  return <TorneosPage searchParams={searchParams} />;
}
