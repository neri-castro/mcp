// repositories/partition.repository.ts
import { BaseRepository } from './base.repository.js';

export interface PartitionListDTO {
  schema: string;
  tableName: string;
  strategy: 'RANGE' | 'LIST' | 'HASH';
  partitionColumn: string;
  partitionCount: number;
  totalSize: string;
}

export interface PartitionDetailDTO {
  partitionName: string;
  bounds: string;
  sizeBytes: number;
  sizeHuman: string;
  estimatedRows: number;
}

export interface PartitionRecommendationDTO {
  tableName: string;
  estimatedRows: number;
  totalSize: string;
  recommendation: string;
  suggestedStrategy: string;
  suggestedColumn: string;
  ddlSuggestion: string;
}

export interface IPartitionRepository {
  getPartitionList(schema: string): Promise<PartitionListDTO[]>;
  getPartitionDetail(schema: string, tableName: string): Promise<PartitionDetailDTO[]>;
  getPartitionRecommendations(schema: string): Promise<PartitionRecommendationDTO[]>;
  getPartitionMaintenance(schema: string): Promise<Record<string, unknown>[]>;
}

export class PartitionRepository extends BaseRepository<PartitionListDTO> implements IPartitionRepository {
  async getPartitionList(schema: string): Promise<PartitionListDTO[]> {
    const sql = `
      SELECT
        n.nspname AS schema,
        c.relname AS table_name,
        CASE p.partstrat
          WHEN 'r' THEN 'RANGE'
          WHEN 'l' THEN 'LIST'
          WHEN 'h' THEN 'HASH'
        END AS strategy,
        (
          SELECT string_agg(a.attname, ', ')
          FROM pg_attribute a
          WHERE a.attrelid = c.oid
            AND a.attnum = ANY(p.partattrs::smallint[])
        ) AS partition_column,
        (SELECT COUNT(*) FROM pg_inherits i WHERE i.inhparent = c.oid) AS partition_count,
        pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size
      FROM pg_partitioned_table p
      JOIN pg_class c ON c.oid = p.partrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = $1
      ORDER BY c.relname
    `;

    const rows = await this.query<{
      schema: string; table_name: string; strategy: string;
      partition_column: string; partition_count: string; total_size: string;
    }>(sql, [schema]);

    return rows.map(r => ({
      schema: r.schema,
      tableName: r.table_name,
      strategy: r.strategy as PartitionListDTO['strategy'],
      partitionColumn: r.partition_column,
      partitionCount: parseInt(r.partition_count ?? '0'),
      totalSize: r.total_size,
    }));
  }

  async getPartitionDetail(schema: string, tableName: string): Promise<PartitionDetailDTO[]> {
    const sql = `
      SELECT
        child.relname AS partition_name,
        pg_get_expr(child.relpartbound, child.oid) AS bounds,
        pg_total_relation_size(child.oid) AS size_bytes,
        pg_size_pretty(pg_total_relation_size(child.oid)) AS size_human,
        COALESCE(child.reltuples::bigint, 0) AS estimated_rows
      FROM pg_class parent
      JOIN pg_namespace n ON n.oid = parent.relnamespace
      JOIN pg_inherits i ON i.inhparent = parent.oid
      JOIN pg_class child ON child.oid = i.inhrelid
      WHERE n.nspname = $1 AND parent.relname = $2
      ORDER BY bounds
    `;

    const rows = await this.query<{
      partition_name: string; bounds: string; size_bytes: string;
      size_human: string; estimated_rows: string;
    }>(sql, [schema, tableName]);

    return rows.map(r => ({
      partitionName: r.partition_name,
      bounds: r.bounds,
      sizeBytes: parseInt(r.size_bytes ?? '0'),
      sizeHuman: r.size_human,
      estimatedRows: parseInt(r.estimated_rows ?? '0'),
    }));
  }

  async getPartitionRecommendations(schema: string): Promise<PartitionRecommendationDTO[]> {
    const sql = `
      SELECT
        t.tablename AS table_name,
        COALESCE(s.n_live_tup, 0) AS estimated_rows,
        pg_size_pretty(pg_total_relation_size(t.schemaname || '.' || t.tablename)) AS total_size,
        pg_total_relation_size(t.schemaname || '.' || t.tablename) AS total_size_bytes
      FROM pg_tables t
      JOIN pg_stat_user_tables s ON s.relname = t.tablename AND s.schemaname = t.schemaname
      WHERE t.schemaname = $1
        AND NOT EXISTS (
          SELECT 1 FROM pg_partitioned_table p
          JOIN pg_class c ON c.oid = p.partrelid
          WHERE c.relname = t.tablename
        )
        AND pg_total_relation_size(t.schemaname || '.' || t.tablename) > 1073741824
      ORDER BY total_size_bytes DESC
      LIMIT 10
    `;

    const rows = await this.query<{
      table_name: string; estimated_rows: string; total_size: string; total_size_bytes: string;
    }>(sql, [schema]);

    return rows.map(r => ({
      tableName: r.table_name,
      estimatedRows: parseInt(r.estimated_rows ?? '0'),
      totalSize: r.total_size,
      recommendation: `Tabla grande (${r.total_size}) sin particionar. Considerar particionamiento.`,
      suggestedStrategy: 'RANGE',
      suggestedColumn: 'created_at o campo de fecha/timestamp',
      ddlSuggestion: `-- Ejemplo de particionamiento por rango:\n-- CREATE TABLE ${r.table_name}_partitioned (LIKE ${r.table_name}) PARTITION BY RANGE (created_at);`,
    }));
  }

  async getPartitionMaintenance(schema: string): Promise<Record<string, unknown>[]> {
    const sql = `
      SELECT
        n.nspname AS schema,
        child.relname AS partition_name,
        parent.relname AS parent_table,
        COALESCE(s.n_dead_tup, 0) AS dead_tuples,
        COALESCE(s.n_live_tup, 0) AS live_tuples,
        s.last_vacuum,
        s.last_autovacuum,
        s.last_analyze,
        pg_size_pretty(pg_total_relation_size(child.oid)) AS size
      FROM pg_inherits i
      JOIN pg_class parent ON parent.oid = i.inhparent
      JOIN pg_class child ON child.oid = i.inhrelid
      JOIN pg_namespace n ON n.oid = child.relnamespace
      LEFT JOIN pg_stat_user_tables s ON s.relid = child.oid
      WHERE n.nspname = $1
      ORDER BY parent.relname, child.relname
    `;

    return this.query<Record<string, unknown>>(sql, [schema]);
  }
}
