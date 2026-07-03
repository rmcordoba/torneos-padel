import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrganizersByUser } from "@/modules/organizers/queries";
import { getActiveMembership } from "@/lib/active-organizer";
import { getBillingState } from "@/lib/subscription";
import { Sidebar } from "@/components/layout/sidebar";
import { PlayerSidebar } from "@/components/layout/player-sidebar";
import { Header } from "@/components/layout/header";
import { SubscriptionBanner } from "@/components/layout/subscription-banner";
import { Toaster } from "@/components/ui/toaster";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [memberships, activeMembership] = await Promise.all([
    getOrganizersByUser(session.user.id),
    getActiveMembership(session.user.id),
  ]);
  const organizer = activeMembership
    ? memberships.find((m) => m.organizerId === activeMembership.organizerId)?.organizer
    : memberships[0]?.organizer;
  const isOrganizer = memberships.length > 0;
  const billing = organizer ? await getBillingState(organizer.id) : null;

  return (
    <div className="dash-bg" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {isOrganizer ? (
        <Sidebar
          organizerName={organizer?.name}
          organizerSlug={organizer?.slug}
          activeOrganizerId={organizer?.id}
          organizers={memberships.map((m) => ({
            id: m.organizer.id,
            name: m.organizer.name,
            slug: m.organizer.slug,
          }))}
          hasBookings={billing?.hasBookings ?? false}
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
        {billing && <SubscriptionBanner state={billing} />}
        <main className="dash-main">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
