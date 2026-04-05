import 'dotenv/config';
import { z } from 'zod';

const configSchema = z.object({
  pg: z.object({
    host: z.string().min(1),
    port: z.coerce.number().int().min(1).max(65535).default(5432),
    database: z.string().min(1),
    user: z.string().min(1),
    password: z.string().min(1),
    ssl: z.enum(['true', 'false', 'require', 'verify-full']).default('false'),
    sslCaCert: z.string().optional(),
    poolMax: z.coerce.number().int().min(1).max(100).default(10),
    poolMin: z.coerce.number().int().min(0).default(1),
    idleTimeoutMs: z.coerce.number().positive().default(30000),
    connectionTimeoutMs: z.coerce.number().positive().default(5000),
  }),
  analysis: z.object({
    schema: z.string().default('public'),
    slowQueryThresholdMs: z.coerce.number().positive().default(1000),
    bloatThresholdPct: z.coerce.number().min(0).max(100).default(20),
    statStatementsLimit: z.coerce.number().int().positive().default(50),
    vacuumStaleDays: z.coerce.number().int().positive().default(7),
  }),
  permissions: z.object({
    allowDdl: z.coerce.boolean().default(false),
    allowMaintenance: z.coerce.boolean().default(false),
  }),
  mcp: z.object({
    serverName: z.string().default('postgres-optimizer-mcp'),
    serverVersion: z.string().default('1.0.0'),
    transport: z.enum(['stdio', 'http']).default('stdio'),
  }),
  log: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    format: z.enum(['json', 'pretty']).default('json'),
  }),
});

export type AppConfig = z.infer<typeof configSchema>;

function loadConfig(): AppConfig {
  const raw = {
    pg: {
      host: process.env.PG_HOST,
      port: process.env.PG_PORT,
      database: process.env.PG_DATABASE,
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      ssl: process.env.PG_SSL,
      sslCaCert: process.env.PG_SSL_CA_CERT,
      poolMax: process.env.PG_POOL_MAX,
      poolMin: process.env.PG_POOL_MIN,
      idleTimeoutMs: process.env.PG_POOL_IDLE_TIMEOUT_MS,
      connectionTimeoutMs: process.env.PG_POOL_CONNECTION_TIMEOUT_MS,
    },
    analysis: {
      schema: process.env.PG_SCHEMA,
      slowQueryThresholdMs: process.env.PG_SLOW_QUERY_THRESHOLD_MS,
      bloatThresholdPct: process.env.PG_BLOAT_THRESHOLD_PERCENT,
      statStatementsLimit: process.env.PG_STAT_STATEMENTS_LIMIT,
      vacuumStaleDays: process.env.PG_VACUUM_STALE_DAYS,
    },
    permissions: {
      allowDdl: process.env.PG_ALLOW_DDL,
      allowMaintenance: process.env.PG_ALLOW_MAINTENANCE,
    },
    mcp: {
      serverName: process.env.MCP_SERVER_NAME,
      serverVersion: process.env.MCP_SERVER_VERSION,
      transport: process.env.MCP_TRANSPORT,
    },
    log: {
      level: process.env.LOG_LEVEL,
      format: process.env.LOG_FORMAT,
    },
  };

  const result = configSchema.safeParse(raw);
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n');
    throw new Error(`Configuration validation failed:\n${errors}`);
  }
  return result.data;
}

export const config: AppConfig = loadConfig();
