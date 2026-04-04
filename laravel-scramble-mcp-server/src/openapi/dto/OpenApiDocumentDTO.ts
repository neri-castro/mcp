// ──────────────────────────────────────────────────────────────────
// OpenAPI Document DTOs
// Representan la estructura del documento generado por Scramble
// ──────────────────────────────────────────────────────────────────

export interface SchemaDTO {
  type?: string;
  format?: string;
  properties?: Record<string, SchemaDTO>;
  items?: SchemaDTO;
  required?: string[];
  enum?: unknown[];
  nullable?: boolean;
  description?: string;
  example?: unknown;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  $ref?: string;
  oneOf?: SchemaDTO[];
  anyOf?: SchemaDTO[];
  allOf?: SchemaDTO[];
  deprecated?: boolean;
}

export interface ParameterDTO {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  deprecated?: boolean;
  description?: string;
  schema: SchemaDTO;
  example?: unknown;
}

export interface MediaTypeDTO {
  schema?: SchemaDTO;
}

export interface RequestBodyDTO {
  required?: boolean;
  description?: string;
  content: Record<string, MediaTypeDTO>;
}

export interface ResponseDTO {
  description?: string;
  content?: Record<string, MediaTypeDTO>;
  headers?: Record<string, { schema: SchemaDTO; description?: string }>;
}

export type SecurityRequirementDTO = Record<string, string[]>;

export interface OperationDTO {
  operationId: string;
  tags: string[];
  summary?: string;
  description?: string;
  parameters: ParameterDTO[];
  requestBody?: RequestBodyDTO;
  responses: Record<string, ResponseDTO>;
  security?: SecurityRequirementDTO[];
  deprecated?: boolean;
}

export interface PathItemDTO {
  get?: OperationDTO;
  post?: OperationDTO;
  put?: OperationDTO;
  patch?: OperationDTO;
  delete?: OperationDTO;
  head?: OperationDTO;
  options?: OperationDTO;
}

export interface SecuritySchemeDTO {
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect';
  scheme?: string;
  bearerFormat?: string;
  in?: 'header' | 'query' | 'cookie';
  name?: string;
  flows?: OAuthFlowsDTO;
}

export interface OAuthFlowDTO {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export interface OAuthFlowsDTO {
  implicit?: OAuthFlowDTO;
  password?: OAuthFlowDTO;
  clientCredentials?: OAuthFlowDTO;
  authorizationCode?: OAuthFlowDTO;
}

export interface OpenApiDocumentDTO {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers: Array<{ url: string; description?: string }>;
  paths: Record<string, PathItemDTO>;
  components: {
    schemas: Record<string, SchemaDTO>;
    securitySchemes: Record<string, SecuritySchemeDTO>;
    responses?: Record<string, ResponseDTO>;
  };
  security?: SecurityRequirementDTO[];
}

export const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export function isHttpMethod(method: string): method is HttpMethod {
  return HTTP_METHODS.includes(method as HttpMethod);
}
