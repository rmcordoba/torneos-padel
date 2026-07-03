/**
 * Cálculo de precio de un turno según las franjas horarias de la sede.
 *
 * Las franjas (PriceRule) definen una tarifa POR HORA para un rango de minutos.
 * El precio de un turno se calcula PRORRATEADO: cada minuto del turno se cobra
 * a la tarifa de la franja en la que cae. Así:
 *   - 1 hora a $25.000/h  → $25.000
 *   - media hora           → $12.500
 *   - un turno que cruza dos franjas suma la porción de cada una.
 *
 * Los minutos que no caen en ninguna franja usan `fallbackPerHour` (la tarifa
 * base de la cancha) si está definida; si no, no suman.
 */

export interface PriceBand {
  startMinute: number;
  endMinute: number;
  pricePerHour: number;
}

/** Tarifa por hora vigente en un minuto puntual (o null si ninguna franja lo cubre). */
function rateAtMinute(bands: PriceBand[], minute: number): number | null {
  const b = bands.find((x) => minute >= x.startMinute && minute < x.endMinute);
  return b ? b.pricePerHour : null;
}

/**
 * Precio total de un turno [startMinute, endMinute) según las franjas de la sede.
 * Devuelve `null` si no se pudo determinar ningún precio (ni franjas ni fallback).
 */
export function computeBookingPrice(
  bands: PriceBand[],
  startMinute: number,
  endMinute: number,
  fallbackPerHour: number | null = null,
): number | null {
  if (endMinute <= startMinute) return null;
  let total = 0;
  let priced = false;
  // Recorremos minuto a minuto (un turno son a lo sumo unas pocas horas → trivial).
  for (let m = startMinute; m < endMinute; m++) {
    const rate = rateAtMinute(bands, m) ?? fallbackPerHour;
    if (rate != null) {
      total += rate / 60;
      priced = true;
    }
  }
  return priced ? Math.round(total) : null;
}
