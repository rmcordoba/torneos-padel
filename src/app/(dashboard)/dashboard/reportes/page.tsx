import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrganizersByUser } from "@/modules/organizers/queries";
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

  const memberships = await getOrganizersByUser(session.user.id);
  if (!memberships.length) redirect("/dashboard");

  const organizerId = memberships[0].organizerId;

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
