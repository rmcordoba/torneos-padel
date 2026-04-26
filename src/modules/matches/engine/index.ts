import type { CompetitionFormat } from "@prisma/client";
import type { FormatEngine } from "./types";
import { SingleEliminationEngine } from "./single-elimination";
import { GroupPlayoffEngine } from "./group-playoff";
import { RoundRobinEngine } from "./round-robin";
import { AmericanoEngine } from "./americano";
import { MexicanoEngine } from "./mexicano";
import { DoubleEliminationEngine } from "./double-elimination";

export function getFormatEngine(format: CompetitionFormat): FormatEngine {
  switch (format) {
    case "SINGLE_ELIMINATION":
      return new SingleEliminationEngine();
    case "GROUP_PLAYOFF":
      return new GroupPlayoffEngine();
    case "ROUND_ROBIN":
      return new RoundRobinEngine();
    case "AMERICANO":
      return new AmericanoEngine();
    case "MEXICANO":
      return new MexicanoEngine();
    case "DOUBLE_ELIMINATION":
      return new DoubleEliminationEngine();
    default:
      throw new Error(`Formato "${format}" no implementado`);
  }
}

export type { FormatEngine };
