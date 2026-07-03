import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAdminStats, getGlobalAuditLogs } from "@/modules/admin/queries";
import { Building2, Users, Trophy, Shield, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Overview" };

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Creación", UPDATE: "Modificación", DELETE: "Eliminación",
  PUBLISH: "Publicación", APPROVE: "Aprobación", REJECT: "Rechazo",
  CANCEL: "Cancelación", RESULT_RECORDED: "Resultado", RESULT_MODIFIED: "Result. editado",
};

export default async function AdminOverviewPage() {
  const session = await auth();
  if (session?.user?.systemRole !== "SUPER_ADMIN") redirect("/dashboard");

  const [stats, recentLogs] = await Promise.all([
    getAdminStats(),
    getGlobalAuditLogs(20),
  ]);

  return (
    <div style={{ maxWidth: 1100, display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif", margin: 0 }}>
          Panel de administración
        </h1>
        <p style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
          Visión global del sistema
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard label="Organizadores activos" value={stats.activeOrganizers} sub={`de ${stats.totalOrganizers} en total`} color="#ef4444" icon={<Building2 size={18} />} href="/admin/organizadores" />
        <StatCard label="Usuarios registrados" value={stats.totalUsers} sub="en la plataforma" color="#60a5fa" icon={<Users size={18} />} href="/admin/usuarios" />
        <StatCard label="Torneos totales" value={stats.totalTournaments} sub="en todos los organizadores" color="#a3e635" icon={<Trophy size={18} />} href="/admin/organizadores" />
        <StatCard label="Eventos (7 días)" value={stats.recentLogs} sub="acciones registradas" color="#fbbf24" icon={<Shield size={18} />} href="/admin/auditoria" />
      </div>

      {/* Recent audit */}
      <div style={{ background: "rgba(12,20,40,0.7)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif" }}>
            Actividad reciente
          </h2>
          <Link href="/admin/auditoria" style={{ fontSize: 12, color: "#a3e635", textDecoration: "none", fontWeight: 600 }}>
            Ver todo →
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#475569", fontSize: 13 }}>
            Sin actividad reciente
          </div>
        ) : (
          <div style={{ padding: "0 0 8px" }}>
            {recentLogs.map((log) => {
              const date = new Date(log.createdAt);
              return (
                <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Shield size={14} color="#64748b" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.user.name ?? log.user.email}
                      <span style={{ fontWeight: 400, color: "#475569" }}> · {ACTION_LABELS[log.action] ?? log.action} en {log.entity}</span>
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "#475569", marginTop: 2 }}>
                      {log.organizer?.name ?? "Sin organizador"}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#334155", flexShrink: 0 }}>
                    <Clock size={10} />
                    {date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })} {date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, icon, href }: {
  label: string; value: number; sub: string; color: string; icon: React.ReactNode; href: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{ background: "rgba(12,20,40,0.7)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ color, opacity: 0.8 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 36, fontWeight: 700, color, lineHeight: 1, fontFamily: "var(--font-space), sans-serif" }}>{value}</div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>{label}</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{sub}</div>
        </div>
      </div>
    </Link>
  );
}
