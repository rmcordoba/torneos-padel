import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getActiveMembership } from "@/lib/active-organizer";
import { canManageRecurring } from "@/modules/bookings/actions";
import { getRecurringBookings, getBookingVenues } from "@/modules/bookings/queries";
import { ensureRecurringMaterialized } from "@/modules/bookings/recurring";
import { FijosClient } from "./_components/fijos-client";
import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Turnos fijos" };

export default async function TurnosFijosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await getActiveMembership(session.user.id);
  if (!membership) redirect("/dashboard");
  const organizerId = membership.organizerId;

  // Solo admins (OWNER/ORGANIZER) gestionan turnos fijos
  const isAdmin = await canManageRecurring(session.user.id);
  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 520, margin: "60px auto", textAlign: "center" }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <ShieldAlert size={26} color="#fb7185" />
        </div>
        <h2 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 20, fontWeight: 800, color: "#f8fafc", marginBottom: 8 }}>Acceso restringido</h2>
        <p style={{ fontSize: 14, color: "#64748b" }}>Solo los administradores pueden gestionar turnos fijos.</p>
        <Link href="/dashboard/turnos" style={{ display: "inline-block", marginTop: 20, fontSize: 13, color: "#a3e635", fontWeight: 700, textDecoration: "none" }}>← Volver a turnos</Link>
      </div>
    );
  }

  // Top-up perezoso: rellena las ocurrencias faltantes hasta el horizonte
  await ensureRecurringMaterialized(organizerId);

  const [templates, venues] = await Promise.all([
    getRecurringBookings(organizerId),
    getBookingVenues(organizerId),
  ]);

  return (
    <FijosClient
      templates={templates.map((t) => ({
        id: t.id,
        weekday: t.weekday,
        startMinute: t.startMinute,
        durationMin: t.durationMin,
        validFrom: t.validFrom.toISOString().slice(0, 10),
        validUntil: t.validUntil ? t.validUntil.toISOString().slice(0, 10) : null,
        customerName: t.customerName,
        customerPhone: t.customerPhone,
        price: t.price ? Number(t.price) : null,
        courtName: t.court.name,
        venueName: t.court.venue.name,
        occurrences: t._count.bookings,
      }))}
      venues={venues.map((v) => ({
        id: v.id,
        name: v.name,
        courts: v.courts.map((c) => ({ id: c.id, name: c.name, bookingPrice: c.bookingPrice ? Number(c.bookingPrice) : null })),
      }))}
    />
  );
}
