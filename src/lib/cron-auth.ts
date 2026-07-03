import { timingSafeEqual } from "crypto";

/**
 * Autoriza requests a los endpoints de cron (/api/cron/*).
 *
 * Fail-closed: si CRON_SECRET no está configurado, solo se permite en
 * desarrollo. El secreto viaja únicamente por header (Authorization: Bearer),
 * nunca por query string, para que no quede en logs de acceso ni referrers.
 *
 * Vercel Cron envía automáticamente `Authorization: Bearer ${CRON_SECRET}`.
 */
export function isCronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    // Sin secreto configurado: solo permitir en desarrollo local.
    return process.env.NODE_ENV !== "production";
  }

  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;

  // Comparación en tiempo constante para evitar timing attacks
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
