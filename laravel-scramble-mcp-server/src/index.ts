#!/usr/bin/env node

/**
 * Laravel Scramble MCP Server
 * ────────────────────────────────────────────────────────────────
 * Expone los endpoints de cualquier API Laravel documentada con
 * Scramble (OpenAPI 3.1.0) como tools del Model Context Protocol.
 *
 * Arquitectura:
 *   MCP Tool Layer → OpenAPI Discovery → Service Layer
 *   → Repository Layer → HTTP Client / Auth Layer → Laravel API
 *
 * Principios: SOLID · DRY · Tell Don't Ask · Repository · Service DTO
 * ────────────────────────────────────────────────────────────────
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { config } from './config/config.js';
import { logger } from './utils/logger.js';

// Infrastructure
import { TokenManager } from './auth/TokenManager.js';
import { AuthService } from './auth/AuthService.js';
import { LaravelHttpClient } from './http/LaravelHttpClient.js';
import { OperationExecutor } from './http/OperationExecutor.js';

// OpenAPI
import { OpenApiLoader } from './openapi/OpenApiLoader.js';
import { OpenApiParser } from './openapi/OpenApiParser.js';
import { ToolRegistry } from './openapi/ToolRegistry.js';

// Services
import { DiscoveryService } from './services/DiscoveryService.js';

// Core Tools
import { buildDiscoveryTools } from './tools/core/discovery.tools.js';
import { buildAuthTools } from './tools/core/auth.tools.js';
import { buildPaginationTools } from './tools/core/pagination.tools.js';
import type { CoreTool } from './tools/core/discovery.tools.js';

// ──────────────────────────────────────────────────────────────────
// Composición del sistema (Dependency Injection manual)
// ──────────────────────────────────────────────────────────────────

async function main() {
  logger.info({ name: config.mcpServerName, version: config.mcpServerVersion }, 'Starting MCP server');

  // ── Capa Auth ──
  const tokenManager = new TokenManager();
  const authService = new AuthService(tokenManager, config);

  // ── Capa HTTP ──
  const httpClient = new LaravelHttpClient(config, tokenManager, authService);
  const executor = new OperationExecutor(httpClient);

  // ── Capa OpenAPI ──
  const loader = new OpenApiLoader(config);
  const parser = new OpenApiParser();
  const registry = new ToolRegistry(
    async (operation, path, method, input) => executor.execute(operation, path, method, input),
  );

  // ── Services ──
  const discoveryService = new DiscoveryService(loader, parser, registry, config);

  // ── Core Tools (siempre disponibles) ──
  const coreTools: CoreTool[] = [
    ...buildDiscoveryTools(discoveryService, registry, parser, config),
    ...buildAuthTools(authService, tokenManager, httpClient),
    ...buildPaginationTools(httpClient, config),
  ];

  // ── MCP Server ──
  const server = new Server(
    { name: config.mcpServerName, version: config.mcpServerVersion },
    { capabilities: { tools: {} } },
  );

  // ────────────────────────────────────────────────────────────────
  // Handler: list_tools
  // Combina core tools + tools dinámicos generados desde OpenAPI
  // ────────────────────────────────────────────────────────────────
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const dynamicTools = registry.getAllTools();

    const allTools: Tool[] = [
      // Core tools
      ...coreTools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: {
          type: 'object' as const,
          properties: zodToJsonSchema(t.inputSchema),
          required: getRequiredFields(t.inputSchema),
        },
      })),
      // Dynamic tools generados desde Scramble
      ...dynamicTools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: {
          type: 'object' as const,
          properties: zodToJsonSchema(t.inputSchema),
          required: getRequiredFields(t.inputSchema),
        },
      })),
    ];

    logger.debug({ total: allTools.length }, 'Listing tools');
    return { tools: allTools };
  });

  // ────────────────────────────────────────────────────────────────
  // Handler: call_tool
  // Resuelve el tool por nombre y ejecuta su handler
  // ────────────────────────────────────────────────────────────────
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const input = (args ?? {}) as Record<string, unknown>;

    logger.info({ tool: name }, 'Tool invoked');

    // Buscar en core tools primero
    const coreTool = coreTools.find((t) => t.name === name);
    if (coreTool) {
      try {
        const result = await coreTool.handler(input);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error({ tool: name, error: message }, 'Core tool error');
        return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: message }) }] };
      }
    }

    // Buscar en dynamic tools del registry
    const dynamicTool = registry.getTool(name);
    if (dynamicTool) {
      try {
        const result = await dynamicTool.handler(input);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error({ tool: name, error: message }, 'Dynamic tool error');
        return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: message }) }] };
      }
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: `Tool "${name}" no encontrado. Usa scramble_list_tools para ver los disponibles.`,
        }),
      }],
      isError: true,
    };
  });

  // ────────────────────────────────────────────────────────────────
  // Inicialización: Discovery + Auth
  // ────────────────────────────────────────────────────────────────
  try {
    logger.info('Running OpenAPI discovery...');
    const result = await discoveryService.initialize();
    logger.info({ toolsRegistered: result.toolsRegistered }, 'Discovery complete');

    // Autenticar si hay credenciales configuradas
    if (config.authUsername || config.authApiKey || config.oauthClientId) {
      try {
        const authConfig = parser.parseAuthConfig(
          discoveryService.getDocument() ?? { components: { securitySchemes: {} } } as never,
        );
        await authService.initialize(authConfig ?? undefined);
      } catch (error) {
        logger.warn({ error }, 'Initial authentication failed — continuing without auth');
      }
    }
  } catch (error) {
    logger.warn({ error }, 'Initial discovery failed — server will start but no dynamic tools available');
    logger.warn('Use scramble_discover tool to retry discovery');
  }

  // ────────────────────────────────────────────────────────────────
  // Iniciar transport STDIO
  // ────────────────────────────────────────────────────────────────
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('MCP server connected and ready');
}

// ──────────────────────────────────────────────────────────────────
// Helpers para convertir Zod schemas al formato JSON Schema del MCP
// ──────────────────────────────────────────────────────────────────

function zodToJsonSchema(schema: ReturnType<typeof import('zod').z.object>): Record<string, unknown> {
  // Extraer shape del ZodObject para generar JSON Schema
  const shape = schema.shape as Record<string, unknown>;
  const properties: Record<string, unknown> = {};

  for (const [key, zodType] of Object.entries(shape)) {
    properties[key] = zodTypeToJsonSchema(zodType);
  }

  return properties;
}

function zodTypeToJsonSchema(zodType: unknown): Record<string, unknown> {
  if (!zodType || typeof zodType !== 'object') return { type: 'string' };

  const t = zodType as { _def?: { typeName?: string; description?: string; innerType?: unknown; schema?: unknown; items?: unknown; shape?: () => unknown } };
  const def = t._def;
  if (!def) return { type: 'string' };

  const typeName = def.typeName ?? '';
  const description = def.description;
  const base: Record<string, unknown> = description ? { description } : {};

  switch (typeName) {
    case 'ZodString': return { ...base, type: 'string' };
    case 'ZodNumber': return { ...base, type: 'number' };
    case 'ZodBoolean': return { ...base, type: 'boolean' };
    case 'ZodArray': return { ...base, type: 'array', items: def.items ? zodTypeToJsonSchema(def.items) : {} };
    case 'ZodObject': {
      const shape = typeof def.shape === 'function' ? def.shape() : {};
      const props: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(shape as Record<string, unknown>)) {
        props[k] = zodTypeToJsonSchema(v);
      }
      return { ...base, type: 'object', properties: props };
    }
    case 'ZodOptional': return zodTypeToJsonSchema(def.innerType);
    case 'ZodNullable': return { ...zodTypeToJsonSchema(def.innerType), nullable: true };
    case 'ZodEnum': return { ...base, type: 'string', enum: (def as unknown as { values: string[] }).values };
    case 'ZodDefault': return zodTypeToJsonSchema(def.innerType);
    default: return { ...base, type: 'string' };
  }
}

function getRequiredFields(schema: ReturnType<typeof import('zod').z.object>): string[] {
  const shape = schema.shape as Record<string, unknown>;
  return Object.entries(shape)
    .filter(([, zodType]) => {
      const t = zodType as { _def?: { typeName?: string } };
      const typeName = t._def?.typeName ?? '';
      return typeName !== 'ZodOptional' && typeName !== 'ZodDefault';
    })
    .map(([key]) => key);
}

// ──────────────────────────────────────────────────────────────────
// Graceful shutdown
// ──────────────────────────────────────────────────────────────────

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
  process.exit(1);
});

main().catch((error) => {
  logger.error({ error }, 'Fatal error starting MCP server');
  process.exit(1);
});
