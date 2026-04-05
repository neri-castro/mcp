// tools/vacuum.tools.ts
import { z } from 'zod';
import { VacuumService } from '../services/vacuum.service.js';
import { config } from '../config/config.js';

const service = new VacuumService();

export const vacuumToolDefinitions = [
  {
    name: 'pg_vacuum_status',
    description: `Estado de vacuum por tabla: last_vacuum, last_autovacuum, n_dead_tup, n_live_tup, vacuum_count.
    PG18+: incluye timings totales de vacuum/analyze (total_vacuum_time, total_autovacuum_time).`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
    }),
    handler: async (args: { schema: string }) => service.getVacuumStatus(args.schema),
  },
  {
    name: 'pg_table_bloat_estimate',
    description: `Estimación rápida de bloat (espacio desperdiciado) por tabla usando fórmulas sobre pg_class.
    No requiere extensiones adicionales. Para precisión exacta usar pg_table_bloat_precise.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
    }),
    handler: async (args: { schema: string }) => service.getTableBloatEstimate(args.schema),
  },
  {
    name: 'pg_table_bloat_precise',
    description: `Bloat preciso usando pgstattuple.pgstattuple(). Requiere extensión pgstattuple instalada.
    Más lento pero exacto. Usar en tablas específicas con alto bloat estimado.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema de la tabla'),
      table: z.string().describe('Nombre de la tabla'),
    }),
    handler: async (_args: { schema: string; table: string }) => ({
      message: 'Requiere extensión pgstattuple. Instalar con: CREATE EXTENSION pgstattuple;',
      hint: 'Verificar con pg_extensions_status primero.',
    }),
  },
  {
    name: 'pg_index_bloat_precise',
    description: `Bloat de índice usando pgstattuple.pgstatindex(). Requiere extensión pgstattuple instalada.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema del índice'),
      indexName: z.string().describe('Nombre del índice'),
    }),
    handler: async (_args: { schema: string; indexName: string }) => ({
      message: 'Requiere extensión pgstattuple. Instalar con: CREATE EXTENSION pgstattuple;',
    }),
  },
  {
    name: 'pg_autovacuum_config',
    description: `Muestra configuración actual de autovacuum global y overrides por tabla (pg_class.reloptions).
    Incluye todos los parámetros autovacuum_* de pg_settings.`,
    inputSchema: z.object({}),
    handler: async () => service.getAutovacuumConfig(),
  },
  {
    name: 'pg_autovacuum_candidates',
    description: `Tablas que necesitan VACUUM urgente: n_dead_tup supera threshold configurado.
    Calcula threshold dinámicamente basado en autovacuum_vacuum_threshold y scale_factor.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
    }),
    handler: async (args: { schema: string }) => service.getAutovacuumCandidates(args.schema),
  },
  {
    name: 'pg_xid_wraparound_risk',
    description: `Tablas con relfrozenxid cercano al límite (wraparound risk). Crítico para estabilidad del servidor.
    CRITICAL: age > 1.8B XIDs. WARNING: age > 1.5B XIDs. Ejecutar VACUUM FREEZE inmediatamente en CRITICAL.`,
    inputSchema: z.object({}),
    handler: async () => service.getXidWraparoundRisk(),
  },
  {
    name: 'pg_run_vacuum',
    description: `Ejecuta VACUUM en una tabla o en todas las tablas del schema.
    Requiere PG_ALLOW_MAINTENANCE=true. Soporta modos:
    - VACUUM: elimina dead tuples, no libera espacio al OS
    - VACUUM_ANALYZE: elimina dead tuples + actualiza estadísticas del planner
    - VACUUM_FULL: elimina dead tuples + reescribe tabla + libera espacio al OS (LOCK exclusivo!)
    - VACUUM_FREEZE: congela tuplas para prevenir XID wraparound
    ADVERTENCIA: VACUUM FULL bloquea todas las operaciones. Usar solo en ventanas de mantenimiento.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema de la tabla'),
      table: z.string().optional()
        .describe('Nombre de tabla. Si se omite, aplica VACUUM al schema completo'),
      mode: z.enum(['VACUUM', 'VACUUM_ANALYZE', 'VACUUM_FULL', 'VACUUM_FREEZE'])
        .default('VACUUM_ANALYZE')
        .describe('Modo de vacuum a ejecutar'),
      verbose: z.boolean().default(true).describe('Mostrar salida verbose del vacuum'),
    }),
    handler: async (args: { schema: string; table?: string; mode: string; verbose: boolean }) =>
      service.runVacuum(args.schema, args.table, args.mode, args.verbose),
  },
  {
    name: 'pg_run_analyze',
    description: `Ejecuta ANALYZE en tabla o schema completo si PG_ALLOW_MAINTENANCE=true.
    Actualiza estadísticas del planner sin eliminar dead tuples.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
      table: z.string().optional().describe('Tabla específica. Si se omite, analiza el schema completo'),
    }),
    handler: async (args: { schema: string; table?: string }) =>
      service.runAnalyze(args.schema, args.table),
  },
  {
    name: 'pg_vacuum_progress',
    description: `Monitorea el progreso en tiempo real de un VACUUM en curso.
    Fuente: pg_stat_progress_vacuum. Muestra fase, bloques procesados y dead tuples eliminadas.`,
    inputSchema: z.object({}),
    handler: async () => service.getVacuumProgress(),
  },
  {
    name: 'pg_toast_bloat',
    description: `Analiza tamaño de tablas TOAST asociadas a tablas con columnas grandes (TEXT, BYTEA, JSONB).
    Las tablas TOAST no son visibles en pg_tables pero pueden consumir mucho espacio.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
    }),
    handler: async (args: { schema: string }) => service.getToastBloat(args.schema),
  },
] as const;
