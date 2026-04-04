// ──────────────────────────────────────────────────────────────────
// Normalización de operationId de Scramble → nombre de tool MCP
// Principio: DRY — lógica centralizada para nombres de tools
// ──────────────────────────────────────────────────────────────────

/**
 * Convierte un operationId de Scramble al nombre snake_case del tool MCP.
 *
 * Ejemplos:
 *   "users.index"               → "scramble_users_index"
 *   "posts.publishedPosts"      → "scramble_posts_published_posts"
 *   "api/v1/users.store"        → "scramble_api_v1_users_store"
 */
export function normalizeOperationId(operationId: string, versionPrefix?: string): string {
  const normalized = operationId
    .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase → snake_case
    .replace(/[.\-/]/g, '_') // puntos, guiones, slashes → _
    .toLowerCase()
    .replace(/_+/g, '_') // múltiples _ → uno solo
    .replace(/^_|_$/g, ''); // trim _

  const prefix = versionPrefix ? `scramble_${versionPrefix}_` : 'scramble_';
  return `${prefix}${normalized}`;
}

/**
 * Extrae el prefijo de versión de una URL de docs
 * Ejemplo: "/docs/v2/api.json" → "v2"
 *          "/docs/api.json"    → undefined
 */
export function extractVersionFromDocsUrl(docsUrl: string): string | undefined {
  const match = docsUrl.match(/\/docs\/([^/]+)\/api\.json$/);
  return match?.[1] !== 'api.json' ? match?.[1] : undefined;
}

/**
 * Detecta si un operationId pertenece a un tag específico
 */
export function operationBelongsToTag(tags: string[], tag: string): boolean {
  return tags.some((t) => t.toLowerCase() === tag.toLowerCase());
}
