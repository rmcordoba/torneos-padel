/**
 * Backfill schedule slots for all matches that don't have one.
 * Safe to run multiple times (idempotent — skips matches that already have a slot).
 *
 * Usage:  npx ts-node --project tsconfig.json prisma/backfill-slots.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Backfilling schedule slots for unslotted matches...\n");

  // ── 1. Find all organizers ──────────────────────────────────────────────────
  const organizers = await prisma.organizer.findMany();

  for (const org of organizers) {
    console.log(`▸ Organizer: ${org.name}`);

    // Use the first active venue + first court as the fallback assignment
    const venue = await prisma.venue.findFirst({
      where: { organizerId: org.id, isActive: true },
      include: { courts: { where: { isActive: true }, orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    });

    if (!venue || !venue.courts.length) {
      console.log("  ⚠  No venue/courts found — skipping\n");
      continue;
    }

    // Cycle through courts to distribute load
    const courts = venue.courts;
    let courtIdx = 0;

    // ── 2. Find all tournaments for this organizer ──────────────────────────────
    const tournaments = await prisma.tournament.findMany({
      where: { organizerId: org.id },
      orderBy: { startDate: "asc" },
      include: {
        categories: {
          include: {
            stages: {
              orderBy: { order: "asc" },
              include: {
                matches: {
                  where: { scheduleSlot: null }, // only unslotted
                  orderBy: { createdAt: "asc" },
                },
              },
            },
          },
        },
      },
    });

    for (const tournament of tournaments) {
      // Collect all unslotted matches across all stages/categories
      const unslotted = tournament.categories.flatMap((tc) =>
        tc.stages.flatMap((s) => s.matches.map((m) => ({ match: m, stageOrder: s.order })))
      );

      if (!unslotted.length) {
        console.log(`  ✓ ${tournament.name}: no unslotted matches`);
        continue;
      }

      // Spread matches across the tournament day range
      const start = new Date(tournament.startDate);
      const end   = new Date(tournament.endDate);
      const totalDays = Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
      );

      // Assign one day per "stage order" block, then wrap around
      let slotCount = 0;
      let dayOffset = 0;
      let hour      = 9; // 09:00

      for (const { match } of unslotted) {
        const matchDate = new Date(start);
        matchDate.setDate(start.getDate() + (dayOffset % totalDays));
        matchDate.setHours(0, 0, 0, 0);

        const startTime = new Date(matchDate);
        startTime.setHours(hour, 0, 0, 0);

        const endTime = new Date(matchDate);
        endTime.setHours(hour + 1, 30, 0, 0);

        const court = courts[courtIdx % courts.length];

        await prisma.scheduleSlot.create({
          data: {
            tournamentId: tournament.id,
            venueId:      venue.id,
            matchId:      match.id,
            date:         matchDate,
            startTime,
            endTime,
            courtAssignment: { create: { courtId: court.id } },
          },
        });

        slotCount++;
        courtIdx++;

        // Advance time: 2h per match; after 18:30 move to next day
        hour += 2;
        if (hour > 18) {
          hour = 9;
          dayOffset++;
        }
      }

      console.log(`  ✓ ${tournament.name}: ${slotCount} slot(s) created`);
    }

    console.log();
  }

  console.log("✅ Backfill complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
