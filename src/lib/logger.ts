// Logging estructurado de errores del servidor.
//
// Hoy escribe JSON a stdout/stderr (visible en logs de Vercel o del host).
// Si más adelante se suma Sentry u otro servicio, este es el único punto a
// tocar: agregar el capture dentro de logError.

type LogExtra = Record<string, unknown>;

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error.cause ? { cause: String(error.cause) } : {}),
    };
  }
  return { message: String(error) };
}

/**
 * Registra un error con contexto. `context` identifica el módulo/flujo
 * (ej: "mp-webhook", "cron:booking-reminders", "email").
 */
export function logError(context: string, error: unknown, extra?: LogExtra): void {
  console.error(
    JSON.stringify({
      level: "error",
      context,
      timestamp: new Date().toISOString(),
      error: serializeError(error),
      ...(extra ? { extra } : {}),
    })
  );
}

/** Advertencia estructurada (condición anómala pero no fatal). */
export function logWarn(context: string, message: string, extra?: LogExtra): void {
  console.warn(
    JSON.stringify({
      level: "warn",
      context,
      timestamp: new Date().toISOString(),
      message,
      ...(extra ? { extra } : {}),
    })
  );
}
