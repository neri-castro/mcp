// repositories/stats.repository.ts
import { BaseRepository } from './base.repository.js';
import { SlowQueryDTO, ExplainPlanDTO, SequentialScanDTO, QueryPlannerStatsDTO } from '../dtos/query.dto.js';

export interface IStatsRepository {
  getSlowQueries(limit: number, orderBy: string, minCalls: number, dbName?: string): Promise<SlowQueryDTO[]>;
  getHighIoQueries(limit: number): Promise<SlowQueryDTO[]>;
  getFrequentQueries(limit: number): Promise<SlowQueryDTO[]>;
  explainQuery(query: string, verbose?: boolean): Promise<ExplainPlanDTO>;
  getSequentialScans(schema: string): Promise<SequentialScanDTO[]>;
  getQueryPlannerStats(schema: string, tableName: string): Promise<QueryPlannerStatsDTO[]>;
  resetStatStatements(): Promise<void>;
}

export class StatsRepository extends BaseRepository<SlowQueryDTO> implements IStatsRepository {
  private buildSlowQuerySql(orderByClause: string, extraWhere: string = ''): string {
    const pg17Cols = this.isPg17Plus
      ? ', stats_since, minmax_stats_since'
      : '';

    return `
      SELECT
        queryid::text AS query_id,
        query,
        calls,
        total_exec_time AS total_exec_time_ms,
        mean_exec_time AS mean_exec_time_ms,
        stddev_exec_time AS stddev_exec_time_ms,
        min_exec_time AS min_exec_time_ms,
        max_exec_time AS max_exec_time_ms,
        rows,
        shared_blks_hit,
        shared_blks_read,
        CASE WHEN shared_blks_hit + shared_blks_read > 0
          THEN ROUND(100.0 * shared_blks_hit / (shared_blks_hit + shared_blks_read), 2)
          ELSE 100
        END AS cache_hit_ratio_pct,
        temp_blks_read,
        temp_blks_written
        ${pg17Cols}
      FROM pg_stat_statements
      WHERE dbid = (SELECT oid FROM pg_database WHERE datname = COALESCE($3, current_database()))
      ${extraWhere}
      AND calls >= $2
      ORDER BY ${orderByClause} DESC
      LIMIT $1
    `;
  }

  async getSlowQueries(limit: number, orderBy: string, minCalls: number, dbName?: string): Promise<SlowQueryDTO[]> {
    const orderMap: Record<string, string> = {
      total_time: 'total_exec_time',
      mean_time: 'mean_exec_time',
      calls: 'calls',
      io_time: 'blk_read_time + blk_write_time',
    };
    const orderClause = orderMap[orderBy] ?? 'total_exec_time';
    const sql = this.buildSlowQuerySql(orderClause);
    return this.mapQueryRows(await this.query(sql, [limit, minCalls, dbName ?? null]));
  }

  async getHighIoQueries(limit: number): Promise<SlowQueryDTO[]> {
    const pg17Cols = this.isPg17Plus ? ', stats_since, minmax_stats_since' : '';
    const sql = `
      SELECT
        queryid::text AS query_id, query, calls,
        total_exec_time AS total_exec_time_ms, mean_exec_time AS mean_exec_time_ms,
        stddev_exec_time AS stddev_exec_time_ms, min_exec_time AS min_exec_time_ms,
        max_exec_time AS max_exec_time_ms, rows,
        shared_blks_hit, shared_blks_read,
        CASE WHEN shared_blks_hit + shared_blks_read > 0
          THEN ROUND(100.0 * shared_blks_hit / (shared_blks_hit + shared_blks_read), 2)
          ELSE 100
        END AS cache_hit_ratio_pct,
        temp_blks_read, temp_blks_written
        ${pg17Cols}
      FROM pg_stat_statements
      WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
      ORDER BY shared_blks_read DESC
      LIMIT $1
    `;
    return this.mapQueryRows(await this.query(sql, [limit]));
  }

  async getFrequentQueries(limit: number): Promise<SlowQueryDTO[]> {
    const pg17Cols = this.isPg17Plus ? ', stats_since, minmax_stats_since' : '';
    const sql = `
      SELECT
        queryid::text AS query_id, query, calls,
        total_exec_time AS total_exec_time_ms, mean_exec_time AS mean_exec_time_ms,
        stddev_exec_time AS stddev_exec_time_ms, min_exec_time AS min_exec_time_ms,
        max_exec_time AS max_exec_time_ms, rows,
        shared_blks_hit, shared_blks_read,
        CASE WHEN shared_blks_hit + shared_blks_read > 0
          THEN ROUND(100.0 * shared_blks_hit / (shared_blks_hit + shared_blks_read), 2)
          ELSE 100
        END AS cache_hit_ratio_pct,
        temp_blks_read, temp_blks_written
        ${pg17Cols}
      FROM pg_stat_statements
      WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
      ORDER BY calls DESC
      LIMIT $1
    `;
    return this.mapQueryRows(await this.query(sql, [limit]));
  }

  private mapQueryRows(rows: Record<string, unknown>[]): SlowQueryDTO[] {
    return rows.map(r => ({
      queryId: String(r['query_id'] ?? ''),
      query: String(r['query'] ?? ''),
      calls: Number(r['calls'] ?? 0),
      totalExecTimeMs: Number(r['total_exec_time_ms'] ?? 0),
      meanExecTimeMs: Number(r['mean_exec_time_ms'] ?? 0),
      stddevExecTimeMs: Number(r['stddev_exec_time_ms'] ?? 0),
      minExecTimeMs: Number(r['min_exec_time_ms'] ?? 0),
      maxExecTimeMs: Number(r['max_exec_time_ms'] ?? 0),
      rows: Number(r['rows'] ?? 0),
      sharedBlksHit: Number(r['shared_blks_hit'] ?? 0),
      sharedBlksRead: Number(r['shared_blks_read'] ?? 0),
      cacheHitRatioPct: Number(r['cache_hit_ratio_pct'] ?? 100),
      tempBlksRead: Number(r['temp_blks_read'] ?? 0),
      tempBlksWritten: Number(r['temp_blks_written'] ?? 0),
      statsSince: r['stats_since'] as Date | undefined,
      minmaxStatsSince: r['minmax_stats_since'] as Date | undefined,
    }));
  }

  async explainQuery(query: string, verbose: boolean = false): Promise<ExplainPlanDTO> {
    const walOption = verbose ? ', WAL' : '';
    const explainSql = `EXPLAIN (ANALYZE, BUFFERS${walOption}, FORMAT JSON) ${query}`;
    const rows = await this.query<{ 'QUERY PLAN': object[] }>(explainSql);
    const plan = rows[0]?.['QUERY PLAN']?.[0] as Record<string, unknown> ?? {};
    const planNode = plan['Plan'] as Record<string, unknown> ?? {};

    const planStr = JSON.stringify(plan);
    return {
      query,
      planJson: plan,
      totalCost: Number(planNode['Total Cost'] ?? 0),
      actualTimeMs: Number(planNode['Actual Total Time'] ?? 0),
      rows: Number(planNode['Actual Rows'] ?? 0),
      loops: Number(planNode['Actual Loops'] ?? 0),
      sharedHit: Number((plan['Planning'] as Record<string, number> | undefined)?.['Shared Hit Blocks'] ?? 0),
      sharedRead: Number((plan['Planning'] as Record<string, number> | undefined)?.['Shared Read Blocks'] ?? 0),
      hasSeqScan: planStr.includes('Seq Scan'),
      hasIndexScan: planStr.includes('Index Scan'),
      hasHashJoin: planStr.includes('Hash Join'),
      hasNestedLoop: planStr.includes('Nested Loop'),
      planningTimeMs: Number(plan['Planning Time'] ?? 0),
      executionTimeMs: Number(plan['Execution Time'] ?? 0),
    };
  }

  async getSequentialScans(schema: string): Promise<SequentialScanDTO[]> {
    const sql = `
      SELECT
        schemaname AS schema_name,
        relname AS table_name,
        COALESCE(seq_scan, 0) AS seq_scan,
        COALESCE(idx_scan, 0) AS idx_scan,
        CASE WHEN COALESCE(seq_scan, 0) + COALESCE(idx_scan, 0) > 0
          THEN ROUND(100.0 * seq_scan / (seq_scan + idx_scan), 2)
          ELSE 0
        END AS seq_scan_ratio_pct,
        COALESCE(n_live_tup, 0) AS live_tuples,
        pg_size_pretty(pg_relation_size(relid)) AS table_size
      FROM pg_stat_user_tables
      WHERE schemaname = $1
        AND COALESCE(seq_scan, 0) > 0
      ORDER BY seq_scan_ratio_pct DESC, seq_scan DESC
    `;

    const rows = await this.query<{
      schema_name: string; table_name: string; seq_scan: string;
      idx_scan: string; seq_scan_ratio_pct: string; live_tuples: string; table_size: string;
    }>(sql, [schema]);

    return rows.map(r => ({
      schemaName: r.schema_name,
      tableName: r.table_name,
      seqScan: parseInt(r.seq_scan ?? '0'),
      idxScan: parseInt(r.idx_scan ?? '0'),
      seqScanRatioPct: parseFloat(r.seq_scan_ratio_pct ?? '0'),
      liveTuples: parseInt(r.live_tuples ?? '0'),
      tableSize: r.table_size,
      recommendation: parseFloat(r.seq_scan_ratio_pct ?? '0') > 80
        ? `Alta proporción de seq_scan. Considerar añadir índice en columnas de filtro frecuentes.`
        : 'Ratio aceptable.',
    }));
  }

  async getQueryPlannerStats(schema: string, tableName: string): Promise<QueryPlannerStatsDTO[]> {
    const sql = `
      SELECT
        tablename AS table_name,
        attname AS column_name,
        n_distinct,
        correlation,
        most_common_vals::text AS most_common_vals_text,
        null_frac,
        avg_width
      FROM pg_stats
      WHERE schemaname = $1 AND tablename = $2
      ORDER BY attname
    `;

    const rows = await this.query<{
      table_name: string; column_name: string; n_distinct: number;
      correlation: number; most_common_vals_text: string | null;
      null_frac: number; avg_width: number;
    }>(sql, [schema, tableName]);

    return rows.map(r => ({
      tableName: r.table_name,
      columnName: r.column_name,
      nDistinct: r.n_distinct,
      correlation: r.correlation,
      mostCommonVals: r.most_common_vals_text
        ? r.most_common_vals_text.replace(/[{}]/g, '').split(',')
        : null,
      nullFraction: r.null_frac,
      avgWidth: r.avg_width,
    }));
  }

  async resetStatStatements(): Promise<void> {
    await this.execute('SELECT pg_stat_statements_reset()');
  }
}
