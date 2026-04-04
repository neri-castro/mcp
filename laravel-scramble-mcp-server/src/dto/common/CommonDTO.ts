// ──────────────────────────────────────────────────────────────────
// Common DTOs usados en toda la aplicación
// ──────────────────────────────────────────────────────────────────

// PaginationDTO.ts
export interface PaginationLinksDTO {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface LengthAwarePaginationMetaDTO {
  current_page: number;
  from: number | null;
  last_page: number;
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface CursorPaginationMetaDTO {
  path: string;
  per_page: number;
  next_cursor: string | null;
  prev_cursor: string | null;
}

export type PaginationMetaDTO = LengthAwarePaginationMetaDTO | CursorPaginationMetaDTO;

export interface PaginatedResponseDTO<T> {
  data: T[];
  links: PaginationLinksDTO;
  meta: PaginationMetaDTO;
}

export function isPaginatedResponse<T>(
  data: unknown,
): data is PaginatedResponseDTO<T> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'data' in data &&
    Array.isArray((data as PaginatedResponseDTO<T>).data) &&
    'meta' in data
  );
}

// ErrorDTO.ts
export interface ErrorResponseDTO {
  message: string;
  errors?: Record<string, string[]>; // 422 Validation
  exception?: string; // Solo en debug mode
  trace?: unknown[]; // Solo en debug mode
}

// ApiResponseDTO.ts
export type ApiResponseDTO<T> =
  | { success: true; data: T; statusCode: number }
  | { success: false; error: ErrorResponseDTO; statusCode: number; hint?: string };

export function isApiSuccess<T>(
  response: ApiResponseDTO<T>,
): response is { success: true; data: T; statusCode: number } {
  return response.success === true;
}
