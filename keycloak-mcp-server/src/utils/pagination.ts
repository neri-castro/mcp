import { PaginationParamsDTO } from '../dto/common/index.js';
import { config } from '../config/config.js';

export function buildPaginationParams(params?: PaginationParamsDTO): Record<string, unknown> {
  return {
    first: params?.first ?? 0,
    max: Math.min(params?.max ?? config.kcDefaultPageSize, config.kcMaxPageSize),
    ...(params?.search ? { search: params.search } : {}),
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildMCPSuccess<T>(data: T) {
  return { success: true as const, data };
}

export function buildMCPError(
  code: string,
  message: string,
  hint?: string,
  details?: unknown
) {
  return {
    success: false as const,
    error: { code, message, ...(hint ? { hint } : {}), ...(details ? { details } : {}) },
  };
}
