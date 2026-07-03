// Instrumentación de Next.js (https://nextjs.org/docs/app/guides/instrumentation)
//
// onRequestError captura TODO error no manejado durante el render o en route
// handlers / server actions, con contexto del request. Es el gancho central
// de observabilidad: si se suma Sentry, acá va Sentry.captureRequestError.

import { logError } from "@/lib/logger";

export function onRequestError(
  error: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string; routeType: string }
): void {
  logError("unhandled-request-error", error, {
    path: request.path,
    method: request.method,
    routeType: context.routeType,
    routePath: context.routePath,
  });
}
