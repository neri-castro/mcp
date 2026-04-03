// src/index.ts

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { AuthManager } from './auth/AuthManager.js';
import { GiteaHttpClient } from './http/GiteaHttpClient.js';
import { GiteaApiError } from './errors/GiteaApiError.js';

// ─── Servicios ───────────────────────────────────────────────────────────────
import { RepoService } from './services/RepoService.js';
import { CommitService } from './services/CommitService.js';
import { IssueService } from './services/IssueService.js';
import { PullRequestService } from './services/PullRequestService.js';
import { UserService } from './services/UserService.js';
import { OrgService } from './services/OrgService.js';
import { ActionsService } from './services/ActionsService.js';
import { NotificationService } from './services/NotificationService.js';
import { PackageService } from './services/PackageService.js';
import { AdminService } from './services/AdminService.js';
import { MiscService } from './services/MiscService.js';

// ─── Builders de tools ───────────────────────────────────────────────────────
import { buildRepoTools } from './tools/repo/index.js';
import { buildCommitTools } from './tools/repo/commits.js';
import { buildIssueTools } from './tools/issue/index.js';
import { buildPRTools } from './tools/pr/index.js';
import { buildUserTools } from './tools/user/index.js';
import { buildOrgTools } from './tools/org/index.js';
import { buildActionsTools } from './tools/actions/index.js';
import { buildNotificationTools } from './tools/notifications/index.js';
import { buildPackageTools } from './tools/packages/index.js';
import { buildAdminTools } from './tools/admin/index.js';
import { buildMiscTools } from './tools/misc/index.js';

import type { ToolDefinition, ToolRegistry } from './tools/types.js';

// ─── Validar configuración ───────────────────────────────────────────────────
const baseUrl = process.env.GITEA_BASE_URL;
if (!baseUrl) {
  console.error('[gitea-mcp] ERROR: GITEA_BASE_URL no está definida');
  process.exit(1);
}

// ─── Inicialización de capas ─────────────────────────────────────────────────
const auth = AuthManager.fromEnv();
const httpClient = new GiteaHttpClient(baseUrl, auth, {
  timeout: Number(process.env.GITEA_REQUEST_TIMEOUT ?? 30_000),
  maxRetries: Number(process.env.GITEA_MAX_RETRIES ?? 3),
  sudoUser: process.env.GITEA_SUDO_USER,
});

// ─── Instanciar servicios (Service Layer) ────────────────────────────────────
const repoService       = new RepoService(httpClient);
const commitService     = new CommitService(httpClient);
const issueService      = new IssueService(httpClient);
const prService         = new PullRequestService(httpClient);
const userService       = new UserService(httpClient);
const orgService        = new OrgService(httpClient);
const actionsService    = new ActionsService(httpClient);
const notifService      = new NotificationService(httpClient);
const packageService    = new PackageService(httpClient);
const adminService      = new AdminService(httpClient);
const miscService       = new MiscService(httpClient);

// ─── Registrar todas las tools (DRY: builders por dominio) ───────────────────
const allTools: ToolDefinition[] = [
  ...buildRepoTools(repoService),
  ...buildCommitTools(commitService),
  ...buildIssueTools(issueService),
  ...buildPRTools(prService),
  ...buildUserTools(userService),
  ...buildOrgTools(orgService),
  ...buildActionsTools(actionsService),
  ...buildNotificationTools(notifService),
  ...buildPackageTools(packageService),
  ...buildAdminTools(adminService),
  ...buildMiscTools(miscService),
];

// Verificar nombres duplicados en desarrollo
const toolRegistry: ToolRegistry = new Map();
for (const tool of allTools) {
  if (toolRegistry.has(tool.name)) {
    console.warn(`[gitea-mcp] WARN: tool duplicada: ${tool.name}`);
  }
  toolRegistry.set(tool.name, tool);
}

// ─── Crear servidor MCP ──────────────────────────────────────────────────────
const server = new Server(
  { name: 'gitea-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// ─── Handler: listar tools ───────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools.map(t => ({
    name: t.name,
    description: t.description,
    inputSchema: {
      type: 'object' as const,
      // Convertir schema Zod a JSON Schema compatible con MCP
      ...zodToJsonSchema(t.inputSchema),
    },
  })),
}));

// ─── Handler: invocar tool ───────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const tool = toolRegistry.get(name);
  if (!tool) {
    return {
      content: [{ type: 'text' as const, text: `Tool '${name}' no encontrada` }],
      isError: true,
    };
  }

  // Validar input con Zod
  const parsed = tool.inputSchema.safeParse(args ?? {});
  if (!parsed.success) {
    return {
      content: [{
        type: 'text' as const,
        text: `Validación fallida para '${name}': ${parsed.error.message}`,
      }],
      isError: true,
    };
  }

  try {
    const result = await tool.handler(parsed.data);
    return { content: [{ type: 'text' as const, text: result }] };
  } catch (err) {
    if (err instanceof GiteaApiError) {
      return {
        content: [{
          type: 'text' as const,
          text: `Error ${err.statusCode} en ${err.endpoint}: ${err.details}`,
        }],
        isError: true,
      };
    }
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: 'text' as const, text: `Error inesperado: ${message}` }],
      isError: true,
    };
  }
});

// ─── Helper: Zod → JSON Schema básico ────────────────────────────────────────
// Conversión mínima para exponer el schema a los clientes MCP
function zodToJsonSchema(schema: any): Record<string, unknown> {
  try {
    // Extraer la definición interna de Zod para producir JSON Schema básico
    if (schema._def?.typeName === 'ZodObject') {
      const shape = schema._def.shape();
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        const fieldSchema = value as any;
        properties[key] = zodFieldToJsonSchema(fieldSchema);

        // Campo requerido si no es opcional ni tiene default
        const typeName = fieldSchema._def?.typeName;
        if (typeName !== 'ZodOptional' && typeName !== 'ZodDefault' && !fieldSchema.isOptional?.()) {
          required.push(key);
        }
      }

      return {
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }
  } catch {
    // fallback seguro
  }
  return {};
}

function zodFieldToJsonSchema(field: any): Record<string, unknown> {
  const typeName = field._def?.typeName;
  const description = field._def?.description || field.description;

  const base = description ? { description } : {};

  switch (typeName) {
    case 'ZodString':   return { ...base, type: 'string' };
    case 'ZodNumber':   return { ...base, type: 'number' };
    case 'ZodBoolean':  return { ...base, type: 'boolean' };
    case 'ZodArray':    return { ...base, type: 'array', items: zodFieldToJsonSchema(field._def.type) };
    case 'ZodEnum':     return { ...base, type: 'string', enum: field._def.values };
    case 'ZodRecord':   return { ...base, type: 'object', additionalProperties: true };
    case 'ZodOptional': return zodFieldToJsonSchema(field._def.innerType);
    case 'ZodDefault':  return { ...zodFieldToJsonSchema(field._def.innerType), default: field._def.defaultValue() };
    case 'ZodObject':   return { ...base, type: 'object', ...zodToJsonSchema(field) };
    default:            return { ...base, type: 'string' };
  }
}

// ─── Arrancar el servidor ────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[gitea-mcp] Servidor iniciado — ${toolRegistry.size} tools registradas`);
  console.error(`[gitea-mcp] Auth type: ${auth.getType()}`);
  console.error(`[gitea-mcp] Base URL: ${baseUrl}`);
}

main().catch(err => {
  console.error('[gitea-mcp] Error fatal:', err);
  process.exit(1);
});
