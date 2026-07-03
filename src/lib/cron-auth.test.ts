import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isCronAuthorized } from "./cron-auth";

function makeRequest(authHeader?: string): Request {
  return new Request("http://localhost/api/cron/test", {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe("isCronAuthorized", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
  });

  it("acepta el Bearer token correcto", () => {
    vi.stubEnv("CRON_SECRET", "super-secreto");
    expect(isCronAuthorized(makeRequest("Bearer super-secreto"))).toBe(true);
  });

  it("rechaza un token incorrecto", () => {
    vi.stubEnv("CRON_SECRET", "super-secreto");
    expect(isCronAuthorized(makeRequest("Bearer otro"))).toBe(false);
  });

  it("rechaza sin header de autorización", () => {
    vi.stubEnv("CRON_SECRET", "super-secreto");
    expect(isCronAuthorized(makeRequest())).toBe(false);
  });

  it("fail-closed: sin CRON_SECRET en producción rechaza todo", () => {
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(isCronAuthorized(makeRequest())).toBe(false);
    expect(isCronAuthorized(makeRequest("Bearer cualquiercosa"))).toBe(false);
  });

  it("sin CRON_SECRET en desarrollo permite (para pruebas locales)", () => {
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(isCronAuthorized(makeRequest())).toBe(true);
  });
});
