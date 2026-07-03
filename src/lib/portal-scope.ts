import { cache } from "react";

/**
 * Scope del portal público para el request actual.
 *
 * - Portal global (raíz): `basePath = ""`, `organizerId = undefined` → muestra
 *   datos de todos los clubes.
 * - Sitio de un club (`/c/[slug]`): el layout setea `basePath = "/c/[slug]"` y
 *   `organizerId` → todas las páginas (reusadas) quedan acotadas a ese club y sus
 *   links se prefijan con el basePath.
 *
 * Se usa React `cache()` para tener un contenedor mutable por request, así no hay
 * que pasar el scope por props a través de todo el árbol de componentes server.
 */
type PortalScope = { organizerId?: string; basePath: string };

const scopeRef = cache((): { current: PortalScope } => ({
  current: { basePath: "", organizerId: undefined },
}));

export function setPortalScope(scope: PortalScope) {
  scopeRef().current = scope;
}

export function getPortalScope(): PortalScope {
  return scopeRef().current;
}

/** organizerId activo del scope (undefined en el portal global). */
export function scopedOrg(): string | undefined {
  return scopeRef().current.organizerId;
}

/** Prefija un path interno del portal con el basePath del club (no-op en global). */
export function plink(path: string): string {
  const { basePath } = scopeRef().current;
  if (!basePath || !path.startsWith("/")) return path;
  return `${basePath}${path}`;
}
