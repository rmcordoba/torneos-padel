import ReservasPage from "@/app/(public)/reservas/page";
import { resolveClubScope } from "@/lib/club-scope";

export default async function ClubReservasPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ org?: string; venue?: string; date?: string }>;
}) {
  await resolveClubScope((await params).slug);
  return <ReservasPage searchParams={searchParams} />;
}
