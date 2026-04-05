// tools/query.tools.ts
import { z } from 'zod';
import { QueryService } from '../services/query.service.js';
import { config } from '../config/config.js';

const service = new QueryService();

export const queryToolDefinitions = [
  {
    name: 'pg_slow_queries',
    description: `Retorna las N consultas SQL más lentas registradas en pg_stat_statements.
    Ordena por total_exec_time (costo acumulado) o mean_exec_time (costo por ejecución).
    Requiere que pg_stat_statements esté instalado y habilitado en shared_preload_libraries.
    Incluye: query normalizada, calls, tiempos de ejecución, cache hit ratio, I/O en disco.
    PG17+: incluye columnas stats_since y minmax_stats_since para ventana temporal.`,
    inputSchema: z.object({
      limit: z.number().int().min(1).max(200).default(20)
        .describe('Número máximo de consultas a retornar'),
      orderBy: z.enum(['total_time', 'mean_time', 'calls', 'io_time'])
        .default('total_time')
        .describe('Criterio de ordenamiento'),
      minCalls: z.number().int().min(0).default(0)
        .describe('Filtrar consultas con al menos N llamadas'),
      dbName: z.string().optional()
        .describe('Nombre de DB a filtrar. Por defecto: current_database()'),
    }),
    handler: async (args: { limit: number; orderBy: string; minCalls: number; dbName?: string }) =>
      service.getSlowQueries(args.limit, args.orderBy, args.minCalls, args.dbName),
  },
  {
    name: 'pg_high_io_queries',
    description: `Consultas con mayor lectura de bloques desde disco (shared_blks_read alto vs shared_blks_hit).
    Candidatas a mejora de índices o aumento de shared_buffers.`,
    inputSchema: z.object({
      limit: z.number().int().min(1).max(100).default(20)
        .describe('Número de consultas a retornar'),
    }),
    handler: async (args: { limit: number }) => service.getHighIoQueries(args.limit),
  },
  {
    name: 'pg_frequent_queries',
    description: `Consultas ejecutadas con mayor frecuencia. Candidatas a caché o materialización.
    Alta frecuencia + bajo tiempo individual = candidata a connection pooling o caching.`,
    inputSchema: z.object({
      limit: z.number().int().min(1).max(100).default(20)
        .describe('Número de consultas a retornar'),
    }),
    handler: async (args: { limit: number }) => service.getFrequentQueries(args.limit),
  },
  {
    name: 'pg_explain_analyze',
    description: `Ejecuta EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) para una query dada y parsea el plan.
    ADVERTENCIA: Ejecuta la query realmente. Para INSERT/UPDATE/DELETE usar dentro de una transacción.
    Detecta automáticamente: Seq Scan, Index Scan, Hash Join, Nested Loop.`,
    inputSchema: z.object({
      query: z.string().describe('Query SQL a analizar (solo SELECT recomendado en producción)'),
    }),
    handler: async (args: { query: string }) => service.explainQuery(args.query, false),
  },
  {
    name: 'pg_explain_verbose',
    description: `Igual que pg_explain_analyze pero incluye WAL writes y CPU time.
    PG18: incluye buffer usage por defecto. Más detallado para análisis profundo.`,
    inputSchema: z.object({
      query: z.string().describe('Query SQL a analizar'),
    }),
    handler: async (args: { query: string }) => service.explainVerbose(args.query),
  },
  {
    name: 'pg_sequential_scans',
    description: `Tablas con alto ratio de seq_scan vs idx_scan. Candidatas a nuevos índices.
    Un ratio > 80% indica que las consultas no están usando índices efectivamente.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
    }),
    handler: async (args: { schema: string }) => service.getSequentialScans(args.schema),
  },
  {
    name: 'pg_stat_statements_reset',
    description: `Resetea las estadísticas de pg_stat_statements para comenzar desde cero.
    Útil después de cambios de configuración o para medir un período específico.`,
    inputSchema: z.object({}),
    handler: async () => service.resetStatStatements(),
  },
  {
    name: 'pg_stat_statements_info',
    description: `Información sobre el módulo pg_stat_statements: estadísticas agregadas disponibles.`,
    inputSchema: z.object({}),
    handler: async () => ({
      message: 'pg_stat_statements activo. Usar pg_slow_queries, pg_high_io_queries o pg_frequent_queries para consultar.',
      note: 'Para ver info de la extensión usar pg_extensions_status.',
    }),
  },
  {
    name: 'pg_query_planner_stats',
    description: `Estadísticas del planner por tabla: correlation, n_distinct, most_common_vals en pg_stats.
    Útil para entender por qué el planner elige un plan determinado.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema de la tabla'),
      table: z.string().describe('Nombre de la tabla'),
    }),
    handler: async (args: { schema: string; table: string }) =>
      service.getQueryPlannerStats(args.schema, args.table),
  },
] as const;
