import type { AuthConfigDTO } from "../auth/AuthConfigDTO.js";
import type { AssertionDTO } from "../test/AssertionDTO.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";
export type BodyType = "json" | "form-urlencoded" | "multipart-form" | "xml" | "graphql" | "text" | "none";

export interface CreateRequestDTO {
  collection_path: string;
  folder_path?: string;
  name: string;
  method: HttpMethod;
  url: string;
  seq?: number;
  body_type?: BodyType;
  body?: Record<string, unknown> | string;
  headers?: Record<string, string>;
  params_query?: Record<string, string>;
  params_path?: Record<string, string>;
  auth?: AuthConfigDTO;
  vars_pre?: Record<string, string>;
  vars_post?: Record<string, string>;
  assertions?: AssertionDTO[];
  script_pre?: string;
  script_post?: string;
  tests?: string;
  docs?: string;
}

export interface UpdateRequestDTO extends Partial<Omit<CreateRequestDTO, "collection_path" | "name">> {}

export interface RequestResponseDTO {
  file_path: string;
  name: string;
  method: string;
  url: string;
  seq: number;
  body_type: string;
  body: unknown;
  headers: Record<string, string>;
  params_query: Record<string, { value: string; enabled: boolean }>;
  auth: AuthConfigDTO;
  vars_pre: Record<string, string>;
  vars_post: Record<string, string>;
  assertions: AssertionDTO[];
  script_pre: string;
  script_post: string;
  tests: string;
  docs: string;
  raw_bru: string;
}
