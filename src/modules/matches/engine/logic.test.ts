import { describe, it, expect } from "vitest";
import {
  nextPow2,
  winnerSideFromSets,
  computeGroupStandings,
  distributeIntoGroups,
  distributeIntoNumGroups,
  interleaveClassified,
  rankClassified,
  seedOrder,
  seedIntoBracket,
  type ClassifiedStanding,
  type GroupMatchData,
} from "./logic";

// ─── nextPow2 ─────────────────────────────────────────────────────────────────

describe("nextPow2", () => {
  it("devuelve la potencia de 2 exacta cuando n ya lo es", () => {
    expect(nextPow2(2)).toBe(2);
    expect(nextPow2(4)).toBe(4);
    expect(nextPow2(8)).toBe(8);
    expect(nextPow2(16)).toBe(16);
  });

  it("redondea hacia arriba a la siguiente potencia de 2", () => {
    expect(nextPow2(3)).toBe(4);
    expect(nextPow2(5)).toBe(8);
    expect(nextPow2(9)).toBe(16);
    expect(nextPow2(17)).toBe(32);
  });

  it("tiene un mínimo de 2 (cuadro más chico posible)", () => {
    expect(nextPow2(0)).toBe(2);
    expect(nextPow2(1)).toBe(2);
  });
});

// ─── winnerSideFromSets ───────────────────────────────────────────────────────

describe("winnerSideFromSets", () => {
  it("resuelve 2-0 al mejor de 3", () => {
    const sets = [
      { games1: 6, games2: 3 },
      { games1: 6, games2: 4 },
    ];
    expect(winnerSideFromSets(sets, 3)).toBe(1);
  });

  it("resuelve 2-1 al mejor de 3", () => {
    const sets = [
      { games1: 6, games2: 3 },
      { games1: 4, games2: 6 },
      { games1: 7, games2: 5 },
    ];
    expect(winnerSideFromSets(sets, 3)).toBe(1);
  });

  it("gana el lado 2", () => {
    const sets = [
      { games1: 3, games2: 6 },
      { games1: 2, games2: 6 },
    ];
    expect(winnerSideFromSets(sets, 3)).toBe(2);
  });

  it("devuelve null si el partido no está decidido (1-1 al mejor de 3)", () => {
    const sets = [
      { games1: 6, games2: 3 },
      { games1: 4, games2: 6 },
    ];
    expect(winnerSideFromSets(sets, 3)).toBeNull();
  });

  it("devuelve null sin sets cargados", () => {
    expect(winnerSideFromSets([], 3)).toBeNull();
  });

  it("ignora sets empatados (no deberían existir, pero no rompen)", () => {
    const sets = [
      { games1: 6, games2: 6 },
      { games1: 6, games2: 2 },
    ];
    // Solo 1 set ganado: al mejor de 3 se necesitan 2
    expect(winnerSideFromSets(sets, 3)).toBeNull();
  });

  it("al mejor de 1 set (setsPerMatch=1) alcanza con un set", () => {
    expect(winnerSideFromSets([{ games1: 6, games2: 4 }], 1)).toBe(1);
  });

  it("al mejor de 5 se necesitan 3 sets", () => {
    const twoSets = [
      { games1: 6, games2: 1 },
      { games1: 6, games2: 1 },
    ];
    expect(winnerSideFromSets(twoSets, 5)).toBeNull();
    expect(winnerSideFromSets([...twoSets, { games1: 6, games2: 0 }], 5)).toBe(1);
  });
});

// ─── computeGroupStandings ────────────────────────────────────────────────────

function match(
  side1TeamId: string,
  side2TeamId: string,
  winnerId: string | null,
  sets: [number, number][]
): GroupMatchData {
  return {
    side1TeamId,
    side2TeamId,
    winnerId,
    sets: sets.map(([games1, games2]) => ({ games1, games2 })),
  };
}

describe("computeGroupStandings", () => {
  it("ordena por puntos: 2 por victoria", () => {
    // A le gana a B y a C; B le gana a C
    const standings = computeGroupStandings([
      match("A", "B", "A", [[6, 2], [6, 3]]),
      match("A", "C", "A", [[6, 1], [6, 2]]),
      match("B", "C", "B", [[6, 4], [6, 4]]),
    ]);

    expect(standings.map((s) => s.teamId)).toEqual(["A", "B", "C"]);
    expect(standings[0].points).toBe(4);
    expect(standings[1].points).toBe(2);
    expect(standings[2].points).toBe(0);
  });

  it("desempata por diferencia de sets", () => {
    // Triángulo: A→B, B→C, C→A (todos 2 pts).
    // A gana 2-0 y pierde 1-2 → diff +1
    // B gana 2-1 y pierde 0-2 → diff -1
    // C gana 2-1 y pierde 1-2 → diff 0
    const standings = computeGroupStandings([
      match("A", "B", "A", [[6, 3], [6, 4]]),               // A 2-0 B
      match("B", "C", "B", [[6, 2], [3, 6], [6, 4]]),       // B 2-1 C
      match("C", "A", "C", [[6, 4], [2, 6], [7, 5]]),       // C 2-1 A
    ]);

    expect(standings.map((s) => s.teamId)).toEqual(["A", "C", "B"]);
  });

  it("desempata por diferencia de games cuando los sets empatan", () => {
    // A y B: 1 victoria cada uno, misma diff de sets, distinta diff de games
    const standings = computeGroupStandings([
      match("A", "B", "A", [[6, 0], [6, 0]]),  // A +12
      match("B", "A", "B", [[6, 4], [6, 4]]),  // B +4 → A queda -4+12 = +8, B = -12+4... recalculo abajo
    ]);

    // A: gw 6+6+4+4=20, gl 0+0+6+6=12 → +8
    // B: gw 0+0+6+6=12, gl 6+6+4+4=20 → -8
    expect(standings.map((s) => s.teamId)).toEqual(["A", "B"]);
    expect(standings[0].gamesWon - standings[0].gamesLost).toBe(8);
  });

  it("acumula estadísticas correctamente", () => {
    const standings = computeGroupStandings([
      match("A", "B", "A", [[6, 3], [4, 6], [6, 2]]),
    ]);

    const a = standings.find((s) => s.teamId === "A")!;
    const b = standings.find((s) => s.teamId === "B")!;

    expect(a).toMatchObject({ played: 1, won: 1, lost: 0, setsWon: 2, setsLost: 1, gamesWon: 16, gamesLost: 11, points: 2 });
    expect(b).toMatchObject({ played: 1, won: 0, lost: 1, setsWon: 1, setsLost: 2, gamesWon: 11, gamesLost: 16, points: 0 });
  });

  it("partido sin ganador (walkover sin winnerId) suma jugado pero no puntos", () => {
    const standings = computeGroupStandings([
      match("A", "B", null, []),
    ]);
    expect(standings[0].played).toBe(1);
    expect(standings[0].points).toBe(0);
    expect(standings[1].points).toBe(0);
  });

  it("grupo sin partidos devuelve tabla vacía", () => {
    expect(computeGroupStandings([])).toEqual([]);
  });
});

// ─── distributeIntoGroups ─────────────────────────────────────────────────────

describe("distributeIntoGroups", () => {
  it("8 equipos en grupos de 4 → 2 grupos de 4 intercalados", () => {
    const teams = ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8"];
    const groups = distributeIntoGroups(teams, 4);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toEqual(["t1", "t3", "t5", "t7"]);
    expect(groups[1]).toEqual(["t2", "t4", "t6", "t8"]);
  });

  it("grupos balanceados cuando no es divisible (7 equipos, size 4 → 4+3)", () => {
    const teams = ["t1", "t2", "t3", "t4", "t5", "t6", "t7"];
    const groups = distributeIntoGroups(teams, 4);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveLength(4);
    expect(groups[1]).toHaveLength(3);
  });

  it("cada equipo queda en exactamente un grupo", () => {
    const teams = Array.from({ length: 13 }, (_, i) => `t${i + 1}`);
    const groups = distributeIntoGroups(teams, 4);

    const all = groups.flat().sort();
    expect(all).toEqual([...teams].sort());
    // Balanceo: difieren a lo sumo en 1
    const sizes = groups.map((g) => g.length);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });

  it("menos equipos que groupSize → un solo grupo", () => {
    expect(distributeIntoGroups(["a", "b", "c"], 4)).toEqual([["a", "b", "c"]]);
  });
});

// ─── interleaveClassified ─────────────────────────────────────────────────────

describe("interleaveClassified", () => {
  it("intercala primeros y segundos de cada grupo (cuadro balanceado)", () => {
    const classified = interleaveClassified(
      [
        ["A1", "A2", "A3"],
        ["B1", "B2", "B3"],
      ],
      2
    );
    // Todos los 1ros primero, después los 2dos
    expect(classified).toEqual(["A1", "B1", "A2", "B2"]);
  });

  it("con 4 grupos y 2 que avanzan", () => {
    const classified = interleaveClassified(
      [
        ["A1", "A2"],
        ["B1", "B2"],
        ["C1", "C2"],
        ["D1", "D2"],
      ],
      2
    );
    expect(classified).toEqual(["A1", "B1", "C1", "D1", "A2", "B2", "C2", "D2"]);
  });

  it("ignora slots vacíos si un grupo tiene menos clasificados", () => {
    const classified = interleaveClassified([["A1", "A2"], ["B1"]], 2);
    expect(classified).toEqual(["A1", "B1", "A2"]);
  });
});

// ─── distributeIntoNumGroups ──────────────────────────────────────────────────

describe("distributeIntoNumGroups", () => {
  it("19 equipos en 6 grupos → uno de 4 y cinco de 3", () => {
    const teams = Array.from({ length: 19 }, (_, i) => `t${i + 1}`);
    const groups = distributeIntoNumGroups(teams, 6);
    expect(groups).toHaveLength(6);
    expect(groups.map((g) => g.length).sort((a, b) => b - a)).toEqual([4, 3, 3, 3, 3, 3]);
    expect(groups.flat().sort()).toEqual([...teams].sort());
  });

  it("reparte exacto cuando la división es entera", () => {
    const teams = Array.from({ length: 12 }, (_, i) => `t${i + 1}`);
    const groups = distributeIntoNumGroups(teams, 4);
    expect(groups.map((g) => g.length)).toEqual([3, 3, 3, 3]);
  });

  it("no crea más grupos que equipos", () => {
    const groups = distributeIntoNumGroups(["a", "b", "c"], 5);
    expect(groups).toHaveLength(3);
    expect(groups.map((g) => g.length)).toEqual([1, 1, 1]);
  });
});

// ─── seedOrder / seedIntoBracket ──────────────────────────────────────────────

describe("seedOrder", () => {
  it("cuadro de 8: siembra estándar", () => {
    expect(seedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });

  it("los seeds 1 y 2 quedan en mitades opuestas (solo se cruzan en la final)", () => {
    const order = seedOrder(16);
    const half = order.length / 2;
    const idx1 = order.indexOf(1);
    const idx2 = order.indexOf(2);
    expect(idx1 < half).not.toBe(idx2 < half);
  });
});

describe("seedIntoBracket", () => {
  it("con 6 equipos en cuadro de 8, los seeds 1 y 2 reciben bye (pasan directo a semis)", () => {
    const teams = ["s1", "s2", "s3", "s4", "s5", "s6"];
    const slots = seedIntoBracket(teams, 8);
    // pares: (slot0,slot1), (slot2,slot3), ...
    const pairs = [0, 2, 4, 6].map((i) => [slots[i], slots[i + 1]]);
    const byes = pairs.filter(([, b]) => b === null).map(([a]) => a);
    expect(byes.sort()).toEqual(["s1", "s2"]);
  });

  it("con 12 equipos en cuadro de 16, los 4 mejores reciben bye", () => {
    const teams = Array.from({ length: 12 }, (_, i) => `s${i + 1}`);
    const slots = seedIntoBracket(teams, 16);
    const pairs = Array.from({ length: 8 }, (_, i) => [slots[i * 2], slots[i * 2 + 1]]);
    const byes = pairs.filter(([, b]) => b === null).map(([a]) => a);
    expect(byes.sort()).toEqual(["s1", "s2", "s3", "s4"]);
  });

  it("el primer slot de cada par nunca es null si hay al menos la mitad de equipos", () => {
    const teams = Array.from({ length: 10 }, (_, i) => `s${i + 1}`);
    const slots = seedIntoBracket(teams, 16);
    for (let i = 0; i < slots.length; i += 2) {
      expect(slots[i]).not.toBeNull();
    }
  });
});

// ─── rankClassified ───────────────────────────────────────────────────────────

describe("rankClassified", () => {
  const base = { setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0 };

  it("ordena 1ros antes que 2dos, y dentro por puntos promedio (no absolutos)", () => {
    const standings: ClassifiedStanding[] = [
      // Ganador de grupo de 4: 3 victorias en 3 partidos (6 pts, promedio 2)
      { teamId: "w-big", position: 1, points: 6, matchesPlayed: 3, ...base },
      // Ganador de grupo de 3: 2 victorias en 2 partidos (4 pts, promedio 2, peor dif de sets)
      { teamId: "w-small", position: 1, points: 4, matchesPlayed: 2, ...base, setsWon: 4, setsLost: 1 },
      // 2do de grupo
      { teamId: "runner", position: 2, points: 2, matchesPlayed: 2, ...base },
      // 3ro: no clasifica con advancePerGroup=2
      { teamId: "third", position: 3, points: 0, matchesPlayed: 2, ...base },
    ];
    const ranked = rankClassified(standings, 2);
    expect(ranked).toHaveLength(3);
    expect(ranked[2]).toBe("runner");
    // w-small gana el desempate por diferencia de sets promedio
    expect(ranked[0]).toBe("w-small");
    expect(ranked[1]).toBe("w-big");
  });

  it("excluye posiciones fuera del corte", () => {
    const standings: ClassifiedStanding[] = [
      { teamId: "a", position: 1, points: 4, matchesPlayed: 2, ...base },
      { teamId: "b", position: 2, points: 2, matchesPlayed: 2, ...base },
    ];
    expect(rankClassified(standings, 1)).toEqual(["a"]);
  });
});
