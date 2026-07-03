import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUsersPage } from "@/modules/admin/queries";
import { toggleUserActive, setUserSystemRole } from "@/modules/admin/actions";
import { Users, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Usuarios" };

function buildUrl(page: number) {
  if (page <= 1) return "/admin/usuarios";
  return `/admin/usuarios?page=${page}`;
}

export default async function AdminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (session?.user?.systemRole !== "SUPER_ADMIN") redirect("/dashboard");

  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);

  const { users, total, pageSize } = await getUsersPage({ page });
  const totalPages = Math.ceil(total / pageSize);
  const currentUserId = session.user.id;

  return (
    <div style={{ maxWidth: 1000, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif", margin: 0 }}>
          Usuarios
        </h1>
        <p style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
          {total} usuario{total !== 1 ? "s" : ""} en el sistema
          {totalPages > 1 && ` · Página ${page} de ${totalPages}`}
        </p>
      </div>

      <div style={{ background: "rgba(12,20,40,0.7)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.04)" }}>
              {["Usuario", "Rol sistema", "Organizadores", "Estado", "Creado", "Acciones"].map((h) => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#334155", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const isSuperAdmin = user.systemRole === "SUPER_ADMIN";
              const orgNames = user.organizerMemberships.map((uo) => uo.organizer.name).join(", ");

              return (
                <tr key={user.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", opacity: user.isActive ? 1 : 0.55 }}>
                  {/* Usuario */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                        background: isSuperAdmin ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isSuperAdmin ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.07)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 800,
                        color: isSuperAdmin ? "#ef4444" : "#94a3b8",
                        fontFamily: "var(--font-space), sans-serif",
                      }}>
                        {(user.name ?? user.email ?? "?").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>
                          {user.name ?? "(sin nombre)"}
                          {isSelf && <span style={{ fontSize: 10, color: "#a3e635", marginLeft: 6, fontWeight: 700 }}>vos</span>}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Rol */}
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      padding: "3px 10px", borderRadius: 20,
                      background: isSuperAdmin ? "rgba(239,68,68,0.12)" : "rgba(100,116,139,0.12)",
                      color: isSuperAdmin ? "#ef4444" : "#94a3b8",
                      border: `1px solid ${isSuperAdmin ? "rgba(239,68,68,0.25)" : "rgba(100,116,139,0.2)"}`,
                      display: "inline-flex", alignItems: "center", gap: 4,
                    }}>
                      {isSuperAdmin && <ShieldAlert size={10} />}
                      {isSuperAdmin ? "Super Admin" : "Player"}
                    </span>
                  </td>

                  {/* Organizadores */}
                  <td style={{ padding: "12px 16px" }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#475569", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {orgNames || "—"}
                    </p>
                  </td>

                  {/* Estado */}
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      padding: "2px 8px", borderRadius: 20,
                      background: user.isActive ? "rgba(163,230,53,0.12)" : "rgba(100,116,139,0.12)",
                      color: user.isActive ? "#a3e635" : "#94a3b8",
                    }}>
                      {user.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  {/* Creado */}
                  <td style={{ padding: "12px 16px" }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>
                      {new Date(user.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                    </p>
                  </td>

                  {/* Acciones */}
                  <td style={{ padding: "12px 16px" }}>
                    {isSelf ? (
                      <span style={{ fontSize: 11, color: "#334155" }}>—</span>
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        <form
                          action={async () => {
                            "use server";
                            await toggleUserActive(user.id);
                          }}
                        >
                          <button
                            type="submit"
                            style={{
                              padding: "5px 10px", borderRadius: 6,
                              border: `1px solid ${user.isActive ? "rgba(248,113,113,0.4)" : "rgba(163,230,53,0.4)"}`,
                              background: "transparent",
                              color: user.isActive ? "#f87171" : "#a3e635",
                              fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                            }}
                          >
                            {user.isActive ? "Desactivar" : "Activar"}
                          </button>
                        </form>

                        <form
                          action={async () => {
                            "use server";
                            await setUserSystemRole(user.id, isSuperAdmin ? "PLAYER" : "SUPER_ADMIN");
                          }}
                        >
                          <button
                            type="submit"
                            style={{
                              padding: "5px 10px", borderRadius: 6,
                              border: "1px solid rgba(239,68,68,0.3)",
                              background: "transparent",
                              color: isSuperAdmin ? "#475569" : "#ef4444",
                              fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                            }}
                          >
                            {isSuperAdmin ? "Quitar admin" : "Hacer admin"}
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {users.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 12 }}>
            <Users size={40} color="rgba(255,255,255,0.1)" />
            <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>Sin usuarios registrados</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
          {page > 1 ? (
            <a
              href={buildUrl(page - 1)}
              style={{
                height: 34, paddingInline: 14, display: "flex", alignItems: "center",
                borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(12,20,40,0.7)",
                fontSize: 12, fontWeight: 600, color: "#e2e8f0",
                textDecoration: "none",
              }}
            >
              ← Anterior
            </a>
          ) : (
            <span
              style={{
                height: 34, paddingInline: 14, display: "flex", alignItems: "center",
                borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.04)",
                fontSize: 12, fontWeight: 600, color: "#334155",
              }}
            >
              ← Anterior
            </span>
          )}

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | "…")[]>((acc, p, idx, arr) => {
              if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} style={{ fontSize: 12, color: "#334155", paddingInline: 4 }}>…</span>
              ) : (
                <a
                  key={p}
                  href={buildUrl(p as number)}
                  style={{
                    width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 8, border: `1px solid ${p === page ? "rgba(163,230,53,0.28)" : "rgba(255,255,255,0.07)"}`,
                    background: p === page ? "rgba(163,230,53,0.12)" : "rgba(12,20,40,0.7)",
                    fontSize: 12, fontWeight: 700,
                    color: p === page ? "#a3e635" : "#e2e8f0",
                    textDecoration: "none",
                  }}
                >
                  {p}
                </a>
              )
            )}

          {page < totalPages ? (
            <a
              href={buildUrl(page + 1)}
              style={{
                height: 34, paddingInline: 14, display: "flex", alignItems: "center",
                borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(12,20,40,0.7)",
                fontSize: 12, fontWeight: 600, color: "#e2e8f0",
                textDecoration: "none",
              }}
            >
              Siguiente →
            </a>
          ) : (
            <span
              style={{
                height: 34, paddingInline: 14, display: "flex", alignItems: "center",
                borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.04)",
                fontSize: 12, fontWeight: 600, color: "#334155",
              }}
            >
              Siguiente →
            </span>
          )}
        </div>
      )}
    </div>
  );
}
