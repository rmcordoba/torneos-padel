import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAllOrganizersAdmin } from "@/modules/admin/queries";
import { OrganizadoresManager } from "./_components/organizadores-manager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Organizadores" };

export default async function AdminOrganizadoresPage() {
  const session = await auth();
  if (session?.user?.systemRole !== "SUPER_ADMIN") redirect("/dashboard");

  const organizers = await getAllOrganizersAdmin();

  return (
    <div style={{ maxWidth: 1000, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", fontFamily: "var(--font-space), sans-serif", margin: 0 }}>
          Organizadores
        </h1>
        <p style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
          Gestión de organizadores del sistema
        </p>
      </div>

      <OrganizadoresManager organizers={organizers} />
    </div>
  );
}
