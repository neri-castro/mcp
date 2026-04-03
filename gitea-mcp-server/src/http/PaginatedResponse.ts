// src/http/PaginatedResponse.ts

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  limit: number;
}

export interface HttpClientOptions {
  timeout?: number;
  maxRetries?: number;
  tlsVerify?: boolean;
  sudoUser?: string;
}
