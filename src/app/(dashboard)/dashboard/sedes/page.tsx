import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getActiveMembership } from "@/lib/active-organizer";
import { getVenuesByOrganizer } from "@/modules/venues/queries";
import { Building2, MapPin, Plus, Layers } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sedes y canchas" };

export default async function SedesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await getActiveMembership(session.user.id);
  if (!membership) redirect("/dashboard");

  const organizerId = membership.organizerId;
  const venues = await getVenuesByOrganizer(organizerId);

  return (
    <div style={{ maxWidth: 800, display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 28, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 6 }}>
            Sedes y canchas
          </h1>
          <p style={{ fontSize: 13, color: "#475569" }}>
            {venues.length === 0
              ? "Agregá tu primera sede para asignar canchas a los partidos"
              : `${venues.length} sede${venues.length !== 1 ? "s" : ""} configurada${venues.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/dashboard/sedes/nueva" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "10px 18px", borderRadius: 10,
          background: "#a3e635", color: "#080e1a",
          fontSize: 13, fontWeight: 800, textDecoration: "none",
          boxShadow: "0 0 20px rgba(163,230,53,0.3)",
        }}>
          <Plus size={15} /> Nueva sede
        </Link>
      </div>

      {venues.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "80px 40px", borderRadius: 12,
          border: "1px dashed rgba(255,255,255,0.1)", textAlign: "center",
        }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(163,230,53,0.12)", border: "1px solid rgba(163,230,53,0.28)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Building2 size={22} color="#a3e635" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc", marginBottom: 8, fontFamily: "var(--font-space), sans-serif" }}>
            Sin sedes
          </h3>
          <p style={{ fontSize: 13, color: "#64748b", maxWidth: 280, marginBottom: 24 }}>
            Creá una sede para luego agregarle las canchas donde se juegan los partidos.
          </p>
          <Link href="/dashboard/sedes/nueva" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "9px 20px", borderRadius: 8,
            background: "#a3e635", color: "#0a0f0a",
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
                background: "rgba(12,20,40,0.7)", border: "1px solid rgba(255,255,255,0.07)",
                textDecoration: "none", cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: "rgba(163,230,53,0.12)", border: "1px solid rgba(163,230,53,0.28)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Building2 size={18} color="#a3e635" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {venue.name}
                    </p>
                    {(venue.city || venue.address) && (
                      <p style={{ fontSize: 11, color: "#475569", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={10} />
                        {[venue.city, venue.address].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                <span style={{ color: "#334155", fontSize: 16, flexShrink: 0 }}>›</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#475569" }}>
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
