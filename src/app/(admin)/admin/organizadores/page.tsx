import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAllOrganizersAdmin } from "@/modules/admin/queries";
import { toggleOrganizerActive } from "@/modules/admin/actions";
import { Building2, Trophy, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Organizadores" };

export default async function AdminOrganizadoresPage() {
  const session = await auth();
  if (session?.user?.systemRole !== "SUPER_ADMIN") redirect("/dashboard");

  const organizers = await getAllOrganizersAdmin();

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", fontFamily: "Space Grotesk, sans-serif", margin: 0 }}>
          Organizadores
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-dimmer)", marginTop: 4 }}>
          {organizers.length} organizador{organizers.length !== 1 ? "es" : ""} en el sistema
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {organizers.map((org) => (
          <div
            key={org.id}
            style={{
              background: "var(--bg-surface)",
              border: `1px solid ${org.isActive ? "var(--border-default)" : "var(--border-subtle)"}`,
              borderRadius: 12,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              opacity: org.isActive ? 1 : 0.6,
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 42, height: 42, borderRadius: 10, flexShrink: 0,
              background: org.isActive ? "var(--accent-15)" : "var(--bg-elevated)",
              border: `1px solid ${org.isActive ? "var(--accent-30)" : "var(--border-default)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 800,
              color: org.isActive ? "var(--accent)" : "var(--text-faint)",
              fontFamily: "Space Grotesk, sans-serif",
            }}>
              {org.name.slice(0, 2).toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                  {org.name}
                </p>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  padding: "2px 8px", borderRadius: 20,
                  background: org.isActive ? "rgba(163,230,53,0.15)" : "rgba(100,116,139,0.15)",
                  color: org.isActive ? "#a3e635" : "#94a3b8",
                  border: `1px solid ${org.isActive ? "rgba(163,230,53,0.3)" : "rgba(100,116,139,0.3)"}`,
                }}>
                  {org.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-dimmer)" }}>
                  <Trophy size={11} /> {org._count.tournaments} torneos
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-dimmer)" }}>
                  <Users size={11} /> {org._count.members} miembros
                </span>
                <span style={{ fontSize: 12, color: "var(--text-dimmer)" }}>
                  /{org.slug}
                </span>
              </div>
              {org.email && (
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-darkest)" }}>{org.email}</p>
              )}
            </div>

            {/* Actions */}
            <form
              action={async () => {
                "use server";
                await toggleOrganizerActive(org.id);
              }}
            >
              <button
                type="submit"
                style={{
                  padding: "6px 14px",
                  borderRadius: 7,
                  border: `1px solid ${org.isActive ? "rgba(248,113,113,0.4)" : "rgba(163,230,53,0.4)"}`,
                  background: "transparent",
                  color: org.isActive ? "#f87171" : "#a3e635",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {org.isActive ? "Desactivar" : "Activar"}
              </button>
            </form>
          </div>
        ))}
      </div>

      {organizers.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 12 }}>
          <Building2 size={40} color="var(--border-strong)" />
          <p style={{ fontSize: 13, color: "var(--text-dimmer)", margin: 0 }}>Sin organizadores registrados</p>
        </div>
      )}
    </div>
  );
}
