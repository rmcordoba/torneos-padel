import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getGlobalAuditLogs } from "@/modules/admin/queries";
import { AuditoriaAdminClient, type AuditEntry } from "./_components/auditoria-admin-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Auditoría global" };

export default async function AdminAuditoriaPage() {
  const session = await auth();
  if (session?.user?.systemRole !== "SUPER_ADMIN") redirect("/dashboard");

  const rawLogs = await getGlobalAuditLogs(500);

  const entries: AuditEntry[] = rawLogs.map((l) => ({
    id:             l.id,
    createdAt:      l.createdAt.toISOString(),
    userName:       l.user.name ?? l.user.email,
    userEmail:      l.user.email,
    organizerName:  l.organizer?.name ?? null,
    entity:         l.entity,
    entityId:       l.entityId,
    action:         l.action,
    before:         l.before as Record<string, unknown> | null,
    after:          l.after  as Record<string, unknown> | null,
    ipAddress:      l.ipAddress ?? null,
    tournamentName: l.tournament?.name ?? null,
  }));

  return <AuditoriaAdminClient entries={entries} />;
}
