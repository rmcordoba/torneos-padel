import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAllUsers } from "@/modules/admin/queries";
import { toggleUserActive, setUserSystemRole } from "@/modules/admin/actions";
import { Users, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Usuarios" };

export default async function AdminUsuariosPage() {
  const session = await auth();
  if (session?.user?.systemRole !== "SUPER_ADMIN") redirect("/dashboard");

  const users = await getAllUsers();
  const currentUserId = session.user.id;

  return (
    <div style={{ maxWidth: 1000, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", fontFamily: "Space Grotesk, sans-serif", margin: 0 }}>
          Usuarios
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-dimmer)", marginTop: 4 }}>
          {users.length} usuario{users.length !== 1 ? "s" : ""} en el sistema
        </p>
      </div>

      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}>
              {["Usuario", "Rol sistema", "Organizadores", "Estado", "Creado", "Acciones"].map((h) => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-darkest)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
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
                <tr key={user.id} style={{ borderBottom: "1px solid var(--border-subtle)", opacity: user.isActive ? 1 : 0.55 }}>
                  {/* Usuario */}
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                        background: isSuperAdmin ? "rgba(239,68,68,0.12)" : "var(--bg-elevated)",
                        border: `1px solid ${isSuperAdmin ? "rgba(239,68,68,0.25)" : "var(--border-default)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 800,
                        color: isSuperAdmin ? "#ef4444" : "var(--text-muted)",
                        fontFamily: "Space Grotesk, sans-serif",
                      }}>
                        {(user.name ?? user.email ?? "?").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                          {user.name ?? "(sin nombre)"}
                          {isSelf && <span style={{ fontSize: 10, color: "var(--accent)", marginLeft: 6, fontWeight: 700 }}>vos</span>}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: "var(--text-dimmer)" }}>{user.email}</p>
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
                    <p style={{ margin: 0, fontSize: 12, color: "var(--text-dimmer)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                    <p style={{ margin: 0, fontSize: 12, color: "var(--text-dimmer)" }}>
                      {new Date(user.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                    </p>
                  </td>

                  {/* Acciones */}
                  <td style={{ padding: "12px 16px" }}>
                    {isSelf ? (
                      <span style={{ fontSize: 11, color: "var(--text-darkest)" }}>—</span>
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        {/* Toggle active */}
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

                        {/* Toggle role */}
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
                              color: isSuperAdmin ? "var(--text-dimmer)" : "#ef4444",
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
            <Users size={40} color="var(--border-strong)" />
            <p style={{ fontSize: 13, color: "var(--text-dimmer)", margin: 0 }}>Sin usuarios registrados</p>
          </div>
        )}
      </div>
    </div>
  );
}
