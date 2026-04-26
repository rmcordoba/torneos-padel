import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOrganizersByUser } from "@/modules/organizers/queries";
import { getTournamentForEdit } from "@/modules/tournaments/queries";
import { TournamentEditForm } from "../_components/tournament-edit-form";
import { ChevronLeft, Settings2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar torneo" };

function toDateInput(d: Date) { return d.toISOString().slice(0, 10); }

export default async function EditTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await getOrganizersByUser(session.user.id);
  if (!memberships.length) redirect("/dashboard");

  const organizerId = memberships[0].organizerId;
  const tournament = await getTournamentForEdit(id, organizerId);
  if (!tournament) notFound();

  return (
    <div style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 24 }}>
      <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        <Link href="/dashboard/torneos" style={{ color: "var(--text-faint)", textDecoration: "none" }}>Torneos</Link>
        <span style={{ color: "var(--border-strong)" }}>/</span>
        <Link href={`/dashboard/torneos/${id}`} style={{ color: "var(--text-faint)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
          {tournament.name}
        </Link>
        <span style={{ color: "var(--border-strong)" }}>/</span>
        <span style={{ fontWeight: 600, color: "var(--text-muted)" }}>Editar</span>
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Settings2 size={22} color="var(--text-muted)" />
        </div>
        <div>
          <h1 className="page-title">Editar torneo</h1>
          <p style={{ fontSize: 13, color: "var(--text-dimmer)", marginTop: 4 }}>{tournament.name}</p>
        </div>
      </div>

      <div style={{ background: "var(--bg-surface)", borderRadius: 12, border: "1px solid var(--border-default)", padding: 24 }}>
        <TournamentEditForm
          tournamentId={tournament.id}
          defaultValues={{
            name: tournament.name,
            description: tournament.description,
            startDate: toDateInput(tournament.startDate),
            endDate: toDateInput(tournament.endDate),
            registrationDeadline: tournament.registrationDeadline ? toDateInput(tournament.registrationDeadline) : null,
            isPublic: tournament.isPublic,
          }}
        />
      </div>
    </div>
  );
}
