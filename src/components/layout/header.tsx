import { getDashboardStats } from "@/modules/dashboard/queries";
import { auth } from "@/lib/auth";
import { getActiveMembership } from "@/lib/active-organizer";
import { NotificationsBtn } from "@/components/layout/notifications-btn";
import { MobileMenuBtn } from "@/components/layout/mobile-menu-btn";
import { DashSearch } from "@/components/layout/dash-search";

export async function Header() {
  const session = await auth();
  const membership = session?.user ? await getActiveMembership(session.user.id) : null;
  const organizer = membership?.organizer;
  const stats = organizer ? await getDashboardStats(organizer.id) : null;
  const pendingCount = stats?.pendingRegistrationsToday ?? 0;

  return (
    <header className="dash-header" style={{
      height: 60,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 10,
      flexShrink: 0,
    }}>
      {/* Left: mobile menu + organizer breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <MobileMenuBtn />
        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: "#a3e635", boxShadow: "0 0 8px rgba(163,230,53,0.6)" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", fontFamily: "var(--font-space), sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {organizer?.name ?? "Dashboard"}
          </span>
        </div>
      </div>

      {/* Right: search + notifications */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        {organizer && <DashSearch />}
        <NotificationsBtn pendingCount={pendingCount} />
      </div>
    </header>
  );
}
