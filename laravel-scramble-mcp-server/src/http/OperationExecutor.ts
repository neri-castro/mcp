import FormData from 'form-data';
import { logger } from '../utils/logger.js';
import { buildErrorHint } from '../utils/markdown.js';
import {
  LaravelApiError,
  ValidationError,
  NotFoundError,
  AuthorizationError,
  AuthenticationError,
  ConflictError,
  RateLimitError,
} from '../utils/errors.js';
import type { LaravelHttpClient } from '../http/LaravelHttpClient.js';
import type { OperationDTO } from '../openapi/dto/OpenApiDocumentDTO.js';
import type { ApiResponseDTO } from '../dto/common/CommonDTO.js';

// ──────────────────────────────────────────────────────────────────
// OperationExecutor: ejecuta la request HTTP de cada tool invocado
// Tell Don't Ask: decide cómo enviar sin consultar estado externo
// ──────────────────────────────────────────────────────────────────

interface PartitionedParams {
  pathParams: Record<string, string | number>;
  queryParams: Record<string, unknown>;
  body: Record<string, unknown>;
  headers: Record<string, string>;
}

export class OperationExecutor {
  constructor(private readonly client: LaravelHttpClient) {}

  async execute(
    operation: OperationDTO,
    path: string,
    method: string,
    input: Record<string, unknown>,
  ): Promise<ApiResponseDTO<unknown>> {
    try {
      const { pathParams, queryParams, body, headers } = this.partitionParams(operation, input);
      const resolvedPath = this.interpolatePath(path, pathParams);
      const contentType = this.detectContentType(operation);

      logger.debug({ method, path: resolvedPath, contentType }, 'Executing operation');

      let requestData: unknown = Object.keys(body).length > 0 ? body : undefined;
      const requestHeaders = { ...headers };

      // Manejar multipart/form-data para file uploads
      if (contentType === 'multipart/form-data' && requestData) {
        const formData = new FormData();
        for (const [key, value] of Object.entries(body)) {
          if (Buffer.isBuffer(value)) {
            formData.append(key, value, { filename: key });
          } else {
            formData.append(key, String(value));
          }
        }
        requestData = formData;
        Object.assign(requestHeaders, formData.getHeaders());
      }

      const response = await this.client.request<unknown>({
        method,
        url: resolvedPath,
        params: queryParams,
        data: requestData,
        headers: requestHeaders,
      });

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      return this.mapError(error);
    }
  }

  /**
   * Particiona el input del tool en path params, query params, body y headers
   * según los parámetros definidos en la operación OpenAPI
   */
  private partitionParams(
    operation: OperationDTO,
    input: Record<string, unknown>,
  ): PartitionedParams {
    const pathParams: Record<string, string | number> = {};
    const queryParams: Record<string, unknown> = {};
    const headers: Record<string, string> = {};
    const knownParams = new Set<string>();

    for (const param of operation.parameters ?? []) {
      knownParams.add(param.name);
      const value = input[param.name];
      if (value === undefined || value === null) continue;

      switch (param.in) {
        case 'path':
          pathParams[param.name] = value as string | number;
          break;
        case 'query':
          queryParams[param.name] = value;
          break;
        case 'header':
          headers[param.name] = String(value);
          break;
        case 'cookie':
          // cookies son manejadas por axios automáticamente si se configuran
          break;
      }
    }

    // Todo lo que no sea un parámetro conocido va al body
    const body: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (!knownParams.has(key) && value !== undefined) {
        body[key] = value;
      }
    }

    return { pathParams, queryParams, body, headers };
  }

  /**
   * Interpola los path params en el path de la operación
   * /users/{user} + { user: 42 } → /users/42
   */
  private interpolatePath(
    path: string,
    pathParams: Record<string, string | number>,
  ): string {
    return path.replace(/\{([^}]+)\}/g, (_, paramName: string) => {
      const value = pathParams[paramName];
      if (value === undefined) {
        logger.warn({ paramName, path }, 'Path param not provided');
        return `:${paramName}`;
      }
      return encodeURIComponent(String(value));
    });
  }

  private detectContentType(
    operation: OperationDTO,
  ): 'application/json' | 'multipart/form-data' | 'none' {
    const content = operation.requestBody?.content;
    if (!content) return 'none';
    if ('multipart/form-data' in content) return 'multipart/form-data';
    return 'application/json';
  }

  /**
   * Mapea errores de la capa HTTP a ApiResponseDTO para el LLM
   * Tell Don't Ask: el executor decide el mensaje sin que el tool lo consulte
   */
  private mapError(error: unknown): ApiResponseDTO<unknown> {
    if (error instanceof ValidationError) {
      return {
        success: false,
        statusCode: 422,
        error: {
          message: error.message,
          errors: error.errors,
        },
        hint: `Campos inválidos: ${JSON.stringify(error.errors)}`,
      };
    }

    if (error instanceof NotFoundError) {
      return {
        success: false,
        statusCode: 404,
        error: { message: error.message },
        hint: buildErrorHint(404, error.errorData),
      };
    }

    if (error instanceof AuthenticationError) {
      return {
        success: false,
        statusCode: 401,
        error: { message: error.message },
        hint: 'Token expirado. Se intentó renovar automáticamente sin éxito. Usa scramble_auth_login para obtener un nuevo token.',
      };
    }

    if (error instanceof AuthorizationError) {
      return {
        success: false,
        statusCode: 403,
        error: { message: error.message },
        hint: 'Usuario sin permisos para esta operación.',
      };
    }

    if (error instanceof ConflictError) {
      return {
        success: false,
        statusCode: 409,
        error: { message: error.message },
        hint: 'Conflicto de estado. Usa el campo version retornado para reintentar.',
      };
    }

    if (error instanceof RateLimitError) {
      return {
        success: false,
        statusCode: 429,
        error: { message: error.message },
        hint: `Rate limit alcanzado. Reintenta en ${error.retryAfterSeconds} segundos.`,
      };
    }

    if (error instanceof LaravelApiError) {
      return {
        success: false,
        statusCode: error.statusCode,
        error: { message: error.message },
        hint: buildErrorHint(error.statusCode, error.errorData),
      };
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error }, 'Unexpected error executing operation');
    return {
      success: false,
      statusCode: 0,
      error: { message },
      hint: 'Error inesperado. Revisa los logs del MCP server.',
    };
  }
}
