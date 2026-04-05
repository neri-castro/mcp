// repositories/index.repository.ts
import { BaseRepository } from './base.repository.js';
import {
  IndexDetailDTO,
  UnusedIndexDTO,
  DuplicateIndexDTO,
  IndexBloatDTO,
} from '../dtos/index.dto.js';

export interface IIndexRepository {
  getIndexList(schema: string): Promise<IndexDetailDTO[]>;
  getUnusedIndexes(schema: string, minScans: number): Promise<UnusedIndexDTO[]>;
  getDuplicateIndexes(schema: string): Promise<DuplicateIndexDTO[]>;
  getMissingFkIndexes(schema: string): Promise<{ childTable: string; fkColumn: string; parentTable: string }[]>;
  getInvalidIndexes(schema: string): Promise<IndexDetailDTO[]>;
  getIndexBloat(schema: string): Promise<IndexBloatDTO[]>;
}

export class IndexRepository extends BaseRepository<IndexDetailDTO> implements IIndexRepository {
  async getIndexList(schema: string): Promise<IndexDetailDTO[]> {
    const sql = `
      SELECT
        ix.schemaname AS schema_name,
        ix.tablename AS table_name,
        ix.indexname AS index_name,
        am.amname AS index_type,
        ARRAY(
          SELECT a.attname FROM pg_attribute a
          WHERE a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) AND a.attnum > 0
          ORDER BY a.attnum
        ) AS columns,
        COALESCE(ARRAY(
          SELECT a.attname FROM pg_attribute a
          WHERE a.attrelid = i.indrelid
          AND a.attnum = ANY(i.indkey[i.indnkeyatts:])
          ORDER BY a.attnum
        ), ARRAY[]::text[]) AS include_columns,
        i.indisunique AS is_unique,
        i.indisprimary AS is_primary,
        i.indisvalid AS is_valid,
        i.indpred IS NOT NULL AS is_partial,
        pg_get_expr(i.indpred, i.indrelid) AS where_clause,
        pg_relation_size(ix.indexname::regclass) AS size_bytes,
        pg_size_pretty(pg_relation_size(ix.indexname::regclass)) AS size_human,
        COALESCE(s.idx_scan, 0) AS idx_scan,
        COALESCE(s.idx_tup_read, 0) AS idx_tup_read,
        COALESCE(s.idx_tup_fetch, 0) AS idx_tup_fetch,
        pg_get_indexdef(i.indexrelid) AS index_def
      FROM pg_indexes ix
      JOIN pg_index i ON i.indexrelid = ix.indexname::regclass
      JOIN pg_class c ON c.oid = i.indexrelid
      JOIN pg_am am ON am.oid = c.relam
      LEFT JOIN pg_stat_user_indexes s
        ON s.schemaname = ix.schemaname AND s.indexrelname = ix.indexname
      WHERE ix.schemaname = $1
      ORDER BY size_bytes DESC NULLS LAST
    `;

    const rows = await this.query<{
      schema_name: string; table_name: string; index_name: string;
      index_type: string; columns: string[]; include_columns: string[];
      is_unique: boolean; is_primary: boolean; is_valid: boolean;
      is_partial: boolean; where_clause: string | null;
      size_bytes: string; size_human: string;
      idx_scan: string; idx_tup_read: string; idx_tup_fetch: string;
      index_def: string;
    }>(sql, [schema]);

    return rows.map(r => ({
      schemaName: r.schema_name,
      tableName: r.table_name,
      indexName: r.index_name,
      indexType: r.index_type as IndexDetailDTO['indexType'],
      columns: r.columns,
      includeColumns: r.include_columns,
      isUnique: r.is_unique,
      isPrimary: r.is_primary,
      isValid: r.is_valid,
      isPartial: r.is_partial,
      whereClause: r.where_clause,
      sizeBytes: parseInt(r.size_bytes ?? '0'),
      sizeHuman: r.size_human,
      idxScan: parseInt(r.idx_scan ?? '0'),
      idxTupRead: parseInt(r.idx_tup_read ?? '0'),
      idxTupFetch: parseInt(r.idx_tup_fetch ?? '0'),
      indexDef: r.index_def,
    }));
  }

  async getUnusedIndexes(schema: string, minScans: number = 50): Promise<UnusedIndexDTO[]> {
    const sql = `
      SELECT
        schemaname AS schema_name,
        tablename AS table_name,
        indexname AS index_name,
        pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
        COALESCE(idx_scan, 0) AS idx_scan,
        pg_get_indexdef(indexrelid) AS index_def
      FROM pg_stat_user_indexes
      JOIN pg_index USING (indexrelid)
      WHERE schemaname = $1
        AND NOT indisprimary
        AND NOT indisunique
        AND COALESCE(idx_scan, 0) < $2
      ORDER BY pg_relation_size(indexrelid) DESC
    `;

    const rows = await this.query<{
      schema_name: string; table_name: string; index_name: string;
      index_size: string; idx_scan: string; index_def: string;
    }>(sql, [schema, minScans]);

    return rows.map(r => ({
      schemaName: r.schema_name,
      tableName: r.table_name,
      indexName: r.index_name,
      indexSize: r.index_size,
      idxScan: parseInt(r.idx_scan ?? '0'),
      indexDef: r.index_def,
      recommendation: `DROP INDEX CONCURRENTLY ${r.schema_name}.${r.index_name};`,
    }));
  }

  async getDuplicateIndexes(schema: string): Promise<DuplicateIndexDTO[]> {
    const sql = `
      SELECT
        ix1.schemaname AS schema_name,
        ix1.tablename AS table_name,
        ix1.indexname AS index_name,
        ix2.indexname AS duplicate_of,
        ARRAY(
          SELECT a.attname FROM pg_attribute a
          WHERE a.attrelid = i1.indrelid AND a.attnum = ANY(i1.indkey) AND a.attnum > 0
        ) AS columns,
        pg_size_pretty(pg_relation_size(ix1.indexname::regclass)) AS index_size
      FROM pg_indexes ix1
      JOIN pg_index i1 ON i1.indexrelid = ix1.indexname::regclass
      JOIN pg_indexes ix2 ON ix2.tablename = ix1.tablename AND ix2.schemaname = ix1.schemaname
        AND ix2.indexname <> ix1.indexname
      JOIN pg_index i2 ON i2.indexrelid = ix2.indexname::regclass
      WHERE ix1.schemaname = $1
        AND i1.indkey::text = i2.indkey::text
        AND i1.indrelid = i2.indrelid
        AND NOT i1.indisprimary
      ORDER BY ix1.tablename, ix1.indexname
    `;

    const rows = await this.query<{
      schema_name: string; table_name: string; index_name: string;
      duplicate_of: string; columns: string[]; index_size: string;
    }>(sql, [schema]);

    return rows.map(r => ({
      schemaName: r.schema_name,
      tableName: r.table_name,
      indexName: r.index_name,
      duplicateOf: r.duplicate_of,
      columns: r.columns,
      indexSize: r.index_size,
      recommendation: `DROP INDEX CONCURRENTLY ${r.schema_name}.${r.index_name}; -- duplicate of ${r.duplicate_of}`,
    }));
  }

  async getMissingFkIndexes(schema: string): Promise<{ childTable: string; fkColumn: string; parentTable: string }[]> {
    const sql = `
      SELECT
        conrelid::regclass AS child_table,
        a.attname AS fk_column,
        confrelid::regclass AS parent_table
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      JOIN pg_namespace ns ON ns.oid = (
        SELECT relnamespace FROM pg_class WHERE oid = c.conrelid
      )
      WHERE c.contype = 'f'
        AND ns.nspname = $1
        AND NOT EXISTS (
          SELECT 1 FROM pg_index i
          WHERE i.indrelid = c.conrelid AND i.indkey[0] = a.attnum
        )
      ORDER BY child_table
    `;

    const rows = await this.query<{
      child_table: string; fk_column: string; parent_table: string;
    }>(sql, [schema]);

    return rows.map(r => ({
      childTable: r.child_table,
      fkColumn: r.fk_column,
      parentTable: r.parent_table,
    }));
  }

  async getInvalidIndexes(schema: string): Promise<IndexDetailDTO[]> {
    const allIndexes = await this.getIndexList(schema);
    return allIndexes.filter(i => !i.isValid);
  }

  async getIndexBloat(schema: string): Promise<IndexBloatDTO[]> {
    const sql = `
      SELECT
        ix.schemaname AS schema_name,
        ix.tablename AS table_name,
        ix.indexname AS index_name,
        ROUND(
          CASE WHEN pg_relation_size(ix.indexname::regclass) > 0
          THEN (pg_relation_size(ix.indexname::regclass)::numeric - c.relpages * 8192) /
               pg_relation_size(ix.indexname::regclass) * 100
          ELSE 0 END, 2
        ) AS bloat_ratio_pct,
        GREATEST(0, pg_relation_size(ix.indexname::regclass) - c.relpages * 8192) AS wasted_bytes,
        pg_size_pretty(GREATEST(0, pg_relation_size(ix.indexname::regclass) - c.relpages * 8192)) AS wasted_size,
        pg_size_pretty(pg_relation_size(ix.indexname::regclass)) AS total_size
      FROM pg_indexes ix
      JOIN pg_class c ON c.oid = ix.indexname::regclass
      JOIN pg_index i ON i.indexrelid = c.oid
      WHERE ix.schemaname = $1
        AND i.indisvalid
      ORDER BY wasted_bytes DESC NULLS LAST
    `;

    const rows = await this.query<{
      schema_name: string; table_name: string; index_name: string;
      bloat_ratio_pct: string; wasted_bytes: string; wasted_size: string; total_size: string;
    }>(sql, [schema]);

    return rows.map(r => ({
      schemaName: r.schema_name,
      tableName: r.table_name,
      indexName: r.index_name,
      bloatRatioPct: parseFloat(r.bloat_ratio_pct ?? '0'),
      wastedBytes: parseInt(r.wasted_bytes ?? '0'),
      wastedSize: r.wasted_size,
      totalSize: r.total_size,
      recommendation: parseFloat(r.bloat_ratio_pct ?? '0') > 30
        ? `REINDEX INDEX CONCURRENTLY ${r.schema_name}.${r.index_name};`
        : 'OK',
    }));
  }
}
