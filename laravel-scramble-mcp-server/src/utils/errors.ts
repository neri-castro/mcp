import type { ErrorResponseDTO } from '../dto/common/CommonDTO.js';

// ──────────────────────────────────────────────────────────────────
// Jerarquía de errores personalizada para el MCP
// Principio: Tell Don't Ask — cada error contiene su contexto
// ──────────────────────────────────────────────────────────────────

export class LaravelApiError extends Error {
  constructor(
    public readonly errorData: ErrorResponseDTO | unknown,
    public readonly statusCode: number,
    message?: string,
  ) {
    const msg =
      message ??
      (typeof errorData === 'object' && errorData !== null && 'message' in errorData
        ? String((errorData as ErrorResponseDTO).message)
        : `Laravel API Error ${statusCode}`);
    super(msg);
    this.name = 'LaravelApiError';
  }
}

export class AuthenticationError extends LaravelApiError {
  constructor(errorData?: unknown) {
    super(errorData ?? { message: 'Authentication failed' }, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends LaravelApiError {
  constructor(errorData?: unknown) {
    super(errorData ?? { message: 'Forbidden' }, 403);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends LaravelApiError {
  public readonly errors: Record<string, string[]>;

  constructor(errorData: ErrorResponseDTO) {
    super(errorData, 422, errorData.message);
    this.name = 'ValidationError';
    this.errors = errorData.errors ?? {};
  }
}

export class NotFoundError extends LaravelApiError {
  constructor(errorData?: unknown, resourceId?: string | number) {
    const msg = resourceId
      ? `Recurso con ID ${resourceId} no encontrado`
      : 'Recurso no encontrado';
    super(errorData ?? { message: msg }, 404, msg);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends LaravelApiError {
  constructor(errorData?: unknown) {
    super(errorData ?? { message: 'Conflict' }, 409);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends LaravelApiError {
  constructor(
    public readonly retryAfterSeconds: number,
    errorData?: unknown,
  ) {
    super(errorData ?? { message: 'Rate limit exceeded' }, 429);
    this.name = 'RateLimitError';
  }
}

export class TokenRefreshError extends Error {
  constructor(message = 'Failed to refresh token') {
    super(message);
    this.name = 'TokenRefreshError';
  }
}
