import 'dotenv/config';
import { z } from 'zod';

const configSchema = z.object({
  laravelApiBaseUrl: z.string().url({ message: 'LARAVEL_API_BASE_URL must be a valid URL' }),
  scrambleDocsUrl: z.string().url(),
  apiPrefix: z.string().default('api'),

  // Auth
  authType: z.enum(['bearer', 'apiKey', 'basic', 'oauth2']).default('bearer'),
  authUsername: z.string().optional(),
  authPassword: z.string().optional(),
  authApiKey: z.string().optional(),
  authApiKeyHeader: z.string().default('X-API-Key'),
  authLoginEndpoint: z.string().default('/api/login'),
  authLoginUsernameField: z.string().default('email'),
  authLoginPasswordField: z.string().default('password'),
  authTokenField: z.string().default('token'),
  authRefreshTokenField: z.string().default('refresh_token'),

  // OAuth2
  oauthClientId: z.string().optional(),
  oauthClientSecret: z.string().optional(),
  oauthTokenUrl: z.string().url().optional(),
  oauthScopes: z.string().optional(),

  // HTTP
  httpTimeoutMs: z.coerce.number().positive().default(10000),
  httpMaxRetryAttempts: z.coerce.number().int().min(0).max(5).default(3),
  httpRetryDelayMs: z.coerce.number().positive().default(1000),
  httpTlsVerify: z
    .string()
    .transform((v) => v !== 'false')
    .default('true'),

  // Pagination
  defaultPageSize: z.coerce.number().int().positive().default(25),
  maxPageSize: z.coerce.number().int().positive().default(100),
  autoPaginate: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  // OpenAPI
  openapiCacheTtlMs: z.coerce.number().int().min(0).default(300000),
  openapiReloadOnStart: z
    .string()
    .transform((v) => v !== 'false')
    .default('true'),
  openapiDocsUrls: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v
            .split(',')
            .map((u) => u.trim())
            .filter(Boolean)
        : undefined,
    ),

  // Logging
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  logFormat: z.enum(['json', 'pretty']).default('json'),

  // MCP
  mcpServerName: z.string().default('laravel-scramble-mcp'),
  mcpServerVersion: z.string().default('1.0.0'),
});

export type AppConfig = z.infer<typeof configSchema>;

function buildConfig(): AppConfig {
  const baseUrl =
    process.env['LARAVEL_API_BASE_URL'] ?? 'http://localhost:8000';
  const defaultDocsUrl = `${baseUrl}/docs/api.json`;

  return configSchema.parse({
    laravelApiBaseUrl: baseUrl,
    scrambleDocsUrl: process.env['SCRAMBLE_DOCS_URL'] ?? defaultDocsUrl,
    apiPrefix: process.env['API_PREFIX'],
    authType: process.env['AUTH_TYPE'],
    authUsername: process.env['AUTH_USERNAME'],
    authPassword: process.env['AUTH_PASSWORD'],
    authApiKey: process.env['AUTH_API_KEY'],
    authApiKeyHeader: process.env['AUTH_API_KEY_HEADER'],
    authLoginEndpoint: process.env['AUTH_LOGIN_ENDPOINT'],
    authLoginUsernameField: process.env['AUTH_LOGIN_USERNAME_FIELD'],
    authLoginPasswordField: process.env['AUTH_LOGIN_PASSWORD_FIELD'],
    authTokenField: process.env['AUTH_TOKEN_FIELD'],
    authRefreshTokenField: process.env['AUTH_REFRESH_TOKEN_FIELD'],
    oauthClientId: process.env['OAUTH_CLIENT_ID'],
    oauthClientSecret: process.env['OAUTH_CLIENT_SECRET'],
    oauthTokenUrl: process.env['OAUTH_TOKEN_URL'],
    oauthScopes: process.env['OAUTH_SCOPES'],
    httpTimeoutMs: process.env['HTTP_TIMEOUT_MS'],
    httpMaxRetryAttempts: process.env['HTTP_MAX_RETRY_ATTEMPTS'],
    httpRetryDelayMs: process.env['HTTP_RETRY_DELAY_MS'],
    httpTlsVerify: process.env['HTTP_TLS_VERIFY'],
    defaultPageSize: process.env['DEFAULT_PAGE_SIZE'],
    maxPageSize: process.env['MAX_PAGE_SIZE'],
    autoPaginate: process.env['AUTO_PAGINATE'],
    openapiCacheTtlMs: process.env['OPENAPI_CACHE_TTL_MS'],
    openapiReloadOnStart: process.env['OPENAPI_RELOAD_ON_START'],
    openapiDocsUrls: process.env['OPENAPI_DOCS_URLS'],
    logLevel: process.env['LOG_LEVEL'],
    logFormat: process.env['LOG_FORMAT'],
    mcpServerName: process.env['MCP_SERVER_NAME'],
    mcpServerVersion: process.env['MCP_SERVER_VERSION'],
  });
}

export const config = buildConfig();
