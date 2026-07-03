import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActiveMembership } from "@/lib/active-organizer";
import { getAuditLogs } from "@/modules/audit/actions";
import { AuditoriaClient, type AuditEntry } from "./_components/auditoria-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Auditoría" };

export default async function AuditoriaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await getActiveMembership(session.user.id);
  if (!membership) redirect("/dashboard");

  const organizerId = membership.organizerId;
  const rawLogs = await getAuditLogs(organizerId, 300);

  const entries: AuditEntry[] = rawLogs.map((l) => ({
    id:             l.id,
    createdAt:      l.createdAt.toISOString(),
    userName:       l.user.name ?? l.user.email,
    userEmail:      l.user.email,
    entity:         l.entity,
    entityId:       l.entityId,
    action:         l.action,
    before:         l.before as Record<string, unknown> | null,
    after:          l.after  as Record<string, unknown> | null,
    ipAddress:      l.ipAddress ?? null,
    tournamentName: l.tournament?.name ?? null,
  }));

  return <AuditoriaClient entries={entries} />;
}
