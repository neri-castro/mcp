import 'dotenv/config';
import { z } from 'zod';

const configSchema = z.object({
  taigaHost: z.string().url('TAIGA_HOST debe ser una URL válida'),
  taigaApiBaseUrl: z.string().url('TAIGA_API_BASE_URL debe ser una URL válida'),
  authType: z.enum(['normal', 'ldap']).default('normal'),
  username: z.string().min(1, 'TAIGA_USERNAME es requerido'),
  password: z.string().min(1, 'TAIGA_PASSWORD es requerido'),
  requestTimeoutMs: z.coerce.number().positive().default(10000),
  maxRetryAttempts: z.coerce.number().int().min(0).max(5).default(3),
  retryDelayMs: z.coerce.number().positive().default(1000),
  tlsVerify: z.string().transform((v) => v !== 'false').default('true'),
  defaultPageSize: z.coerce.number().int().positive().default(100),
  maxPageSize: z.coerce.number().int().positive().default(500),
  autoPaginate: z.string().transform((v) => v !== 'false').default('true'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  logFormat: z.enum(['json', 'pretty']).default('json'),
  mcpServerName: z.string().default('taiga-mcp'),
  mcpServerVersion: z.string().default('1.0.0'),
});

export type AppConfig = z.infer<typeof configSchema>;

function loadConfig(): AppConfig {
  const result = configSchema.safeParse({
    taigaHost: process.env.TAIGA_HOST,
    taigaApiBaseUrl: process.env.TAIGA_API_BASE_URL || `${process.env.TAIGA_HOST}/api/v1`,
    authType: process.env.TAIGA_AUTH_TYPE,
    username: process.env.TAIGA_USERNAME,
    password: process.env.TAIGA_PASSWORD,
    requestTimeoutMs: process.env.TAIGA_REQUEST_TIMEOUT_MS,
    maxRetryAttempts: process.env.TAIGA_MAX_RETRY_ATTEMPTS,
    retryDelayMs: process.env.TAIGA_RETRY_DELAY_MS,
    tlsVerify: process.env.TAIGA_TLS_VERIFY,
    defaultPageSize: process.env.TAIGA_DEFAULT_PAGE_SIZE,
    maxPageSize: process.env.TAIGA_MAX_PAGE_SIZE,
    autoPaginate: process.env.TAIGA_AUTO_PAGINATE,
    logLevel: process.env.LOG_LEVEL,
    logFormat: process.env.LOG_FORMAT,
    mcpServerName: process.env.MCP_SERVER_NAME,
    mcpServerVersion: process.env.MCP_SERVER_VERSION,
  });

  if (!result.success) {
    const errors = result.error.errors.map((e) => `  ${e.path.join('.')}: ${e.message}`).join('\n');
    throw new Error(`Configuración inválida:\n${errors}`);
  }

  return result.data;
}

export const config = loadConfig();
