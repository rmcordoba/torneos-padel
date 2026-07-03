import { headers } from "next/headers";

/**
 * Rate limiter en memoria (ventana fija) para proteger acciones sensibles
 * (login, registro, reset de contraseña) contra fuerza bruta.
 *
 * Limitación conocida: el estado vive en la instancia del proceso. En un
 * deploy serverless con múltiples instancias el límite es por instancia
 * (sigue frenando ataques de una misma fuente, que golpean instancias
 * calientes). Si se escala, migrar a un store compartido (p. ej. Upstash
 * Redis con @upstash/ratelimit).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Limpieza perezosa para que el Map no crezca sin límite.
function sweep(now: number) {
  if (buckets.size < 10_000) return;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Registra un intento para `key` y devuelve si está permitido.
 * @param key      identificador (ej: "login:1.2.3.4")
 * @param limit    máximo de intentos dentro de la ventana
 * @param windowMs duración de la ventana en ms
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  bucket.count++;
  return bucket.count <= limit;
}

/** IP del cliente para usar como clave de rate limit (server actions / route handlers). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  // x-forwarded-for puede traer una lista: el primer valor es el cliente
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** Helper combinado: limita `action` por IP. Devuelve true si está permitido. */
export async function rateLimitByIp(action: string, limit: number, windowMs: number): Promise<boolean> {
  const ip = await getClientIp();
  return checkRateLimit(`${action}:${ip}`, limit, windowMs);
}
