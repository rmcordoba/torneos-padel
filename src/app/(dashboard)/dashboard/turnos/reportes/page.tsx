import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getActiveMembership } from "@/lib/active-organizer";
import { getBookingVenues } from "@/modules/bookings/queries";
import { getBookingReport } from "@/modules/bookings/reports";
import { ChevronLeft, TrendingUp, DollarSign, Clock, UserX, Globe, Store, CalendarClock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reportes de turnos" };

const ACCENT = "#a3e635";
const DAYS_ABBR = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function pad2(n: number) { return String(n).padStart(2, "0"); }
function ds(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

const PERIODS = [
  { key: "hoy",     label: "Hoy" },
  { key: "7d",      label: "Últimos 7 días" },
  { key: "mes",     label: "Este mes" },
  { key: "mespasado", label: "Mes pasado" },
] as const;

function rangeFor(period: string): { from: string; to: string; label: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "hoy") return { from: ds(today), to: ds(today), label: "Hoy" };
  if (period === "mes") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: ds(first), to: ds(today), label: "Este mes" };
  }
  if (period === "mespasado") {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: ds(first), to: ds(last), label: "Mes pasado" };
  }
  // 7d (default)
  const from = new Date(today); from.setDate(from.getDate() - 6);
  return { from: ds(from), to: ds(today), label: "Últimos 7 días" };
}

export default async function TurnosReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; venue?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const membership = await getActiveMembership(session.user.id);
  if (!membership) redirect("/dashboard");
  const organizerId = membership.organizerId;

  const { period: periodParam, venue: venueParam } = await searchParams;
  const period = PERIODS.some((p) => p.key === periodParam) ? periodParam! : "7d";
  const range = rangeFor(period);

  const venues = await getBookingVenues(organizerId);
  const activeVenueId = venues.find((v) => v.id === venueParam)?.id;

  const report = await getBookingReport(organizerId, { from: range.from, to: range.to, venueId: activeVenueId });

  const link = (p: { period?: string; venue?: string | null }) => {
    const params = new URLSearchParams();
    params.set("period", p.period ?? period);
    const v = p.venue === undefined ? (activeVenueId ?? "") : (p.venue ?? "");
    if (v) params.set("venue", v);
    return `/dashboard/turnos/reportes?${params.toString()}`;
  };

  const maxWeekday = Math.max(1, ...report.byWeekday.map((d) => d.bookings));
  const maxHour = Math.max(1, ...report.byHour.map((h) => h.bookings));

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <Link href="/dashboard/turnos" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "#475569", textDecoration: "none", marginBottom: 12 }}>
          <ChevronLeft size={14} /> Turnos
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <TrendingUp size={24} color={ACCENT} />
          <h1 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 28, fontWeight: 900, color: "#f8fafc", letterSpacing: "-0.02em", lineHeight: 1 }}>
            Reportes de turnos
          </h1>
        </div>
        <p style={{ fontSize: 13, color: "#475569" }}>{range.from} → {range.to} · {report.days} día{report.days !== 1 ? "s" : ""}</p>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", padding: 4, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
          {PERIODS.map((p) => {
            const active = p.key === period;
            return (
              <Link key={p.key} href={link({ period: p.key })} style={{
                padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none",
                background: active ? "rgba(255,255,255,0.08)" : "transparent", color: active ? "#f1f5f9" : "#64748b",
              }}>{p.label}</Link>
            );
          })}
        </div>
        {venues.length > 1 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Link href={link({ venue: null })} style={venuePill(!activeVenueId)}>Todas</Link>
            {venues.map((v) => (
              <Link key={v.id} href={link({ venue: v.id })} style={venuePill(v.id === activeVenueId)}>{v.name}</Link>
            ))}
          </div>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
        <Kpi icon={<Clock size={18} />} value={String(report.bookings)} label="Reservas" color="#a3e635" />
        <Kpi icon={<TrendingUp size={18} />} value={`${report.occupancyPct}%`} label="Ocupación" color="#38bdf8"
             sub={`${report.bookedHours}h de ${report.availableHours}h`} />
        <Kpi icon={<DollarSign size={18} />} value={`$${report.revenuePaid.toLocaleString("es-AR")}`} label="Cobrado" color="#a3e635" />
        <Kpi icon={<DollarSign size={18} />} value={`$${report.revenuePending.toLocaleString("es-AR")}`} label="Pendiente" color="#fbbf24" />
        <Kpi icon={<UserX size={18} />} value={String(report.noShows)} label="No-shows" color="#fb7185" />
      </div>

      {/* Origen de las reservas */}
      <Panel title="Origen de las reservas">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <SourceCard icon={<Globe size={16} />} label="Web pública" value={report.bySource.PUBLIC} color="#38bdf8" />
          <SourceCard icon={<Store size={16} />} label="Mostrador" value={report.bySource.STAFF} color="#a3e635" />
          <SourceCard icon={<CalendarClock size={16} />} label="Turno fijo" value={report.bySource.FIXED} color="#a78bfa" />
        </div>
      </Panel>

      {/* Por cancha */}
      <Panel title="Ocupación por cancha">
        {report.byCourt.length === 0 ? (
          <p style={{ fontSize: 13, color: "#475569", padding: "8px 0" }}>Sin reservas en este período.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {report.byCourt.map((c) => (
              <div key={c.courtId} style={{ display: "grid", gridTemplateColumns: "1fr 120px 90px 90px", gap: 12, alignItems: "center" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", fontFamily: "var(--font-space), sans-serif" }}>{c.courtName}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{c.venueName}</div>
                </div>
                {/* Barra de ocupación */}
                <div>
                  <div style={{ height: 8, borderRadius: 6, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, c.occupancyPct)}%`, background: c.occupancyPct >= 70 ? "#a3e635" : c.occupancyPct >= 35 ? "#fbbf24" : "#fb923c", borderRadius: 6 }} />
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: 14, fontWeight: 800, color: "#f1f5f9", fontFamily: "var(--font-space), sans-serif" }}>{c.occupancyPct}%</div>
                <div style={{ textAlign: "right", fontSize: 13, color: "#a3e635", fontWeight: 700 }}>${c.revenuePaid.toLocaleString("es-AR")}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Por día de semana + por hora */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Panel title="Reservas por día">
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
            {report.byWeekday.map((d) => (
              <div key={d.weekday} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", fontFamily: "var(--font-space), sans-serif" }}>{d.bookings}</span>
                <div style={{ width: "100%", height: 80, display: "flex", alignItems: "flex-end" }}>
                  <div style={{ width: "100%", height: `${(d.bookings / maxWeekday) * 100}%`, minHeight: d.bookings > 0 ? 4 : 0, background: "linear-gradient(180deg, #a3e635, rgba(163,230,53,0.3))", borderRadius: "4px 4px 0 0" }} />
                </div>
                <span style={{ fontSize: 10, color: "#475569" }}>{DAYS_ABBR[d.weekday]}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Horarios más pedidos">
          {report.byHour.length === 0 ? (
            <p style={{ fontSize: 13, color: "#475569", padding: "8px 0" }}>Sin datos.</p>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
              {report.byHour.map((h) => (
                <div key={h.hour} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <div style={{ width: "100%", height: 88, display: "flex", alignItems: "flex-end" }}>
                    <div style={{ width: "100%", height: `${(h.bookings / maxHour) * 100}%`, minHeight: 4, background: "linear-gradient(180deg, #38bdf8, rgba(56,189,248,0.3))", borderRadius: "3px 3px 0 0" }} title={`${h.bookings} reservas`} />
                  </div>
                  <span style={{ fontSize: 9, color: "#475569", fontFamily: "var(--font-space), sans-serif" }}>{pad2(h.hour)}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Kpi({ icon, value, label, color, sub }: { icon: React.ReactNode; value: string; label: string; color: string; sub?: string }) {
  return (
    <div style={{ borderRadius: 16, background: "rgba(12,20,40,0.7)", border: "1px solid rgba(255,255,255,0.07)", padding: 18 }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: `${color}1f`, border: `1px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", color, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 700, marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 16, background: "rgba(12,20,40,0.6)", border: "1px solid rgba(255,255,255,0.07)", padding: 20 }}>
      <h2 style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 14, fontWeight: 800, color: "#f8fafc", marginBottom: 16 }}>{title}</h2>
      {children}
    </div>
  );
}

function SourceCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div style={{ borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ color }}>{icon}</span>
      <div>
        <div style={{ fontFamily: "var(--font-space), sans-serif", fontSize: 20, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

function venuePill(active: boolean): React.CSSProperties {
  return {
    padding: "7px 14px", borderRadius: 100, fontSize: 12, fontWeight: 700, textDecoration: "none",
    background: active ? ACCENT : "rgba(255,255,255,0.04)", color: active ? "#080e1a" : "#64748b",
    border: active ? "none" : "1px solid rgba(255,255,255,0.08)",
  };
}
