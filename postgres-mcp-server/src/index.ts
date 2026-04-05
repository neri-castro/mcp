// src/index.ts - PostgreSQL Optimizer MCP Server Entry Point
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { config } from './config/config.js';
import { dbClient } from './db/client.js';
import { McpError } from './db/client.js';

// Tool definitions
import { schemaToolDefinitions } from './tools/schema.tools.js';
import { indexToolDefinitions } from './tools/index.tools.js';
import { queryToolDefinitions } from './tools/query.tools.js';
import { vacuumToolDefinitions } from './tools/vacuum.tools.js';
import { integrityToolDefinitions } from './tools/integrity.tools.js';
import { monitoringToolDefinitions } from './tools/monitoring.tools.js';
import { configToolDefinitions } from './tools/config.tools.js';
import { partitionToolDefinitions } from './tools/partition.tools.js';

// ─────────────────────────────────────────────────────────────────────────────
// Tool Registry: all 75 tools aggregated
// ─────────────────────────────────────────────────────────────────────────────

type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
};

const allTools: ToolDefinition[] = [
  ...(schemaToolDefinitions as unknown as ToolDefinition[]),
  ...(indexToolDefinitions as unknown as ToolDefinition[]),
  ...(queryToolDefinitions as unknown as ToolDefinition[]),
  ...(vacuumToolDefinitions as unknown as ToolDefinition[]),
  ...(integrityToolDefinitions as unknown as ToolDefinition[]),
  ...(monitoringToolDefinitions as unknown as ToolDefinition[]),
  ...(configToolDefinitions as unknown as ToolDefinition[]),
  ...(partitionToolDefinitions as unknown as ToolDefinition[]),
];

const toolMap = new Map(allTools.map(t => [t.name, t]));

// ─────────────────────────────────────────────────────────────────────────────
// MCP Server Setup
// ─────────────────────────────────────────────────────────────────────────────

const server = new Server(
  {
    name: config.mcp.serverName,
    version: config.mcp.serverVersion,
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// List Tools Handler
// ─────────────────────────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: zodToJsonSchema(tool.inputSchema, { target: 'openApi3' }),
  })),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Call Tool Handler
// ─────────────────────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: rawArgs } = request.params;

  const tool = toolMap.get(name);
  if (!tool) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: `Tool '${name}' not found`, availableTools: allTools.map(t => t.name) }),
      }],
      isError: true,
    };
  }

  try {
    // Validate args with Zod
    const parsed = tool.inputSchema.parse(rawArgs ?? {});
    const result = await tool.handler(parsed as Record<string, unknown>);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2),
      }],
    };
  } catch (error) {
    const errorMessage = formatError(error);
    console.error(`[MCP Error] Tool: ${name}`, errorMessage);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: errorMessage.message,
          code: errorMessage.code,
          hint: errorMessage.hint,
          tool: name,
        }),
      }],
      isError: true,
    };
  }
});

function formatError(error: unknown): { message: string; code: string; hint?: string } {
  if (error instanceof McpError) {
    return { message: error.message, code: error.code, hint: error.hint };
  }
  if (error instanceof z.ZodError) {
    const issues = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    return { message: `Validation error: ${issues}`, code: 'VALIDATION_ERROR' };
  }
  if (error instanceof Error) {
    return { message: error.message, code: 'UNKNOWN_ERROR' };
  }
  return { message: 'Unknown error occurred', code: 'UNKNOWN_ERROR' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Startup
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.error(`[MCP] Starting ${config.mcp.serverName} v${config.mcp.serverVersion}`);
  console.error(`[MCP] Connecting to PostgreSQL: ${config.pg.host}:${config.pg.port}/${config.pg.database}`);

  // Detect PG version to enable/disable version-specific features
  await dbClient.detectVersion();
  console.error(`[MCP] Connected to PostgreSQL ${dbClient.versionString}`);
  console.error(`[MCP] PG17+ features: ${dbClient.isPg17Plus ? 'enabled' : 'disabled'}`);
  console.error(`[MCP] PG18+ features: ${dbClient.isPg18Plus ? 'enabled' : 'disabled'}`);
  console.error(`[MCP] DDL allowed: ${config.permissions.allowDdl}`);
  console.error(`[MCP] Maintenance allowed: ${config.permissions.allowMaintenance}`);
  console.error(`[MCP] Registered tools: ${allTools.length}`);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[MCP] Server ready. Listening on stdio.');
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.error('[MCP] Shutting down...');
  await dbClient.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('[MCP] Shutting down...');
  await dbClient.end();
  process.exit(0);
});

main().catch(err => {
  console.error('[MCP] Fatal error:', err);
  process.exit(1);
});
