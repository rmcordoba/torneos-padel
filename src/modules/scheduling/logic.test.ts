import { describe, it, expect } from "vitest";
import { effectiveEnd, overlaps, minutesLabel, checkVenueHours, DEFAULT_MATCH_MINUTES } from "./logic";

const d = (time: string) => new Date(`2026-07-06T${time}:00`); // lunes

describe("overlaps", () => {
  it("detecta solapamiento parcial", () => {
    expect(overlaps(d("10:00"), d("11:30"), d("11:00"), d("12:30"))).toBe(true);
  });

  it("detecta contención total", () => {
    expect(overlaps(d("10:00"), d("13:00"), d("11:00"), d("12:00"))).toBe(true);
  });

  it("intervalos que solo se tocan en el borde NO se solapan", () => {
    // Partido 10:00–11:30 y partido 11:30–13:00 en la misma cancha: válido
    expect(overlaps(d("10:00"), d("11:30"), d("11:30"), d("13:00"))).toBe(false);
    expect(overlaps(d("11:30"), d("13:00"), d("10:00"), d("11:30"))).toBe(false);
  });

  it("intervalos disjuntos no se solapan", () => {
    expect(overlaps(d("08:00"), d("09:00"), d("20:00"), d("21:00"))).toBe(false);
  });
});

describe("effectiveEnd", () => {
  it("usa el fin real cuando existe", () => {
    expect(effectiveEnd(d("10:00"), d("12:00")).getTime()).toBe(d("12:00").getTime());
  });

  it("asume la duración por defecto cuando no hay fin", () => {
    const end = effectiveEnd(d("10:00"), null);
    expect(end.getTime() - d("10:00").getTime()).toBe(DEFAULT_MATCH_MINUTES * 60_000);
  });
});

describe("minutesLabel", () => {
  it("formatea minutos desde medianoche", () => {
    expect(minutesLabel(480)).toBe("08:00");
    expect(minutesLabel(1380)).toBe("23:00");
    expect(minutesLabel(90)).toBe("01:30");
  });

  it("1440 (medianoche del día siguiente) se muestra como 00:00", () => {
    expect(minutesLabel(1440)).toBe("00:00");
  });
});

describe("checkVenueHours", () => {
  const abierto = { isClosed: false, openMinute: 480, closeMinute: 1380 }; // 08:00–23:00

  it("acepta un horario dentro del rango", () => {
    expect(checkVenueHours(d("10:00"), d("11:30"), abierto)).toBeNull();
  });

  it("acepta exactamente en los bordes", () => {
    expect(checkVenueHours(d("08:00"), d("09:30"), abierto)).toBeNull();
    expect(checkVenueHours(d("21:30"), d("23:00"), abierto)).toBeNull();
  });

  it("rechaza si empieza antes de la apertura", () => {
    expect(checkVenueHours(d("07:30"), d("09:00"), abierto)).toContain("fuera del horario");
  });

  it("rechaza si termina después del cierre", () => {
    expect(checkVenueHours(d("22:30"), d("23:30"), abierto)).toContain("fuera del horario");
  });

  it("rechaza día cerrado", () => {
    expect(
      checkVenueHours(d("10:00"), d("11:00"), { isClosed: true, openMinute: 0, closeMinute: 1440 })
    ).toBe("La sede está cerrada ese día");
  });

  it("incluye el rango de la sede en el mensaje", () => {
    expect(checkVenueHours(d("06:00"), d("07:00"), abierto)).toBe(
      "El horario está fuera del horario de la sede (08:00–23:00)"
    );
  });

  it("sede que cierra a medianoche (closeMinute 1440) permite hasta las 00:00", () => {
    const hastaMedianoche = { isClosed: false, openMinute: 480, closeMinute: 1440 };
    // 23:00 + 60 min = minuto 1440 exacto → válido
    expect(checkVenueHours(d("23:00"), new Date(d("23:00").getTime() + 60 * 60_000), hastaMedianoche)).toBeNull();
  });
});
