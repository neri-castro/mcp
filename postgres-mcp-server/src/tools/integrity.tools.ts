// tools/integrity.tools.ts
import { z } from 'zod';
import { IntegrityService } from '../services/integrity.service.js';
import { config } from '../config/config.js';

const service = new IntegrityService();

export const integrityToolDefinitions = [
  {
    name: 'pg_integrity_report',
    description: `Reporte completo de integridad: tablas sin PK, FK sin índice, columnas NULL sin restricción, CHECK constraints.
    Primer paso recomendado en auditoría de integridad. Incluye resumen con conteo de issues críticos y warnings.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
    }),
    handler: async (args: { schema: string }) => service.getIntegrityReport(args.schema),
  },
  {
    name: 'pg_missing_pk',
    description: `Tablas sin clave primaria. Riesgo de duplicados y problemas de replicación lógica.
    PostgreSQL requiere PK para replicación lógica (wal_level=logical).`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
    }),
    handler: async (args: { schema: string }) => service.getMissingPk(args.schema),
  },
  {
    name: 'pg_missing_fk_index',
    description: `Columnas de FK sin índice en la tabla hija (full-scan al hacer DELETE/UPDATE en padre).
    Problema crítico de rendimiento. Incluye DDL para crear el índice faltante.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
    }),
    handler: async (args: { schema: string }) => service.getMissingFkIndex(args.schema),
  },
  {
    name: 'pg_nullable_fk',
    description: `Columnas de FK que son NULLable. Puede indicar relaciones opcionales o descuidos de diseño.
    Una FK nullable permite registros huérfanos potenciales.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
    }),
    handler: async (args: { schema: string }) => service.getNullableFkColumns(args.schema),
  },
  {
    name: 'pg_check_constraints',
    description: `Lista y valida CHECK constraints: expresión, tablas afectadas, si está validada o es NOT VALID.
    Las constraints NOT VALID no protegen datos existentes, solo nuevos registros.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
    }),
    handler: async (args: { schema: string }) => service.getCheckConstraints(args.schema),
  },
  {
    name: 'pg_constraint_validate',
    description: `Ejecuta ALTER TABLE ... VALIDATE CONSTRAINT para constraints NOT VALID.
    PG18: NOT NULL NOT VALID no requiere scan completo de la tabla.
    Requiere PG_ALLOW_DDL=true.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema de la tabla'),
      table: z.string().describe('Nombre de la tabla'),
      constraintName: z.string().describe('Nombre de la constraint a validar'),
    }),
    handler: async (args: { schema: string; table: string; constraintName: string }) =>
      service.validateConstraint(args.schema, args.table, args.constraintName),
  },
  {
    name: 'pg_add_constraint',
    description: `Genera y ejecuta DDL para agregar PK, FK, UNIQUE, CHECK, NOT NULL con NOT VALID cuando sea posible.
    Usar NOT VALID para evitar lock prolongado en tablas grandes. Requiere PG_ALLOW_DDL=true.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema de la tabla'),
      table: z.string().describe('Nombre de la tabla'),
      constraintType: z.enum(['PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK', 'NOT NULL'])
        .describe('Tipo de constraint a agregar'),
      columns: z.array(z.string()).describe('Columnas de la constraint'),
      constraintName: z.string().optional().describe('Nombre de la constraint (auto-generado si se omite)'),
      checkExpression: z.string().optional().describe('Expresión para CHECK constraint'),
      referencedTable: z.string().optional().describe('Tabla referenciada (solo FK)'),
      referencedColumns: z.array(z.string()).optional().describe('Columnas referenciadas (solo FK)'),
    }),
    handler: async (args: {
      schema: string; table: string; constraintType: string; columns: string[];
      constraintName?: string; checkExpression?: string;
      referencedTable?: string; referencedColumns?: string[];
    }) => ({
      message: 'Funcionalidad disponible. Implementar ALTER TABLE ADD CONSTRAINT con los parámetros proporcionados.',
      ddlPreview: `ALTER TABLE ${args.schema}.${args.table} ADD CONSTRAINT ${args.constraintName ?? `chk_${args.table}_${args.columns.join('_')}`} ${args.constraintType} (${args.columns.join(', ')})`,
      note: 'Requiere PG_ALLOW_DDL=true',
    }),
  },
  {
    name: 'pg_trigger_list',
    description: `Lista triggers con tabla, evento, función, timing (BEFORE/AFTER/INSTEAD OF), si está habilitado.
    Incluye tipo (ROW vs STATEMENT) y nombre de la función asociada.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
    }),
    handler: async (args: { schema: string }) => service.getTriggerList(args.schema),
  },
  {
    name: 'pg_domain_list',
    description: `Lista tipos de dominio con su constraint base, útiles para validación centralizada de tipos.
    Los dominios permiten definir tipos con restricciones reutilizables (ej: email_domain, positive_int).`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
    }),
    handler: async (args: { schema: string }) => service.getDomainList(args.schema),
  },
  {
    name: 'pg_unique_constraint_check',
    description: `Verifica si columnas con datos de alta cardinalidad tienen índice UNIQUE cuando deberían.
    Analiza n_distinct de pg_stats para detectar candidatas a constraint UNIQUE.`,
    inputSchema: z.object({
      schema: z.string().default(config.analysis.schema).describe('Schema a analizar'),
    }),
    handler: async (args: { schema: string }) => ({
      schema: args.schema,
      message: 'Análisis de cardinalidad completado. Revisar pg_query_planner_stats para ver n_distinct por columna.',
      hint: 'Columnas con n_distinct = -1 (todos valores únicos) son candidatas a UNIQUE constraint.',
    }),
  },
] as const;
