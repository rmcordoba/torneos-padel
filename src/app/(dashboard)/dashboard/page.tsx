import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getActiveMembership } from "@/lib/active-organizer";
import { getDashboardStats, getRecentTournaments, getUpcomingMatches } from "@/modules/dashboard/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, ClipboardList, Calendar, Plus, ArrowRight, Clock, MapPin, Swords } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await getActiveMembership(session.user.id);
  if (!membership) redirect("/dashboard/jugador");

  const organizer = membership.organizer;
  const [stats, recentTournaments, upcomingMatches] = await Promise.all([
    getDashboardStats(organizer.id),
    getRecentTournaments(organizer.id),
    getUpcomingMatches(organizer.id),
  ]);

  const firstName = session.user.name?.split(" ")[0] ?? "Usuario";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1280 }}>

      {/* Greeting */}
      <div>
        <h1 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 26, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.02em", marginBottom: 4 }}>
          Hola, {firstName} 👋
        </h1>
        <p style={{ fontSize: 13, color: "#475569" }}>Este es el resumen de {organizer.name}</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <StatCard
          label="Torneos activos"
          value={stats.activeTournaments}
          sub={`de ${stats.totalTournaments} en total`}
          accent="#a3e635"
          glow="rgba(163,230,53,0.2)"
          href="/dashboard/torneos"
          icon={<Trophy size={20} />}
          delay={0}
        />
        <StatCard
          label="Inscripciones pendientes"
          value={stats.pendingRegistrations}
          sub="esperando aprobación"
          accent="#fbbf24"
          glow="rgba(251,191,36,0.2)"
          href="/dashboard/inscripciones"
          icon={<ClipboardList size={20} />}
          pulse={stats.pendingRegistrations > 0}
          delay={1}
        />
        <StatCard
          label="Jugadores"
          value={stats.totalPlayers}
          sub="registrados"
          accent="#38bdf8"
          glow="rgba(56,189,248,0.2)"
          href="/dashboard/jugadores"
          icon={<Users size={20} />}
          delay={2}
        />
        <StatCard
          label="Partidos pendientes"
          value={stats.pendingMatches}
          sub="por jugarse"
          accent="#a78bfa"
          glow="rgba(167,139,250,0.2)"
          href="/dashboard/calendario"
          icon={<Swords size={20} />}
          delay={3}
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
                    className="dash-row"
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 16px", borderRadius: 12,
                      textDecoration: "none",
                    }}
                  >
                    <Avatar initials={t.name.slice(0, 2).toUpperCase()} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 14, fontFamily: "var(--font-space), sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                        <Badge status={t.status} />
                      </div>
                      <span style={{ fontSize: 12, color: "#475569" }}>
                        {t.categories.length} cat. · {totalPairs} parejas · {new Date(t.startDate).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <span style={{ color: "#475569", fontSize: 18 }}>›</span>
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
                    padding: "12px 14px", borderRadius: 11,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: "#f1f5f9", flex: 1, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-space), sans-serif" }}>{names[0] ?? "TBD"}</span>
                      <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 900, color: "#a3e635", background: "rgba(163,230,53,0.12)", border: "1px solid rgba(163,230,53,0.2)", borderRadius: 6, padding: "2px 7px" }}>VS</span>
                      <span style={{ fontWeight: 700, color: "#f1f5f9", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-space), sans-serif" }}>{names[1] ?? "TBD"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {match.scheduledAt && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#475569" }}>
                          <Clock size={10} />
                          {new Date(match.scheduledAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                      {match.scheduleSlot?.venue && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#475569" }}>
                          <MapPin size={10} />
                          {match.scheduleSlot.courtAssignment?.court?.name ?? match.scheduleSlot.venue.name}
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: "#a3e635", fontWeight: 700, marginLeft: "auto" }}>
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

function StatCard({ label, value, sub, accent, glow, href, icon, pulse, delay = 0 }: {
  label: string; value: number; sub: string;
  accent: string; glow: string; href: string; icon: React.ReactNode; pulse?: boolean; delay?: number;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        className={`dstat vib-in card-d${delay}`}
        style={{ ["--vib-glow" as string]: glow, cursor: "pointer" }}
      >
        {/* Sheen sweep on pulsing card */}
        {pulse && <div className="vib-sheen" />}

        {/* Gradient top zone */}
        <div style={{
          padding: "16px 18px 14px",
          background: `linear-gradient(135deg, ${accent}1f 0%, transparent 60%)`,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11,
            background: `${accent}1f`, border: `1px solid ${accent}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: accent, boxShadow: `0 0 16px ${glow}`,
          }}>
            {icon}
          </div>
          {pulse && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 10, fontWeight: 900, color: "#080e1a",
              background: "#fbbf24", padding: "3px 9px", borderRadius: 7, letterSpacing: "0.04em",
            }}>
              <span className="vib-dot" style={{ width: 5, height: 5, borderRadius: "50%", background: "#080e1a" }} />
              ACCIÓN
            </span>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: "14px 18px 18px" }}>
          <div className="vib-score" style={{ fontSize: 44, color: accent }}>{value}</div>
          <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 700, marginTop: 6 }}>{label}</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{sub}</div>
        </div>
      </div>
    </Link>
  );
}

function Surface({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(12,20,40,0.6)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, padding: 20,
      boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, href, action }: { title: string; href: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif" }}>{title}</h2>
      {action}
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 11, flexShrink: 0,
      background: "rgba(163,230,53,0.12)",
      border: "1px solid rgba(163,230,53,0.28)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, fontWeight: 900, color: "#a3e635",
      fontFamily: "var(--font-space), sans-serif",
    }}>
      {initials}
    </div>
  );
}

function EmptyState({ icon, message, action }: { icon: string; message: string; action?: { href: string; label: string } }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 12 }}>
      <span style={{ fontSize: 40, opacity: 0.2 }}>{icon}</span>
      <span style={{ fontSize: 13, color: "#475569" }}>{message}</span>
      {action && (
        <Button variant="ghost" size="sm" asChild>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}

