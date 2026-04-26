import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOrganizersByUser } from "@/modules/organizers/queries";
import { listTournamentsByOrganizer } from "@/modules/tournaments/queries";
import { Plus, Trophy, Calendar, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Torneos" };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  REGISTRATION_OPEN: "Inscripciones",
  REGISTRATION_CLOSED: "Ins. cerradas",
  IN_PROGRESS: "En curso",
  COMPLETED: "Finalizado",
  CANCELLED: "Cancelado",
};

const STATUS_COLOR: Record<string, { bg: string; color: string; border: string }> = {
  DRAFT:               { bg: "rgba(148,163,184,0.12)", color: "#94a3b8", border: "rgba(148,163,184,0.25)" },
  PUBLISHED:           { bg: "rgba(96,165,250,0.12)",  color: "#60a5fa", border: "rgba(96,165,250,0.25)" },
  REGISTRATION_OPEN:   { bg: "rgba(163,230,53,0.12)",  color: "#a3e635", border: "rgba(163,230,53,0.3)" },
  REGISTRATION_CLOSED: { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24", border: "rgba(251,191,36,0.25)" },
  IN_PROGRESS:         { bg: "rgba(163,230,53,0.15)",  color: "#a3e635", border: "rgba(163,230,53,0.3)" },
  COMPLETED:           { bg: "rgba(148,163,184,0.12)", color: "#94a3b8", border: "rgba(148,163,184,0.25)" },
  CANCELLED:           { bg: "rgba(248,113,113,0.12)", color: "#f87171", border: "rgba(248,113,113,0.25)" },
};

export default async function TorneosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await getOrganizersByUser(session.user.id);
  if (memberships.length === 0) redirect("/dashboard");

  const organizer = memberships[0].organizer;
  const tournaments = await listTournamentsByOrganizer(organizer.id);

  const active   = tournaments.filter((t) => ["IN_PROGRESS", "REGISTRATION_OPEN"].includes(t.status));
  const upcoming = tournaments.filter((t) => ["DRAFT", "PUBLISHED", "REGISTRATION_CLOSED"].includes(t.status));
  const past     = tournaments.filter((t) => ["COMPLETED", "CANCELLED"].includes(t.status));

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Torneos</h1>
          <p style={{ fontSize: 13, color: "var(--text-dimmer)", marginTop: 4 }}>
            {tournaments.length} torneo{tournaments.length !== 1 ? "s" : ""} · {organizer.name}
          </p>
        </div>
        <Link href="/dashboard/torneos/nuevo" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "9px 18px", borderRadius: 8,
          background: "var(--accent)", color: "#0a0f0a",
          fontSize: 13, fontWeight: 700, textDecoration: "none",
          transition: "opacity 0.15s",
        }}>
          <Plus size={14} /> Nuevo torneo
        </Link>
      </div>

      {tournaments.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "80px 40px", borderRadius: 12,
          border: "1px dashed var(--border-strong)", textAlign: "center",
        }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--accent-15)", border: "1px solid var(--accent-30)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Trophy size={22} color="var(--accent)" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, fontFamily: "Space Grotesk, sans-serif" }}>
            Creá tu primer torneo
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-faint)", maxWidth: 280, marginBottom: 24 }}>
            Gestioná inscripciones, fixtures, resultados y ranking desde un solo lugar.
          </p>
          <Link href="/dashboard/torneos/nuevo" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "9px 20px", borderRadius: 8,
            background: "var(--accent)", color: "#0a0f0a",
            fontSize: 13, fontWeight: 700, textDecoration: "none",
          }}>
            <Plus size={14} /> Crear torneo
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {active.length > 0 && (
            <TournamentGroup title="En curso · Inscripciones abiertas" tournaments={active} dotColor="#a3e635" />
          )}
          {upcoming.length > 0 && (
            <TournamentGroup title="Próximos" tournaments={upcoming} dotColor="#60a5fa" />
          )}
          {past.length > 0 && (
            <TournamentGroup title="Finalizados" tournaments={past} dotColor="#475569" />
          )}
        </div>
      )}
    </div>
  );
}

function TournamentGroup({
  title,
  tournaments,
  dotColor,
}: {
  title: string;
  tournaments: Awaited<ReturnType<typeof listTournamentsByOrganizer>>;
  dotColor: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {title}
        </span>
        <span style={{ fontSize: 11, color: "var(--text-darkest)" }}>({tournaments.length})</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tournaments.map((t) => {
          const totalPairs = t.categories.reduce((acc, tc) => acc + (tc._count?.registrations ?? 0), 0);
          const sc = STATUS_COLOR[t.status] ?? STATUS_COLOR.DRAFT;
          const dateStr = new Date(t.startDate).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });

          return (
            <Link
              key={t.id}
              href={`/dashboard/torneos/${t.id}`}
              className="row-hover"
              style={{
                display: "grid", gridTemplateColumns: "auto 1fr auto auto",
                alignItems: "center", gap: 18, padding: "16px 18px",
                background: "var(--bg-surface)", borderRadius: 10,
                border: "1px solid var(--border-default)",
                textDecoration: "none", cursor: "pointer",
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: "var(--accent-15)", border: "1px solid var(--accent-30)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: "var(--accent)",
                fontFamily: "Space Grotesk, sans-serif",
              }}>
                {t.name.slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "Space Grotesk, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.name}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                    background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                    letterSpacing: "0.05em", textTransform: "uppercase", flexShrink: 0,
                  }}>
                    {t.status === "IN_PROGRESS" && <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: "#a3e635", marginRight: 5, verticalAlign: "middle" }} />}
                    {STATUS_LABEL[t.status]}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: "var(--text-dimmer)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={12} /> {dateStr}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Trophy size={12} /> {t.categories.length} cat.
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Users size={12} /> {totalPairs} parejas
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <span style={{ color: "var(--text-darkest)", fontSize: 14 }}>›</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
