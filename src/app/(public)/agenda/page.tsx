import { getPublicScheduleForMonth } from "@/modules/public/queries";
import { scopedOrg, getPortalScope } from "@/lib/portal-scope";
import { AgendaClient } from "./_components/agenda-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Agenda — PádelPro" };

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; day?: string }>;
}) {
  const { year: rawYear, month: rawMonth, day: rawDay } = await searchParams;
  const now   = new Date();
  const year  = rawYear  ? parseInt(rawYear)  : now.getFullYear();
  const month = rawMonth ? parseInt(rawMonth) : now.getMonth() + 1;
  const day   = rawDay   ? parseInt(rawDay)   : now.getDate();

  const monthSlots = await getPublicScheduleForMonth(year, month, scopedOrg());

  const slots = monthSlots.map((s) => {
    const side1  = s.match?.teams.find((t) => t.side === 1);
    const side2  = s.match?.teams.find((t) => t.side === 2);
    const names1 = side1?.team.players.map((p) => `${p.playerProfile.firstName[0]}. ${p.playerProfile.lastName}`).join(" / ") ?? "TBD";
    const names2 = side2?.team.players.map((p) => `${p.playerProfile.firstName[0]}. ${p.playerProfile.lastName}`).join(" / ") ?? "TBD";
    const score  = s.match?.sets.map((set) => `${set.games1}-${set.games2}`).join(", ") ?? null;

    return {
      id:             s.id,
      day:            parseInt(s.date.toISOString().slice(8, 10)),
      startTime:      new Date(s.startTime).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      endTime:        s.endTime ? new Date(s.endTime).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : null,
      matchLabel:     s.match ? `${names1} vs ${names2}` : "Partido sin asignar",
      score:          score,
      category:       s.match?.stage.tournamentCategory.category.name ?? "",
      tournamentName: s.match?.stage.tournamentCategory.tournament.name ?? "",
      venueName:      s.venue.name,
      courtName:      s.courtAssignment?.court.name ?? null,
      status:         s.match?.status ?? "SCHEDULED",
    };
  });

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", padding: "32px 24px" }}>
      <AgendaClient
        slots={slots}
        initialYear={year}
        initialMonth={month}
        initialDay={day}
        basePath={getPortalScope().basePath}
      />
    </div>
  );
}

