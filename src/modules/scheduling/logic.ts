// Lógica pura de scheduling (sin DB), testeada en logic.test.ts.

/** Duración asumida (min) cuando no se carga hora de fin, para detectar solapamientos. */
export const DEFAULT_MATCH_MINUTES = 90;

/** Fin efectivo de un intervalo: el real, o inicio + duración por defecto. */
export function effectiveEnd(start: Date, end: Date | null): Date {
  return end ?? new Date(start.getTime() + DEFAULT_MATCH_MINUTES * 60_000);
}

/** Dos intervalos se solapan si comparten tiempo (los bordes que se tocan NO cuentan). */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** "HH:MM" a partir de minutos desde medianoche (1440 → 00:00). */
export function minutesLabel(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Valida un intervalo contra el horario de apertura de la sede.
 * Devuelve un mensaje de error o null si es válido.
 */
export function checkVenueHours(
  start: Date,
  end: Date,
  schedule: { isClosed: boolean; openMinute: number; closeMinute: number }
): string | null {
  if (schedule.isClosed) return "La sede está cerrada ese día";

  const startMin = start.getHours() * 60 + start.getMinutes();
  const endMin = startMin + Math.round((end.getTime() - start.getTime()) / 60_000);

  if (startMin < schedule.openMinute || endMin > schedule.closeMinute) {
    return `El horario está fuera del horario de la sede (${minutesLabel(schedule.openMinute)}–${minutesLabel(schedule.closeMinute)})`;
  }
  return null;
}
