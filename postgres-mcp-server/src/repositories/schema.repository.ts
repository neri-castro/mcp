// repositories/schema.repository.ts
import { BaseRepository } from './base.repository.js';
import {
  TableSummaryDTO,
  ColumnDetailDTO,
  ConstraintDTO,
  SchemaOverviewDTO,
  ForeignKeyMapDTO,
  TableSizeReportDTO,
  SequenceDTO,
  ViewDTO,
} from '../dtos/schema.dto.js';

export interface ISchemaRepository {
  getSchemaOverview(schema: string): Promise<SchemaOverviewDTO>;
  getTableList(schema: string): Promise<TableSummaryDTO[]>;
  getTableDetail(schema: string, tableName: string): Promise<ColumnDetailDTO[]>;
  getColumnAnalysis(schema: string): Promise<ColumnDetailDTO[]>;
  getConstraintList(schema: string): Promise<ConstraintDTO[]>;
  getForeignKeyMap(schema: string): Promise<ForeignKeyMapDTO[]>;
  getOrphanTables(schema: string): Promise<string[]>;
  getViewList(schema: string): Promise<ViewDTO[]>;
  getSequenceList(schema: string): Promise<SequenceDTO[]>;
  getTableSizeReport(schema: string): Promise<TableSizeReportDTO[]>;
}

export class SchemaRepository extends BaseRepository<TableSummaryDTO> implements ISchemaRepository {
  async getSchemaOverview(schema: string): Promise<SchemaOverviewDTO> {
    const sql = `
      SELECT
        n.nspname AS schema,
        COUNT(DISTINCT CASE WHEN c.relkind = 'r' THEN c.oid END) AS table_count,
        COUNT(DISTINCT CASE WHEN c.relkind = 'v' THEN c.oid END) AS view_count,
        COUNT(DISTINCT CASE WHEN c.relkind = 'm' THEN c.oid END) AS materialized_view_count,
        COUNT(DISTINCT CASE WHEN p.prokind = 'f' THEN p.oid END) AS function_count,
        COUNT(DISTINCT t.oid) AS trigger_count,
        COUNT(DISTINCT CASE WHEN c.relkind = 'S' THEN c.oid END) AS sequence_count,
        COALESCE(SUM(pg_total_relation_size(c.oid)) FILTER (WHERE c.relkind = 'r'), 0) AS total_size_bytes
      FROM pg_namespace n
      LEFT JOIN pg_class c ON c.relnamespace = n.oid
      LEFT JOIN pg_proc p ON p.pronamespace = n.oid
      LEFT JOIN pg_trigger t ON t.tgrelid = c.oid AND NOT t.tgisinternal
      WHERE n.nspname = $1
      GROUP BY n.nspname
    `;
    const row = await this.queryOne<{
      schema: string; table_count: string; view_count: string;
      materialized_view_count: string; function_count: string;
      trigger_count: string; sequence_count: string; total_size_bytes: string;
    }>(sql, [schema]);

    if (!row) {
      return {
        schema, tableCount: 0, viewCount: 0, materializedViewCount: 0,
        functionCount: 0, triggerCount: 0, sequenceCount: 0, totalSizeBytes: 0,
      };
    }

    return {
      schema: row.schema,
      tableCount: parseInt(row.table_count),
      viewCount: parseInt(row.view_count),
      materializedViewCount: parseInt(row.materialized_view_count),
      functionCount: parseInt(row.function_count),
      triggerCount: parseInt(row.trigger_count),
      sequenceCount: parseInt(row.sequence_count),
      totalSizeBytes: parseInt(row.total_size_bytes),
    };
  }

  async getTableList(schema: string): Promise<TableSummaryDTO[]> {
    const sql = `
      SELECT
        schemaname AS schema,
        tablename AS table_name,
        COALESCE(n_live_tup, 0) AS estimated_rows,
        pg_total_relation_size(schemaname || '.' || tablename) AS total_size_bytes,
        pg_relation_size(schemaname || '.' || tablename) AS table_size_bytes,
        pg_indexes_size(schemaname || '.' || tablename) AS index_size_bytes,
        last_vacuum,
        last_analyze,
        (EXISTS (
          SELECT 1 FROM pg_constraint co
          JOIN pg_class cl ON cl.oid = co.conrelid
          JOIN pg_namespace ns ON ns.oid = cl.relnamespace
          WHERE co.contype = 'p' AND cl.relname = tablename AND ns.nspname = schemaname
        )) AS has_pk,
        (SELECT COUNT(*) FROM pg_indexes i WHERE i.schemaname = s.schemaname AND i.tablename = s.tablename) AS index_count
      FROM pg_stat_user_tables s
      WHERE schemaname = $1
      ORDER BY total_size_bytes DESC NULLS LAST
    `;

    const rows = await this.query<{
      schema: string; table_name: string; estimated_rows: string;
      total_size_bytes: string; table_size_bytes: string; index_size_bytes: string;
      last_vacuum: Date | null; last_analyze: Date | null;
      has_pk: boolean; index_count: string;
    }>(sql, [schema]);

    return rows.map(r => ({
      schema: r.schema,
      tableName: r.table_name,
      estimatedRows: parseInt(r.estimated_rows ?? '0'),
      totalSizeBytes: parseInt(r.total_size_bytes ?? '0'),
      tableSizeBytes: parseInt(r.table_size_bytes ?? '0'),
      indexSizeBytes: parseInt(r.index_size_bytes ?? '0'),
      lastVacuum: r.last_vacuum,
      lastAnalyze: r.last_analyze,
      hasPk: r.has_pk,
      indexCount: parseInt(r.index_count ?? '0'),
    }));
  }

  async getTableDetail(schema: string, tableName: string): Promise<ColumnDetailDTO[]> {
    const sql = `
      SELECT
        ordinal_position,
        column_name,
        data_type,
        is_nullable = 'YES' AS is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `;

    const rows = await this.query<{
      ordinal_position: number; column_name: string; data_type: string;
      is_nullable: boolean; column_default: string | null;
      character_maximum_length: number | null; numeric_precision: number | null;
      numeric_scale: number | null;
    }>(sql, [schema, tableName]);

    return rows.map(r => ({
      ordinalPosition: r.ordinal_position,
      columnName: r.column_name,
      dataType: r.data_type,
      isNullable: r.is_nullable,
      columnDefault: r.column_default,
      characterMaxLength: r.character_maximum_length,
      numericPrecision: r.numeric_precision,
      numericScale: r.numeric_scale,
    }));
  }

  async getColumnAnalysis(schema: string): Promise<ColumnDetailDTO[]> {
    const sql = `
      SELECT
        ordinal_position,
        column_name,
        table_name || '.' || column_name AS data_type,
        is_nullable = 'YES' AS is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns
      WHERE table_schema = $1
        AND (is_nullable = 'YES' OR column_default IS NULL)
      ORDER BY table_name, ordinal_position
    `;

    const rows = await this.query<{
      ordinal_position: number; column_name: string; data_type: string;
      is_nullable: boolean; column_default: string | null;
      character_maximum_length: number | null; numeric_precision: number | null;
      numeric_scale: number | null;
    }>(sql, [schema]);

    return rows.map(r => ({
      ordinalPosition: r.ordinal_position,
      columnName: r.column_name,
      dataType: r.data_type,
      isNullable: r.is_nullable,
      columnDefault: r.column_default,
      characterMaxLength: r.character_maximum_length,
      numericPrecision: r.numeric_precision,
      numericScale: r.numeric_scale,
    }));
  }

  async getConstraintList(schema: string): Promise<ConstraintDTO[]> {
    const sql = `
      SELECT
        co.conname AS constraint_name,
        CASE co.contype
          WHEN 'p' THEN 'PRIMARY KEY'
          WHEN 'f' THEN 'FOREIGN KEY'
          WHEN 'u' THEN 'UNIQUE'
          WHEN 'c' THEN 'CHECK'
        END AS constraint_type,
        cl.relname AS table_name,
        ARRAY(
          SELECT a.attname FROM pg_attribute a
          WHERE a.attrelid = co.conrelid AND a.attnum = ANY(co.conkey)
          ORDER BY a.attnum
        ) AS columns,
        rf.relname AS referenced_table,
        ARRAY(
          SELECT a.attname FROM pg_attribute a
          WHERE a.attrelid = co.confrelid AND a.attnum = ANY(co.confkey)
          ORDER BY a.attnum
        ) AS referenced_columns,
        CASE co.confupdtype
          WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
          WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT'
        END AS on_update,
        CASE co.confdeltype
          WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
          WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT'
        END AS on_delete,
        pg_get_constraintdef(co.oid) AS check_clause,
        NOT co.convalidated AS is_not_valid
      FROM pg_constraint co
      JOIN pg_class cl ON cl.oid = co.conrelid
      JOIN pg_namespace ns ON ns.oid = cl.relnamespace
      LEFT JOIN pg_class rf ON rf.oid = co.confrelid
      WHERE ns.nspname = $1
        AND co.contype IN ('p', 'f', 'u', 'c')
      ORDER BY cl.relname, co.contype
    `;

    const rows = await this.query<{
      constraint_name: string; constraint_type: string; table_name: string;
      columns: string[]; referenced_table: string | null; referenced_columns: string[] | null;
      on_update: string | null; on_delete: string | null;
      check_clause: string | null; is_not_valid: boolean;
    }>(sql, [schema]);

    return rows.map(r => ({
      constraintName: r.constraint_name,
      constraintType: r.constraint_type as ConstraintDTO['constraintType'],
      tableName: r.table_name,
      columns: r.columns,
      referencedTable: r.referenced_table ?? undefined,
      referencedColumns: r.referenced_columns ?? undefined,
      onDelete: r.on_delete as ConstraintDTO['onDelete'],
      onUpdate: r.on_update as ConstraintDTO['onUpdate'],
      checkClause: r.check_clause ?? undefined,
      isNotValid: r.is_not_valid,
    }));
  }

  async getForeignKeyMap(schema: string): Promise<ForeignKeyMapDTO[]> {
    const sql = `
      SELECT
        tc.table_schema AS child_schema,
        tc.table_name AS child_table,
        kcu.column_name AS child_column,
        ccu.table_schema AS parent_schema,
        ccu.table_name AS parent_table,
        ccu.column_name AS parent_column,
        rc.update_rule AS on_update,
        rc.delete_rule AS on_delete,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1
      ORDER BY child_table, child_column
    `;

    const rows = await this.query<{
      child_schema: string; child_table: string; child_column: string;
      parent_schema: string; parent_table: string; parent_column: string;
      on_update: string; on_delete: string; constraint_name: string;
    }>(sql, [schema]);

    return rows.map(r => ({
      childSchema: r.child_schema,
      childTable: r.child_table,
      childColumn: r.child_column,
      parentSchema: r.parent_schema,
      parentTable: r.parent_table,
      parentColumn: r.parent_column,
      onUpdate: r.on_update,
      onDelete: r.on_delete,
      constraintName: r.constraint_name,
    }));
  }

  async getOrphanTables(schema: string): Promise<string[]> {
    const sql = `
      SELECT cl.relname AS table_name
      FROM pg_class cl
      JOIN pg_namespace ns ON ns.oid = cl.relnamespace
      WHERE ns.nspname = $1
        AND cl.relkind = 'r'
        AND NOT EXISTS (
          SELECT 1 FROM pg_constraint co WHERE co.conrelid = cl.oid AND co.contype = 'p'
        )
        AND NOT EXISTS (
          SELECT 1 FROM pg_constraint co WHERE co.conrelid = cl.oid AND co.contype = 'f'
        )
        AND NOT EXISTS (
          SELECT 1 FROM pg_constraint co WHERE co.confrelid = cl.oid AND co.contype = 'f'
        )
      ORDER BY cl.relname
    `;
    const rows = await this.query<{ table_name: string }>(sql, [schema]);
    return rows.map(r => r.table_name);
  }

  async getViewList(schema: string): Promise<ViewDTO[]> {
    const sql = `
      SELECT
        schemaname AS schema,
        viewname AS view_name,
        'VIEW' AS view_type,
        definition,
        TRUE AS is_updatable
      FROM pg_views WHERE schemaname = $1
      UNION ALL
      SELECT
        schemaname AS schema,
        matviewname AS view_name,
        'MATERIALIZED VIEW' AS view_type,
        definition,
        FALSE AS is_updatable
      FROM pg_matviews WHERE schemaname = $1
      ORDER BY view_name
    `;
    const rows = await this.query<{
      schema: string; view_name: string; view_type: string;
      definition: string; is_updatable: boolean;
    }>(sql, [schema]);

    return rows.map(r => ({
      schema: r.schema,
      viewName: r.view_name,
      viewType: r.view_type as ViewDTO['viewType'],
      definition: r.definition,
      isUpdatable: r.is_updatable,
    }));
  }

  async getSequenceList(schema: string): Promise<SequenceDTO[]> {
    const sql = `
      SELECT
        sequence_schema AS schema,
        sequence_name,
        minimum_value::bigint AS min_value,
        maximum_value::bigint AS max_value,
        increment::bigint AS increment,
        cycle_option = 'YES' AS is_cycled,
        a.attrelid::regclass::text AS associated_table,
        a.attname AS associated_column
      FROM information_schema.sequences s
      LEFT JOIN pg_depend d ON d.objid = (
        SELECT oid FROM pg_class WHERE relname = s.sequence_name
        AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = s.sequence_schema)
      ) AND d.deptype = 'a'
      LEFT JOIN pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
      WHERE sequence_schema = $1
      ORDER BY sequence_name
    `;
    const rows = await this.query<{
      schema: string; sequence_name: string; min_value: string;
      max_value: string; increment: string; is_cycled: boolean;
      associated_table: string | null; associated_column: string | null;
    }>(sql, [schema]);

    return rows.map(r => ({
      schema: r.schema,
      sequenceName: r.sequence_name,
      currentValue: null,
      minValue: parseInt(r.min_value),
      maxValue: parseInt(r.max_value),
      increment: parseInt(r.increment),
      isCycled: r.is_cycled,
      associatedTable: r.associated_table,
      associatedColumn: r.associated_column,
    }));
  }

  async getTableSizeReport(schema: string): Promise<TableSizeReportDTO[]> {
    const sql = `
      SELECT
        schemaname AS schema,
        tablename AS table_name,
        pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
        pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) AS table_size,
        pg_size_pretty(pg_indexes_size(schemaname || '.' || tablename)) AS index_size,
        pg_size_pretty(
          pg_total_relation_size(schemaname || '.' || tablename)
          - pg_relation_size(schemaname || '.' || tablename)
          - pg_indexes_size(schemaname || '.' || tablename)
        ) AS toast_size,
        pg_total_relation_size(schemaname || '.' || tablename) AS total_size_bytes
      FROM pg_tables
      WHERE schemaname = $1
      ORDER BY total_size_bytes DESC
    `;
    const rows = await this.query<{
      schema: string; table_name: string; total_size: string;
      table_size: string; index_size: string; toast_size: string; total_size_bytes: string;
    }>(sql, [schema]);

    return rows.map(r => ({
      schema: r.schema,
      tableName: r.table_name,
      totalSize: r.total_size,
      tableSize: r.table_size,
      indexSize: r.index_size,
      toastSize: r.toast_size,
      totalSizeBytes: parseInt(r.total_size_bytes ?? '0'),
    }));
  }
}
