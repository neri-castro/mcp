// repositories/vacuum.repository.ts
import { BaseRepository } from './base.repository.js';
import {
  TableBloatDTO,
  XIDWraparoundDTO,
  AutovacuumConfigDTO,
  AutovacuumCandidateDTO,
  VacuumProgressDTO,
  VacuumResultDTO,
  ToastBloatDTO,
} from '../dtos/vacuum.dto.js';

export interface IVacuumRepository {
  getVacuumStatus(schema: string): Promise<TableBloatDTO[]>;
  getTableBloatEstimate(schema: string): Promise<TableBloatDTO[]>;
  getAutovacuumConfig(): Promise<AutovacuumConfigDTO[]>;
  getAutovacuumCandidates(schema: string): Promise<AutovacuumCandidateDTO[]>;
  getXidWraparoundRisk(): Promise<XIDWraparoundDTO[]>;
  runVacuum(schema: string, table: string | undefined, mode: string, verbose: boolean): Promise<VacuumResultDTO>;
  runAnalyze(schema: string, table?: string): Promise<VacuumResultDTO>;
  getVacuumProgress(): Promise<VacuumProgressDTO[]>;
  getToastBloat(schema: string): Promise<ToastBloatDTO[]>;
}

export class VacuumRepository extends BaseRepository<TableBloatDTO> implements IVacuumRepository {
  async getVacuumStatus(schema: string): Promise<TableBloatDTO[]> {
    const vacuumTimingCols = this.isPg18Plus
      ? ', total_vacuum_time, total_autovacuum_time, total_analyze_time, total_autoanalyze_time'
      : '';

    const sql = `
      SELECT
        schemaname AS schema_name,
        relname AS table_name,
        n_live_tup AS live_tuples,
        n_dead_tup AS dead_tuples,
        CASE WHEN n_live_tup + n_dead_tup > 0
          THEN ROUND(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 2)
          ELSE 0
        END AS dead_tuple_ratio_pct,
        pg_total_relation_size(relid) AS total_size_bytes,
        pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
        last_vacuum,
        last_autovacuum,
        vacuum_count
        ${vacuumTimingCols}
      FROM pg_stat_user_tables
      WHERE schemaname = $1
      ORDER BY dead_tuple_ratio_pct DESC NULLS LAST
    `;

    const rows = await this.query<Record<string, unknown>>(sql, [schema]);
    return rows.map(r => this.mapBloatRow(r));
  }

  async getTableBloatEstimate(schema: string): Promise<TableBloatDTO[]> {
    const sql = `
      SELECT
        schemaname AS schema_name,
        tablename AS table_name,
        n_live_tup AS live_tuples,
        n_dead_tup AS dead_tuples,
        CASE WHEN n_live_tup + n_dead_tup > 0
          THEN ROUND(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 2)
          ELSE 0
        END AS dead_tuple_ratio_pct,
        pg_total_relation_size(schemaname || '.' || tablename) AS total_size_bytes,
        pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
        last_autovacuum,
        last_vacuum,
        vacuum_count
      FROM pg_stat_user_tables
      WHERE schemaname = $1
        AND n_dead_tup > 0
      ORDER BY dead_tuple_ratio_pct DESC
    `;

    const rows = await this.query<Record<string, unknown>>(sql, [schema]);
    return rows.map(r => this.mapBloatRow(r));
  }

  private mapBloatRow(r: Record<string, unknown>): TableBloatDTO {
    const deadRatio = Number(r['dead_tuple_ratio_pct'] ?? 0);
    let recommendation: TableBloatDTO['recommendation'] = 'OK';
    if (deadRatio > 50) recommendation = 'VACUUM FULL';
    else if (deadRatio > 20) recommendation = 'VACUUM ANALYZE';
    else if (deadRatio > 5) recommendation = 'VACUUM';

    return {
      schemaName: String(r['schema_name'] ?? ''),
      tableName: String(r['table_name'] ?? ''),
      liveTuples: Number(r['live_tuples'] ?? 0),
      deadTuples: Number(r['dead_tuples'] ?? 0),
      deadTupleRatioPct: deadRatio,
      totalSizeBytes: Number(r['total_size_bytes'] ?? 0),
      totalSize: String(r['total_size'] ?? '0 bytes'),
      estimatedWastePct: deadRatio,
      lastVacuum: r['last_vacuum'] as Date | null,
      lastAutovacuum: r['last_autovacuum'] as Date | null,
      vacuumCount: Number(r['vacuum_count'] ?? 0),
      recommendation,
    };
  }

  async getAutovacuumConfig(): Promise<AutovacuumConfigDTO[]> {
    const sql = `
      SELECT
        name AS param_name,
        setting AS current_value,
        unit,
        short_desc AS description
      FROM pg_settings
      WHERE name LIKE '%autovacuum%'
      ORDER BY name
    `;

    const rows = await this.query<{
      param_name: string; current_value: string; unit: string | null; description: string;
    }>(sql);

    return rows.map(r => ({
      paramName: r.param_name,
      currentValue: r.current_value,
      unit: r.unit,
      description: r.description,
      recommendation: null,
    }));
  }

  async getAutovacuumCandidates(schema: string): Promise<AutovacuumCandidateDTO[]> {
    const sql = `
      WITH av_settings AS (
        SELECT
          current_setting('autovacuum_vacuum_threshold')::numeric AS threshold,
          current_setting('autovacuum_vacuum_scale_factor')::numeric AS scale_factor
      )
      SELECT
        schemaname AS schema_name,
        relname AS table_name,
        n_live_tup AS live_tuples,
        n_dead_tup AS dead_tuples,
        CASE WHEN n_live_tup + n_dead_tup > 0
          THEN ROUND(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 2)
          ELSE 0
        END AS dead_tuple_ratio_pct,
        ROUND(av.threshold + av.scale_factor * n_live_tup) AS vacuum_threshold,
        EXTRACT(DAY FROM now() - GREATEST(last_vacuum, last_autovacuum))::int AS days_since_last_vacuum
      FROM pg_stat_user_tables, av_settings av
      WHERE schemaname = $1
        AND n_dead_tup > ROUND(av.threshold + av.scale_factor * n_live_tup)
      ORDER BY dead_tuple_ratio_pct DESC
    `;

    const rows = await this.query<{
      schema_name: string; table_name: string; live_tuples: string;
      dead_tuples: string; dead_tuple_ratio_pct: string;
      vacuum_threshold: string; days_since_last_vacuum: number | null;
    }>(sql, [schema]);

    return rows.map(r => {
      const ratio = parseFloat(r.dead_tuple_ratio_pct ?? '0');
      return {
        schemaName: r.schema_name,
        tableName: r.table_name,
        liveTuples: parseInt(r.live_tuples ?? '0'),
        deadTuples: parseInt(r.dead_tuples ?? '0'),
        deadTupleRatioPct: ratio,
        vacuumThreshold: parseInt(r.vacuum_threshold ?? '0'),
        daysSinceLastVacuum: r.days_since_last_vacuum,
        urgency: ratio > 50 ? 'CRITICAL' : ratio > 20 ? 'HIGH' : 'MEDIUM',
      };
    });
  }

  async getXidWraparoundRisk(): Promise<XIDWraparoundDTO[]> {
    const sql = `
      SELECT
        n.nspname AS schema_name,
        c.relname AS table_name,
        age(c.relfrozenxid) AS xid_age,
        2147483647 - age(c.relfrozenxid) AS xids_until_wraparound,
        age((SELECT datfrozenxid FROM pg_database WHERE datname = current_database())) AS database_age,
        CASE
          WHEN age(c.relfrozenxid) > 1800000000 THEN 'CRITICAL'
          WHEN age(c.relfrozenxid) > 1500000000 THEN 'WARNING'
          ELSE 'OK'
        END AS risk_level,
        pg_size_pretty(pg_total_relation_size(c.oid)) AS table_size
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'r'
        AND n.nspname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY xid_age DESC
      LIMIT 20
    `;

    const rows = await this.query<{
      schema_name: string; table_name: string; xid_age: string;
      xids_until_wraparound: string; database_age: string;
      risk_level: string; table_size: string;
    }>(sql);

    return rows.map(r => ({
      schemaName: r.schema_name,
      tableName: r.table_name,
      frozenXidAge: parseInt(r.xid_age ?? '0'),
      xidsUntilWraparound: parseInt(r.xids_until_wraparound ?? '0'),
      databaseAge: parseInt(r.database_age ?? '0'),
      riskLevel: r.risk_level as XIDWraparoundDTO['riskLevel'],
      tableSize: r.table_size,
      recommendation: r.risk_level === 'CRITICAL'
        ? `VACUUM FREEZE ${r.schema_name}.${r.table_name}; -- URGENTE: riesgo de XID wraparound`
        : r.risk_level === 'WARNING'
          ? `Programar VACUUM FREEZE en ${r.schema_name}.${r.table_name}`
          : 'OK',
    }));
  }

  async runVacuum(schema: string, table: string | undefined, mode: string, verbose: boolean): Promise<VacuumResultDTO> {
    const modeMap: Record<string, string> = {
      VACUUM: 'VACUUM',
      VACUUM_ANALYZE: 'VACUUM ANALYZE',
      VACUUM_FULL: 'VACUUM FULL',
      VACUUM_FREEZE: 'VACUUM FREEZE',
    };

    const verboseStr = verbose ? ' VERBOSE' : '';
    const modeStr = modeMap[mode] ?? 'VACUUM';
    const target = table ? `${schema}.${table}` : '';
    const sql = `${modeStr}${verboseStr} ${target}`.trim();

    const startMs = Date.now();
    await this.execute(sql);
    const durationMs = Date.now() - startMs;

    return {
      table: table ?? `schema: ${schema}`,
      mode: modeStr,
      success: true,
      output: `${sql} ejecutado correctamente`,
      durationMs,
    };
  }

  async runAnalyze(schema: string, table?: string): Promise<VacuumResultDTO> {
    const target = table ? `${schema}.${table}` : schema;
    const sql = `ANALYZE VERBOSE ${target}`;
    const startMs = Date.now();
    await this.execute(sql);
    return {
      table: target,
      mode: 'ANALYZE',
      success: true,
      output: `${sql} ejecutado correctamente`,
      durationMs: Date.now() - startMs,
    };
  }

  async getVacuumProgress(): Promise<VacuumProgressDTO[]> {
    const sql = `
      SELECT
        pid,
        datname AS database_name,
        relid::regclass::text AS table_name,
        phase,
        heap_blks_total,
        heap_blks_scanned,
        CASE WHEN heap_blks_total > 0
          THEN ROUND(100.0 * heap_blks_scanned / heap_blks_total, 2)
          ELSE 0
        END AS heap_blks_pct,
        index_vacuum_count,
        num_dead_tuples AS dead_tuples_removed
      FROM pg_stat_progress_vacuum
    `;

    const rows = await this.query<{
      pid: number; database_name: string; table_name: string; phase: string;
      heap_blks_total: string; heap_blks_scanned: string; heap_blks_pct: string;
      index_vacuum_count: string; dead_tuples_removed: string;
    }>(sql);

    return rows.map(r => ({
      pid: r.pid,
      databaseName: r.database_name,
      tableName: r.table_name,
      phase: r.phase,
      heapBlksTotal: parseInt(r.heap_blks_total ?? '0'),
      heapBlksScanned: parseInt(r.heap_blks_scanned ?? '0'),
      heapBlksPct: parseFloat(r.heap_blks_pct ?? '0'),
      indexVacuumCount: parseInt(r.index_vacuum_count ?? '0'),
      deadTuplesRemoved: parseInt(r.dead_tuples_removed ?? '0'),
    }));
  }

  async getToastBloat(schema: string): Promise<ToastBloatDTO[]> {
    const sql = `
      SELECT
        n.nspname AS schema_name,
        c.relname AS table_name,
        t.relname AS toast_table_name,
        pg_size_pretty(pg_total_relation_size(t.oid)) AS toast_size,
        pg_size_pretty(pg_total_relation_size(c.oid)) AS table_size,
        ARRAY(
          SELECT a.attname FROM pg_attribute a
          WHERE a.attrelid = c.oid AND a.attstorage IN ('e', 'x', 'm') AND a.attnum > 0
        ) AS columns
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_class t ON t.oid = c.reltoastrelid
      WHERE n.nspname = $1
        AND c.relkind = 'r'
        AND c.reltoastrelid != 0
      ORDER BY pg_total_relation_size(t.oid) DESC
    `;

    const rows = await this.query<{
      schema_name: string; table_name: string; toast_table_name: string;
      toast_size: string; table_size: string; columns: string[];
    }>(sql, [schema]);

    return rows.map(r => ({
      schemaName: r.schema_name,
      tableName: r.table_name,
      toastTableName: r.toast_table_name,
      toastSize: r.toast_size,
      tableSize: r.table_size,
      columns: r.columns,
    }));
  }
}
