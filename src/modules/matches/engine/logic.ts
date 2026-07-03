// Lógica pura del motor de competencia (sin DB).
// Extraída de los engines para poder testearla de forma aislada.

// ─── Brackets ─────────────────────────────────────────────────────────────────

/** Menor potencia de 2 >= n (tamaño del cuadro). Mínimo 2. */
export function nextPow2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(Math.max(n, 2))));
}

// ─── Resolución de ganador por sets ───────────────────────────────────────────

export interface SetScore {
  games1: number;
  games2: number;
}

/**
 * Determina el lado ganador (1 | 2) a partir de los sets, o null si el
 * partido aún no está decidido. Gana el primero en llegar a ceil(setsPerMatch/2).
 */
export function winnerSideFromSets(sets: SetScore[], setsPerMatch: number): 1 | 2 | null {
  const setsToWin = Math.ceil(setsPerMatch / 2);
  let wins1 = 0;
  let wins2 = 0;

  for (const set of sets) {
    if (set.games1 > set.games2) wins1++;
    else if (set.games2 > set.games1) wins2++;
  }

  if (wins1 >= setsToWin) return 1;
  if (wins2 >= setsToWin) return 2;
  return null;
}

// ─── Standings de grupos ──────────────────────────────────────────────────────

export interface GroupMatchData {
  side1TeamId: string;
  side2TeamId: string;
  winnerId: string | null;
  sets: SetScore[];
}

export interface TeamStats {
  teamId: string;
  played: number;
  won: number;
  lost: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  points: number;
}

/**
 * Calcula la tabla de posiciones de un grupo a partir de sus partidos
 * completados. Orden: puntos (2 por victoria) → diferencia de sets →
 * diferencia de games. Devuelve el array ya ordenado (índice 0 = 1er puesto).
 */
export function computeGroupStandings(matches: GroupMatchData[]): TeamStats[] {
  const stats = new Map<string, TeamStats>();

  const ensure = (teamId: string): TeamStats => {
    let s = stats.get(teamId);
    if (!s) {
      s = { teamId, played: 0, won: 0, lost: 0, setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0, points: 0 };
      stats.set(teamId, s);
    }
    return s;
  };

  for (const match of matches) {
    const s1 = ensure(match.side1TeamId);
    const s2 = ensure(match.side2TeamId);

    s1.played++;
    s2.played++;

    for (const set of match.sets) {
      s1.gamesWon += set.games1;
      s1.gamesLost += set.games2;
      s2.gamesWon += set.games2;
      s2.gamesLost += set.games1;

      if (set.games1 > set.games2) {
        s1.setsWon++;
        s2.setsLost++;
      } else if (set.games2 > set.games1) {
        s2.setsWon++;
        s1.setsLost++;
      }
    }

    if (match.winnerId === match.side1TeamId) {
      s1.won++;
      s1.points += 2;
      s2.lost++;
    } else if (match.winnerId === match.side2TeamId) {
      s2.won++;
      s2.points += 2;
      s1.lost++;
    }
  }

  return [...stats.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const setDiffA = a.setsWon - a.setsLost;
    const setDiffB = b.setsWon - b.setsLost;
    if (setDiffB !== setDiffA) return setDiffB - setDiffA;
    return (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost);
  });
}

// ─── Distribución en grupos ───────────────────────────────────────────────────

/**
 * Distribuye equipos en grupos de forma intercalada (serpiente simple):
 * con N grupos, el equipo i va al grupo i % N. Mantiene los grupos balanceados
 * (difieren a lo sumo en 1 integrante).
 */
export function distributeIntoGroups(teamIds: string[], groupSize: number): string[][] {
  const numGroups = Math.max(1, Math.ceil(teamIds.length / groupSize));
  const groups: string[][] = Array.from({ length: numGroups }, () => []);
  teamIds.forEach((teamId, i) => {
    groups[i % numGroups].push(teamId);
  });
  return groups;
}

/**
 * Distribuye equipos en una cantidad EXACTA de grupos (serpiente simple:
 * el equipo i va al grupo i % numGroups). Los grupos quedan balanceados
 * (difieren a lo sumo en 1 integrante). Ej: 19 equipos en 6 grupos →
 * un grupo de 4 y cinco de 3.
 */
export function distributeIntoNumGroups(teamIds: string[], numGroups: number): string[][] {
  const n = Math.max(1, Math.min(numGroups, teamIds.length));
  const groups: string[][] = Array.from({ length: n }, () => []);
  teamIds.forEach((teamId, i) => {
    groups[i % n].push(teamId);
  });
  return groups;
}

/**
 * Arma la lista de clasificados al playoff intercalando posiciones:
 * primero todos los 1ros de cada grupo, después los 2dos, etc.
 * `groupStandings` = por grupo, teamIds ordenados por posición (índice 0 = 1ro).
 */
export function interleaveClassified(groupStandings: string[][], advancePerGroup: number): string[] {
  const classified: string[] = [];
  for (let slot = 0; slot < advancePerGroup; slot++) {
    for (const standings of groupStandings) {
      const teamId = standings[slot];
      if (teamId) classified.push(teamId);
    }
  }
  return classified;
}

// ─── Seeding del playoff ──────────────────────────────────────────────────────

export interface ClassifiedStanding {
  teamId: string;
  /** Posición dentro de su grupo (1 = ganador de grupo). */
  position: number;
  points: number;
  matchesPlayed: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
}

/**
 * Ordena los clasificados por mérito para sembrar el playoff:
 * 1º todos los ganadores de grupo, después los 2dos, etc.; dentro de cada
 * posición se compara el desempeño PROMEDIO por partido (puntos, luego
 * diferencia de sets, luego diferencia de games) para no penalizar a los
 * equipos de grupos más chicos, que jugaron menos partidos.
 */
export function rankClassified(
  standings: ClassifiedStanding[],
  advancePerGroup: number
): string[] {
  const perMatch = (value: number, played: number) => (played > 0 ? value / played : 0);

  return standings
    .filter((s) => s.position <= advancePerGroup)
    .sort((a, b) => {
      if (a.position !== b.position) return a.position - b.position;
      const pA = perMatch(a.points, a.matchesPlayed);
      const pB = perMatch(b.points, b.matchesPlayed);
      if (pB !== pA) return pB - pA;
      const setDiffA = perMatch(a.setsWon - a.setsLost, a.matchesPlayed);
      const setDiffB = perMatch(b.setsWon - b.setsLost, b.matchesPlayed);
      if (setDiffB !== setDiffA) return setDiffB - setDiffA;
      return perMatch(b.gamesWon - b.gamesLost, b.matchesPlayed) - perMatch(a.gamesWon - a.gamesLost, a.matchesPlayed);
    })
    .map((s) => s.teamId);
}

/**
 * Orden estándar de siembra para un cuadro de `bracketSize` slots (potencia
 * de 2). Devuelve, por slot, el número de seed (1-indexado) que va ahí.
 * Propiedades: el seed 1 y el 2 solo pueden cruzarse en la final, y los byes
 * (seeds inexistentes) les tocan a los mejores sembrados.
 * Ej. bracketSize=8 → [1, 8, 4, 5, 2, 7, 3, 6].
 */
export function seedOrder(bracketSize: number): number[] {
  let order = [1];
  for (let size = 2; size <= bracketSize; size *= 2) {
    const next: number[] = [];
    for (const seed of order) {
      next.push(seed);
      next.push(size + 1 - seed);
    }
    order = next;
  }
  return order;
}

/**
 * Ubica los equipos (ordenados por seed: índice 0 = mejor) en los slots del
 * cuadro según la siembra estándar. Slots sin equipo (null) son byes, y por
 * construcción quedan emparejados con los mejores seeds: con 6 equipos en un
 * cuadro de 8, los seeds 1 y 2 saltean la primera ronda directo a semis.
 */
export function seedIntoBracket(teamIds: string[], bracketSize: number): (string | null)[] {
  return seedOrder(bracketSize).map((seed) => teamIds[seed - 1] ?? null);
}
