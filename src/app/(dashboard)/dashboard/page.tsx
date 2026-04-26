import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOrganizersByUser } from "@/modules/organizers/queries";
import { getDashboardStats, getRecentTournaments, getUpcomingMatches } from "@/modules/dashboard/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, ClipboardList, Calendar, Plus, ArrowRight, Clock, MapPin, Swords } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await getOrganizersByUser(session.user.id);
  if (memberships.length === 0) redirect("/dashboard/jugador");

  const organizer = memberships[0].organizer;
  const [stats, recentTournaments, upcomingMatches] = await Promise.all([
    getDashboardStats(organizer.id),
    getRecentTournaments(organizer.id),
    getUpcomingMatches(organizer.id),
  ]);

  const firstName = session.user.name?.split(" ")[0] ?? "Usuario";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1280 }}>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard
          label="Torneos activos"
          value={stats.activeTournaments}
          sub={`de ${stats.totalTournaments} en total`}
          accent="#a3e635"
          href="/dashboard/torneos"
          icon={<Trophy size={18} />}
        />
        <StatCard
          label="Inscripciones pendientes"
          value={stats.pendingRegistrations}
          sub="esperando aprobación"
          accent="#fbbf24"
          href="/dashboard/inscripciones"
          icon={<ClipboardList size={18} />}
          pulse={stats.pendingRegistrations > 0}
        />
        <StatCard
          label="Jugadores"
          value={stats.totalPlayers}
          sub="registrados"
          accent="#60a5fa"
          href="/dashboard/jugadores"
          icon={<Users size={18} />}
        />
        <StatCard
          label="Partidos pendientes"
          value={stats.pendingMatches}
          sub="por jugarse"
          accent="#a78bfa"
          href="/dashboard/calendario"
          icon={<Swords size={18} />}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16 }}>

        {/* Torneos recientes */}
        <Surface>
          <SectionHeader
            title="Torneos recientes"
            href="/dashboard/torneos"
            action={<Button variant="ghost" size="sm" asChild><Link href="/dashboard/torneos">Ver todos <ArrowRight size={12} /></Link></Button>}
          />
          {recentTournaments.length === 0 ? (
            <EmptyState icon="🏆" message="Sin torneos aún" action={{ href: "/dashboard/torneos/nuevo", label: "+ Crear torneo" }} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
              {recentTournaments.map((t) => {
                const totalPairs = t.categories.reduce((acc, tc) => acc + (tc._count?.registrations ?? 0), 0);
                return (
                  <Link
                    key={t.id}
                    href={`/dashboard/torneos/${t.id}`}
                    className="row-hover"
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 16px", borderRadius: 10,
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                      textDecoration: "none",
                    }}
                  >
                    <Avatar initials={t.name.slice(0, 2).toUpperCase()} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14, fontFamily: "Space Grotesk, sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                        <Badge status={t.status} />
                      </div>
                      <span style={{ fontSize: 12, color: "var(--text-dimmer)" }}>
                        {t.categories.length} cat. · {totalPairs} parejas · {new Date(t.startDate).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <span style={{ color: "var(--text-dimmer)", fontSize: 18 }}>›</span>
                  </Link>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: 14 }}>
            <Button variant="default" size="sm" asChild>
              <Link href="/dashboard/torneos/nuevo"><Plus size={14} /> Nuevo torneo</Link>
            </Button>
          </div>
        </Surface>

        {/* Próximos partidos */}
        <Surface>
          <SectionHeader
            title="Agenda de hoy"
            href="/dashboard/calendario"
            action={<Button variant="ghost" size="sm" asChild><Link href="/dashboard/calendario">Ver agenda <ArrowRight size={12} /></Link></Button>}
          />
          {upcomingMatches.length === 0 ? (
            <EmptyState icon="📅" message="Sin partidos programados" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 16 }}>
              {upcomingMatches.map((match) => {
                const names = match.teams.map((mt) =>
                  mt.team.players.map((tp) => tp.playerProfile.lastName).join("/") || "TBD"
                );
                return (
                  <div key={match.id} style={{
                    padding: "12px 14px", borderRadius: 9,
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-default)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)", flex: 1, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{names[0] ?? "TBD"}</span>
                      <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: "var(--text-faint)", background: "var(--bg-base)", borderRadius: 4, padding: "2px 6px" }}>VS</span>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{names[1] ?? "TBD"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {match.scheduledAt && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-dimmer)" }}>
                          <Clock size={10} />
                          {new Date(match.scheduledAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                      {match.scheduleSlot?.venue && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-dimmer)" }}>
                          <MapPin size={10} />
                          {match.scheduleSlot.courtAssignment?.court?.name ?? match.scheduleSlot.venue.name}
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: "var(--accent)", fontWeight: 600, marginLeft: "auto" }}>
                        {match.stage.tournamentCategory.category.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Surface>
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────────── */

function StatCard({ label, value, sub, accent, href, icon, pulse }: {
  label: string; value: number; sub: string;
  accent: string; href: string; icon: React.ReactNode; pulse?: boolean;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        borderRadius: 12, padding: 20,
        display: "flex", flexDirection: "column", gap: 8,
        cursor: "pointer",
      }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <span style={{ color: accent, opacity: 0.8 }}>{icon}</span>
          {pulse && (
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fbbf24", display: "inline-block", animation: "pulse-dot 1.5s infinite" }} />
          )}
        </div>
        <div>
          <div style={{ fontSize: 36, fontWeight: 700, color: accent, lineHeight: 1, fontFamily: "Space Grotesk, sans-serif" }}>{value}</div>
          <div style={{ fontSize: 12, color: "var(--text-faint)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>{label}</div>
          <div style={{ fontSize: 11, color: "var(--text-dimmer)", marginTop: 2 }}>{sub}</div>
        </div>
      </div>
    </Link>
  );
}

function Surface({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border-default)",
      borderRadius: 12, padding: 20,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, href, action }: { title: string; href: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)", fontFamily: "Space Grotesk, sans-serif" }}>{title}</h2>
      {action}
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
      background: "var(--accent-15)",
      border: "1px solid var(--accent-30)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, fontWeight: 800, color: "var(--accent)",
      fontFamily: "Space Grotesk, sans-serif",
    }}>
      {initials}
    </div>
  );
}

function EmptyState({ icon, message, action }: { icon: string; message: string; action?: { href: string; label: string } }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 12 }}>
      <span style={{ fontSize: 36, opacity: 0.3 }}>{icon}</span>
      <span style={{ fontSize: 13, color: "var(--text-dimmer)" }}>{message}</span>
      {action && (
        <Button variant="ghost" size="sm" asChild>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}

