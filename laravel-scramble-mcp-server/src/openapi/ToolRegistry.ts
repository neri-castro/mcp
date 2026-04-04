import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { normalizeOperationId, extractVersionFromDocsUrl } from '../utils/operation-id.js';
import { buildToolDescription } from '../utils/markdown.js';
import { SchemaConverter } from '../utils/schema-converter.js';
import type { OpenApiDocumentDTO, OperationDTO, ParameterDTO } from './dto/OpenApiDocumentDTO.js';
import type { ParsedOperation } from './OpenApiParser.js';
import type { ApiResponseDTO } from '../dto/common/CommonDTO.js';

// ──────────────────────────────────────────────────────────────────
// ToolRegistry: genera y registra tools MCP dinámicamente desde OpenAPI
// Principio: DRY — un registro central, SRP — solo construye tools
// ──────────────────────────────────────────────────────────────────

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  handler: (input: Record<string, unknown>) => Promise<ApiResponseDTO<unknown>>;
  tags: string[];
  deprecated: boolean;
  method: string;
  path: string;
}

export type OperationExecutorFn = (
  operation: OperationDTO,
  path: string,
  method: string,
  input: Record<string, unknown>,
) => Promise<ApiResponseDTO<unknown>>;

export class ToolRegistry {
  private tools = new Map<string, MCPTool>();

  constructor(private readonly executor: OperationExecutorFn) {}

  /**
   * Construye todos los tools desde el documento OpenAPI de Scramble.
   * Cada operación OpenAPI → 1 tool MCP con nombre snake_case.
   */
  buildFromOpenApi(
    document: OpenApiDocumentDTO,
    parsedOperations: ParsedOperation[],
    docsUrl?: string,
  ): MCPTool[] {
    const converter = new SchemaConverter();
    converter.setSchemas(document.components?.schemas ?? {});

    const versionPrefix = docsUrl ? extractVersionFromDocsUrl(docsUrl) : undefined;
    const builtTools: MCPTool[] = [];

    for (const parsed of parsedOperations) {
      try {
        const tool = this.buildTool(parsed, converter, versionPrefix);
        this.tools.set(tool.name, tool);
        builtTools.push(tool);
      } catch (error) {
        logger.warn(
          { operationId: parsed.operation.operationId, error },
          'Failed to build tool for operation, skipping',
        );
      }
    }

    logger.info({ count: builtTools.length, version: versionPrefix ?? 'default' }, 'Tools registered');
    return builtTools;
  }

  private buildTool(
    parsed: ParsedOperation,
    converter: SchemaConverter,
    versionPrefix?: string,
  ): MCPTool {
    const { path, method, operation, requiresAuth } = parsed;

    const name = normalizeOperationId(operation.operationId, versionPrefix);
    const description = buildToolDescription(operation, method, path, requiresAuth);
    const inputSchema = this.buildInputSchema(operation, converter);

    const handler = async (input: Record<string, unknown>): Promise<ApiResponseDTO<unknown>> => {
      return this.executor(operation, path, method, input);
    };

    return {
      name,
      description,
      inputSchema,
      handler,
      tags: operation.tags ?? [],
      deprecated: operation.deprecated ?? false,
      method,
      path,
    };
  }

  private buildInputSchema(
    operation: OperationDTO,
    converter: SchemaConverter,
  ): z.ZodObject<z.ZodRawShape> {
    const shape: z.ZodRawShape = {};

    // Parámetros: path, query, header, cookie
    for (const param of operation.parameters ?? []) {
      const zodType = this.buildParamZod(param, converter);
      shape[param.name] = param.required ? zodType : zodType.optional();
    }

    // Request body
    if (operation.requestBody) {
      const content =
        operation.requestBody.content['application/json'] ??
        operation.requestBody.content['multipart/form-data'];

      if (content?.schema?.properties) {
        const bodyRequired = operation.requestBody.content['application/json']
          ? (content.schema.required ?? [])
          : [];

        for (const [key, propSchema] of Object.entries(content.schema.properties)) {
          const zodType = converter.jsonSchemaToZod(propSchema);
          const isRequired = bodyRequired.includes(key);

          // Añadir descripción si existe
          const described = propSchema.description
            ? (zodType as z.ZodTypeAny).describe(propSchema.description)
            : zodType;

          shape[key] = isRequired ? described : described.optional();
        }
      }
    }

    return z.object(shape);
  }

  private buildParamZod(param: ParameterDTO, converter: SchemaConverter): z.ZodType {
    const zodType = converter.jsonSchemaToZod(param.schema);

    // Añadir descripción si existe
    if (param.description) {
      return (zodType as z.ZodTypeAny).describe(param.description);
    }

    return zodType;
  }

  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  getAllTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  getToolsByTag(tag: string): MCPTool[] {
    return this.getAllTools().filter((t) =>
      t.tags.some((tg) => tg.toLowerCase() === tag.toLowerCase()),
    );
  }

  searchTools(query: string): MCPTool[] {
    const q = query.toLowerCase();
    return this.getAllTools().filter(
      (t) =>
        t.name.includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }

  clearTools(versionPrefix?: string): void {
    if (versionPrefix) {
      for (const [name] of this.tools) {
        if (name.startsWith(`scramble_${versionPrefix}_`)) {
          this.tools.delete(name);
        }
      }
    } else {
      this.tools.clear();
    }
  }

  get size(): number {
    return this.tools.size;
  }
}
