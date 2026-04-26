import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { ChevronLeft, Building2 } from "lucide-react";
import { VenueForm } from "../_components/venue-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nueva sede" };

export default async function NuevaVenuePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 24 }}>
      <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        <Link href="/dashboard/sedes" style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-faint)", textDecoration: "none" }}>
          <ChevronLeft size={14} /> Sedes
        </Link>
        <span style={{ color: "var(--border-strong)" }}>/</span>
        <span style={{ fontWeight: 600, color: "var(--text-muted)" }}>Nueva sede</span>
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--accent-15)", border: "1px solid var(--accent-30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Building2 size={22} color="var(--accent)" />
        </div>
        <div>
          <h1 className="page-title">Nueva sede</h1>
          <p style={{ fontSize: 13, color: "var(--text-dimmer)", marginTop: 4 }}>
            Completá los datos de la sede donde se jugarán los partidos.
          </p>
        </div>
      </div>

      <div style={{ background: "var(--bg-surface)", borderRadius: 12, border: "1px solid var(--border-default)", padding: 24 }}>
        <VenueForm mode="create" />
      </div>
    </div>
  );
}
