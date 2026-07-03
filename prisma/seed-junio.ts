/**
 * seed-junio.ts
 * Crea 2 torneos de junio 2026 con inscripciones abiertas para categorías femeninas.
 *
 * Torneos:
 *   1. "Copa Femenina Junio 2026" (7–8 jun)
 *      - Femenina 1ra: SINGLE_ELIMINATION, 8 cupos, 4 parejas inscriptas (3 APPROVED, 1 PENDING)
 *
 *   2. "Torneo Apertura Femenino Junio 2026" (21–22 jun)
 *      - Femenina 2da (se crea si no existe): GROUP_PLAYOFF, 8 cupos, 3 parejas (2 APPROVED, 1 PENDING)
 *
 * NO borra datos existentes. Idempotente por nombre de torneo.
 * Ejecutar: npx tsx prisma/seed-junio.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── helpers ──────────────────────────────────────────────────────────────────

async function getOrCreatePlayer(email: string, firstName: string, lastName: string, pw: string) {
  const u = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: pw,
      name: `${firstName} ${lastName}`,
      emailVerified: new Date(),
      playerProfile: { create: { firstName, lastName } },
    },
    include: { playerProfile: true },
  });
  return u.playerProfile!;
}

async function findOrCreateTeam(p1Id: string, p2Id: string) {
  const existing = await prisma.teamPlayer.findMany({
    where: { playerProfileId: p1Id },
    select: { teamId: true },
  });
  const ids = existing.map((e) => e.teamId);
  if (ids.length) {
    const shared = await prisma.teamPlayer.findFirst({
      where: { playerProfileId: p2Id, teamId: { in: ids } },
    });
    if (shared) return prisma.team.findUniqueOrThrow({ where: { id: shared.teamId } });
  }
  return prisma.team.create({
    data: { players: { create: [{ playerProfileId: p1Id }, { playerProfileId: p2Id }] } },
  });
}

async function upsertCat(
  orgId: string,
  name: string,
  gender: "MALE" | "FEMALE" | "MIXED" | "OPEN",
  level?: string,
) {
  return prisma.category.upsert({
    where: { organizerId_name: { organizerId: orgId, name } },
    update: {},
    create: { organizerId: orgId, name, gender, level },
  });
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 seed-junio: creando torneos de junio 2026...");

  // ── Datos base ────────────────────────────────────────────────────────────────
  const org = await prisma.organizer.findUniqueOrThrow({ where: { slug: "club-padel-palermo" } });

  // ── Categorías ────────────────────────────────────────────────────────────────
  const catF1 = await upsertCat(org.id, "Femenina 1ra", "FEMALE", "1ra");
  const catF2 = await upsertCat(org.id, "Femenina 2da", "FEMALE", "2da");

  // ── Jugadoras ─────────────────────────────────────────────────────────────────
  const pw = await bcrypt.hash("jugador1234", 10);

  // Jugadoras ya existentes del seed base
  const [f0, f1, f2, f3, f4, f5, f6, f7] = await Promise.all([
    getOrCreatePlayer("valentina.ruiz@padel.local",     "Valentina", "Ruiz",       pw),
    getOrCreatePlayer("camila.fernandez@padel.local",   "Camila",    "Fernández",  pw),
    getOrCreatePlayer("lucia.martinez@padel.local",     "Lucía",     "Martínez",   pw),
    getOrCreatePlayer("sofia.gonzalez@padel.local",     "Sofía",     "González",   pw),
    getOrCreatePlayer("maria.diaz@padel.local",         "María",     "Díaz",       pw),
    getOrCreatePlayer("florencia.perez@padel.local",    "Florencia", "Pérez",      pw),
    getOrCreatePlayer("jimena.acosta@padel.local",      "Jimena",    "Acosta",     pw),
    getOrCreatePlayer("daniela.romero@padel.local",     "Daniela",   "Romero",     pw),
  ]);

  // Jugadoras nuevas para el torneo 2 (Femenina 2da)
  const [f8, f9, f10, f11, f12, f13] = await Promise.all([
    getOrCreatePlayer("paula.suarez@padel.local",       "Paula",     "Suárez",     pw),
    getOrCreatePlayer("ana.delgado@padel.local",        "Ana",       "Delgado",    pw),
    getOrCreatePlayer("natalia.reyes@padel.local",      "Natalia",   "Reyes",      pw),
    getOrCreatePlayer("carolina.navarro@padel.local",   "Carolina",  "Navarro",    pw),
    getOrCreatePlayer("andrea.luna@padel.local",        "Andrea",    "Luna",       pw),
    getOrCreatePlayer("mariana.campos@padel.local",     "Mariana",   "Campos",     pw),
  ]);

  // ── Equipos ───────────────────────────────────────────────────────────────────
  // Torneo 1 — Femenina 1ra (4 parejas)
  const [fT0, fT1, fT2, fT3] = await Promise.all([
    findOrCreateTeam(f0.id, f1.id),  // Ruiz / Fernández
    findOrCreateTeam(f2.id, f3.id),  // Martínez / González
    findOrCreateTeam(f4.id, f5.id),  // Díaz / Pérez
    findOrCreateTeam(f6.id, f7.id),  // Acosta / Romero
  ]);

  // Torneo 2 — Femenina 2da (3 parejas)
  const [fT4, fT5, fT6] = await Promise.all([
    findOrCreateTeam(f8.id,  f9.id),   // Suárez / Delgado
    findOrCreateTeam(f10.id, f11.id),  // Reyes / Navarro
    findOrCreateTeam(f12.id, f13.id),  // Luna / Campos
  ]);

  // ══════════════════════════════════════════════════════════════════════════════
  // TORNEO 1: Copa Femenina Junio 2026  (7–8 jun, REGISTRATION_OPEN)
  // ══════════════════════════════════════════════════════════════════════════════

  const ya1 = await prisma.tournament.findFirst({
    where: { organizerId: org.id, name: "Copa Femenina Junio 2026" },
  });

  if (ya1) {
    console.log("ℹ  Copa Femenina Junio 2026 ya existe — omitiendo.");
  } else {
    const t1 = await prisma.tournament.create({
      data: {
        organizerId: org.id,
        name: "Copa Femenina Junio 2026",
        description: "Primera edición de la copa exclusiva para damas. Formato eliminación directa con 8 cupos disponibles.",
        status: "REGISTRATION_OPEN",
        startDate: new Date("2026-06-07"),
        endDate: new Date("2026-06-08"),
        registrationDeadline: new Date("2026-06-04"),
        isPublic: true,
        publishedAt: new Date("2026-05-20"),
      },
    });

    const tc1 = await prisma.tournamentCategory.create({
      data: {
        tournamentId: t1.id,
        categoryId: catF1.id,
        format: "SINGLE_ELIMINATION",
        status: "REGISTRATION_OPEN",
        maxTeams: 8,
        minTeams: 4,
        setsPerMatch: 3,
        pricePerTeam: 3500,
      },
    });

    // 3 APPROVED + 1 PENDING
    await prisma.registration.createMany({
      data: [
        { tournamentCategoryId: tc1.id, teamId: fT0.id, status: "APPROVED" },
        { tournamentCategoryId: tc1.id, teamId: fT1.id, status: "APPROVED" },
        { tournamentCategoryId: tc1.id, teamId: fT2.id, status: "APPROVED" },
        { tournamentCategoryId: tc1.id, teamId: fT3.id, status: "PENDING"  },
      ],
    });

    console.log(`  Torneo 1 creado: ${t1.id} — Copa Femenina Junio 2026`);
    console.log("  Femenina 1ra: 3 APPROVED + 1 PENDING (8 cupos disponibles)");
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // TORNEO 2: Torneo Apertura Femenino Junio 2026  (21–22 jun, REGISTRATION_OPEN)
  // ══════════════════════════════════════════════════════════════════════════════

  const ya2 = await prisma.tournament.findFirst({
    where: { organizerId: org.id, name: "Torneo Apertura Femenino Junio 2026" },
  });

  if (ya2) {
    console.log("ℹ  Torneo Apertura Femenino Junio 2026 ya existe — omitiendo.");
  } else {
    const t2 = await prisma.tournament.create({
      data: {
        organizerId: org.id,
        name: "Torneo Apertura Femenino Junio 2026",
        description: "Torneo de mitad de año para categoría Femenina 2da. Formato grupos con playoff final.",
        status: "REGISTRATION_OPEN",
        startDate: new Date("2026-06-21"),
        endDate: new Date("2026-06-22"),
        registrationDeadline: new Date("2026-06-18"),
        isPublic: true,
        publishedAt: new Date("2026-06-01"),
      },
    });

    const tc2 = await prisma.tournamentCategory.create({
      data: {
        tournamentId: t2.id,
        categoryId: catF2.id,
        format: "GROUP_PLAYOFF",
        status: "REGISTRATION_OPEN",
        maxTeams: 8,
        minTeams: 4,
        setsPerMatch: 3,
        pricePerTeam: 2800,
        formatConfig: { groupSize: 4, teamsAdvancePerGroup: 2 },
      },
    });

    // 2 APPROVED + 1 PENDING
    await prisma.registration.createMany({
      data: [
        { tournamentCategoryId: tc2.id, teamId: fT4.id, status: "APPROVED" },
        { tournamentCategoryId: tc2.id, teamId: fT5.id, status: "APPROVED" },
        { tournamentCategoryId: tc2.id, teamId: fT6.id, status: "PENDING"  },
      ],
    });

    console.log(`  Torneo 2 creado: ${t2.id} — Torneo Apertura Femenino Junio 2026`);
    console.log("  Femenina 2da: 2 APPROVED + 1 PENDING (8 cupos disponibles)");
  }

  console.log("✅ seed-junio completado.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
