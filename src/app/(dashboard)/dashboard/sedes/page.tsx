import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOrganizersByUser } from "@/modules/organizers/queries";
import { getVenuesByOrganizer } from "@/modules/venues/queries";
import { Building2, MapPin, Plus, Layers } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sedes y canchas" };

export default async function SedesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await getOrganizersByUser(session.user.id);
  if (!memberships.length) redirect("/dashboard");

  const organizerId = memberships[0].organizerId;
  const venues = await getVenuesByOrganizer(organizerId);

  return (
    <div style={{ maxWidth: 800, display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Sedes y canchas</h1>
          <p style={{ fontSize: 13, color: "var(--text-dimmer)", marginTop: 4 }}>
            {venues.length === 0
              ? "Agregá tu primera sede para asignar canchas a los partidos"
              : `${venues.length} sede${venues.length !== 1 ? "s" : ""} configurada${venues.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/dashboard/sedes/nueva" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "9px 18px", borderRadius: 8,
          background: "var(--accent)", color: "#0a0f0a",
          fontSize: 13, fontWeight: 700, textDecoration: "none",
        }}>
          <Plus size={14} /> Nueva sede
        </Link>
      </div>

      {venues.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "80px 40px", borderRadius: 12,
          border: "1px dashed var(--border-strong)", textAlign: "center",
        }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--accent-15)", border: "1px solid var(--accent-30)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Building2 size={22} color="var(--accent)" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, fontFamily: "Space Grotesk, sans-serif" }}>
            Sin sedes
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-faint)", maxWidth: 280, marginBottom: 24 }}>
            Creá una sede para luego agregarle las canchas donde se juegan los partidos.
          </p>
          <Link href="/dashboard/sedes/nueva" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "9px 20px", borderRadius: 8,
            background: "var(--accent)", color: "#0a0f0a",
            fontSize: 13, fontWeight: 700, textDecoration: "none",
          }}>
            <Plus size={14} /> Crear primera sede
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {venues.map((venue) => (
            <Link
              key={venue.id}
              href={`/dashboard/sedes/${venue.id}`}
              className="row-hover"
              style={{
                display: "flex", flexDirection: "column", gap: 14,
                padding: "18px 18px", borderRadius: 12,
                background: "var(--bg-surface)", border: "1px solid var(--border-default)",
                textDecoration: "none", cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: "var(--accent-15)", border: "1px solid var(--accent-30)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Building2 size={18} color="var(--accent)" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "Space Grotesk, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {venue.name}
                    </p>
                    {(venue.city || venue.address) && (
                      <p style={{ fontSize: 11, color: "var(--text-dimmer)", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={10} />
                        {[venue.city, venue.address].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                <span style={{ color: "var(--text-darkest)", fontSize: 16, flexShrink: 0 }}>›</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-dimmer)" }}>
                <Layers size={12} />
                <span>
                  {venue._count.courts === 0
                    ? "Sin canchas"
                    : `${venue._count.courts} cancha${venue._count.courts !== 1 ? "s" : ""}`}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
