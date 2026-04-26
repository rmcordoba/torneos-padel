import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOrganizersByUser } from "@/modules/organizers/queries";
import { getVenueById } from "@/modules/venues/queries";
import { VenueForm } from "../../_components/venue-form";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar sede" };

export default async function EditVenuePage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;

  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await getOrganizersByUser(session.user.id);
  if (!memberships.length) redirect("/dashboard");

  const venue = await getVenueById(venueId, memberships[0].organizerId);
  if (!venue) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/sedes/${venueId}`}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> {venue.name}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-semibold text-slate-900">Editar</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Editar sede</h1>
        <p className="text-sm text-slate-500 mt-1">Modificá los datos de {venue.name}.</p>
      </div>

      <VenueForm
        mode="edit"
        venueId={venue.id}
        defaultValues={{
          name: venue.name,
          address: venue.address,
          city: venue.city,
          mapUrl: venue.mapUrl,
        }}
      />
    </div>
  );
}
