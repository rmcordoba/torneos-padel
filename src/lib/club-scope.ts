import { notFound } from "next/navigation";
import { getOrganizerBySlug } from "@/modules/organizers/queries";
import { setPortalScope } from "@/lib/portal-scope";

/**
 * Resuelve el club por slug, setea el scope del portal (organizerId + basePath)
 * y devuelve el organizer. Lo llaman tanto el layout del club como cada página,
 * para no depender del orden de render entre layout y page. `getOrganizerBySlug`
 * está cacheado, así que se ejecuta una sola query por request.
 */
export async function resolveClubScope(slug: string) {
  const organizer = await getOrganizerBySlug(slug);
  if (!organizer) notFound();
  setPortalScope({ organizerId: organizer.id, basePath: `/c/${slug}` });
  return organizer;
}
