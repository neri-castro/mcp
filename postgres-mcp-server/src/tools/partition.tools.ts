// tools/partition.tools.ts
import { z } from 'zod';
import { PartitionRepository } from '../repositories/partition.repository.js';
import { config } from '../config/config.js';

const repo = new PartitionRepository();

export const partitionToolDefinitions = [
  {
    name: 'pg_partition_list',
    description: `Lista tablas particionadas: nombre, estrategia (RANGE/LIST/HASH), columna de partición, nro. de particiones.
    Fuente: pg_partitioned_table, pg_class, pg_attribute, pg_namespace.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
    }),
    handler: async (args: { schema: string }) => repo.getPartitionList(args.schema),
  },
  {
    name: 'pg_partition_detail',
    description: `Detalle de particiones de una tabla: nombre, bounds, tamaño, row count.
    Fuente: pg_inherits, pg_class, pg_get_expr(relpartbound).`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema de la tabla'),
      table: z.string().describe('Nombre de la tabla particionada'),
    }),
    handler: async (args: { schema: string; table: string }) =>
      repo.getPartitionDetail(args.schema, args.table),
  },
  {
    name: 'pg_partition_pruning',
    description: `Verifica si el planner usa partition pruning en queries dadas.
    Usa EXPLAIN con enable_partition_pruning. PG18: mejoras en partition pruning automático.`,
    inputSchema: z.object({
      query: z.string().describe('Query SQL a analizar para partition pruning'),
    }),
    handler: async (_args: { query: string }) => ({
      message: 'Verificar partition pruning usando pg_explain_analyze con la query proporcionada.',
      hint: 'Buscar "Partitions removed" en el plan JSON para confirmar pruning activo.',
    }),
  },
  {
    name: 'pg_partition_recommend',
    description: `Sugiere particionamiento para tablas grandes con patrones de acceso por rango de fechas o valores discretos.
    Considera tablas > 1GB sin particionar. Sugiere estrategia RANGE para timestamps, LIST para enums.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
    }),
    handler: async (args: { schema: string }) => repo.getPartitionRecommendations(args.schema),
  },
  {
    name: 'pg_partition_maintenance',
    description: `Lista particiones sin VACUUM/ANALYZE reciente y su estado de bloat.
    Las particiones heredan políticas de autovacuum del padre pero pueden requerir mantenimiento independiente.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
    }),
    handler: async (args: { schema: string }) => repo.getPartitionMaintenance(args.schema),
  },
] as const;
