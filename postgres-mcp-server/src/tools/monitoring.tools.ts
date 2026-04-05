// tools/monitoring.tools.ts
import { z } from 'zod';
import { ActivityRepository } from '../repositories/activity.repository.js';

const repo = new ActivityRepository();

export const monitoringToolDefinitions = [
  {
    name: 'pg_active_connections',
    description: `Conexiones activas: pid, user, db, state, query, wait_event, duración.
    Fuente: pg_stat_activity. Ordenado por duración descendente.`,
    inputSchema: z.object({}),
    handler: async () => repo.getActiveConnections(),
  },
  {
    name: 'pg_long_running_queries',
    description: `Queries ejecutándose por más de N segundos (configurable). Estado: active.
    Útil para detectar queries bloqueadas o lentas en tiempo real.`,
    inputSchema: z.object({
      thresholdSeconds: z.number().int().min(1).default(30)
        .describe('Umbral en segundos para considerar una query como "larga"'),
    }),
    handler: async (args: { thresholdSeconds: number }) =>
      repo.getLongRunningQueries(args.thresholdSeconds),
  },
  {
    name: 'pg_idle_in_transaction',
    description: `Sesiones en estado 'idle in transaction' por más de N segundos.
    Riesgo de bloat y locks. Estas sesiones mantienen snapshots abiertos y bloquean autovacuum.`,
    inputSchema: z.object({
      thresholdSeconds: z.number().int().min(1).default(60)
        .describe('Umbral en segundos'),
    }),
    handler: async (args: { thresholdSeconds: number }) =>
      repo.getIdleInTransaction(args.thresholdSeconds),
  },
  {
    name: 'pg_lock_analysis',
    description: `Análisis de locks activos: tipo, modo, si está bloqueante, query bloqueadora vs. bloqueada.
    Detecta cadenas de bloqueo. Fuente: pg_locks JOIN pg_stat_activity.`,
    inputSchema: z.object({}),
    handler: async () => repo.getLockAnalysis(),
  },
  {
    name: 'pg_deadlock_risk',
    description: `Detecta potencial de deadlock: múltiples sesiones esperando locks en orden inverso.
    Muestra el árbol de bloqueo actual para identificar la query raíz del bloqueo.`,
    inputSchema: z.object({}),
    handler: async () => {
      const locks = await repo.getLockAnalysis();
      return {
        activeLocks: locks.length,
        potentialDeadlocks: locks.filter(l => l.blockedDurationSeconds > 30).length,
        details: locks,
      };
    },
  },
  {
    name: 'pg_connection_stats',
    description: `Estadísticas de conexiones: total, por estado, por usuario, vs. max_connections.
    Detecta agotamiento de pool de conexiones (> 80% uso es crítico).`,
    inputSchema: z.object({}),
    handler: async () => repo.getConnectionStats(),
  },
  {
    name: 'pg_wait_events',
    description: `Distribución de wait events actuales (Lock, LWLock, IO, Client, etc.).
    Útil para diagnosticar cuellos de botella de rendimiento en tiempo real.`,
    inputSchema: z.object({}),
    handler: async () => repo.getWaitEvents(),
  },
  {
    name: 'pg_database_stats',
    description: `Stats por DB: commits, rollbacks, cache hit ratio, temp files, deadlocks, conflictos.
    Fuente: pg_stat_database. Cache hit ratio < 95% indica que shared_buffers es insuficiente.`,
    inputSchema: z.object({}),
    handler: async () => repo.getDatabaseStats(),
  },
  {
    name: 'pg_io_stats',
    description: `Estadísticas de I/O por tipo de backend y objeto (PG16+, mejorado en PG18 con byte-level).
    Fuente: pg_stat_io. Disponible desde PostgreSQL 16.`,
    inputSchema: z.object({}),
    handler: async () => repo.getIoStats(),
  },
  {
    name: 'pg_async_io_status',
    description: `Estado de operaciones I/O asíncronas en curso (solo PG18).
    Fuente: pg_aios view. Muestra operaciones AIO in-flight del nuevo subsistema io_uring/workers.`,
    inputSchema: z.object({}),
    handler: async () => ({
      message: 'pg_aios disponible solo en PostgreSQL 18+. Usar pg_server_version para verificar versión.',
    }),
  },
  {
    name: 'pg_wal_stats',
    description: `Estadísticas de WAL: registros, bytes, buffers full, write/sync times.
    PG18: WAL I/O fue movido desde pg_stat_wal a pg_stat_io.`,
    inputSchema: z.object({}),
    handler: async () => repo.getWalStats(),
  },
  {
    name: 'pg_replication_status',
    description: `Estado de replicación: standby conectados, LSN lag, modo sync, slots activos/inactivos.
    Fuente: pg_stat_replication, pg_replication_slots.`,
    inputSchema: z.object({}),
    handler: async () => repo.getReplicationStatus(),
  },
  {
    name: 'pg_checkpoint_stats',
    description: `Estadísticas de checkpoints: num_timed, num_requested, buffers_written, write_time.
    PG17+: usa pg_stat_checkpointer (separado de pg_stat_bgwriter).`,
    inputSchema: z.object({}),
    handler: async () => repo.getCheckpointStats(),
  },
] as const;
