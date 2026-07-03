/**
 * seed-abril.ts
 * Crea torneos de abril 2026 (todos COMPLETADOS) con distintos formatos:
 *   - GROUP_PLAYOFF   (Copa Apertura Abril — Masc 1ra)
 *   - ROUND_ROBIN     (Liga Femenina Abril — Fem 1ra)
 *   - AMERICANO       (Americano Mixto Abril — Mixta)
 *   - MEXICANO        (Mexicano 2da Abril — Masc 2da)
 *   - DOUBLE_ELIM     (Doble Eliminación Abril — Masc 1ra)
 *
 * NO borra datos existentes. Idempotente por nombre de torneo.
 * Ejecutar: npx tsx prisma/seed-abril.ts
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
      email, password: pw, name: `${firstName} ${lastName}`,
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

async function reg(tcId: string, teamId: string) {
  return prisma.registration.create({
    data: { tournamentCategoryId: tcId, teamId, status: "APPROVED" },
  });
}

// Partido completado con sets y resultado
async function cM(
  stageId: string,
  nodeId: string | null,
  groupId: string | null,
  t1Id: string,
  t2Id: string,
  sets: [number, number][],
  winnerId: string,
  adminId: string,
) {
  const match = await prisma.match.create({
    data: {
      stageId,
      ...(nodeId ? { bracketNodeId: nodeId } : {}),
      ...(groupId ? { groupId } : {}),
      status: "COMPLETED",
      teams: { create: [{ teamId: t1Id, side: 1 }, { teamId: t2Id, side: 2 }] },
      sets: { create: sets.map(([g1, g2], i) => ({ setNumber: i + 1, games1: g1, games2: g2 })) },
      result: { create: { winnerId, recordedById: adminId } },
    },
  });
  if (nodeId) {
    await prisma.bracketNode.update({ where: { id: nodeId }, data: { teamId: winnerId } });
  }
  return match;
}

async function gs(
  groupId: string, teamId: string, pos: number,
  mp: number, mw: number, ml: number,
  sw: number, sl: number, gw: number, gl: number, pts: number,
) {
  return prisma.groupStanding.create({
    data: { groupId, teamId, position: pos, matchesPlayed: mp, matchesWon: mw, matchesLost: ml,
            setsWon: sw, setsLost: sl, gamesWon: gw, gamesLost: gl, points: pts },
  });
}

// SE nodes helpers
async function se8nodes(stageId: string) {
  const f   = await prisma.bracketNode.create({ data: { stageId, round: 1, position: 1 } });
  const sf1 = await prisma.bracketNode.create({ data: { stageId, round: 2, position: 1, parentNodeId: f.id } });
  const sf2 = await prisma.bracketNode.create({ data: { stageId, round: 2, position: 2, parentNodeId: f.id } });
  const qf1 = await prisma.bracketNode.create({ data: { stageId, round: 4, position: 1, parentNodeId: sf1.id } });
  const qf2 = await prisma.bracketNode.create({ data: { stageId, round: 4, position: 2, parentNodeId: sf1.id } });
  const qf3 = await prisma.bracketNode.create({ data: { stageId, round: 4, position: 3, parentNodeId: sf2.id } });
  const qf4 = await prisma.bracketNode.create({ data: { stageId, round: 4, position: 4, parentNodeId: sf2.id } });
  return { f, sf1, sf2, qf1, qf2, qf3, qf4 };
}

async function se4nodes(stageId: string) {
  const f   = await prisma.bracketNode.create({ data: { stageId, round: 1, position: 1 } });
  const sf1 = await prisma.bracketNode.create({ data: { stageId, round: 2, position: 1, parentNodeId: f.id } });
  const sf2 = await prisma.bracketNode.create({ data: { stageId, round: 2, position: 2, parentNodeId: f.id } });
  return { f, sf1, sf2 };
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 seed-abril: verificando...");

  const org = await prisma.organizer.findUniqueOrThrow({ where: { slug: "club-padel-palermo" } });
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@padel.local" } });
  const venue = await prisma.venue.findFirstOrThrow({ where: { organizerId: org.id } });

  const catM1  = await prisma.category.findUniqueOrThrow({ where: { organizerId_name: { organizerId: org.id, name: "Masculina 1ra" } } });
  const catM2  = await prisma.category.findUniqueOrThrow({ where: { organizerId_name: { organizerId: org.id, name: "Masculina 2da" } } });
  const catF1  = await prisma.category.findUniqueOrThrow({ where: { organizerId_name: { organizerId: org.id, name: "Femenina 1ra"  } } });
  const catMix = await prisma.category.findUniqueOrThrow({ where: { organizerId_name: { organizerId: org.id, name: "Mixta"         } } });

  // Idempotencia
  const already = await prisma.tournament.findFirst({
    where: { organizerId: org.id, name: "Copa Apertura Abril 2026" },
  });
  if (already) {
    console.log("ℹ  seed-abril ya aplicado — omitiendo.");
    return;
  }

  const pw = await bcrypt.hash("jugador1234", 10);

  // ── Jugadores base (seed.ts) ─────────────────────────────────────────────────
  const [p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15] = await Promise.all([
    getOrCreatePlayer("carlos.torres@padel.local",   "Carlos",    "Torres",   pw),
    getOrCreatePlayer("diego.sanchez@padel.local",   "Diego",     "Sánchez",  pw),
    getOrCreatePlayer("martin.garcia@padel.local",   "Martín",    "García",   pw),
    getOrCreatePlayer("pablo.lopez@padel.local",     "Pablo",     "López",    pw),
    getOrCreatePlayer("rodrigo.herrera@padel.local", "Rodrigo",   "Herrera",  pw),
    getOrCreatePlayer("facundo.morales@padel.local", "Facundo",   "Morales",  pw),
    getOrCreatePlayer("nicolas.peralta@padel.local", "Nicolás",   "Peralta",  pw),
    getOrCreatePlayer("sebastian.rios@padel.local",  "Sebastián", "Ríos",     pw),
    getOrCreatePlayer("ezequiel.vega@padel.local",   "Ezequiel",  "Vega",     pw),
    getOrCreatePlayer("lucas.mendez@padel.local",    "Lucas",     "Méndez",   pw),
    getOrCreatePlayer("agustin.blanco@padel.local",  "Agustín",   "Blanco",   pw),
    getOrCreatePlayer("mateo.costa@padel.local",     "Mateo",     "Costa",    pw),
    getOrCreatePlayer("federico.ramos@padel.local",  "Federico",  "Ramos",    pw),
    getOrCreatePlayer("leandro.cruz@padel.local",    "Leandro",   "Cruz",     pw),
    getOrCreatePlayer("tomas.ortega@padel.local",    "Tomás",     "Ortega",   pw),
    getOrCreatePlayer("ignacio.flores@padel.local",  "Ignacio",   "Flores",   pw),
  ]);

  const [f0, f1, f2, f3, f4, f5, f6, f7] = await Promise.all([
    getOrCreatePlayer("valentina.ruiz@padel.local",    "Valentina", "Ruiz",      pw),
    getOrCreatePlayer("camila.fernandez@padel.local",  "Camila",    "Fernández", pw),
    getOrCreatePlayer("lucia.martinez@padel.local",    "Lucía",     "Martínez",  pw),
    getOrCreatePlayer("sofia.gonzalez@padel.local",    "Sofía",     "González",  pw),
    getOrCreatePlayer("maria.diaz@padel.local",        "María",     "Díaz",      pw),
    getOrCreatePlayer("florencia.perez@padel.local",   "Florencia", "Pérez",     pw),
    getOrCreatePlayer("jimena.acosta@padel.local",     "Jimena",    "Acosta",    pw),
    getOrCreatePlayer("daniela.romero@padel.local",    "Daniela",   "Romero",    pw),
  ]);

  // ── Nuevos jugadores exclusivos de este seed ──────────────────────────────────
  const [x0, x1, x2, x3, x4, x5, x6, x7] = await Promise.all([
    getOrCreatePlayer("ivan.rios@padel.local",       "Iván",      "Ríos",      pw),
    getOrCreatePlayer("brian.soto@padel.local",      "Brian",     "Soto",      pw),
    getOrCreatePlayer("maximiliano.diaz@padel.local","Maximiliano","Díaz",      pw),
    getOrCreatePlayer("nicolas.gimenez@padel.local", "Nicolás",   "Giménez",   pw),
    getOrCreatePlayer("paula.santos@padel.local",    "Paula",     "Santos",    pw),
    getOrCreatePlayer("roxana.gallo@padel.local",    "Roxana",    "Gallo",     pw),
    getOrCreatePlayer("sandra.rios@padel.local",     "Sandra",    "Ríos",      pw),
    getOrCreatePlayer("mariela.acuña@padel.local",   "Mariela",   "Acuña",     pw),
  ]);

  // ── Equipos ───────────────────────────────────────────────────────────────────
  // Masculinos (8 equipos para M1ra y Doble Eliminación)
  const [mT0,mT1,mT2,mT3,mT4,mT5,mT6,mT7] = await Promise.all([
    findOrCreateTeam(p0.id,  p1.id),   // Torres / Sánchez
    findOrCreateTeam(p2.id,  p3.id),   // García / López
    findOrCreateTeam(p4.id,  p5.id),   // Herrera / Morales
    findOrCreateTeam(p6.id,  p7.id),   // Peralta / Ríos
    findOrCreateTeam(p8.id,  p9.id),   // Vega / Méndez
    findOrCreateTeam(p10.id, p11.id),  // Blanco / Costa
    findOrCreateTeam(p12.id, p13.id),  // Ramos / Cruz
    findOrCreateTeam(p14.id, p15.id),  // Ortega / Flores
  ]);

  // Femeninos (4 equipos para Round Robin)
  const [fT0,fT1,fT2,fT3] = await Promise.all([
    findOrCreateTeam(f0.id, f1.id),   // Ruiz / Fernández
    findOrCreateTeam(f2.id, f3.id),   // Martínez / González
    findOrCreateTeam(f4.id, f5.id),   // Díaz / Pérez
    findOrCreateTeam(f6.id, f7.id),   // Acosta / Romero
  ]);

  // Mixtos (6 equipos para Americano)
  const [mxT0,mxT1,mxT2,mxT3,mxT4,mxT5] = await Promise.all([
    findOrCreateTeam(p0.id,  f0.id),  // Torres / Ruiz
    findOrCreateTeam(p2.id,  f1.id),  // García / Fernández
    findOrCreateTeam(p4.id,  f2.id),  // Herrera / Martínez
    findOrCreateTeam(p6.id,  f3.id),  // Peralta / González
    findOrCreateTeam(x0.id,  x4.id),  // Iván Ríos / Paula Santos
    findOrCreateTeam(x1.id,  x5.id),  // Brian Soto / Roxana Gallo
  ]);

  // Masculinos 2da (6 equipos para Mexicano: mezcla de conocidos + nuevos)
  const [m2T0,m2T1,m2T2,m2T3,m2T4,m2T5] = await Promise.all([
    findOrCreateTeam(p8.id,  p9.id),   // Vega / Méndez
    findOrCreateTeam(p10.id, p11.id),  // Blanco / Costa
    findOrCreateTeam(p12.id, p13.id),  // Ramos / Cruz
    findOrCreateTeam(p14.id, p15.id),  // Ortega / Flores
    findOrCreateTeam(x0.id,  x1.id),   // Iván Ríos / Brian Soto
    findOrCreateTeam(x2.id,  x3.id),   // Maximiliano Díaz / Nicolás Giménez
  ]);

  // ══════════════════════════════════════════════════════════════════════════════
  // A1: Copa Apertura Abril 2026  (COMPLETED — GROUP_PLAYOFF — Masculina 1ra)
  // 2 grupos de 4 → SF cruzadas → Final
  // ══════════════════════════════════════════════════════════════════════════════

  const tA1 = await prisma.tournament.create({
    data: {
      organizerId: org.id,
      name: "Copa Apertura Abril 2026",
      description: "Torneo de apertura del mes de abril con formato por grupos y playoffs finales.",
      status: "COMPLETED",
      startDate: new Date("2026-04-05"),
      endDate:   new Date("2026-04-06"),
      isPublic:  true,
      publishedAt: new Date("2026-03-20"),
    },
  });

  const tA1m1 = await prisma.tournamentCategory.create({
    data: {
      tournamentId: tA1.id, categoryId: catM1.id,
      format: "GROUP_PLAYOFF", status: "COMPLETED",
      maxTeams: 8, minTeams: 4, setsPerMatch: 3,
      formatConfig: { groupSize: 4, teamsAdvancePerGroup: 2 },
    },
  });

  for (const t of [mT0,mT1,mT2,mT3,mT4,mT5,mT6,mT7]) await reg(tA1m1.id, t.id);

  // Stage 1: Grupos
  const stA1g = await prisma.stage.create({
    data: { tournamentCategoryId: tA1m1.id, name: "Fase de Grupos", type: "GROUPS", order: 1, isCompleted: true },
  });

  // Grupo A: mT0(1°), mT2(2°), mT4(3°), mT6(4°)
  const gA = await prisma.group.create({ data: { stageId: stA1g.id, name: "Grupo A", order: 1 } });
  await cM(stA1g.id, null, gA.id, mT0.id, mT2.id, [[6,3],[6,4]],       mT0.id, admin.id);
  await cM(stA1g.id, null, gA.id, mT0.id, mT4.id, [[6,2],[6,3]],       mT0.id, admin.id);
  await cM(stA1g.id, null, gA.id, mT0.id, mT6.id, [[6,1],[6,2]],       mT0.id, admin.id);
  await cM(stA1g.id, null, gA.id, mT2.id, mT4.id, [[6,4],[6,3]],       mT2.id, admin.id);
  await cM(stA1g.id, null, gA.id, mT2.id, mT6.id, [[6,3],[6,4]],       mT2.id, admin.id);
  await cM(stA1g.id, null, gA.id, mT4.id, mT6.id, [[6,4],[4,6],[7,5]], mT4.id, admin.id);
  // Standings A:
  await gs(gA.id, mT0.id, 1, 3,3,0, 6,0, 36,16, 9);
  await gs(gA.id, mT2.id, 2, 3,2,1, 4,2, 30,23, 6);
  await gs(gA.id, mT4.id, 3, 3,1,2, 3,3, 26,32, 3);
  await gs(gA.id, mT6.id, 4, 3,0,3, 1,5, 21,42, 0);

  // Grupo B: mT1(1°), mT3(2°), mT5(3°), mT7(4°)
  const gB = await prisma.group.create({ data: { stageId: stA1g.id, name: "Grupo B", order: 2 } });
  await cM(stA1g.id, null, gB.id, mT1.id, mT3.id, [[6,4],[7,5]],       mT1.id, admin.id);
  await cM(stA1g.id, null, gB.id, mT1.id, mT5.id, [[6,3],[6,2]],       mT1.id, admin.id);
  await cM(stA1g.id, null, gB.id, mT1.id, mT7.id, [[6,2],[6,1]],       mT1.id, admin.id);
  await cM(stA1g.id, null, gB.id, mT3.id, mT5.id, [[6,3],[6,4]],       mT3.id, admin.id);
  await cM(stA1g.id, null, gB.id, mT3.id, mT7.id, [[6,4],[6,2]],       mT3.id, admin.id);
  await cM(stA1g.id, null, gB.id, mT5.id, mT7.id, [[4,6],[6,4],[6,3]], mT5.id, admin.id);
  // Standings B:
  await gs(gB.id, mT1.id, 1, 3,3,0, 6,0, 36,16, 9);
  await gs(gB.id, mT3.id, 2, 3,2,1, 4,2, 31,24, 6);
  await gs(gB.id, mT5.id, 3, 3,1,2, 3,3, 27,30, 3);
  await gs(gB.id, mT7.id, 4, 3,0,3, 1,6, 19,43, 0);

  // Stage 2: Playoffs (SF cruzadas: A1 vs B2, B1 vs A2)
  const stA1p = await prisma.stage.create({
    data: { tournamentCategoryId: tA1m1.id, name: "Playoffs", type: "SINGLE_ELIMINATION", order: 2, isCompleted: true },
  });
  const { f: pF, sf1: pSF1, sf2: pSF2 } = await se4nodes(stA1p.id);

  // SF1: A1(mT0) vs B2(mT3) → mT0 wins
  await cM(stA1p.id, pSF1.id, null, mT0.id, mT3.id, [[6,4],[7,5]], mT0.id, admin.id);
  // SF2: B1(mT1) vs A2(mT2) → mT1 wins
  await cM(stA1p.id, pSF2.id, null, mT1.id, mT2.id, [[6,3],[6,4]], mT1.id, admin.id);
  // Final: mT0 vs mT1 → mT0 wins
  await cM(stA1p.id, pF.id, null, mT0.id, mT1.id, [[6,4],[4,6],[7,5]], mT0.id, admin.id);

  console.log("✓ A1 — Copa Apertura Abril 2026 (COMPLETADO, GROUP_PLAYOFF, Masc 1ra)");

  // ══════════════════════════════════════════════════════════════════════════════
  // A2: Liga Femenina Abril 2026  (COMPLETED — ROUND_ROBIN — Femenina 1ra)
  // 4 equipos, todos contra todos (6 partidos), standings finales
  // ══════════════════════════════════════════════════════════════════════════════

  const tA2 = await prisma.tournament.create({
    data: {
      organizerId: org.id,
      name: "Liga Femenina Abril 2026",
      description: "Liga de round robin femenina — todos los equipos se enfrentan entre sí.",
      status: "COMPLETED",
      startDate: new Date("2026-04-12"),
      endDate:   new Date("2026-04-12"),
      isPublic:  true,
      publishedAt: new Date("2026-03-25"),
    },
  });

  const tA2f1 = await prisma.tournamentCategory.create({
    data: {
      tournamentId: tA2.id, categoryId: catF1.id,
      format: "ROUND_ROBIN", status: "COMPLETED",
      maxTeams: 4, minTeams: 4, setsPerMatch: 3,
    },
  });

  for (const t of [fT0,fT1,fT2,fT3]) await reg(tA2f1.id, t.id);

  const stA2 = await prisma.stage.create({
    data: { tournamentCategoryId: tA2f1.id, name: "Round Robin", type: "GROUPS", order: 1, isCompleted: true },
  });
  const grpA2 = await prisma.group.create({ data: { stageId: stA2.id, name: "Todos contra todos", order: 1 } });

  // fT0 gana todo (3W), fT1 gana 2 (2W), fT2 gana 1 (1W), fT3 no gana (0W)
  await cM(stA2.id, null, grpA2.id, fT0.id, fT1.id, [[6,4],[6,3]],       fT0.id, admin.id);
  await cM(stA2.id, null, grpA2.id, fT0.id, fT2.id, [[6,2],[6,4]],       fT0.id, admin.id);
  await cM(stA2.id, null, grpA2.id, fT0.id, fT3.id, [[6,1],[6,2]],       fT0.id, admin.id);
  await cM(stA2.id, null, grpA2.id, fT1.id, fT2.id, [[6,3],[6,4]],       fT1.id, admin.id);
  await cM(stA2.id, null, grpA2.id, fT1.id, fT3.id, [[6,2],[6,3]],       fT1.id, admin.id);
  await cM(stA2.id, null, grpA2.id, fT2.id, fT3.id, [[6,4],[4,6],[7,5]], fT2.id, admin.id);

  await gs(grpA2.id, fT0.id, 1, 3,3,0, 6,0, 36,13, 9);
  await gs(grpA2.id, fT1.id, 2, 3,2,1, 4,2, 29,24, 6);
  await gs(grpA2.id, fT2.id, 3, 3,1,2, 3,3, 26,35, 3);
  await gs(grpA2.id, fT3.id, 4, 3,0,3, 1,6, 22,41, 0);

  console.log("✓ A2 — Liga Femenina Abril 2026 (COMPLETADO, ROUND_ROBIN, Fem 1ra)");

  // ══════════════════════════════════════════════════════════════════════════════
  // A3: Americano Mixto Abril 2026  (COMPLETED — AMERICANO — Mixta)
  // 6 equipos, todos contra todos (15 partidos), puntos = juegos ganados
  // ══════════════════════════════════════════════════════════════════════════════

  const tA3 = await prisma.tournament.create({
    data: {
      organizerId: org.id,
      name: "Americano Mixto Abril 2026",
      description: "Formato americano mixto — la pareja que más juegos acumule se lleva el campeonato.",
      status: "COMPLETED",
      startDate: new Date("2026-04-19"),
      endDate:   new Date("2026-04-19"),
      isPublic:  true,
      publishedAt: new Date("2026-04-01"),
    },
  });

  const tA3mix = await prisma.tournamentCategory.create({
    data: {
      tournamentId: tA3.id, categoryId: catMix.id,
      format: "AMERICANO", status: "COMPLETED",
      maxTeams: 6, minTeams: 4, setsPerMatch: 1, gamesPerSet: 9,
    },
  });

  for (const t of [mxT0,mxT1,mxT2,mxT3,mxT4,mxT5]) await reg(tA3mix.id, t.id);

  const stA3 = await prisma.stage.create({
    data: { tournamentCategoryId: tA3mix.id, name: "Americano", type: "GROUPS", order: 1, isCompleted: true },
  });
  const grpA3 = await prisma.group.create({ data: { stageId: stA3.id, name: "Todos contra todos", order: 1 } });

  // 15 partidos (6 equipos C(6,2) = 15) — todos completados
  // sets = [g1, g2], gamesPerSet=9
  await cM(stA3.id, null, grpA3.id, mxT0.id, mxT1.id, [[9,5]], mxT0.id, admin.id);
  await cM(stA3.id, null, grpA3.id, mxT0.id, mxT2.id, [[9,6]], mxT0.id, admin.id);
  await cM(stA3.id, null, grpA3.id, mxT0.id, mxT3.id, [[9,4]], mxT0.id, admin.id);
  await cM(stA3.id, null, grpA3.id, mxT0.id, mxT4.id, [[9,7]], mxT0.id, admin.id);
  await cM(stA3.id, null, grpA3.id, mxT0.id, mxT5.id, [[9,6]], mxT0.id, admin.id);
  await cM(stA3.id, null, grpA3.id, mxT1.id, mxT2.id, [[5,9]], mxT2.id, admin.id);
  await cM(stA3.id, null, grpA3.id, mxT1.id, mxT3.id, [[9,6]], mxT1.id, admin.id);
  await cM(stA3.id, null, grpA3.id, mxT1.id, mxT4.id, [[9,7]], mxT1.id, admin.id);
  await cM(stA3.id, null, grpA3.id, mxT1.id, mxT5.id, [[6,9]], mxT5.id, admin.id);
  await cM(stA3.id, null, grpA3.id, mxT2.id, mxT3.id, [[9,5]], mxT2.id, admin.id);
  await cM(stA3.id, null, grpA3.id, mxT2.id, mxT4.id, [[9,6]], mxT2.id, admin.id);
  await cM(stA3.id, null, grpA3.id, mxT2.id, mxT5.id, [[9,7]], mxT2.id, admin.id);
  await cM(stA3.id, null, grpA3.id, mxT3.id, mxT4.id, [[9,6]], mxT3.id, admin.id);
  await cM(stA3.id, null, grpA3.id, mxT3.id, mxT5.id, [[9,5]], mxT3.id, admin.id);
  await cM(stA3.id, null, grpA3.id, mxT4.id, mxT5.id, [[6,9]], mxT5.id, admin.id);

  // Totales (pts = juegos ganados):
  // mxT0: 5W, gw=9*5=45, gl=5+6+4+7+6=28, pts=45
  // mxT2: 4W, gw=9+9+9+9=36 + 5(vs mxT0)= 41? Let me calculate properly
  // mxT0 gw = 9+9+9+9+9=45, gl=5+6+4+7+6=28
  // mxT1 gw = 5+9+9+6=29 + gl from mxT0(9) = wait...
  // mxT1 played: vs mxT0(5), vs mxT2(5 got), vs mxT3(9), vs mxT4(9), vs mxT5(6)
  //   gw = 5+5+9+9+6=34, gl = 9+9+6+7+9=40
  // mxT2 played: vs mxT0(6), vs mxT1(9), vs mxT3(9), vs mxT4(9), vs mxT5(9)
  //   gw = 6+9+9+9+9=42, gl = 9+5+5+6+7=32
  // mxT3 played: vs mxT0(4), vs mxT1(6), vs mxT2(5), vs mxT4(9), vs mxT5(9)
  //   gw = 4+6+5+9+9=33, gl = 9+9+9+6+5=38
  // mxT4 played: vs mxT0(7), vs mxT1(7), vs mxT2(6), vs mxT3(6), vs mxT5(6)
  //   gw = 7+7+6+6+6=32, gl = 9+9+9+9+9=45
  // mxT5 played: vs mxT0(6), vs mxT1(9), vs mxT2(7), vs mxT3(5), vs mxT4(9)
  //   gw = 6+9+7+5+9=36, gl = 9+6+9+9+6=39
  // Rankings by gw: mxT0(45), mxT2(42), mxT1(34), mxT3(33), mxT5(36?!)
  // Wait mxT5=36 > mxT3=33 → order: mxT0(45), mxT2(42), mxT5(36), mxT1(34), mxT3(33), mxT4(32)
  await gs(grpA3.id, mxT0.id, 1, 5,5,0, 5,0, 45,28, 45);
  await gs(grpA3.id, mxT2.id, 2, 5,4,1, 4,1, 42,32, 42);
  await gs(grpA3.id, mxT5.id, 3, 5,2,3, 2,3, 36,39, 36);
  await gs(grpA3.id, mxT1.id, 4, 5,2,3, 2,3, 34,40, 34);
  await gs(grpA3.id, mxT3.id, 5, 5,2,3, 2,3, 33,38, 33);
  await gs(grpA3.id, mxT4.id, 6, 5,0,5, 0,5, 32,45, 32);

  console.log("✓ A3 — Americano Mixto Abril 2026 (COMPLETADO, AMERICANO, Mixta)");

  // ══════════════════════════════════════════════════════════════════════════════
  // A4: Mexicano Masculino 2da Abril 2026  (COMPLETED — MEXICANO — Masc 2da)
  // 6 equipos, 3 rondas, emparejamiento dinámico por ranking acumulado
  // ══════════════════════════════════════════════════════════════════════════════

  const tA4 = await prisma.tournament.create({
    data: {
      organizerId: org.id,
      name: "Mexicano 2da Abril 2026",
      description: "Formato mexicano — emparejamiento dinámico por puntos acumulados. El torneo de 2da categoría más reñido del mes.",
      status: "COMPLETED",
      startDate: new Date("2026-04-20"),
      endDate:   new Date("2026-04-20"),
      isPublic:  true,
      publishedAt: new Date("2026-04-05"),
    },
  });

  const tA4m2 = await prisma.tournamentCategory.create({
    data: {
      tournamentId: tA4.id, categoryId: catM2.id,
      format: "MEXICANO", status: "COMPLETED",
      maxTeams: 6, minTeams: 4, setsPerMatch: 1, gamesPerSet: 9,
      formatConfig: { rounds: 3 },
    },
  });

  for (const t of [m2T0,m2T1,m2T2,m2T3,m2T4,m2T5]) await reg(tA4m2.id, t.id);

  const stA4 = await prisma.stage.create({
    data: { tournamentCategoryId: tA4m2.id, name: "Mexicano", type: "GROUPS", order: 1, isCompleted: true },
  });

  // Ronda 1 (emparejamiento inicial: 1°vs4°, 2°vs5°, 3°vs6°)
  const r1 = await prisma.group.create({ data: { stageId: stA4.id, name: "Ronda 1", order: 1 } });
  // m2T0 vs m2T3 [9,5] m2T0 wins | m2T1 vs m2T4 [9,4] m2T1 wins | m2T2 vs m2T5 [9,6] m2T2 wins
  await cM(stA4.id, null, r1.id, m2T0.id, m2T3.id, [[9,5]], m2T0.id, admin.id);
  await cM(stA4.id, null, r1.id, m2T1.id, m2T4.id, [[9,4]], m2T1.id, admin.id);
  await cM(stA4.id, null, r1.id, m2T2.id, m2T5.id, [[9,6]], m2T2.id, admin.id);
  // After R1 gw: m2T0=9, m2T1=9, m2T2=9, m2T3=5, m2T4=4, m2T5=6
  // gw-gl: m2T0=4, m2T1=5, m2T2=3, m2T3=-4, m2T4=-5, m2T5=-3
  // Ranking R1: m2T1(9,+5), m2T0(9,+4), m2T2(9,+3), m2T5(6,-3), m2T3(5,-4), m2T4(4,-5)

  // Ronda 2 (1°vs2°, 3°vs4°, 5°vs6°, avoid rematches)
  const r2 = await prisma.group.create({ data: { stageId: stA4.id, name: "Ronda 2", order: 2 } });
  // m2T1 vs m2T0 [9,6] m2T1 wins | m2T2 vs m2T5 — already played R1! → m2T2 vs m2T3 instead
  // Actual R2: m2T1 vs m2T0, m2T2 vs m2T3, m2T5 vs m2T4
  await cM(stA4.id, null, r2.id, m2T1.id, m2T0.id, [[9,6]], m2T1.id, admin.id);
  await cM(stA4.id, null, r2.id, m2T2.id, m2T3.id, [[9,5]], m2T2.id, admin.id);
  await cM(stA4.id, null, r2.id, m2T5.id, m2T4.id, [[9,7]], m2T5.id, admin.id);
  // After R2 totals: m2T1=18, m2T2=18, m2T0=15, m2T5=15, m2T3=10, m2T4=11
  // gw-gl: m2T1=(18-10)=8, m2T2=(18-11)=7, m2T0=(15-14)=1, m2T5=(15-16)=-1, m2T4=(11-18)=-7, m2T3=(10-18)=-8
  // Ranking R2: m2T1(18,+8), m2T2(18,+7), m2T0(15,+1), m2T5(15,-1), m2T4(11,-7), m2T3(10,-8)

  // Ronda 3 (1°vs2°, 3°vs4°, 5°vs6°)
  const r3 = await prisma.group.create({ data: { stageId: stA4.id, name: "Ronda 3", order: 3 } });
  // m2T1 vs m2T2, m2T0 vs m2T5, m2T4 vs m2T3
  await cM(stA4.id, null, r3.id, m2T1.id, m2T2.id, [[9,7]], m2T1.id, admin.id);
  await cM(stA4.id, null, r3.id, m2T0.id, m2T5.id, [[9,6]], m2T0.id, admin.id);
  await cM(stA4.id, null, r3.id, m2T4.id, m2T3.id, [[9,7]], m2T4.id, admin.id);
  // Final totals: m2T1=27, m2T2=25, m2T0=24, m2T5=21, m2T4=20, m2T3=17

  console.log("✓ A4 — Mexicano 2da Abril 2026 (COMPLETADO, MEXICANO, Masc 2da)");

  // ══════════════════════════════════════════════════════════════════════════════
  // A5: Torneo Doble Eliminación Abril 2026  (COMPLETED — DOUBLE_ELIMINATION — Masc 1ra)
  // 4 equipos, cuadro W + cuadro L + Gran Final
  //   WB-SF1: mT0 vs mT3 → mT0 wins (mT3 → LB)
  //   WB-SF2: mT1 vs mT2 → mT1 wins (mT2 → LB)
  //   WBF:    mT0 vs mT1 → mT0 wins (mT1 → LBF)
  //   LB-R1:  mT3 vs mT2 → mT3 wins (mT2 eliminado)
  //   LBF:    mT1 vs mT3 → mT1 wins (mT3 eliminado)
  //   GF:     mT0 vs mT1 → mT0 wins (campeon)
  // ══════════════════════════════════════════════════════════════════════════════

  const tA5 = await prisma.tournament.create({
    data: {
      organizerId: org.id,
      name: "Doble Eliminación Abril 2026",
      description: "Formato de doble eliminación — perdés una vez y pasás al cuadro de perdedores. Hay que perder dos veces para quedar fuera.",
      status: "COMPLETED",
      startDate: new Date("2026-04-26"),
      endDate:   new Date("2026-04-27"),
      isPublic:  true,
      publishedAt: new Date("2026-04-10"),
    },
  });

  const tA5m1 = await prisma.tournamentCategory.create({
    data: {
      tournamentId: tA5.id, categoryId: catM1.id,
      format: "DOUBLE_ELIMINATION", status: "COMPLETED",
      maxTeams: 4, minTeams: 4, setsPerMatch: 3,
    },
  });

  for (const t of [mT0,mT1,mT2,mT3]) await reg(tA5m1.id, t.id);

  // Stage 1: Cuadro de Ganadores (Winner Bracket)
  const stA5wb = await prisma.stage.create({
    data: { tournamentCategoryId: tA5m1.id, name: "Cuadro de Ganadores", type: "SINGLE_ELIMINATION", order: 1, isCompleted: true },
  });
  const { f: wbF, sf1: wbSF1, sf2: wbSF2 } = await se4nodes(stA5wb.id);

  // WB-SF1: mT0 vs mT3 → mT0 wins
  await cM(stA5wb.id, wbSF1.id, null, mT0.id, mT3.id, [[6,3],[6,4]], mT0.id, admin.id);
  // WB-SF2: mT1 vs mT2 → mT1 wins
  await cM(stA5wb.id, wbSF2.id, null, mT1.id, mT2.id, [[6,4],[7,5]], mT1.id, admin.id);
  // WBF: mT0 vs mT1 → mT0 wins, mT1 drops to LBF
  await cM(stA5wb.id, wbF.id, null, mT0.id, mT1.id, [[6,3],[6,4]], mT0.id, admin.id);

  // Stage 2: Cuadro de Perdedores + Gran Final (Loser Bracket + GF)
  const stA5lb = await prisma.stage.create({
    data: { tournamentCategoryId: tA5m1.id, name: "Cuadro de Perdedores y Gran Final", type: "SINGLE_ELIMINATION", order: 2, isCompleted: true },
  });
  // Tree: GF → LBF → LBR1
  const lbGF  = await prisma.bracketNode.create({ data: { stageId: stA5lb.id, round: 1, position: 1 } });
  const lbLBF = await prisma.bracketNode.create({ data: { stageId: stA5lb.id, round: 2, position: 1, parentNodeId: lbGF.id } });
  const lbR1  = await prisma.bracketNode.create({ data: { stageId: stA5lb.id, round: 3, position: 1, parentNodeId: lbLBF.id } });

  // LB-R1: mT3 vs mT2 (losers from WB-SF1 and WB-SF2) → mT3 wins
  await cM(stA5lb.id, lbR1.id, null, mT3.id, mT2.id, [[6,4],[6,3]], mT3.id, admin.id);
  // LBF: mT1 (WBF loser) vs mT3 (LBR1 winner) → mT1 wins
  await cM(stA5lb.id, lbLBF.id, null, mT1.id, mT3.id, [[6,4],[5,7],[6,4]], mT1.id, admin.id);
  // Gran Final: mT0 (undefeated) vs mT1 (from LB) → mT0 wins
  await cM(stA5lb.id, lbGF.id, null, mT0.id, mT1.id, [[6,4],[6,3]], mT0.id, admin.id);

  console.log("✓ A5 — Doble Eliminación Abril 2026 (COMPLETADO, DOUBLE_ELIMINATION, Masc 1ra)");

  // ══════════════════════════════════════════════════════════════════════════════
  // Resumen
  // ══════════════════════════════════════════════════════════════════════════════
  console.log("\n✅ seed-abril completado!");
  console.log("\nTorneos abril 2026 creados (todos COMPLETADOS):");
  console.log("  A1: Copa Apertura Abril 2026    — GROUP_PLAYOFF        (Masc 1ra)  → Campeón: Torres/Sánchez");
  console.log("  A2: Liga Femenina Abril 2026    — ROUND_ROBIN          (Fem 1ra)   → Campeón: Ruiz/Fernández");
  console.log("  A3: Americano Mixto Abril 2026  — AMERICANO            (Mixta)     → Campeón: Torres/Ruiz");
  console.log("  A4: Mexicano 2da Abril 2026     — MEXICANO             (Masc 2da)  → Campeón: Blanco/Costa");
  console.log("  A5: Doble Eliminación Abril     — DOUBLE_ELIMINATION   (Masc 1ra)  → Campeón: Torres/Sánchez");
  console.log("\nNuevos jugadores: Iván Ríos, Brian Soto, Maximiliano Díaz, Nicolás Giménez, Paula Santos, Roxana Gallo, Sandra Ríos, Mariela Acuña");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
