import pg from 'pg';
import { config } from '../config/config.js';

const { Pool } = pg;

export class McpError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly hint?: string,
  ) {
    super(message);
    this.name = 'McpError';
  }
}

interface QueryOptions {
  maxRetries?: number;
  statementTimeout?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class PostgresClient {
  private static instance: PostgresClient;
  private pool: pg.Pool;
  private pgVersion: number = 0;

  private constructor() {
    const sslConfig = this.buildSslConfig();

    this.pool = new Pool({
      host: config.pg.host,
      port: config.pg.port,
      database: config.pg.database,
      user: config.pg.user,
      password: config.pg.password,
      ssl: sslConfig,
      max: config.pg.poolMax,
      min: config.pg.poolMin,
      idleTimeoutMillis: config.pg.idleTimeoutMs,
      connectionTimeoutMillis: config.pg.connectionTimeoutMs,
    });

    this.pool.on('error', (err) => {
      console.error('Pool error:', err.message);
    });
  }

  private buildSslConfig(): boolean | pg.ConnectionConfig['ssl'] {
    switch (config.pg.ssl) {
      case 'false': return false;
      case 'true':
      case 'require': return { rejectUnauthorized: false };
      case 'verify-full': return {
        rejectUnauthorized: true,
        ca: config.pg.sslCaCert,
      };
      default: return false;
    }
  }

  static getInstance(): PostgresClient {
    if (!PostgresClient.instance) {
      PostgresClient.instance = new PostgresClient();
    }
    return PostgresClient.instance;
  }

  async query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
    opts?: QueryOptions,
  ): Promise<T[]> {
    const maxRetries = opts?.maxRetries ?? 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const client = await this.pool.connect().catch(err => {
        throw this.wrapError(err);
      });

      try {
        if (opts?.statementTimeout) {
          await client.query(`SET statement_timeout = '${opts.statementTimeout}'`);
        }
        const result = await client.query(sql, params);
        return result.rows as T[];
      } catch (err: unknown) {
        if (this.isRetryable(err) && attempt < maxRetries) {
          await sleep(Math.pow(2, attempt) * 100);
          continue;
        }
        throw this.wrapError(err);
      } finally {
        client.release();
      }
    }

    throw new McpError('Max retries exceeded', 'MAX_RETRIES');
  }

  async queryOne<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
    opts?: QueryOptions,
  ): Promise<T | null> {
    const rows = await this.query<T>(sql, params, opts);
    return rows[0] ?? null;
  }

  async execute(sql: string, params?: unknown[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(sql, params);
    } finally {
      client.release();
    }
  }

  async detectVersion(): Promise<void> {
    const row = await this.queryOne<{ server_version_num: string }>(
      'SHOW server_version_num',
    );
    if (row) {
      this.pgVersion = parseInt(row.server_version_num, 10);
    }
  }

  get version(): number { return this.pgVersion; }
  get isPg17Plus(): boolean { return this.pgVersion >= 170000; }
  get isPg18Plus(): boolean { return this.pgVersion >= 180000; }
  get versionString(): string {
    const major = Math.floor(this.pgVersion / 10000);
    const minor = Math.floor((this.pgVersion % 10000) / 100);
    return `${major}.${minor}`;
  }

  private isRetryable(err: unknown): boolean {
    if (err instanceof Error) {
      const pgErr = err as pg.DatabaseError;
      // Connection errors are retryable
      return pgErr.code === 'ECONNREFUSED' || pgErr.code === '08006' || pgErr.code === '08001';
    }
    return false;
  }

  private wrapError(err: unknown): McpError {
    if (err instanceof McpError) return err;
    if (err instanceof Error) {
      const pgErr = err as pg.DatabaseError;
      switch (pgErr.code) {
        case 'ECONNREFUSED':
          return new McpError(
            `No se pudo conectar a PostgreSQL en ${config.pg.host}:${config.pg.port}`,
            'CONNECTION_REFUSED',
            'Verificar que el servidor PostgreSQL esté en ejecución y accesible.',
          );
        case '28000':
        case '28P01':
          return new McpError(
            `Credenciales incorrectas para usuario '${config.pg.user}'`,
            'AUTH_FAILED',
          );
        case '3D000':
          return new McpError(
            `La base de datos '${config.pg.database}' no existe`,
            'DB_NOT_FOUND',
          );
        case '57014':
          return new McpError(
            `La consulta superó el timeout configurado`,
            'QUERY_TIMEOUT',
            'Aumentar PG_SLOW_QUERY_THRESHOLD_MS o revisar el plan de ejecución.',
          );
        case '42883':
          return new McpError(
            `Función no encontrada. Es posible que una extensión requerida no esté instalada.`,
            'EXTENSION_MISSING',
            'Verificar extensiones con pg_extensions_status.',
          );
        case '42501':
          return new McpError(
            `Permisos insuficientes. Configurar PG_ALLOW_DDL=true o PG_ALLOW_MAINTENANCE=true según corresponda.`,
            'INSUFFICIENT_PRIVILEGE',
          );
        default:
          return new McpError(
            err.message,
            pgErr.code ?? 'UNKNOWN',
          );
      }
    }
    return new McpError('Unknown error', 'UNKNOWN');
  }

  async end(): Promise<void> {
    await this.pool.end();
  }
}

export const dbClient = PostgresClient.getInstance();
