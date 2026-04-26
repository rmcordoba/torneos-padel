import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getPlayerProfileForEdit } from "@/modules/players/queries";
import { PlayerEditForm } from "../_components/player-edit-form";
import { ChevronLeft, Pencil } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar jugador" };

export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const player = await getPlayerProfileForEdit(playerId);
  if (!player) notFound();

  return (
    <div style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 24 }}>
      <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        <Link href="/dashboard/jugadores" style={{ color: "var(--text-faint)", textDecoration: "none" }}>Jugadores</Link>
        <span style={{ color: "var(--border-strong)" }}>/</span>
        <Link href={`/dashboard/jugadores/${playerId}`} style={{ color: "var(--text-faint)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
          {player.lastName}, {player.firstName}
        </Link>
        <span style={{ color: "var(--border-strong)" }}>/</span>
        <span style={{ fontWeight: 600, color: "var(--text-muted)" }}>Editar</span>
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Pencil size={20} color="var(--text-muted)" />
        </div>
        <div>
          <h1 className="page-title">Editar jugador</h1>
          <p style={{ fontSize: 13, color: "var(--text-dimmer)", marginTop: 4 }}>
            {player.firstName} {player.lastName} · {player.user.email}
          </p>
        </div>
      </div>

      <div style={{ background: "var(--bg-surface)", borderRadius: 12, border: "1px solid var(--border-default)", padding: 24 }}>
        <PlayerEditForm
          playerProfileId={player.id}
          defaultValues={{
            firstName: player.firstName,
            lastName: player.lastName,
            phone: player.phone,
            dni: player.dni,
            birthDate: player.birthDate ? player.birthDate.toISOString().slice(0, 10) : null,
          }}
        />
      </div>
    </div>
  );
}
