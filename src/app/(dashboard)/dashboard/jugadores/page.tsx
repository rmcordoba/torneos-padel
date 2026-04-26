import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOrganizersByUser } from "@/modules/organizers/queries";
import { getPlayersByOrganizer } from "@/modules/players/queries";
import { Users, UserPlus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Jugadores" };

export default async function JugadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await getOrganizersByUser(session.user.id);
  if (!memberships.length) redirect("/dashboard");

  const organizerId = memberships[0].organizerId;
  const players = await getPlayersByOrganizer(organizerId, q?.trim() || undefined);

  return (
    <div style={{ maxWidth: 800, display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Jugadores</h1>
          <p style={{ fontSize: 13, color: "var(--text-dimmer)", marginTop: 4 }}>
            {players.length > 0
              ? `${players.length} jugador${players.length !== 1 ? "es" : ""} encontrado${players.length !== 1 ? "s" : ""}`
              : "Jugadores de tu organización"}
          </p>
        </div>
        <Link href="/dashboard/jugadores/nuevo" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "9px 18px", borderRadius: 8,
          background: "var(--accent)", color: "#0a0f0a",
          fontSize: 13, fontWeight: 700, textDecoration: "none",
        }}>
          <UserPlus size={14} /> Agregar jugador
        </Link>
      </div>

      {/* Search */}
      <form method="GET">
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-darkest)", fontSize: 13 }}>🔍</span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre, apellido, DNI o email..."
            className="field-input"
            style={{ paddingLeft: 36 }}
          />
        </div>
      </form>

      {/* Results */}
      {players.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "80px 40px", borderRadius: 12,
          border: "1px dashed var(--border-strong)", textAlign: "center",
        }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--accent-15)", border: "1px solid var(--accent-30)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Users size={22} color="var(--accent)" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, fontFamily: "Space Grotesk, sans-serif" }}>
            {q ? `Sin resultados para "${q}"` : "Sin jugadores aún"}
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-faint)", maxWidth: 280 }}>
            {q
              ? "Probá con otro nombre, apellido o DNI."
              : "Los jugadores aparecen aquí cuando se inscriben a un torneo."}
          </p>
        </div>
      ) : (
        <div style={{ background: "var(--bg-surface)", borderRadius: 12, border: "1px solid var(--border-default)", overflow: "hidden" }}>
          <div style={{ padding: "10px 18px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              {players.length} jugador{players.length !== 1 ? "es" : ""}
              {q && ` para "${q}"`}
            </span>
          </div>
          <div>
            {players.map((player, idx) => {
              const initials = `${player.firstName[0]}${player.lastName[0]}`.toUpperCase();
              const accentColors = ["#a3e635", "#60a5fa", "#a78bfa", "#fbbf24"];
              const ac = accentColors[(player.firstName.charCodeAt(0) + player.lastName.charCodeAt(0)) % accentColors.length];

              return (
                <Link
                  key={player.id}
                  href={`/dashboard/jugadores/${player.id}`}
                  className="row-hover"
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 18px", textDecoration: "none",
                    borderBottom: idx < players.length - 1 ? "1px solid var(--border-subtle)" : "none",
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: `${ac}22`, border: `1px solid ${ac}44`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, color: ac,
                    fontFamily: "Space Grotesk, sans-serif",
                  }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                      {player.lastName}, {player.firstName}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-dimmer)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {player.user.email}
                      {player.dni && ` · DNI ${player.dni}`}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 12, color: "var(--text-faint)" }}>
                      {player._count.teamPlayers} pareja{player._count.teamPlayers !== 1 ? "s" : ""}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
