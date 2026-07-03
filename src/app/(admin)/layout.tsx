import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrganizersByUser } from "@/modules/organizers/queries";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { MobileMenuBtn } from "@/components/layout/mobile-menu-btn";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.systemRole !== "SUPER_ADMIN") redirect("/dashboard");

  const memberships = await getOrganizersByUser(session.user.id);

  return (
    <div className="dash-bg" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <AdminSidebar
        userName={session.user.name ?? ""}
        userEmail={session.user.email ?? ""}
        hasDashboard={memberships.length > 0}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div className="dash-mobile-topbar">
          <MobileMenuBtn />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", fontFamily: "var(--font-space), sans-serif" }}>
            Panel Admin
          </span>
        </div>
        <main className="dash-main">
          {children}
        </main>
      </div>
    </div>
  );
}
