// PaginationDTO.ts
export interface PaginationMetaDTO {
  count: number;
  current: number;
  next: string | null;
  prev: string | null;
}

export interface PaginatedResponseDTO<T> {
  data: T[];
  pagination: PaginationMetaDTO;
}

// ErrorDTO.ts
export interface TaigaErrorDTO {
  _error_message?: string;
  _error_type?: string;
  detail?: string;
  [field: string]: string[] | string | undefined;
}

// AttachmentDTO.ts
export interface CreateAttachmentDTO {
  object_id: number;
  project: number;
  attached_file: Buffer;
  description?: string;
  is_deprecated?: boolean;
}

export interface AttachmentResponseDTO {
  id: number;
  object_id: number;
  project: number;
  name: string;
  url: string;
  size: number;
  description: string;
  is_deprecated: boolean;
  created_date: string;
  owner: number;
}

// MCP Tool response wrapper
export interface ToolSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ToolErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    current_version?: number;
    hint?: string;
    details?: unknown;
  };
}

export type ToolResponse<T = unknown> = ToolSuccessResponse<T> | ToolErrorResponse;

export function successResponse<T>(data: T): ToolSuccessResponse<T> {
  return { success: true, data };
}

export function errorResponse(
  code: string,
  message: string,
  extras?: { current_version?: number; hint?: string; details?: unknown }
): ToolErrorResponse {
  return { success: false, error: { code, message, ...extras } };
}
