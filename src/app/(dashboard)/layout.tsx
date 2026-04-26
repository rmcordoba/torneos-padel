import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrganizersByUser } from "@/modules/organizers/queries";
import { Sidebar } from "@/components/layout/sidebar";
import { PlayerSidebar } from "@/components/layout/player-sidebar";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/toaster";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await getOrganizersByUser(session.user.id);
  const organizer = memberships[0]?.organizer;
  const isOrganizer = memberships.length > 0;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-base)" }}>
      {isOrganizer ? (
        <Sidebar
          organizerName={organizer?.name}
          organizerSlug={organizer?.slug}
          userName={session.user.name ?? ""}
          userEmail={session.user.email ?? ""}
          isSuperAdmin={session.user.systemRole === "SUPER_ADMIN"}
        />
      ) : (
        <PlayerSidebar
          userName={session.user.name ?? ""}
          userEmail={session.user.email ?? ""}
        />
      )}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header />
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
