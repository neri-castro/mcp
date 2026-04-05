// tools/index.tools.ts
import { z } from 'zod';
import { IndexService } from '../services/index.service.js';
import { config } from '../config/config.js';

const service = new IndexService();

export const indexToolDefinitions = [
  {
    name: 'pg_index_list',
    description: `Lista todos los índices con: nombre, tabla, columnas, tipo, tamaño, is_unique, is_primary, is_valid.
    Incluye estadísticas de uso (idx_scan, idx_tup_read) y DDL completo.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a inspeccionar'),
    }),
    handler: async (args: { schema: string }) => service.getIndexList(args.schema),
  },
  {
    name: 'pg_unused_indexes',
    description: `Índices con idx_scan = 0 o muy bajo uso. Candidatos a eliminar para reducir overhead de escritura.
    No incluye PK ni UNIQUE constraints.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
      minScans: z.number().int().min(0).default(50).describe('Umbral máximo de scans para considerar "no usado"'),
    }),
    handler: async (args: { schema: string; minScans: number }) =>
      service.getUnusedIndexes(args.schema, args.minScans),
  },
  {
    name: 'pg_duplicate_indexes',
    description: `Detecta índices con la misma combinación de columnas y tipo (exactos o casi-duplicados).
    Consume espacio y degrada escrituras innecesariamente.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
    }),
    handler: async (args: { schema: string }) => service.getDuplicateIndexes(args.schema),
  },
  {
    name: 'pg_missing_fk_indexes',
    description: `FK sin índice en la columna hijo — problema crítico para DELETE/UPDATE en tabla padre.
    Genera full-scan en cada operación de la tabla padre. Incluye DDL para crear el índice.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
    }),
    handler: async (args: { schema: string }) => service.getMissingFkIndexes(args.schema),
  },
  {
    name: 'pg_index_bloat',
    description: `Estimación de bloat en índices B-tree usando cálculo heurístico con pg_class.
    Identifica índices candidatos a REINDEX CONCURRENTLY.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
    }),
    handler: async (args: { schema: string }) => service.getIndexBloat(args.schema),
  },
  {
    name: 'pg_invalid_indexes',
    description: `Índices marcados como inválidos (CREATE INDEX CONCURRENTLY fallido).
    Deben eliminarse y recrearse. Fuente: pg_index WHERE NOT indisvalid.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
    }),
    handler: async (args: { schema: string }) => service.getInvalidIndexes(args.schema),
  },
  {
    name: 'pg_index_recommend',
    description: `Sugiere índices faltantes basado en queries de pg_stat_statements y sequential scans frecuentes.
    Considera: tablas con muchos seq_scans, FK sin índice en tabla hija, columnas de alta cardinalidad sin índice.
    Retorna DDL sugerido con tipo de índice óptimo (B-tree, GIN, BRIN) y justificación.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
      minSeqScanRatio: z.number().min(0).max(100).default(80)
        .describe('% mínimo de seq_scan vs total scans para incluir tabla'),
      topNTables: z.number().int().min(1).max(50).default(10)
        .describe('Limitar análisis a las N tablas más accedidas'),
    }),
    handler: async (args: { schema: string; minSeqScanRatio: number; topNTables: number }) =>
      service.getIndexRecommendations(args.schema, args.minSeqScanRatio, args.topNTables),
  },
  {
    name: 'pg_create_index',
    description: `Genera el DDL para crear un índice y lo ejecuta si PG_ALLOW_DDL=true.
    Usa CONCURRENTLY por defecto para no bloquear escrituras en producción.
    Soporta B-tree, GIN, GiST, BRIN, Hash, índices parciales y covering (INCLUDE).`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema de la tabla'),
      table: z.string().describe('Nombre de la tabla'),
      columns: z.array(z.string()).min(1).describe('Columnas del índice (en orden)'),
      indexType: z.enum(['btree', 'hash', 'gin', 'gist', 'spgist', 'brin'])
        .optional().describe('Tipo de índice (default: btree)'),
      unique: z.boolean().default(false).describe('Crear índice UNIQUE'),
      whereClause: z.string().optional().describe('Cláusula WHERE para índice parcial'),
      includeColumns: z.array(z.string()).optional().describe('Columnas INCLUDE para covering index'),
      concurrent: z.boolean().default(true).describe('Usar CONCURRENTLY (recomendado en producción)'),
    }),
    handler: async (args: {
      schema: string; table: string; columns: string[];
      indexType?: string; unique: boolean; whereClause?: string;
      includeColumns?: string[]; concurrent: boolean;
    }) => service.createIndex(args.schema, args.table, args.columns, {
      indexType: args.indexType,
      unique: args.unique,
      whereClause: args.whereClause,
      includeColumns: args.includeColumns,
      concurrent: args.concurrent,
    }),
  },
  {
    name: 'pg_drop_index',
    description: `Genera el DDL para eliminar un índice y lo ejecuta si PG_ALLOW_DDL=true.
    Usa DROP INDEX CONCURRENTLY para no bloquear lectura/escritura.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema del índice'),
      indexName: z.string().describe('Nombre del índice a eliminar'),
    }),
    handler: async (args: { schema: string; indexName: string }) =>
      service.dropIndex(args.schema, args.indexName),
  },
  {
    name: 'pg_reindex_table',
    description: `Ejecuta REINDEX TABLE CONCURRENTLY si PG_ALLOW_MAINTENANCE=true.
    Reconstruye todos los índices de la tabla. Útil para eliminar bloat de índices.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema de la tabla'),
      table: z.string().describe('Nombre de la tabla a reindexar'),
    }),
    handler: async (args: { schema: string; table: string }) =>
      service.reindexTable(args.schema, args.table),
  },
  {
    name: 'pg_index_coverage',
    description: `Analiza si los índices existentes cubren las columnas del WHERE en las top queries.
    Identifica oportunidades de covering indexes (INCLUDE) para evitar heap fetches.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
    }),
    handler: async (args: { schema: string }) => service.getIndexCoverage(args.schema),
  },
  {
    name: 'pg_hypopg_simulate',
    description: `Usa HypoPG para simular un índice hipotético y verificar si el planner lo usaría,
    sin crear el índice real. Requiere extensión hypopg instalada.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema de la tabla'),
      table: z.string().describe('Tabla sobre la que simular el índice'),
      columns: z.array(z.string()).describe('Columnas del índice hipotético'),
      query: z.string().describe('Query SQL para verificar si el índice sería utilizado'),
    }),
    handler: async (_args: { schema: string; table: string; columns: string[]; query: string }) => ({
      message: 'HypoPG simulation — requiere extensión hypopg instalada (CREATE EXTENSION hypopg)',
      hint: 'Verificar estado con pg_extensions_status primero.',
    }),
  },
] as const;
