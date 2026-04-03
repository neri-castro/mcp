/**
 * OCC (Optimistic Concurrency Control) helper.
 * Taiga requiere el campo `version` en todos los PATCH/PUT.
 * getFn retorna Promise<unknown> para flexibilidad; el cast a { version: number } se hace internamente.
 */
export async function withCurrentVersion<T>(
  getFn: () => Promise<unknown>,
  editFn: (version: number) => Promise<T>
): Promise<T> {
  const current = (await getFn()) as { version: number };
  return editFn(current.version);
}
