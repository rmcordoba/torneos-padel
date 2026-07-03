import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getActiveMembership } from "@/lib/active-organizer";
import { getOrganizerForTournamentForm } from "@/modules/organizers/queries";
import { TournamentForm } from "./_components/tournament-form";
import { ChevronLeft, Trophy } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nuevo torneo" };

export default async function NuevoTorneoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await getActiveMembership(session.user.id);
  if (!membership) redirect("/dashboard");

  const organizer = await getOrganizerForTournamentForm(membership.organizer.id);
  if (!organizer) redirect("/dashboard");

  const defaults = organizer.settings ?? {
    defaultSetsPerMatch: 3,
    defaultGamesPerSet: 6,
    defaultMaxTeamsPerCat: 16,
  };

  return (
    <div style={{ maxWidth: 960, display: "flex", flexDirection: "column", gap: 24 }}>
      <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        <Link href="/dashboard/torneos" style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-faint)", textDecoration: "none" }}>
          <ChevronLeft size={14} /> Torneos
        </Link>
        <span style={{ color: "var(--border-strong)" }}>/</span>
        <span style={{ fontWeight: 600, color: "var(--text-muted)" }}>Nuevo torneo</span>
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--accent-15)", border: "1px solid var(--accent-30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Trophy size={22} color="var(--accent)" />
        </div>
        <div>
          <h1 className="page-title">Nuevo torneo</h1>
          <p style={{ fontSize: 13, color: "var(--text-dimmer)", marginTop: 4 }}>
            Configurá el torneo, sus categorías y reglas de competencia
          </p>
        </div>
      </div>

      <TournamentForm
        venues={organizer.venues}
        categories={organizer.categories}
        organizerDefaults={{
          defaultSetsPerMatch: defaults.defaultSetsPerMatch,
          defaultGamesPerSet: defaults.defaultGamesPerSet,
          defaultMaxTeamsPerCat: defaults.defaultMaxTeamsPerCat,
        }}
      />
    </div>
  );
}
