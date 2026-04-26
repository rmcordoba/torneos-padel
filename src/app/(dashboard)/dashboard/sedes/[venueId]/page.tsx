import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOrganizersByUser } from "@/modules/organizers/queries";
import { getVenueById } from "@/modules/venues/queries";
import { CourtManager } from "../_components/court-manager";
import { DeleteVenueButton } from "../_components/delete-venue-button";
import { ChevronLeft, Building2, MapPin, ExternalLink, Pencil, Layers } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Detalle de sede" };

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await getOrganizersByUser(session.user.id);
  if (!memberships.length) redirect("/dashboard");

  const organizerId = memberships[0].organizerId;
  const venue = await getVenueById(venueId, organizerId);
  if (!venue) notFound();

  return (
    <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Breadcrumb */}
      <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        <Link href="/dashboard/sedes" style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-faint)", textDecoration: "none" }}>
          <ChevronLeft size={14} /> Sedes
        </Link>
        <span style={{ color: "var(--border-strong)" }}>/</span>
        <span style={{ fontWeight: 600, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{venue.name}</span>
      </nav>

      {/* Venue header */}
      <div style={{ background: "var(--bg-surface)", borderRadius: 12, border: "1px solid var(--border-default)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--accent-15)", border: "1px solid var(--accent-30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Building2 size={22} color="var(--accent)" />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "Space Grotesk, sans-serif" }}>{venue.name}</h1>
              {venue.city && (
                <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-dimmer)", marginTop: 6 }}>
                  <MapPin size={13} color="var(--text-darkest)" />
                  {[venue.city, venue.address].filter(Boolean).join(" — ")}
                </p>
              )}
              {venue.mapUrl && (
                <a href={venue.mapUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--accent)", textDecoration: "none", marginTop: 4 }}>
                  <ExternalLink size={12} /> Ver en Google Maps
                </a>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <Link href={`/dashboard/sedes/${venue.id}/editar`} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-faint)", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
              <Pencil size={13} /> Editar
            </Link>
            <DeleteVenueButton venueId={venue.id} venueName={venue.name} />
          </div>
        </div>

        <div style={{ padding: "10px 24px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-elevated)", display: "flex", alignItems: "center", gap: 8 }}>
          <Layers size={14} color="var(--text-darkest)" />
          <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
            {venue.courts.length === 0
              ? "Sin canchas configuradas"
              : `${venue.courts.length} cancha${venue.courts.length !== 1 ? "s" : ""} configurada${venue.courts.length !== 1 ? "s" : ""}`}
          </span>
        </div>
      </div>

      {/* Courts */}
      <div>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, fontFamily: "Space Grotesk, sans-serif" }}>
          <Layers size={15} color="var(--accent)" /> Canchas
        </h2>
        <CourtManager venueId={venue.id} courts={venue.courts} />
      </div>
    </div>
  );
}
