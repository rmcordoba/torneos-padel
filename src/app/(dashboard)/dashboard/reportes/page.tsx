import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActiveMembership } from "@/lib/active-organizer";
import {
  getRegistrationReport,
  getMatchReport,
  getChampionsReport,
} from "@/modules/reports/queries";
import { ReportesClient } from "./_components/reportes-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reportes" };

export default async function ReportesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await getActiveMembership(session.user.id);
  if (!membership) redirect("/dashboard");

  const organizerId = membership.organizerId;

  const [registrations, matches, champions] = await Promise.all([
    getRegistrationReport(organizerId),
    getMatchReport(organizerId),
    getChampionsReport(organizerId),
  ]);

  return (
    <ReportesClient
      registrations={registrations}
      matches={matches}
      champions={champions.map((c) => ({
        ...c,
        startDate: c.startDate.toISOString(),
        endDate:   c.endDate.toISOString(),
      }))}
    />
  );
}
