import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrganizersByUser } from "@/modules/organizers/queries";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.systemRole !== "SUPER_ADMIN") redirect("/dashboard");

  const memberships = await getOrganizersByUser(session.user.id);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-base)" }}>
      <AdminSidebar
        userName={session.user.name ?? ""}
        userEmail={session.user.email ?? ""}
        hasDashboard={memberships.length > 0}
      />
      <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        {children}
      </main>
    </div>
  );
}
