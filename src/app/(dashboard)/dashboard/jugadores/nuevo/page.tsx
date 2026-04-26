import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { PlayerCreateForm } from "./_components/player-create-form";
import { ChevronLeft, UserPlus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nuevo jugador" };

export default async function NuevoJugadorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 24 }}>
      <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        <Link href="/dashboard/jugadores" style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-faint)", textDecoration: "none" }}>
          <ChevronLeft size={14} /> Jugadores
        </Link>
        <span style={{ color: "var(--border-strong)" }}>/</span>
        <span style={{ fontWeight: 600, color: "var(--text-muted)" }}>Nuevo jugador</span>
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--accent-15)", border: "1px solid var(--accent-30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <UserPlus size={22} color="var(--accent)" />
        </div>
        <div>
          <h1 className="page-title">Nuevo jugador</h1>
          <p style={{ fontSize: 13, color: "var(--text-dimmer)", marginTop: 4 }}>
            Agregá un jugador para inscribirlo en torneos
          </p>
        </div>
      </div>

      <div style={{ background: "var(--bg-surface)", borderRadius: 12, border: "1px solid var(--border-default)", padding: 24 }}>
        <PlayerCreateForm />
      </div>
    </div>
  );
}
