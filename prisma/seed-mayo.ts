/**
 * seed-mayo.ts
 * Crea el "Gran Premio de Mayo 2026" — torneo IN_PROGRESS transcurriendo en mayo 2026.
 *
 * Categorías:
 *   - Masculina 1ra: GROUP_PLAYOFF, 8 equipos, 2 grupos de 4.
 *     Fase de grupos en curso (3 partidos completados por grupo, 3 pendientes).
 *   - Femenina 1ra:  SINGLE_ELIMINATION, 4 equipos.
 *     Semis completadas, final programada.
 *
 * NO borra datos existentes. Idempotente por nombre de torneo.
 * Ejecutar: npx tsx prisma/seed-mayo.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── helpers ──────────────────────────────────────────────────────────────────

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

// Posición en tabla de grupo
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
  console.log("🌱 seed-mayo: creando Gran Premio de Mayo 2026...");

  // ── Datos base ────────────────────────────────────────────────────────────────
  const org   = await prisma.organizer.findUniqueOrThrow({ where: { slug: "club-padel-palermo" } });
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@padel.local" } });
  const catM1 = await prisma.category.findUniqueOrThrow({ where: { organizerId_name: { organizerId: org.id, name: "Masculina 1ra" } } });
  const catF1 = await prisma.category.findUniqueOrThrow({ where: { organizerId_name: { organizerId: org.id, name: "Femenina 1ra"  } } });

  // Idempotencia
  const already = await prisma.tournament.findFirst({
    where: { organizerId: org.id, name: "Gran Premio de Mayo 2026" },
  });
  if (already) {
    console.log("ℹ  Gran Premio de Mayo 2026 ya existe — omitiendo.");
    return;
  }

  // ── Jugadores ─────────────────────────────────────────────────────────────────
  // Masculinos (p0–p15) — existen desde seed.ts
  const [p0,p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15] = await Promise.all([
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "carlos.torres@padel.local"   } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "diego.sanchez@padel.local"    } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "martin.garcia@padel.local"    } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "pablo.lopez@padel.local"      } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "rodrigo.herrera@padel.local"  } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "facundo.morales@padel.local"  } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "nicolas.peralta@padel.local"  } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "sebastian.rios@padel.local"   } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "ezequiel.vega@padel.local"    } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "lucas.mendez@padel.local"     } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "agustin.blanco@padel.local"   } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "mateo.costa@padel.local"      } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "federico.ramos@padel.local"   } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "leandro.cruz@padel.local"     } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "tomas.ortega@padel.local"     } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "ignacio.flores@padel.local"   } })).id } }),
  ]);

  // Femeninas (f0–f7)
  const [f0,f1,f2,f3,f4,f5,f6,f7] = await Promise.all([
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "valentina.ruiz@padel.local"    } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "camila.fernandez@padel.local"  } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "lucia.martinez@padel.local"    } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "sofia.gonzalez@padel.local"    } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "maria.diaz@padel.local"        } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "florencia.perez@padel.local"   } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "jimena.acosta@padel.local"     } })).id } }),
    prisma.playerProfile.findUniqueOrThrow({ where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "daniela.romero@padel.local"    } })).id } }),
  ]);

  // ── Equipos ───────────────────────────────────────────────────────────────────
  // Masculinos (mT0–mT7)
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

  // Femeninos (fT0–fT3)
  const [fT0,fT1,fT2,fT3] = await Promise.all([
    findOrCreateTeam(f0.id, f1.id),  // Ruiz / Fernández
    findOrCreateTeam(f2.id, f3.id),  // Martínez / González
    findOrCreateTeam(f4.id, f5.id),  // Díaz / Pérez
    findOrCreateTeam(f6.id, f7.id),  // Acosta / Romero
  ]);

  // ══════════════════════════════════════════════════════════════════════════════
  // TORNEO: Gran Premio de Mayo 2026  (IN_PROGRESS, 16–25 mayo 2026)
  // ══════════════════════════════════════════════════════════════════════════════

  const torneo = await prisma.tournament.create({
    data: {
      organizerId: org.id,
      name: "Gran Premio de Mayo 2026",
      description: "El gran torneo de mitad de temporada. Fase de grupos en pleno desarrollo.",
      status: "IN_PROGRESS",
      startDate: new Date("2026-05-16"),
      endDate: new Date("2026-05-25"),
      isPublic: true,
      publishedAt: new Date("2026-05-01"),
    },
  });

  console.log(`  Torneo creado: ${torneo.id}`);

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORÍA 1: Masculina 1ra — GROUP_PLAYOFF, 8 equipos
  // Fase de grupos en curso: 2 grupos de 4, 3 partidos completados / 3 pendientes por grupo
  // ─────────────────────────────────────────────────────────────────────────────

  const tcM = await prisma.tournamentCategory.create({
    data: {
      tournamentId: torneo.id,
      categoryId: catM1.id,
      format: "GROUP_PLAYOFF",
      status: "IN_PROGRESS",
      maxTeams: 8,
      minTeams: 4,
      setsPerMatch: 3,
      formatConfig: { groupSize: 4, teamsAdvancePerGroup: 2 },
    },
  });

  // Registraciones
  for (const t of [mT0,mT1,mT2,mT3,mT4,mT5,mT6,mT7]) await reg(tcM.id, t.id);

  // Stage: fase de grupos
  const stageGrupos = await prisma.stage.create({
    data: {
      tournamentCategoryId: tcM.id,
      name: "Fase de Grupos",
      type: "GROUPS",
      order: 1,
      isCompleted: false,
    },
  });

  // Grupo A: Torres/Sánchez (mT0), García/López (mT1), Herrera/Morales (mT2), Peralta/Ríos (mT3)
  const grpA = await prisma.group.create({ data: { stageId: stageGrupos.id, name: "Grupo A", order: 1 } });

  // Grupo A — partidos completados (rondas 1 y 2)
  await cGM(stageGrupos.id, grpA.id, mT0.id, mT1.id, [[6,3],[7,5]], mT0.id, admin.id); // mT0 vence mT1
  await cGM(stageGrupos.id, grpA.id, mT2.id, mT3.id, [[6,4],[6,2]], mT2.id, admin.id); // mT2 vence mT3
  await cGM(stageGrupos.id, grpA.id, mT0.id, mT2.id, [[6,2],[6,3]], mT0.id, admin.id); // mT0 vence mT2

  // Grupo A — partidos pendientes (ronda 3)
  await sGM(stageGrupos.id, grpA.id, mT1.id, mT3.id);
  await sGM(stageGrupos.id, grpA.id, mT0.id, mT3.id);
  await sGM(stageGrupos.id, grpA.id, mT1.id, mT2.id);

  // Tabla Grupo A (tras 3 partidos disputados)
  // mT0: 2 jugados, 2G-0P, 4 sets ganados, 0 perdidos, pts=6
  // mT2: 2 jugados, 1G-1P, 2 sets ganados, 2 perdidos, pts=3
  // mT1: 1 jugado,  0G-1P, 0 sets ganados, 2 perdidos, pts=0
  // mT3: 1 jugado,  0G-1P, 0 sets ganados, 2 perdidos, pts=0
  await gs(grpA.id, mT0.id, 1, 2, 2, 0, 4, 0, 25, 12, 6);
  await gs(grpA.id, mT2.id, 2, 2, 1, 1, 2, 2, 18, 16, 3);
  await gs(grpA.id, mT1.id, 3, 1, 0, 1, 0, 2,  8, 13, 0);
  await gs(grpA.id, mT3.id, 4, 1, 0, 1, 0, 2,  6, 12, 0);

  // Grupo B: Vega/Méndez (mT4), Blanco/Costa (mT5), Ramos/Cruz (mT6), Ortega/Flores (mT7)
  const grpB = await prisma.group.create({ data: { stageId: stageGrupos.id, name: "Grupo B", order: 2 } });

  // Grupo B — partidos completados
  await cGM(stageGrupos.id, grpB.id, mT4.id, mT5.id, [[6,3],[6,4]], mT4.id, admin.id); // mT4 vence mT5
  await cGM(stageGrupos.id, grpB.id, mT6.id, mT7.id, [[4,6],[3,6]], mT7.id, admin.id); // mT7 vence mT6
  await cGM(stageGrupos.id, grpB.id, mT4.id, mT6.id, [[6,1],[6,2]], mT4.id, admin.id); // mT4 vence mT6

  // Grupo B — partidos pendientes
  await sGM(stageGrupos.id, grpB.id, mT5.id, mT7.id);
  await sGM(stageGrupos.id, grpB.id, mT4.id, mT7.id);
  await sGM(stageGrupos.id, grpB.id, mT5.id, mT6.id);

  // Tabla Grupo B
  await gs(grpB.id, mT4.id, 1, 2, 2, 0, 4, 0, 24, 10, 6);
  await gs(grpB.id, mT7.id, 2, 1, 1, 0, 2, 0, 12,  7, 3);
  await gs(grpB.id, mT6.id, 3, 2, 0, 2, 0, 4,  6, 18, 0);
  await gs(grpB.id, mT5.id, 4, 1, 0, 1, 0, 2,  7, 12, 0);

  // Stage: eliminación directa (placeholder, aún no iniciado)
  await prisma.stage.create({
    data: {
      tournamentCategoryId: tcM.id,
      name: "Eliminación Directa",
      type: "SINGLE_ELIMINATION",
      order: 2,
      isCompleted: false,
    },
  });

  console.log("  Masculina 1ra — fase de grupos creada.");

  // ─────────────────────────────────────────────────────────────────────────────
  // CATEGORÍA 2: Femenina 1ra — SINGLE_ELIMINATION, 4 equipos
  // Semis completadas, final programada
  // ─────────────────────────────────────────────────────────────────────────────

  const tcF = await prisma.tournamentCategory.create({
    data: {
      tournamentId: torneo.id,
      categoryId: catF1.id,
      format: "SINGLE_ELIMINATION",
      status: "IN_PROGRESS",
      maxTeams: 4,
      minTeams: 4,
      setsPerMatch: 3,
    },
  });

  // Registraciones
  for (const t of [fT0,fT1,fT2,fT3]) await reg(tcF.id, t.id);

  // Stage: cuadro principal
  const stageSE = await prisma.stage.create({
    data: {
      tournamentCategoryId: tcF.id,
      name: "Cuadro principal",
      type: "SINGLE_ELIMINATION",
      order: 1,
      isCompleted: false,
    },
  });

  // Nodos SE-4: Final (round=1), SF1 y SF2 (round=2)
  const nFinal = await prisma.bracketNode.create({ data: { stageId: stageSE.id, round: 1, position: 1 } });
  const nSF1   = await prisma.bracketNode.create({ data: { stageId: stageSE.id, round: 2, position: 1, parentNodeId: nFinal.id } });
  const nSF2   = await prisma.bracketNode.create({ data: { stageId: stageSE.id, round: 2, position: 2, parentNodeId: nFinal.id } });

  // SF1: Ruiz/Fernández vence Acosta/Romero
  await cBM(stageSE.id, nSF1.id, fT0.id, fT3.id, [[6,4],[6,3]], fT0.id, admin.id);

  // SF2: Martínez/González vence Díaz/Pérez
  await cBM(stageSE.id, nSF2.id, fT2.id, fT1.id, [[7,5],[6,4]], fT2.id, admin.id);

  // Final: Ruiz/Fernández vs Martínez/González — PROGRAMADA
  await sBM(stageSE.id, nFinal.id, fT0.id, fT2.id);

  console.log("  Femenina 1ra — semis completadas, final programada.");
  console.log("✅ Gran Premio de Mayo 2026 creado exitosamente.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
