import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getGlobalAuditLogs } from "@/modules/admin/queries";
import { Shield, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Auditoría global" };

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CREATE:          { label: "Creación",         color: "rgba(163,230,53,0.15)" },
  UPDATE:          { label: "Modificación",      color: "rgba(96,165,250,0.15)" },
  DELETE:          { label: "Eliminación",       color: "rgba(248,113,113,0.15)" },
  PUBLISH:         { label: "Publicación",       color: "rgba(192,132,252,0.15)" },
  APPROVE:         { label: "Aprobación",        color: "rgba(163,230,53,0.15)" },
  REJECT:          { label: "Rechazo",           color: "rgba(248,113,113,0.15)" },
  CANCEL:          { label: "Cancelación",       color: "rgba(251,191,36,0.15)" },
  RESULT_RECORDED: { label: "Resultado",         color: "rgba(56,189,248,0.15)" },
  RESULT_MODIFIED: { label: "Result. editado",   color: "rgba(251,191,36,0.15)" },
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "#a3e635", UPDATE: "#60a5fa", DELETE: "#f87171",
  PUBLISH: "#c084fc", APPROVE: "#a3e635", REJECT: "#f87171",
  CANCEL: "#fbbf24", RESULT_RECORDED: "#38bdf8", RESULT_MODIFIED: "#fbbf24",
};

export default async function AdminAuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string }>;
}) {
  const session = await auth();
  if (session?.user?.systemRole !== "SUPER_ADMIN") redirect("/dashboard");

  const { limit: limitParam } = await searchParams;
  const limit = Math.min(Number(limitParam) || 100, 500);
  const logs = await getGlobalAuditLogs(limit);

  return (
    <div style={{ maxWidth: 1100, display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", fontFamily: "Space Grotesk, sans-serif", margin: 0 }}>
            Auditoría global
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-dimmer)", marginTop: 4 }}>
            Todas las acciones del sistema · {logs.length} registros
          </p>
        </div>
        {limit < 500 && logs.length === limit && (
          <a
            href={`/admin/auditoria?limit=${limit + 100}`}
            style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}
          >
            Cargar más →
          </a>
        )}
      </div>

      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: 12, overflow: "hidden" }}>
        {logs.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 12 }}>
            <Shield size={40} color="var(--border-strong)" />
            <p style={{ fontSize: 13, color: "var(--text-dimmer)", margin: 0 }}>Sin registros de auditoría</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}>
                  {["Fecha", "Usuario", "Organizador", "Entidad", "Acción", "Detalle"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-darkest)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const date = new Date(log.createdAt);
                  const meta = ACTION_LABELS[log.action] ?? { label: log.action, color: "rgba(100,116,139,0.15)" };
                  const textColor = ACTION_COLORS[log.action] ?? "#94a3b8";
                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                          {date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: "var(--text-dimmer)", display: "flex", alignItems: "center", gap: 3 }}>
                          <Clock size={9} />
                          {date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {log.user.name ?? log.user.email}
                        </p>
                        {log.user.name && (
                          <p style={{ margin: 0, fontSize: 11, color: "var(--text-dimmer)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {log.user.email}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <p style={{ margin: 0, fontSize: 12, color: "var(--text-dimmer)", whiteSpace: "nowrap" }}>
                          {log.organizer?.name ?? "—"}
                        </p>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{log.entity}</p>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          padding: "3px 9px", borderRadius: 20,
                          background: meta.color,
                          color: textColor,
                          whiteSpace: "nowrap",
                        }}>
                          {meta.label}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        {(log.before || log.after) ? (
                          <details style={{ cursor: "pointer" }}>
                            <summary style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, listStyle: "none" }}>
                              Ver diff
                            </summary>
                            <div style={{ marginTop: 6, display: "flex", gap: 12 }}>
                              {log.before && (
                                <div>
                                  <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 600, color: "var(--text-darkest)", textTransform: "uppercase" }}>Antes</p>
                                  <pre style={{ margin: 0, fontSize: 10, color: "var(--text-dimmer)", background: "var(--bg-elevated)", borderRadius: 6, padding: "6px 8px", maxWidth: 200, overflow: "auto" }}>
                                    {JSON.stringify(log.before, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.after && (
                                <div>
                                  <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 600, color: "var(--text-darkest)", textTransform: "uppercase" }}>Después</p>
                                  <pre style={{ margin: 0, fontSize: 10, color: "var(--text-dimmer)", background: "var(--bg-elevated)", borderRadius: 6, padding: "6px 8px", maxWidth: 200, overflow: "auto" }}>
                                    {JSON.stringify(log.after, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </details>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--text-darkest)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
