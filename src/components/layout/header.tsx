import { Bell } from "lucide-react";
import { getDashboardStats } from "@/modules/dashboard/queries";
import { auth } from "@/lib/auth";
import { getOrganizersByUser } from "@/modules/organizers/queries";

export async function Header() {
  const session = await auth();
  const memberships = session?.user ? await getOrganizersByUser(session.user.id) : [];
  const organizer = memberships[0]?.organizer;
  const stats = organizer ? await getDashboardStats(organizer.id) : null;
  const pendingCount = stats?.pendingRegistrations ?? 0;

  return (
    <header style={{
      padding: "0 28px",
      height: 56,
      borderBottom: "1px solid var(--border-subtle)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "var(--bg-base)",
      backdropFilter: "blur(8px)",
      position: "sticky",
      top: 0,
      zIndex: 10,
      flexShrink: 0,
    }}>
      {/* Left: organizer breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 13, color: "var(--text-dimmer)" }}>
          {organizer?.name ?? "Dashboard"}
        </span>
      </div>

      {/* Right: search + notifications */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <input
            placeholder="Buscar jugador, torneo..."
            style={{
              padding: "7px 14px 7px 34px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: 8,
              color: "var(--text-muted)",
              fontSize: 12,
              outline: "none",
              width: 220,
              fontFamily: "inherit",
            }}
          />
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--text-darkest)" }}>
            🔍
          </span>
        </div>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button style={{
            width: 36, height: 36, borderRadius: 8,
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            color: "var(--text-faint)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Bell size={15} />
          </button>
          {pendingCount > 0 && (
            <span style={{
              position: "absolute", top: -4, right: -4,
              minWidth: 16, height: 16, padding: "0 4px",
              background: "#fbbf24",
              borderRadius: 20,
              fontSize: 9, fontWeight: 800, color: "#0a0f0a",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "Space Grotesk, sans-serif",
            }}>
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
