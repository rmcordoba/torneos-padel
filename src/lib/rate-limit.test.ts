import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("permite hasta el límite y bloquea el siguiente intento", () => {
    const key = `test-limit-${Date.now()}-a`;
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(false);
    expect(checkRateLimit(key, 3, 60_000)).toBe(false);
  });

  it("resetea el contador cuando expira la ventana", () => {
    const key = `test-limit-${Date.now()}-b`;
    expect(checkRateLimit(key, 1, 60_000)).toBe(true);
    expect(checkRateLimit(key, 1, 60_000)).toBe(false);

    vi.advanceTimersByTime(60_001);

    expect(checkRateLimit(key, 1, 60_000)).toBe(true);
  });

  it("las claves son independientes entre sí", () => {
    const base = `test-limit-${Date.now()}`;
    expect(checkRateLimit(`${base}-c1`, 1, 60_000)).toBe(true);
    expect(checkRateLimit(`${base}-c1`, 1, 60_000)).toBe(false);
    // Otra clave (otra IP / otra acción) no se ve afectada
    expect(checkRateLimit(`${base}-c2`, 1, 60_000)).toBe(true);
  });
});
