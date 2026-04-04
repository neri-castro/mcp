import type {
  OpenApiDocumentDTO,
  OperationDTO,
  PathItemDTO,
  SecuritySchemeDTO,
} from './dto/OpenApiDocumentDTO.js';
import { isHttpMethod, HTTP_METHODS } from './dto/OpenApiDocumentDTO.js';
import type { AuthConfigDTO } from '../auth/dto/AuthDTO.js';
import { logger } from '../utils/logger.js';

// ──────────────────────────────────────────────────────────────────
// OpenApiParser: extrae operations, parameters y security del documento
// Principio: SRP — solo parseo, sin lógica de negocio
// ──────────────────────────────────────────────────────────────────

export interface ParsedOperation {
  path: string;
  method: string;
  operation: OperationDTO;
  requiresAuth: boolean;
  contentType: 'application/json' | 'multipart/form-data' | 'none';
}

export class OpenApiParser {
  /**
   * Extrae todas las operaciones del documento OpenAPI
   */
  parseOperations(document: OpenApiDocumentDTO): ParsedOperation[] {
    const operations: ParsedOperation[] = [];
    const globalSecurity = document.security ?? [];

    for (const [path, pathItem] of Object.entries(document.paths)) {
      const parsed = this.parsePathItem(path, pathItem, globalSecurity);
      operations.push(...parsed);
    }

    logger.debug({ count: operations.length }, 'Parsed OpenAPI operations');
    return operations;
  }

  private parsePathItem(
    path: string,
    pathItem: PathItemDTO,
    globalSecurity: Array<Record<string, string[]>>,
  ): ParsedOperation[] {
    const results: ParsedOperation[] = [];

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;

      // Si no tiene operationId, generar uno desde path+method
      if (!operation.operationId) {
        operation.operationId = this.generateOperationId(path, method);
      }

      // Determinar si requiere autenticación
      const operationSecurity = operation.security;
      const effectiveSecurity = operationSecurity ?? globalSecurity;
      const requiresAuth = effectiveSecurity.length > 0 &&
        !effectiveSecurity.every((req) => Object.keys(req).length === 0);

      // Detectar Content-Type del requestBody
      const contentType = this.detectContentType(operation);

      results.push({
        path,
        method,
        operation,
        requiresAuth,
        contentType,
      });
    }

    return results;
  }

  /**
   * Extrae la configuración de autenticación desde securitySchemes
   */
  parseAuthConfig(document: OpenApiDocumentDTO): AuthConfigDTO | null {
    const schemes = document.components?.securitySchemes ?? {};
    const entries = Object.entries(schemes);

    if (entries.length === 0) return null;

    // Tomar el primer esquema de seguridad global
    const [, scheme] = entries[0]!;
    return this.mapSecurityScheme(scheme);
  }

  private mapSecurityScheme(scheme: SecuritySchemeDTO): AuthConfigDTO {
    switch (scheme.type) {
      case 'http':
        if (scheme.scheme === 'bearer') {
          return {
            type: 'bearer',
            bearerFormat: scheme.bearerFormat,
          };
        }
        return { type: 'basic' };

      case 'apiKey':
        return {
          type: 'apiKey',
          in: scheme.in ?? 'header',
          name: scheme.name,
        };

      case 'oauth2': {
        const flow =
          scheme.flows?.clientCredentials ??
          scheme.flows?.password ??
          scheme.flows?.authorizationCode;
        return {
          type: 'oauth2',
          tokenUrl: flow?.tokenUrl,
          authorizationUrl: flow?.authorizationUrl,
          scopes: flow?.scopes,
        };
      }

      default:
        return { type: 'bearer' };
    }
  }

  /**
   * Detecta si una operación usa multipart/form-data (file uploads)
   */
  private detectContentType(
    operation: OperationDTO,
  ): 'application/json' | 'multipart/form-data' | 'none' {
    const content = operation.requestBody?.content;
    if (!content) return 'none';
    if ('multipart/form-data' in content) return 'multipart/form-data';
    return 'application/json';
  }

  /**
   * Genera un operationId desde path y method si no existe
   * /api/v1/users → users_index (get), users_store (post), etc.
   */
  private generateOperationId(path: string, method: string): string {
    const methodSuffix: Record<string, string> = {
      get: 'index',
      post: 'store',
      put: 'update',
      patch: 'update',
      delete: 'destroy',
    };

    const pathParts = path
      .replace(/^\//, '')
      .replace(/\{[^}]+\}/g, '')
      .replace(/\/+/g, '/')
      .replace(/\/$/, '')
      .split('/')
      .filter(Boolean);

    const resource = pathParts[pathParts.length - 1] ?? 'resource';
    const suffix = methodSuffix[method] ?? method;

    return `${resource}.${suffix}`;
  }

  /**
   * Lista todos los tags únicos del documento (= grupos de endpoints)
   */
  parseTags(document: OpenApiDocumentDTO): string[] {
    const tags = new Set<string>();

    for (const pathItem of Object.values(document.paths)) {
      for (const method of HTTP_METHODS) {
        const operation = pathItem[method];
        operation?.tags?.forEach((tag) => tags.add(tag));
      }
    }

    return Array.from(tags).sort();
  }
}
