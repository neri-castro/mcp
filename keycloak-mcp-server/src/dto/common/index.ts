// PaginationDTO.ts
export interface PaginationParamsDTO {
  first?: number;
  max?: number;
  search?: string;
}

// ErrorDTO.ts
export interface KeycloakErrorDTO {
  error?: string;
  error_description?: string;
  errorMessage?: string;
  field?: string;
}

export interface MCPErrorResponseDTO {
  success: false;
  error: {
    code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'CONFLICT' | 'FORBIDDEN' | 'BAD_REQUEST' | 'RATE_LIMITED' | 'SERVER_ERROR' | 'UNKNOWN';
    message: string;
    hint?: string;
    details?: KeycloakErrorDTO;
  };
}

export interface MCPSuccessResponseDTO<T = unknown> {
  success: true;
  data: T;
}

export type MCPResponseDTO<T = unknown> = MCPSuccessResponseDTO<T> | MCPErrorResponseDTO;

// TokenDTO.ts
export interface TokenRequestDTO {
  grant_type: 'client_credentials' | 'password' | 'refresh_token';
  client_id: string;
  client_secret?: string;
  username?: string;
  password?: string;
  refresh_token?: string;
}

export interface TokenResponseDTO {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: 'Bearer';
  session_state: string;
  scope: string;
}
