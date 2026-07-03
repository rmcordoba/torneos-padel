/**
 * seed-extra.ts
 * Agrega torneos de demostración con formatos variados (GROUP_PLAYOFF, AMERICANO, MEXICANO).
 * NO borra datos existentes. Usa upsert para jugadores y verifica idempotencia por nombre de torneo.
 * Ejecutar: npm run db:seed:extra
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── helpers ──────────────────────────────────────────────────────────────────

async function getPlayer(email: string) {
  const u = await prisma.user.findUniqueOrThrow({
    where: { email },
    include: { playerProfile: true },
  });
  return u.playerProfile!;
}

async function createPlayer(email: string, firstName: string, lastName: string, pw: string) {
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

async function reg(tcId: string, teamId: string, status: "APPROVED" | "PENDING" = "APPROVED") {
  return prisma.registration.create({ data: { tournamentCategoryId: tcId, teamId, status } });
}

async function wl(tcId: string, teamId: string, position: number) {
  return prisma.waitlistEntry.create({ data: { tournamentCategoryId: tcId, teamId, position } });
}

// Partido de grupo completado
async function cGM(
  stageId: string,
  groupId: string,
  t1Id: string,
  t2Id: string,
  sets: [number, number][],
  winnerId: string,
  adminId: string,
) {
  return prisma.match.create({
    data: {
      stageId,
      groupId,
      status: "COMPLETED",
      teams: { create: [{ teamId: t1Id, side: 1 }, { teamId: t2Id, side: 2 }] },
      sets: { create: sets.map(([g1, g2], i) => ({ setNumber: i + 1, games1: g1, games2: g2 })) },
      result: { create: { winnerId, recordedById: adminId } },
    },
  });
}

// Partido de grupo programado
async function sGM(stageId: string, groupId: string, t1Id: string, t2Id: string) {
  return prisma.match.create({
    data: {
      stageId,
      groupId,
      status: "SCHEDULED",
      teams: { create: [{ teamId: t1Id, side: 1 }, { teamId: t2Id, side: 2 }] },
    },
  });
}

// Partido de bracket completado
async function cBM(
  stageId: string,
  nodeId: string,
  t1Id: string,
  t2Id: string,
  sets: [number, number][],
  winnerId: string,
  adminId: string,
) {
  const match = await prisma.match.create({
    data: {
      stageId,
      bracketNodeId: nodeId,
      status: "COMPLETED",
      teams: { create: [{ teamId: t1Id, side: 1 }, { teamId: t2Id, side: 2 }] },
      sets: { create: sets.map(([g1, g2], i) => ({ setNumber: i + 1, games1: g1, games2: g2 })) },
      result: { create: { winnerId, recordedById: adminId } },
    },
  });
  await prisma.bracketNode.update({ where: { id: nodeId }, data: { teamId: winnerId } });
  return match;
}

// Partido de bracket programado
async function sBM(stageId: string, nodeId: string, t1Id: string, t2Id: string) {
  return prisma.match.create({
    data: {
      stageId,
      bracketNodeId: nodeId,
      status: "SCHEDULED",
      teams: { create: [{ teamId: t1Id, side: 1 }, { teamId: t2Id, side: 2 }] },
    },
  });
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

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 seed-extra: verificando datos base...");

  // ── Datos base existentes ────────────────────────────────────────────────────
  const org = await prisma.organizer.findUniqueOrThrow({ where: { slug: "club-padel-palermo" } });
  const venue = await prisma.venue.findFirstOrThrow({ where: { organizerId: org.id } });
  const courts = await prisma.court.findMany({ where: { venueId: venue.id } });
  const [c1, c2, c3, c4] = courts;

  const catM1  = await prisma.category.findUniqueOrThrow({ where: { organizerId_name: { organizerId: org.id, name: "Masculina 1ra" } } });
  const catM2  = await prisma.category.findUniqueOrThrow({ where: { organizerId_name: { organizerId: org.id, name: "Masculina 2da" } } });
  const catF1  = await prisma.category.findUniqueOrThrow({ where: { organizerId_name: { organizerId: org.id, name: "Femenina 1ra"  } } });
  const catMix = await prisma.category.findUniqueOrThrow({ where: { organizerId_name: { organizerId: org.id, name: "Mixta"         } } });

  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@padel.local" } });

  // Idempotencia
  const already = await prisma.tournament.findFirst({
    where: { organizerId: org.id, name: "Gran Copa del Club" },
  });
  if (already) {
    console.log("ℹ  seed-extra ya aplicado — omitiendo.");
    return;
  }

  // ── Jugadores existentes (del seed principal) ────────────────────────────────
  const [p0,p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15] = await Promise.all([
    getPlayer("carlos.torres@padel.local"),
    getPlayer("diego.sanchez@padel.local"),
    getPlayer("martin.garcia@padel.local"),
    getPlayer("pablo.lopez@padel.local"),
    getPlayer("rodrigo.herrera@padel.local"),
    getPlayer("facundo.morales@padel.local"),
    getPlayer("nicolas.peralta@padel.local"),
    getPlayer("sebastian.rios@padel.local"),
    getPlayer("ezequiel.vega@padel.local"),
    getPlayer("lucas.mendez@padel.local"),
    getPlayer("agustin.blanco@padel.local"),
    getPlayer("mateo.costa@padel.local"),
    getPlayer("federico.ramos@padel.local"),
    getPlayer("leandro.cruz@padel.local"),
    getPlayer("tomas.ortega@padel.local"),
    getPlayer("ignacio.flores@padel.local"),
  ]);

  const [f0,f1,f2,f3,f4,f5,f6,f7] = await Promise.all([
    getPlayer("valentina.ruiz@padel.local"),
    getPlayer("camila.fernandez@padel.local"),
    getPlayer("lucia.martinez@padel.local"),
    getPlayer("sofia.gonzalez@padel.local"),
    getPlayer("maria.diaz@padel.local"),
    getPlayer("florencia.perez@padel.local"),
    getPlayer("jimena.acosta@padel.local"),
    getPlayer("daniela.romero@padel.local"),
  ]);

  // ── Equipos existentes (reusar los ya creados) ───────────────────────────────
  const [mT0,mT1,mT2,mT3,mT4,mT5,mT6,mT7] = await Promise.all([
    findOrCreateTeam(p0.id,  p1.id),
    findOrCreateTeam(p2.id,  p3.id),
    findOrCreateTeam(p4.id,  p5.id),
    findOrCreateTeam(p6.id,  p7.id),
    findOrCreateTeam(p8.id,  p9.id),
    findOrCreateTeam(p10.id, p11.id),
    findOrCreateTeam(p12.id, p13.id),
    findOrCreateTeam(p14.id, p15.id),
  ]);

  const [fT0,fT1,fT2,fT3] = await Promise.all([
    findOrCreateTeam(f0.id, f1.id),
    findOrCreateTeam(f2.id, f3.id),
    findOrCreateTeam(f4.id, f5.id),
    findOrCreateTeam(f6.id, f7.id),
  ]);

  const [mxT0,mxT1,mxT2,mxT3] = await Promise.all([
    findOrCreateTeam(p0.id, f0.id),
    findOrCreateTeam(p2.id, f1.id),
    findOrCreateTeam(p4.id, f2.id),
    findOrCreateTeam(p6.id, f3.id),
  ]);

  // ── Nuevos jugadores ─────────────────────────────────────────────────────────
  const pw = await bcrypt.hash("jugador1234", 10);

  const [np0,np1,np2,np3,np4,np5,np6,np7,np8,np9,np10,np11] = await Promise.all([
    createPlayer("juanma.silva@padel.local",   "Juan Manuel", "Silva",   pw),
    createPlayer("ramiro.castro@padel.local",  "Ramiro",      "Castro",  pw),
    createPlayer("claudio.vidal@padel.local",  "Claudio",     "Vidal",   pw),
    createPlayer("gustavo.arias@padel.local",  "Gustavo",     "Arias",   pw),
    createPlayer("ernesto.molina@padel.local", "Ernesto",     "Molina",  pw),
    createPlayer("horacio.sosa@padel.local",   "Horacio",     "Sosa",    pw),
    createPlayer("ariel.luna@padel.local",     "Ariel",       "Luna",    pw),
    createPlayer("walter.ponce@padel.local",   "Walter",      "Ponce",   pw),
    createPlayer("roberto.suarez@padel.local", "Roberto",     "Suárez",  pw),
    createPlayer("marcelo.vargas@padel.local", "Marcelo",     "Vargas",  pw),
    createPlayer("alex.reyes@padel.local",     "Alejandro",   "Reyes",   pw),
    createPlayer("daniel.rojas@padel.local",   "Daniel",      "Rojas",   pw),
  ]);

  const [nf0,nf1,nf2,nf3,nf4,nf5] = await Promise.all([
    createPlayer("andrea.medina@padel.local",   "Andrea",    "Medina",  pw),
    createPlayer("patricia.ibarra@padel.local", "Patricia",  "Ibarra",  pw),
    createPlayer("silvia.campos@padel.local",   "Silvia",    "Campos",  pw),
    createPlayer("carolina.reyes@padel.local",  "Carolina",  "Reyes",   pw),
    createPlayer("gabriela.lara@padel.local",   "Gabriela",  "Lara",    pw),
    createPlayer("alejandra.mora@padel.local",  "Alejandra", "Mora",    pw),
  ]);

  // ── Nuevos equipos ───────────────────────────────────────────────────────────
  const [nT0,nT1,nT2,nT3,nT4,nT5] = await Promise.all([
    findOrCreateTeam(np0.id,  np1.id),   // Silva / Castro
    findOrCreateTeam(np2.id,  np3.id),   // Vidal / Arias
    findOrCreateTeam(np4.id,  np5.id),   // Molina / Sosa
    findOrCreateTeam(np6.id,  np7.id),   // Luna / Ponce
    findOrCreateTeam(np8.id,  np9.id),   // Suárez / Vargas
    findOrCreateTeam(np10.id, np11.id),  // Reyes / Rojas
  ]);

  const [nfT0,nfT1,nfT2] = await Promise.all([
    findOrCreateTeam(nf0.id, nf1.id),   // Medina / Ibarra
    findOrCreateTeam(nf2.id, nf3.id),   // Campos / Reyes
    findOrCreateTeam(nf4.id, nf5.id),   // Lara / Mora
  ]);

  const [nmxT0,nmxT1,nmxT2] = await Promise.all([
    findOrCreateTeam(np0.id, nf0.id),   // Silva / Medina
    findOrCreateTeam(np2.id, nf2.id),   // Vidal / Campos
    findOrCreateTeam(np4.id, nf4.id),   // Molina / Lara
  ]);

  // ══════════════════════════════════════════════════════════════════════════════
  // T6: Gran Copa del Club  (IN_PROGRESS — GROUP_PLAYOFF — Masculina 2da)
  // Grupos completos, playoff SF programado
  // Grupo A: mT1, mT3, nT0, nT1  |  Grupo B: mT5, mT7, nT2, nT3
  // ══════════════════════════════════════════════════════════════════════════════

  const t6 = await prisma.tournament.create({
    data: {
      organizerId: org.id,
      name: "Gran Copa del Club",
      description: "Torneo por grupos — los mejores equipos de Segunda División se miden en la cancha",
      status: "IN_PROGRESS",
      startDate: new Date("2026-05-16"),
      endDate:   new Date("2026-05-18"),
      isPublic:  true,
      publishedAt: new Date("2026-04-20"),
    },
  });

  const t6m2 = await prisma.tournamentCategory.create({
    data: {
      tournamentId: t6.id,
      categoryId:   catM2.id,
      format:       "GROUP_PLAYOFF",
      status:       "IN_PROGRESS",
      maxTeams:     8,
      minTeams:     4,
      setsPerMatch: 3,
      formatConfig: { groupSize: 4, teamsAdvancePerGroup: 2 },
    },
  });

  for (const t of [mT1,mT3,nT0,nT1,mT5,mT7,nT2,nT3]) await reg(t6m2.id, t.id);

  // Stage 1: Grupos (completado)
  const t6sg = await prisma.stage.create({
    data: { tournamentCategoryId: t6m2.id, name: "Fase de Grupos", type: "GROUPS", order: 1, isCompleted: true },
  });

  // Grupo A
  const t6gA = await prisma.group.create({ data: { stageId: t6sg.id, name: "Grupo A", order: 1 } });

  // mT1 gana todo (1°), mT3 gana 2 (2°), nT0 gana 1 (3°), nT1 no gana (4°)
  await cGM(t6sg.id, t6gA.id, mT1.id, mT3.id, [[6,3],[6,4]],       mT1.id, admin.id);
  await cGM(t6sg.id, t6gA.id, mT1.id, nT0.id, [[6,2],[6,1]],       mT1.id, admin.id);
  await cGM(t6sg.id, t6gA.id, mT1.id, nT1.id, [[6,4],[6,3]],       mT1.id, admin.id);
  await cGM(t6sg.id, t6gA.id, mT3.id, nT0.id, [[6,4],[7,5]],       mT3.id, admin.id);
  await cGM(t6sg.id, t6gA.id, mT3.id, nT1.id, [[6,3],[6,2]],       mT3.id, admin.id);
  await cGM(t6sg.id, t6gA.id, nT0.id, nT1.id, [[6,4],[4,6],[7,5]], nT0.id, admin.id);

  // Standings Grupo A (calculados a partir de los resultados anteriores):
  // mT1: 3P 3W 0L sw=6 sl=0 gw=36 gl=17 pts=9
  // mT3: 3P 2W 1L sw=4 sl=2 gw=32 gl=26 pts=6
  // nT0: 3P 1W 2L sw=2 sl=4 gw=29 gl=40 pts=3
  // nT1: 3P 0W 3L sw=1 sl=5 gw=27 gl=41 pts=0
  await gs(t6gA.id, mT1.id, 1, 3,3,0, 6,0, 36,17, 9);
  await gs(t6gA.id, mT3.id, 2, 3,2,1, 4,2, 32,26, 6);
  await gs(t6gA.id, nT0.id, 3, 3,1,2, 2,4, 29,40, 3);
  await gs(t6gA.id, nT1.id, 4, 3,0,3, 1,5, 27,41, 0);

  // Grupo B
  const t6gB = await prisma.group.create({ data: { stageId: t6sg.id, name: "Grupo B", order: 2 } });

  // mT5 gana todo (1°), mT7 gana 2 (2°), nT2 gana 1 (3°), nT3 no gana (4°)
  await cGM(t6sg.id, t6gB.id, mT5.id, mT7.id, [[6,2],[6,3]],       mT5.id, admin.id);
  await cGM(t6sg.id, t6gB.id, mT5.id, nT2.id, [[6,4],[6,3]],       mT5.id, admin.id);
  await cGM(t6sg.id, t6gB.id, mT5.id, nT3.id, [[6,3],[7,5]],       mT5.id, admin.id);
  await cGM(t6sg.id, t6gB.id, mT7.id, nT2.id, [[4,6],[6,4],[6,3]], mT7.id, admin.id);
  await cGM(t6sg.id, t6gB.id, mT7.id, nT3.id, [[6,4],[6,2]],       mT7.id, admin.id);
  await cGM(t6sg.id, t6gB.id, nT2.id, nT3.id, [[6,3],[6,4]],       nT2.id, admin.id);

  // Standings Grupo B:
  // mT5: 3P 3W 0L sw=6 sl=0 gw=37 gl=20 pts=9
  // mT7: 3P 2W 1L sw=4 sl=3 gw=33 gl=31 pts=6
  // nT2: 3P 1W 2L sw=3 sl=4 gw=32 gl=35 pts=3
  // nT3: 3P 0W 3L sw=0 sl=6 gw=21 gl=37 pts=0
  await gs(t6gB.id, mT5.id, 1, 3,3,0, 6,0, 37,20, 9);
  await gs(t6gB.id, mT7.id, 2, 3,2,1, 4,3, 33,31, 6);
  await gs(t6gB.id, nT2.id, 3, 3,1,2, 3,4, 32,35, 3);
  await gs(t6gB.id, nT3.id, 4, 3,0,3, 0,6, 21,37, 0);

  // Stage 2: Playoffs (semifinales cruzadas: A1 vs B2, B1 vs A2)
  const t6sb = await prisma.stage.create({
    data: { tournamentCategoryId: t6m2.id, name: "Playoffs", type: "SINGLE_ELIMINATION", order: 2 },
  });

  const t6fn  = await prisma.bracketNode.create({ data: { stageId: t6sb.id, round: 1, position: 1 } });
  const t6sf1 = await prisma.bracketNode.create({ data: { stageId: t6sb.id, round: 2, position: 1, parentNodeId: t6fn.id } });
  const t6sf2 = await prisma.bracketNode.create({ data: { stageId: t6sb.id, round: 2, position: 2, parentNodeId: t6fn.id } });

  // SF1: A1(mT1) vs B2(mT7) — programado
  await sBM(t6sb.id, t6sf1.id, mT1.id, mT7.id);
  // SF2: B1(mT5) vs A2(mT3) — programado
  await sBM(t6sb.id, t6sf2.id, mT5.id, mT3.id);

  // Slots para las semis
  await prisma.scheduleSlot.createMany({
    data: [
      { tournamentId: t6.id, venueId: venue.id, date: new Date("2026-05-18"),
        startTime: new Date("2026-05-18T14:00:00Z"), endTime: new Date("2026-05-18T15:30:00Z") },
      { tournamentId: t6.id, venueId: venue.id, date: new Date("2026-05-18"),
        startTime: new Date("2026-05-18T16:00:00Z"), endTime: new Date("2026-05-18T17:30:00Z") },
    ],
  });

  console.log("✓ T6 — Gran Copa del Club (en curso, GROUP_PLAYOFF)");

  // ══════════════════════════════════════════════════════════════════════════════
  // T7: Torneo Americano Mixto  (IN_PROGRESS — AMERICANO — Mixta)
  // 6 equipos, liga todos vs todos, standings por juegos ganados
  // 9 de 15 partidos completados
  // ══════════════════════════════════════════════════════════════════════════════

  const t7 = await prisma.tournament.create({
    data: {
      organizerId: org.id,
      name: "Torneo Americano Mixto",
      description: "Formato americano — cada juego ganado suma en la tabla. La dupla con más juegos gana el torneo.",
      status:   "IN_PROGRESS",
      startDate: new Date("2026-05-17"),
      endDate:   new Date("2026-05-18"),
      isPublic:  true,
      publishedAt: new Date("2026-04-25"),
    },
  });

  const t7mix = await prisma.tournamentCategory.create({
    data: {
      tournamentId: t7.id,
      categoryId:   catMix.id,
      format:       "AMERICANO",
      status:       "IN_PROGRESS",
      maxTeams:     6,
      minTeams:     4,
      setsPerMatch: 1,
      gamesPerSet:  9,
    },
  });

  for (const t of [mxT0,mxT1,mxT2,mxT3,nmxT0,nmxT1]) await reg(t7mix.id, t.id);

  const t7st = await prisma.stage.create({
    data: { tournamentCategoryId: t7mix.id, name: "Americano", type: "GROUPS", order: 1 },
  });

  const t7grp = await prisma.group.create({ data: { stageId: t7st.id, name: "Todos contra todos", order: 1 } });

  // 9 partidos completados
  await cGM(t7st.id, t7grp.id, mxT0.id,  mxT1.id,  [[9,5]],  mxT0.id,  admin.id);
  await cGM(t7st.id, t7grp.id, mxT0.id,  mxT2.id,  [[9,6]],  mxT0.id,  admin.id);
  await cGM(t7st.id, t7grp.id, mxT0.id,  mxT3.id,  [[9,4]],  mxT0.id,  admin.id);
  await cGM(t7st.id, t7grp.id, mxT1.id,  mxT2.id,  [[5,9]],  mxT2.id,  admin.id);
  await cGM(t7st.id, t7grp.id, mxT1.id,  mxT3.id,  [[9,6]],  mxT1.id,  admin.id);
  await cGM(t7st.id, t7grp.id, mxT2.id,  mxT3.id,  [[9,5]],  mxT2.id,  admin.id);
  await cGM(t7st.id, t7grp.id, mxT0.id,  nmxT0.id, [[9,7]],  mxT0.id,  admin.id);
  await cGM(t7st.id, t7grp.id, mxT1.id,  nmxT0.id, [[6,9]],  nmxT0.id, admin.id);
  await cGM(t7st.id, t7grp.id, mxT2.id,  nmxT1.id, [[9,5]],  mxT2.id,  admin.id);

  // 6 partidos pendientes
  await sGM(t7st.id, t7grp.id, mxT3.id,  nmxT0.id);
  await sGM(t7st.id, t7grp.id, mxT3.id,  nmxT1.id);
  await sGM(t7st.id, t7grp.id, mxT0.id,  nmxT1.id);
  await sGM(t7st.id, t7grp.id, mxT1.id,  nmxT1.id);
  await sGM(t7st.id, t7grp.id, mxT2.id,  nmxT0.id);
  await sGM(t7st.id, t7grp.id, nmxT0.id, nmxT1.id);

  // Standings AMERICANO (puntos = juegos ganados acumulados)
  // mxT0:  4P 4W 0L sw=4 sl=0 gw=36 gl=22 pts=36
  // mxT2:  4P 3W 1L sw=3 sl=1 gw=33 gl=24 pts=33
  // mxT1:  4P 1W 3L sw=1 sl=3 gw=25 gl=33 pts=25
  // nmxT0: 2P 1W 1L sw=1 sl=1 gw=16 gl=15 pts=16
  // mxT3:  3P 0W 3L sw=0 sl=3 gw=15 gl=27 pts=15
  // nmxT1: 1P 0W 1L sw=0 sl=1 gw=5  gl=9  pts=5
  await gs(t7grp.id, mxT0.id,  1, 4,4,0, 4,0, 36,22, 36);
  await gs(t7grp.id, mxT2.id,  2, 4,3,1, 3,1, 33,24, 33);
  await gs(t7grp.id, mxT1.id,  3, 4,1,3, 1,3, 25,33, 25);
  await gs(t7grp.id, nmxT0.id, 4, 2,1,1, 1,1, 16,15, 16);
  await gs(t7grp.id, mxT3.id,  5, 3,0,3, 0,3, 15,27, 15);
  await gs(t7grp.id, nmxT1.id, 6, 1,0,1, 0,1,  5, 9,  5);

  console.log("✓ T7 — Torneo Americano Mixto (en curso, AMERICANO)");

  // ══════════════════════════════════════════════════════════════════════════════
  // T8: Copa Master 2026  (REGISTRATION_OPEN — 4 categorías)
  // Masc 1ra (SE), Masc 2da (SE), Fem 1ra (ROUND_ROBIN), Mixta (AMERICANO)
  // Mix rico de aprobados, pendientes y lista de espera
  // ══════════════════════════════════════════════════════════════════════════════

  const t8 = await prisma.tournament.create({
    data: {
      organizerId: org.id,
      name: "Copa Master 2026",
      description: "El evento más importante del año. 4 categorías, premios en efectivo y trofeos para todos los finalistas.",
      status: "REGISTRATION_OPEN",
      startDate: new Date("2026-06-06"),
      endDate:   new Date("2026-06-08"),
      registrationDeadline: new Date("2026-05-30"),
      isPublic:  true,
      publishedAt: new Date("2026-05-01"),
    },
  });

  // Masc 1ra — SE, max=8 — 6 aprobados + 2 pendientes (2 cupos libres)
  const t8m1 = await prisma.tournamentCategory.create({
    data: {
      tournamentId: t8.id, categoryId: catM1.id,
      format: "SINGLE_ELIMINATION", status: "REGISTRATION_OPEN",
      maxTeams: 8, minTeams: 4, setsPerMatch: 3, pricePerTeam: 3500,
    },
  });
  for (const t of [mT0,mT1,mT2,mT3,mT4,mT5]) await reg(t8m1.id, t.id, "APPROVED");
  await reg(t8m1.id, mT6.id, "PENDING");
  await reg(t8m1.id, nT0.id, "PENDING");

  // Masc 2da — SE, max=6 — cupo lleno (6 aprobados) + 1 pendiente en waitlist
  const t8m2 = await prisma.tournamentCategory.create({
    data: {
      tournamentId: t8.id, categoryId: catM2.id,
      format: "SINGLE_ELIMINATION", status: "REGISTRATION_OPEN",
      maxTeams: 6, minTeams: 4, setsPerMatch: 3, pricePerTeam: 2500,
    },
  });
  for (const t of [nT0,nT1,nT2,nT3,nT4,nT5]) await reg(t8m2.id, t.id, "APPROVED");
  await reg(t8m2.id, mT7.id, "PENDING");
  await wl(t8m2.id, mT1.id, 1); // cupo lleno → lista de espera

  // Fem 1ra — ROUND_ROBIN, max=8 — 5 aprobadas + 2 pendientes
  const t8f1 = await prisma.tournamentCategory.create({
    data: {
      tournamentId: t8.id, categoryId: catF1.id,
      format: "ROUND_ROBIN", status: "REGISTRATION_OPEN",
      maxTeams: 8, minTeams: 4, setsPerMatch: 3, pricePerTeam: 2500,
    },
  });
  for (const t of [fT0,fT1,fT2,fT3,nfT0]) await reg(t8f1.id, t.id, "APPROVED");
  await reg(t8f1.id, nfT1.id, "PENDING");
  await reg(t8f1.id, nfT2.id, "PENDING");

  // Mixta — AMERICANO, max=8 — 6 aprobados + 1 pendiente
  const t8mix = await prisma.tournamentCategory.create({
    data: {
      tournamentId: t8.id, categoryId: catMix.id,
      format: "AMERICANO", status: "REGISTRATION_OPEN",
      maxTeams: 8, minTeams: 4, setsPerMatch: 1, gamesPerSet: 9, pricePerTeam: 2000,
    },
  });
  for (const t of [mxT0,mxT1,mxT2,mxT3,nmxT0,nmxT1]) await reg(t8mix.id, t.id, "APPROVED");
  await reg(t8mix.id, nmxT2.id, "PENDING");

  console.log("✓ T8 — Copa Master 2026 (inscripciones abiertas, 4 categorías)");

  // ══════════════════════════════════════════════════════════════════════════════
  // T9: Torneo Mexicano Masculino  (IN_PROGRESS — MEXICANO — Masc 1ra)
  // 8 equipos (mT0-mT7), 4 rondas totales, 3 completadas, ronda 4 programada
  // ══════════════════════════════════════════════════════════════════════════════

  const t9 = await prisma.tournament.create({
    data: {
      organizerId: org.id,
      name: "Torneo Mexicano Masculino",
      description: "Formato mexicano — emparejamiento dinámico por ranking acumulado. Quien más juegos gane, campeón.",
      status:   "IN_PROGRESS",
      startDate: new Date("2026-05-19"),
      endDate:   new Date("2026-05-19"),
      isPublic:  true,
      publishedAt: new Date("2026-05-10"),
    },
  });

  const t9m1 = await prisma.tournamentCategory.create({
    data: {
      tournamentId: t9.id, categoryId: catM1.id,
      format: "MEXICANO", status: "IN_PROGRESS",
      maxTeams: 8, minTeams: 4, setsPerMatch: 1, gamesPerSet: 9,
      formatConfig: { rounds: 4 },
    },
  });

  for (const t of [mT0,mT1,mT2,mT3,mT4,mT5,mT6,mT7]) await reg(t9m1.id, t.id, "APPROVED");

  // Un único stage tipo GROUPS (así lo maneja el engine de MEXICANO)
  const t9st = await prisma.stage.create({
    data: { tournamentCategoryId: t9m1.id, name: "Mexicano", type: "GROUPS", order: 1 },
  });

  // ─── Ronda 1 (emparejamiento inicial aleatorio) ───────────────────────────────
  const t9r1 = await prisma.group.create({ data: { stageId: t9st.id, name: "Ronda 1", order: 1 } });

  // mT0 vs mT7 [9,4] mT0 wins | mT1 vs mT6 [9,3] mT1 wins
  // mT2 vs mT5 [9,5] mT2 wins | mT3 vs mT4 [9,6] mT3 wins
  await cGM(t9st.id, t9r1.id, mT0.id, mT7.id, [[9,4]], mT0.id, admin.id);
  await cGM(t9st.id, t9r1.id, mT1.id, mT6.id, [[9,3]], mT1.id, admin.id);
  await cGM(t9st.id, t9r1.id, mT2.id, mT5.id, [[9,5]], mT2.id, admin.id);
  await cGM(t9st.id, t9r1.id, mT3.id, mT4.id, [[9,6]], mT3.id, admin.id);
  // Juegos acumulados tras R1: mT3=9,mT4=6,mT1=9,mT2=9,mT0=9,mT5=5,mT6=3,mT7=4

  // ─── Ronda 2 (por ranking acumulado R1) ──────────────────────────────────────
  // Orden R1 (por gw): mT0=9, mT1=9, mT2=9, mT3=9, mT4=6, mT5=5, mT6=3, mT7=4
  // Emparejado 1°vs2°, 3°vs4°, 5°vs6°, 7°vs8°:
  // mT0 vs mT1, mT2 vs mT3, mT4 vs mT5 (wait — need to check mT4>mT7, mT5>mT6?)
  // Actually with tied gw=9 for mT0,mT1,mT2,mT3 the order within them uses gw-gl as tiebreaker.
  // gw-gl: mT0=9-4=5, mT1=9-3=6, mT2=9-5=4, mT3=9-6=3 → order: mT1, mT0, mT2, mT3
  // Then mT4=6, mT7=4, mT5=5, mT6=3 → order: mT4, mT5, mT7, mT6
  // Round 2: mT1 vs mT0, mT2 vs mT3, mT4 vs mT5, mT7 vs mT6
  const t9r2 = await prisma.group.create({ data: { stageId: t9st.id, name: "Ronda 2", order: 2 } });

  await cGM(t9st.id, t9r2.id, mT1.id, mT0.id, [[9,7]], mT1.id, admin.id);
  await cGM(t9st.id, t9r2.id, mT2.id, mT3.id, [[9,6]], mT2.id, admin.id);
  await cGM(t9st.id, t9r2.id, mT4.id, mT5.id, [[9,4]], mT4.id, admin.id);
  await cGM(t9st.id, t9r2.id, mT7.id, mT6.id, [[9,5]], mT7.id, admin.id);
  // Juegos acum R1+R2: mT1=9+9=18, mT2=9+9=18, mT0=9+7=16, mT3=9+6=15, mT4=6+9=15, mT7=4+9=13, mT5=5+4=9, mT6=3+5=8

  // ─── Ronda 3 (por ranking acumulado R1+R2) ────────────────────────────────────
  // Orden: mT1=18, mT2=18, mT0=16, mT3=15, mT4=15, mT7=13, mT5=9, mT6=8
  // Tiebreaker mT1 vs mT2: gw-gl: mT1=(9+9)-(3+6)=9, mT2=(9+9)-(5+6)=7 → mT1 primero
  // mT3 vs mT4: gw-gl: mT3=(9+6)-(6+9)=0, mT4=(6+9)-(6+4)=5 → mT4 antes? Actually mT4 gw-gl = 15-10=5 > mT3 gw-gl = 15-15=0 → mT4 tercero, mT3 cuarto
  // Round 3: mT1 vs mT2, mT0 vs mT4, mT3 vs mT7, mT5 vs mT6
  const t9r3 = await prisma.group.create({ data: { stageId: t9st.id, name: "Ronda 3", order: 3 } });

  await cGM(t9st.id, t9r3.id, mT1.id, mT2.id, [[9,7]], mT1.id, admin.id);
  await cGM(t9st.id, t9r3.id, mT0.id, mT4.id, [[9,5]], mT0.id, admin.id);
  await cGM(t9st.id, t9r3.id, mT3.id, mT7.id, [[9,4]], mT3.id, admin.id);
  await cGM(t9st.id, t9r3.id, mT5.id, mT6.id, [[9,6]], mT5.id, admin.id);
  // Juegos acum R1+R2+R3: mT1=18+9=27, mT0=16+9=25, mT2=18+7=25, mT3=15+9=24, mT4=15+5=20, mT5=9+9=18, mT7=13+4=17, mT6=8+6=14

  // ─── Ronda 4 (programada) ─────────────────────────────────────────────────────
  // Orden: mT1=27, mT0=25, mT2=25, mT3=24, mT4=20, mT5=18, mT7=17, mT6=14
  // Tiebreaker mT0 vs mT2: gw-gl: mT0=25-(4+6+5)=10, mT2=25-(5+6+7)=7 → mT0 segundo
  // Round 4: mT1 vs mT0, mT3 vs mT2, mT4 vs mT5, mT7 vs mT6
  const t9r4 = await prisma.group.create({ data: { stageId: t9st.id, name: "Ronda 4", order: 4 } });

  await sGM(t9st.id, t9r4.id, mT1.id, mT0.id);
  await sGM(t9st.id, t9r4.id, mT3.id, mT2.id);
  await sGM(t9st.id, t9r4.id, mT4.id, mT5.id);
  await sGM(t9st.id, t9r4.id, mT7.id, mT6.id);

  console.log("✓ T9 — Torneo Mexicano Masculino (en curso, MEXICANO, 3/4 rondas)");

  // ══════════════════════════════════════════════════════════════════════════════
  // Resumen
  // ══════════════════════════════════════════════════════════════════════════════
  console.log("\n✅ seed-extra completado!\n");
  console.log("Nuevos jugadores creados (todos con contraseña: jugador1234):");
  console.log("  Masculinos: Silva, Castro, Vidal, Arias, Molina, Sosa, Luna, Ponce, Suárez, Vargas, Reyes, Rojas");
  console.log("  Femeninas:  Medina, Ibarra, Campos, Reyes, Lara, Mora");
  console.log("\nTorneos agregados:");
  console.log("  T6: Gran Copa del Club     — IN_PROGRESS,         GROUP_PLAYOFF   (Masc 2da)");
  console.log("  T7: Torneo Americano Mixto — IN_PROGRESS,         AMERICANO        (Mixta)");
  console.log("  T8: Copa Master 2026       — REGISTRATION_OPEN,   SE/SE/RR/AMERIC  (4 cats)");
  console.log("  T9: Torneo Mexicano Masc   — IN_PROGRESS,         MEXICANO         (Masc 1ra)\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
