// tools/config.tools.ts
import { z } from 'zod';
import { ConfigService } from '../services/config.service.js';

const service = new ConfigService();

export const configToolDefinitions = [
  {
    name: 'pg_config_overview',
    description: `Muestra parámetros de configuración más relevantes para rendimiento y mantenimiento.
    Incluye: shared_buffers, work_mem, max_connections, wal_level, autovacuum, checkpoint_completion_target.`,
    inputSchema: z.object({}),
    handler: async () => service.getConfigOverview(),
  },
  {
    name: 'pg_config_memory',
    description: `Análisis de parámetros de memoria: shared_buffers, effective_cache_size, work_mem, maintenance_work_mem.
    Reglas generales: shared_buffers = 25% RAM, effective_cache_size = 75% RAM, work_mem cuidado con max_connections.`,
    inputSchema: z.object({}),
    handler: async () => service.getMemoryConfig(),
  },
  {
    name: 'pg_config_autovacuum',
    description: `Parámetros de autovacuum global y recomendaciones de ajuste según carga.
    Lista todos los parámetros autovacuum_* con sus valores actuales.`,
    inputSchema: z.object({}),
    handler: async () => service.getAutovacuumConfig(),
  },
  {
    name: 'pg_config_connections',
    description: `max_connections, reserved_connections, superuser_reserved_connections, track de conexiones activas.
    max_connections alto con work_mem alto = riesgo de OOM.`,
    inputSchema: z.object({}),
    handler: async () => service.getConnectionsConfig(),
  },
  {
    name: 'pg_config_wal',
    description: `Parámetros WAL: wal_level, wal_buffers, checkpoint_completion_target, max_wal_size.
    wal_level=logical requerido para replicación lógica y algunas extensiones.`,
    inputSchema: z.object({}),
    handler: async () => service.getWalConfig(),
  },
  {
    name: 'pg_config_io',
    description: `Parámetros I/O: effective_io_concurrency, random_page_cost, seq_page_cost, io_method (PG18+).
    random_page_cost = 1.1 para SSD, 4.0 para HDD. io_method=io_uring para máximo rendimiento en Linux 5.1+.`,
    inputSchema: z.object({}),
    handler: async () => service.getIoConfig(),
  },
  {
    name: 'pg_config_parallel',
    description: `Parámetros de paralelismo: max_parallel_workers, max_parallel_workers_per_gather, min_parallel_table_scan_size.
    PG18: GIN builds también soporta paralelismo (max_parallel_maintenance_workers).`,
    inputSchema: z.object({}),
    handler: async () => service.getParallelConfig(),
  },
  {
    name: 'pg_config_logging',
    description: `log_min_duration_statement, log_slow_autovacuum, log_connections, log_lock_waits.
    log_min_duration_statement = PG_SLOW_QUERY_THRESHOLD_MS para capturar queries lentas en logs.`,
    inputSchema: z.object({}),
    handler: async () => service.getLoggingConfig(),
  },
  {
    name: 'pg_server_version',
    description: `Versión exacta del servidor, detecta PG16/17/18 y habilita/deshabilita features específicas.
    Fuente: SELECT version(); SHOW server_version_num.`,
    inputSchema: z.object({}),
    handler: async () => service.getServerVersion(),
  },
  {
    name: 'pg_extensions_status',
    description: `Extensiones instaladas y disponibles. Verifica pg_stat_statements, pgstattuple, hypopg, pg_buffercache.
    Muestra versión instalada vs disponible. Las extensiones no instaladas pueden limitar funcionalidades del MCP.`,
    inputSchema: z.object({}),
    handler: async () => service.getExtensionsStatus(),
  },
] as const;
