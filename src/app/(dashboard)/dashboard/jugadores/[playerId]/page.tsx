import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getPlayerProfile } from "@/modules/players/queries";
import { ChevronLeft, Mail, CreditCard, Phone, Calendar, Trophy, Users, Pencil } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Perfil de jugador" };

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  PENDING:   { bg: "rgba(251,191,36,0.15)",  color: "#fbbf24" },
  APPROVED:  { bg: "rgba(163,230,53,0.15)",  color: "#a3e635" },
  REJECTED:  { bg: "rgba(248,113,113,0.15)", color: "#f87171" },
  CANCELLED: { bg: "rgba(100,116,139,0.15)", color: "#94a3b8" },
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente", APPROVED: "Aprobada", REJECTED: "Rechazada", CANCELLED: "Cancelada",
};

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const player = await getPlayerProfile(playerId);
  if (!player) notFound();

  const initials = `${player.firstName[0]}${player.lastName[0]}`.toUpperCase();

  const allRegistrations = player.teamPlayers.flatMap((tp) =>
    tp.team.registrations.map((reg) => ({
      reg,
      partner: tp.team.players.find((p) => p.playerProfileId !== playerId)?.playerProfile,
    }))
  ).sort((a, b) => new Date(b.reg.createdAt).getTime() - new Date(a.reg.createdAt).getTime());

  const approvedCount = allRegistrations.filter((r) => r.reg.status === "APPROVED").length;

  return (
    <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Breadcrumb */}
      <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        <Link href="/dashboard/jugadores" style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-faint)", textDecoration: "none" }}>
          <ChevronLeft size={14} /> Jugadores
        </Link>
        <span style={{ color: "var(--border-strong)" }}>/</span>
        <span style={{ fontWeight: 600, color: "var(--text-muted)" }}>{player.lastName}, {player.firstName}</span>
      </nav>

      {/* Profile card */}
      <div style={{ background: "var(--bg-surface)", borderRadius: 12, border: "1px solid var(--border-default)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0, background: "var(--accent-15)", border: "1px solid var(--accent-30)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "var(--accent)", fontFamily: "var(--font-space), sans-serif" }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-space), sans-serif" }}>
                {player.firstName} {player.lastName}
              </h1>
              <Link href={`/dashboard/jugadores/${player.id}/editar`} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-faint)", fontSize: 12, fontWeight: 600, textDecoration: "none", flexShrink: 0 }}>
                <Pencil size={13} /> Editar
              </Link>
            </div>
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: "6px 20px" }}>
              {player.user.email && (
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-dimmer)" }}>
                  <Mail size={13} color="var(--text-darkest)" /> {player.user.email}
                </span>
              )}
              {player.dni && (
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-dimmer)" }}>
                  <CreditCard size={13} color="var(--text-darkest)" /> DNI {player.dni}
                </span>
              )}
              {player.phone && (
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-dimmer)" }}>
                  <Phone size={13} color="var(--text-darkest)" /> {player.phone}
                </span>
              )}
              {player.birthDate && (
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-dimmer)" }}>
                  <Calendar size={13} color="var(--text-darkest)" />
                  {new Date(player.birthDate).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid var(--border-subtle)" }}>
          {[
            { label: "Inscripciones", value: allRegistrations.length, accent: false },
            { label: "Aprobadas", value: approvedCount, accent: true },
            { label: "Parejas", value: player.teamPlayers.length, accent: false },
          ].map((s, i) => (
            <div key={i} style={{ padding: "16px 12px", textAlign: "center", borderRight: i < 2 ? "1px solid var(--border-subtle)" : "none" }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: s.accent ? "var(--accent)" : "var(--text-primary)", fontFamily: "var(--font-space), sans-serif" }}>{s.value}</p>
              <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dimmer)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Registration history */}
      <div>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-space), sans-serif" }}>
          <Trophy size={15} color="var(--accent)" /> Historial de inscripciones
        </h2>

        {allRegistrations.length === 0 ? (
          <div style={{ borderRadius: 12, border: "1px dashed var(--border-strong)", padding: "40px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--text-faint)" }}>Sin inscripciones registradas.</p>
          </div>
        ) : (
          <div style={{ background: "var(--bg-surface)", borderRadius: 12, border: "1px solid var(--border-default)", overflow: "hidden" }}>
            {allRegistrations.map(({ reg, partner }, idx) => {
              const st = STATUS_STYLE[reg.status] ?? STATUS_STYLE.CANCELLED;
              return (
                <div key={`${reg.id}-${idx}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: idx < allRegistrations.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: "var(--accent-15)", border: "1px solid var(--accent-30)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Trophy size={15} color="var(--accent)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {reg.tournamentCategory.tournament.name}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: "var(--text-dimmer)" }}>{reg.tournamentCategory.category.name}</span>
                      {partner && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-dimmer)" }}>
                          <Users size={10} /> con {partner.firstName} {partner.lastName}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: "var(--text-darkest)", marginTop: 2 }}>
                      {new Date(reg.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: st.bg, color: st.color, border: `1px solid ${st.color}44`, whiteSpace: "nowrap" }}>
                    {STATUS_LABEL[reg.status] ?? reg.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
