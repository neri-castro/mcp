// repositories/config.repository.ts
import { BaseRepository } from './base.repository.js';

export interface ServerConfigDTO {
  name: string;
  setting: string;
  unit: string | null;
  category: string;
  shortDesc: string;
  source: string;
  minVal: string | null;
  maxVal: string | null;
  varType: string;
}

export interface ExtensionStatusDTO {
  name: string;
  defaultVersion: string | null;
  installedVersion: string | null;
  isInstalled: boolean;
  comment: string | null;
}

export interface ServerVersionDTO {
  version: string;
  versionNum: number;
  isPg17Plus: boolean;
  isPg18Plus: boolean;
  majorVersion: number;
}

export interface IConfigRepository {
  getConfigOverview(): Promise<ServerConfigDTO[]>;
  getMemoryConfig(): Promise<ServerConfigDTO[]>;
  getAutovacuumConfig(): Promise<ServerConfigDTO[]>;
  getConnectionsConfig(): Promise<ServerConfigDTO[]>;
  getWalConfig(): Promise<ServerConfigDTO[]>;
  getIoConfig(): Promise<ServerConfigDTO[]>;
  getParallelConfig(): Promise<ServerConfigDTO[]>;
  getLoggingConfig(): Promise<ServerConfigDTO[]>;
  getServerVersion(): Promise<ServerVersionDTO>;
  getExtensionsStatus(): Promise<ExtensionStatusDTO[]>;
}

export class ConfigRepository extends BaseRepository<ServerConfigDTO> implements IConfigRepository {
  private async getSettingsByNames(names: string[]): Promise<ServerConfigDTO[]> {
    const placeholders = names.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `
      SELECT
        name,
        setting,
        unit,
        category,
        short_desc AS short_desc,
        source,
        min_val,
        max_val,
        vartype AS var_type
      FROM pg_settings
      WHERE name = ANY(ARRAY[${placeholders}])
      ORDER BY category, name
    `;
    const rows = await this.query<{
      name: string; setting: string; unit: string | null; category: string;
      short_desc: string; source: string; min_val: string | null;
      max_val: string | null; var_type: string;
    }>(sql, names);

    return rows.map(r => ({
      name: r.name,
      setting: r.setting,
      unit: r.unit,
      category: r.category,
      shortDesc: r.short_desc,
      source: r.source,
      minVal: r.min_val,
      maxVal: r.max_val,
      varType: r.var_type,
    }));
  }

  private async getSettingsByPattern(pattern: string): Promise<ServerConfigDTO[]> {
    const sql = `
      SELECT name, setting, unit, category, short_desc, source, min_val, max_val, vartype AS var_type
      FROM pg_settings
      WHERE name LIKE $1
      ORDER BY name
    `;
    const rows = await this.query<{
      name: string; setting: string; unit: string | null; category: string;
      short_desc: string; source: string; min_val: string | null;
      max_val: string | null; var_type: string;
    }>(sql, [pattern]);

    return rows.map(r => ({
      name: r.name,
      setting: r.setting,
      unit: r.unit,
      category: r.category,
      shortDesc: r.short_desc,
      source: r.source,
      minVal: r.min_val,
      maxVal: r.max_val,
      varType: r.var_type,
    }));
  }

  async getConfigOverview(): Promise<ServerConfigDTO[]> {
    return this.getSettingsByNames([
      'shared_buffers', 'work_mem', 'maintenance_work_mem', 'effective_cache_size',
      'max_connections', 'wal_level', 'checkpoint_completion_target',
      'autovacuum', 'log_min_duration_statement', 'max_parallel_workers',
      'random_page_cost', 'seq_page_cost', 'effective_io_concurrency',
    ]);
  }

  async getMemoryConfig(): Promise<ServerConfigDTO[]> {
    return this.getSettingsByNames([
      'shared_buffers', 'work_mem', 'maintenance_work_mem', 'effective_cache_size',
      'temp_buffers', 'max_stack_depth', 'huge_pages', 'huge_page_size',
    ]);
  }

  async getAutovacuumConfig(): Promise<ServerConfigDTO[]> {
    return this.getSettingsByPattern('%autovacuum%');
  }

  async getConnectionsConfig(): Promise<ServerConfigDTO[]> {
    return this.getSettingsByNames([
      'max_connections', 'superuser_reserved_connections',
      'reserved_connections', 'tcp_keepalives_idle',
      'tcp_keepalives_interval', 'tcp_keepalives_count',
      'authentication_timeout', 'idle_session_timeout',
    ]);
  }

  async getWalConfig(): Promise<ServerConfigDTO[]> {
    const walSettings = await this.getSettingsByPattern('%wal%');
    const checkpointSettings = await this.getSettingsByPattern('%checkpoint%');
    return [...walSettings, ...checkpointSettings].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getIoConfig(): Promise<ServerConfigDTO[]> {
    const names = [
      'effective_io_concurrency', 'maintenance_io_concurrency',
      'random_page_cost', 'seq_page_cost',
    ];
    if (this.isPg18Plus) names.push('io_method');
    return this.getSettingsByNames(names);
  }

  async getParallelConfig(): Promise<ServerConfigDTO[]> {
    return this.getSettingsByNames([
      'max_parallel_workers', 'max_parallel_workers_per_gather',
      'max_parallel_maintenance_workers', 'min_parallel_table_scan_size',
      'min_parallel_index_scan_size', 'parallel_tuple_cost', 'parallel_setup_cost',
    ]);
  }

  async getLoggingConfig(): Promise<ServerConfigDTO[]> {
    return this.getSettingsByNames([
      'log_min_duration_statement', 'log_connections', 'log_disconnections',
      'log_lock_waits', 'log_statement', 'log_duration',
      'log_autovacuum_min_duration', 'log_temp_files',
    ]);
  }

  async getServerVersion(): Promise<ServerVersionDTO> {
    const row = await this.queryOne<{ version: string; server_version_num: string }>(
      `SELECT version(), current_setting('server_version_num') AS server_version_num`
    );

    const versionNum = parseInt(row?.server_version_num ?? '0', 10);
    const major = Math.floor(versionNum / 10000);

    return {
      version: row?.version ?? 'Unknown',
      versionNum,
      isPg17Plus: versionNum >= 170000,
      isPg18Plus: versionNum >= 180000,
      majorVersion: major,
    };
  }

  async getExtensionsStatus(): Promise<ExtensionStatusDTO[]> {
    const sql = `
      SELECT
        ae.name,
        ae.default_version,
        e.extversion AS installed_version,
        e.oid IS NOT NULL AS is_installed,
        ae.comment
      FROM pg_available_extensions ae
      LEFT JOIN pg_extension e ON e.extname = ae.name
      WHERE ae.name IN (
        'pg_stat_statements', 'pgstattuple', 'pg_buffercache',
        'hypopg', 'pg_prewarm', 'pg_trgm', 'postgis'
      )
      ORDER BY is_installed DESC, ae.name
    `;

    const rows = await this.query<{
      name: string; default_version: string | null; installed_version: string | null;
      is_installed: boolean; comment: string | null;
    }>(sql);

    return rows.map(r => ({
      name: r.name,
      defaultVersion: r.default_version,
      installedVersion: r.installed_version,
      isInstalled: r.is_installed,
      comment: r.comment,
    }));
  }
}
