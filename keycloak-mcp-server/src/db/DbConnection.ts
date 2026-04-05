import { Pool, PoolConfig } from 'pg';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import { DbInspectorError } from '../utils/errors.js';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (pool) return pool;

  if (!config.kcDbHost || !config.kcDbName || !config.kcDbUsername) {
    throw new DbInspectorError(
      'DB Inspector no está configurado. Define KC_DB_HOST, KC_DB_NAME, KC_DB_USERNAME en .env'
    );
  }

  const poolConfig: PoolConfig = {
    host: config.kcDbHost,
    port: config.kcDbPort,
    database: config.kcDbName,
    user: config.kcDbUsername,
    password: config.kcDbPassword,
    min: config.kcDbPoolMin,
    max: config.kcDbPoolMax,
    statement_timeout: config.kcDbQueryTimeoutMs,
    ssl: config.kcDbSslMode !== 'disable' ? { rejectUnauthorized: config.kcDbSslMode === 'verify-full' } : false,
  };

  pool = new Pool(poolConfig);
  pool.on('error', (err) => logger.error({ err }, 'Unexpected DB pool error'));
  return pool;
}

export async function closeDbPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
