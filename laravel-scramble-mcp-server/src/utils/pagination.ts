import type {
  PaginatedResponseDTO,
  LengthAwarePaginationMetaDTO,
  CursorPaginationMetaDTO,
} from '../dto/common/CommonDTO.js';

// ──────────────────────────────────────────────────────────────────
// Helpers para los 3 tipos de paginadores de Laravel
// ──────────────────────────────────────────────────────────────────

export type PaginatorType = 'lengthAware' | 'simple' | 'cursor' | 'none';

export function detectPaginatorType(data: unknown): PaginatorType {
  if (typeof data !== 'object' || data === null) return 'none';

  const d = data as Record<string, unknown>;

  if (!('data' in d) || !Array.isArray(d['data'])) return 'none';

  if ('meta' in d && typeof d['meta'] === 'object' && d['meta'] !== null) {
    const meta = d['meta'] as Record<string, unknown>;
    if ('next_cursor' in meta || 'prev_cursor' in meta) return 'cursor';
    if ('total' in meta && 'last_page' in meta) return 'lengthAware';
  }

  if ('links' in d && !('meta' in d)) return 'simple';

  return 'none';
}

export function extractPaginatedData<T>(response: PaginatedResponseDTO<T>): T[] {
  return response.data;
}

export function isLengthAwareMeta(
  meta: unknown,
): meta is LengthAwarePaginationMetaDTO {
  return (
    typeof meta === 'object' &&
    meta !== null &&
    'total' in meta &&
    'last_page' in meta
  );
}

export function isCursorMeta(meta: unknown): meta is CursorPaginationMetaDTO {
  return (
    typeof meta === 'object' &&
    meta !== null &&
    'next_cursor' in meta
  );
}

/**
 * Formatea metadata de paginación para presentarla al LLM
 * de manera concisa y accionable
 */
export function formatPaginationSummary(response: PaginatedResponseDTO<unknown>): string {
  const { meta, links } = response;

  if (isLengthAwareMeta(meta)) {
    const parts = [
      `Página ${meta.current_page}/${meta.last_page}`,
      `${meta.total} registros totales`,
      `${meta.per_page} por página`,
    ];
    if (links.next) parts.push(`Siguiente: page=${meta.current_page + 1}`);
    return parts.join(' | ');
  }

  if (isCursorMeta(meta)) {
    const parts = [`${meta.per_page} por página`];
    if (meta.next_cursor) parts.push(`next_cursor disponible`);
    return parts.join(' | ');
  }

  return `${response.data.length} registros`;
}
