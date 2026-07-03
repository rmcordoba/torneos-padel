import FixturePage from "@/app/(public)/torneos/[id]/categorias/[catId]/page";
import { resolveClubScope } from "@/lib/club-scope";

export default async function ClubFixturePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string; catId: string }>;
  searchParams: Promise<{ inscripto?: string; espera?: string }>;
}) {
  const { slug, id, catId } = await params;
  await resolveClubScope(slug);
  return <FixturePage params={Promise.resolve({ id, catId })} searchParams={searchParams} />;
}
