// src/dto/common/BruFileDTO.ts
export interface BruFileDTO {
  path: string;
  name: string;
  raw_content: string;
  parsed: Record<string, unknown>;
}

// src/dto/common/ErrorDTO.ts
export type ErrorCode =
  | "FILE_NOT_FOUND"
  | "PARSE_ERROR"
  | "VALIDATION_ERROR"
  | "COLLECTION_NOT_FOUND"
  | "ENV_NOT_FOUND"
  | "PATH_NOT_ALLOWED"
  | "CLI_NOT_INSTALLED"
  | "RUN_FAILED"
  | "PERMISSION_DENIED"
  | "UNKNOWN_ERROR";

export interface BruMcpErrorDTO {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    path?: string;
    hint?: string;
  };
}

// src/dto/common/SuccessDTO.ts
export interface BruMcpSuccessDTO<T> {
  success: true;
  data: T;
  meta?: {
    path: string;
    operation: string;
    timestamp: string;
  };
}

export type BruMcpResultDTO<T> = BruMcpSuccessDTO<T> | BruMcpErrorDTO;

export function success<T>(
  data: T,
  meta?: { path: string; operation: string }
): BruMcpSuccessDTO<T> {
  return {
    success: true,
    data,
    meta: meta
      ? { ...meta, timestamp: new Date().toISOString() }
      : undefined,
  };
}

export function failure(
  code: ErrorCode,
  message: string,
  extra?: { path?: string; hint?: string }
): BruMcpErrorDTO {
  return { success: false, error: { code, message, ...extra } };
}
