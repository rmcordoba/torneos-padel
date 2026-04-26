import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrganizersByUser } from "@/modules/organizers/queries";
import {
  getScheduleByOrganizerMonth,
  getUnscheduledMatches,
  getVenuesWithCourts,
} from "@/modules/scheduling/queries";
import { CalendarioClient } from "./_components/calendario-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Calendario" };

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; day?: string }>;
}) {
  const { year: rawYear, month: rawMonth, day: rawDay } = await searchParams;
  const now   = new Date();
  const year  = rawYear  ? parseInt(rawYear)  : now.getFullYear();
  const month = rawMonth ? parseInt(rawMonth) : now.getMonth() + 1;
  const day   = rawDay   ? parseInt(rawDay)   : now.getDate();

  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await getOrganizersByUser(session.user.id);
  if (!memberships.length) redirect("/dashboard");

  const organizerId = memberships[0].organizerId;

  const [monthSlots, unscheduled, venues] = await Promise.all([
    getScheduleByOrganizerMonth(organizerId, year, month),
    getUnscheduledMatches(organizerId),
    getVenuesWithCourts(organizerId),
  ]);

  const calSlots = monthSlots.map((s) => {
    const side1 = s.match?.teams.find((t) => t.side === 1);
    const side2 = s.match?.teams.find((t) => t.side === 2);
    const n1 = side1?.team.players.map((p) => p.playerProfile.lastName).join("/") ?? "TBD";
    const n2 = side2?.team.players.map((p) => p.playerProfile.lastName).join("/") ?? "TBD";
    return {
      id: s.id,
      day: parseInt(s.date.toISOString().slice(8, 10)),
      startTime: new Date(s.startTime).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      endTime: s.endTime
        ? new Date(s.endTime).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
        : null,
      matchLabel: `${n1} vs ${n2}`,
      category: s.match?.stage.tournamentCategory.category.name ?? "",
      tournamentName: s.match?.stage.tournamentCategory.tournament.name ?? "",
      venueName: s.venue.name,
      courtName: s.courtAssignment?.court.name ?? null,
      status: s.match?.status ?? "SCHEDULED",
    };
  });

  return (
    <CalendarioClient
      slots={calSlots}
      unscheduled={unscheduled}
      venues={venues}
      initialYear={year}
      initialMonth={month}
      initialDay={day}
    />
  );
}
