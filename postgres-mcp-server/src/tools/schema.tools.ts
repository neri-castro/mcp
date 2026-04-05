// tools/schema.tools.ts
import { z } from 'zod';
import { SchemaService } from '../services/schema.service.js';
import { config } from '../config/config.js';

const service = new SchemaService();

export const schemaToolDefinitions = [
  {
    name: 'pg_schema_overview',
    description: `Resumen completo del schema: tablas, vistas, funciones, triggers, secuencias y su count.
    Útil como primer paso en una auditoría de base de datos para entender el volumen y complejidad del schema.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Nombre del schema a analizar'),
    }),
    handler: async (args: { schema: string }) => service.getSchemaOverview(args.schema),
  },
  {
    name: 'pg_table_list',
    description: `Lista todas las tablas con tamaño, row count estimado, last vacuum, last analyze.
    Incluye flag de si tiene PK y cantidad de índices. Ordenado por tamaño descendente.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Nombre del schema'),
    }),
    handler: async (args: { schema: string }) => service.getTableList(args.schema),
  },
  {
    name: 'pg_table_detail',
    description: `Detalle completo de una tabla: columnas, tipos, NOT NULL, defaults, constraints, storage.
    Fuentes: pg_attribute, pg_type, pg_constraint, information_schema.columns.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Nombre del schema'),
      table: z.string().describe('Nombre de la tabla a inspeccionar'),
    }),
    handler: async (args: { schema: string; table: string }) => service.getTableDetail(args.schema, args.table),
  },
  {
    name: 'pg_column_analysis',
    description: `Análisis de columnas problemáticas: sin NOT NULL, sin DEFAULT, tipos TEXT sin longitud,
    columnas NULLABLE en FK. Ayuda a detectar problemas de integridad en el diseño.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Nombre del schema'),
    }),
    handler: async (args: { schema: string }) => service.getColumnAnalysis(args.schema),
  },
  {
    name: 'pg_constraint_list',
    description: `Lista todas las constraints: PK, FK, UNIQUE, CHECK con sus columnas y expresiones.
    Fuentes: pg_constraint, information_schema.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Nombre del schema'),
    }),
    handler: async (args: { schema: string }) => service.getConstraintList(args.schema),
  },
  {
    name: 'pg_foreign_key_map',
    description: `Mapa completo de relaciones FK: tabla hijo → tabla padre, columnas, ON DELETE/UPDATE rules.
    Esencial para analizar integridad referencial y diseño de base de datos.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Nombre del schema'),
    }),
    handler: async (args: { schema: string }) => service.getForeignKeyMap(args.schema),
  },
  {
    name: 'pg_orphan_tables',
    description: `Detecta tablas sin PK y tablas sin FK entrante ni saliente (tablas aisladas).
    Candidatas a revisión o eliminación.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Nombre del schema'),
    }),
    handler: async (args: { schema: string }) => service.getOrphanTables(args.schema),
  },
  {
    name: 'pg_view_list',
    description: `Lista vistas con su definición SQL, tipo (VIEW vs MATERIALIZED VIEW).
    Útil para auditar dependencias y vistas obsoletas.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Nombre del schema'),
    }),
    handler: async (args: { schema: string }) => service.getViewList(args.schema),
  },
  {
    name: 'pg_sequence_list',
    description: `Lista secuencias con valor actual, min, max, increment y si están asociadas a columnas SERIAL/BIGSERIAL.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Nombre del schema'),
    }),
    handler: async (args: { schema: string }) => service.getSequenceList(args.schema),
  },
  {
    name: 'pg_table_size_report',
    description: `Reporte de tamaño: pg_total_relation_size, pg_relation_size, pg_indexes_size por tabla.
    Incluye tamaño de TOAST. Ordenado por tamaño total descendente.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Nombre del schema'),
    }),
    handler: async (args: { schema: string }) => service.getTableSizeReport(args.schema),
  },
] as const;
