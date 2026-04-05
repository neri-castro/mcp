import 'dotenv/config';
import { z } from 'zod';

const configSchema = z.object({
  // Keycloak connection
  kcHost: z.string().url(),
  kcAdminBaseUrl: z.string().url(),
  kcAuthRealm: z.string().min(1).default('master'),

  // Auth
  kcGrantType: z.enum(['client_credentials', 'password']).default('client_credentials'),
  kcClientId: z.string().min(1),
  kcClientSecret: z.string().optional(),
  kcAdminUsername: z.string().optional(),
  kcAdminPassword: z.string().optional(),

  // HTTP
  kcRequestTimeoutMs: z.coerce.number().positive().default(15000),
  kcMaxRetryAttempts: z.coerce.number().int().min(0).max(5).default(3),
  kcRetryDelayBaseMs: z.coerce.number().positive().default(1000),
  kcTlsVerify: z.coerce.boolean().default(true),
  kcTlsCaCert: z.string().optional(),

  // Pagination
  kcDefaultPageSize: z.coerce.number().positive().default(100),
  kcMaxPageSize: z.coerce.number().positive().default(1000),
  kcAutoPaginate: z.coerce.boolean().default(true),

  // Database (DB Inspector)
  kcDbHost: z.string().optional(),
  kcDbPort: z.coerce.number().int().optional().default(5432),
  kcDbName: z.string().optional(),
  kcDbUsername: z.string().optional(),
  kcDbPassword: z.string().optional(),
  kcDbSchema: z.string().default('public'),
  kcDbSslMode: z.enum(['disable', 'require', 'verify-ca', 'verify-full']).default('require'),
  kcDbSslCa: z.string().optional(),
  kcDbPoolMin: z.coerce.number().int().default(1),
  kcDbPoolMax: z.coerce.number().int().default(5),
  kcDbQueryTimeoutMs: z.coerce.number().default(30000),
  kcDbReadOnly: z.coerce.boolean().default(true),

  // MCP
  mcpServerName: z.string().default('keycloak-mcp'),
  mcpServerVersion: z.string().default('1.0.0'),
  mcpTransport: z.enum(['stdio', 'sse']).default('stdio'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  logFormat: z.enum(['json', 'pretty']).default('json'),
}).refine(
  (cfg) =>
    cfg.kcGrantType !== 'password' ||
    (cfg.kcAdminUsername !== undefined && cfg.kcAdminPassword !== undefined),
  { message: 'Se requiere KC_ADMIN_USERNAME y KC_ADMIN_PASSWORD cuando grant_type=password' }
).refine(
  (cfg) =>
    cfg.kcGrantType !== 'client_credentials' || cfg.kcClientSecret !== undefined,
  { message: 'Se requiere KC_CLIENT_SECRET cuando grant_type=client_credentials' }
);

export type AppConfig = z.infer<typeof configSchema>;

export const config: AppConfig = configSchema.parse({
  kcHost: process.env.KC_HOST,
  kcAdminBaseUrl: process.env.KC_ADMIN_BASE_URL ?? `${process.env.KC_HOST}/admin/realms`,
  kcAuthRealm: process.env.KC_AUTH_REALM,
  kcGrantType: process.env.KC_AUTH_GRANT_TYPE,
  kcClientId: process.env.KC_CLIENT_ID,
  kcClientSecret: process.env.KC_CLIENT_SECRET,
  kcAdminUsername: process.env.KC_ADMIN_USERNAME,
  kcAdminPassword: process.env.KC_ADMIN_PASSWORD,
  kcRequestTimeoutMs: process.env.KC_REQUEST_TIMEOUT_MS,
  kcMaxRetryAttempts: process.env.KC_MAX_RETRY_ATTEMPTS,
  kcRetryDelayBaseMs: process.env.KC_RETRY_DELAY_BASE_MS,
  kcTlsVerify: process.env.KC_TLS_VERIFY,
  kcTlsCaCert: process.env.KC_TLS_CA_CERT,
  kcDefaultPageSize: process.env.KC_DEFAULT_PAGE_SIZE,
  kcMaxPageSize: process.env.KC_MAX_PAGE_SIZE,
  kcAutoPaginate: process.env.KC_AUTO_PAGINATE,
  kcDbHost: process.env.KC_DB_HOST,
  kcDbPort: process.env.KC_DB_PORT,
  kcDbName: process.env.KC_DB_NAME,
  kcDbUsername: process.env.KC_DB_USERNAME,
  kcDbPassword: process.env.KC_DB_PASSWORD,
  kcDbSchema: process.env.KC_DB_SCHEMA,
  kcDbSslMode: process.env.KC_DB_SSL_MODE,
  kcDbSslCa: process.env.KC_DB_SSL_CA,
  kcDbPoolMin: process.env.KC_DB_POOL_MIN,
  kcDbPoolMax: process.env.KC_DB_POOL_MAX,
  kcDbQueryTimeoutMs: process.env.KC_DB_QUERY_TIMEOUT_MS,
  kcDbReadOnly: process.env.KC_DB_READ_ONLY,
  mcpServerName: process.env.MCP_SERVER_NAME,
  mcpServerVersion: process.env.MCP_SERVER_VERSION,
  mcpTransport: process.env.MCP_TRANSPORT,
  logLevel: process.env.LOG_LEVEL,
  logFormat: process.env.LOG_FORMAT,
});
