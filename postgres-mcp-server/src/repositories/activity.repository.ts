// repositories/activity.repository.ts
import { BaseRepository } from './base.repository.js';
import {
  ActiveConnectionDTO,
  LockAnalysisDTO,
  ConnectionStatsDTO,
  WaitEventDTO,
  DatabaseStatsDTO,
  IoStatsDTO,
  WalStatsDTO,
  ReplicationStatusDTO,
  CheckpointStatsDTO,
} from '../dtos/monitoring.dto.js';

export interface IActivityRepository {
  getActiveConnections(): Promise<ActiveConnectionDTO[]>;
  getLongRunningQueries(thresholdSeconds: number): Promise<ActiveConnectionDTO[]>;
  getIdleInTransaction(thresholdSeconds: number): Promise<ActiveConnectionDTO[]>;
  getLockAnalysis(): Promise<LockAnalysisDTO[]>;
  getConnectionStats(): Promise<ConnectionStatsDTO>;
  getWaitEvents(): Promise<WaitEventDTO[]>;
  getDatabaseStats(): Promise<DatabaseStatsDTO[]>;
  getIoStats(): Promise<IoStatsDTO[]>;
  getWalStats(): Promise<WalStatsDTO>;
  getReplicationStatus(): Promise<ReplicationStatusDTO[]>;
  getCheckpointStats(): Promise<CheckpointStatsDTO>;
}

export class ActivityRepository extends BaseRepository<ActiveConnectionDTO> implements IActivityRepository {
  async getActiveConnections(): Promise<ActiveConnectionDTO[]> {
    const sql = `
      SELECT
        pid,
        usename AS username,
        datname AS database,
        state,
        LEFT(query, 500) AS query,
        wait_event_type,
        wait_event,
        EXTRACT(EPOCH FROM (now() - query_start))::int AS duration_seconds,
        client_addr::text AS client_addr,
        application_name
      FROM pg_stat_activity
      WHERE pid != pg_backend_pid()
      ORDER BY duration_seconds DESC NULLS LAST
    `;
    const rows = await this.query<{
      pid: number; username: string; database: string; state: string;
      query: string; wait_event_type: string | null; wait_event: string | null;
      duration_seconds: number | null; client_addr: string | null; application_name: string;
    }>(sql);

    return rows.map(r => ({
      pid: r.pid,
      username: r.username ?? '',
      database: r.database ?? '',
      state: r.state ?? '',
      query: r.query ?? '',
      waitEventType: r.wait_event_type,
      waitEvent: r.wait_event,
      durationSeconds: r.duration_seconds,
      clientAddr: r.client_addr,
      applicationName: r.application_name ?? '',
    }));
  }

  async getLongRunningQueries(thresholdSeconds: number): Promise<ActiveConnectionDTO[]> {
    const sql = `
      SELECT
        pid,
        usename AS username,
        datname AS database,
        state,
        LEFT(query, 500) AS query,
        wait_event_type,
        wait_event,
        EXTRACT(EPOCH FROM (now() - query_start))::int AS duration_seconds,
        client_addr::text AS client_addr,
        application_name
      FROM pg_stat_activity
      WHERE state = 'active'
        AND pid != pg_backend_pid()
        AND now() - query_start > make_interval(secs => $1)
      ORDER BY duration_seconds DESC
    `;
    const rows = await this.query<Record<string, unknown>>(sql, [thresholdSeconds]);
    return rows.map(r => ({
      pid: Number(r['pid']),
      username: String(r['username'] ?? ''),
      database: String(r['database'] ?? ''),
      state: String(r['state'] ?? ''),
      query: String(r['query'] ?? ''),
      waitEventType: r['wait_event_type'] as string | null,
      waitEvent: r['wait_event'] as string | null,
      durationSeconds: r['duration_seconds'] as number | null,
      clientAddr: r['client_addr'] as string | null,
      applicationName: String(r['application_name'] ?? ''),
    }));
  }

  async getIdleInTransaction(thresholdSeconds: number): Promise<ActiveConnectionDTO[]> {
    const sql = `
      SELECT
        pid, usename AS username, datname AS database, state,
        LEFT(query, 200) AS query, wait_event_type, wait_event,
        EXTRACT(EPOCH FROM (now() - state_change))::int AS duration_seconds,
        client_addr::text AS client_addr, application_name
      FROM pg_stat_activity
      WHERE state = 'idle in transaction'
        AND now() - state_change > make_interval(secs => $1)
      ORDER BY duration_seconds DESC
    `;
    const rows = await this.query<Record<string, unknown>>(sql, [thresholdSeconds]);
    return rows.map(r => ({
      pid: Number(r['pid']),
      username: String(r['username'] ?? ''),
      database: String(r['database'] ?? ''),
      state: String(r['state'] ?? ''),
      query: String(r['query'] ?? ''),
      waitEventType: r['wait_event_type'] as string | null,
      waitEvent: r['wait_event'] as string | null,
      durationSeconds: r['duration_seconds'] as number | null,
      clientAddr: r['client_addr'] as string | null,
      applicationName: String(r['application_name'] ?? ''),
    }));
  }

  async getLockAnalysis(): Promise<LockAnalysisDTO[]> {
    const sql = `
      SELECT
        blocked.pid AS blocked_pid,
        blocked.usename AS blocked_user,
        blocking.pid AS blocking_pid,
        blocking.usename AS blocking_user,
        LEFT(blocked.query, 300) AS blocked_query,
        LEFT(blocking.query, 300) AS blocking_query,
        EXTRACT(EPOCH FROM (now() - blocked.query_start))::int AS blocked_duration_seconds,
        blocked_locks.locktype,
        blocked_locks.mode AS waiting_mode,
        blocking_locks.mode AS held_mode
      FROM pg_catalog.pg_locks AS blocked_locks
      JOIN pg_catalog.pg_stat_activity AS blocked ON blocked.pid = blocked_locks.pid
      JOIN pg_catalog.pg_locks AS blocking_locks
        ON blocking_locks.transactionid = blocked_locks.transactionid
        AND blocking_locks.pid != blocked_locks.pid
      JOIN pg_catalog.pg_stat_activity AS blocking ON blocking.pid = blocking_locks.pid
      WHERE NOT blocked_locks.granted
    `;

    const rows = await this.query<{
      blocked_pid: number; blocked_user: string; blocking_pid: number;
      blocking_user: string; blocked_query: string; blocking_query: string;
      blocked_duration_seconds: number; locktype: string;
      waiting_mode: string; held_mode: string;
    }>(sql);

    return rows.map(r => ({
      blockedPid: r.blocked_pid,
      blockedUser: r.blocked_user ?? '',
      blockingPid: r.blocking_pid,
      blockingUser: r.blocking_user ?? '',
      blockedQuery: r.blocked_query,
      blockingQuery: r.blocking_query,
      blockedDurationSeconds: r.blocked_duration_seconds,
      lockType: r.locktype,
      waitingMode: r.waiting_mode,
      heldMode: r.held_mode,
    }));
  }

  async getConnectionStats(): Promise<ConnectionStatsDTO> {
    const sql = `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE state = 'active') AS active,
        COUNT(*) FILTER (WHERE state = 'idle') AS idle,
        COUNT(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_transaction,
        COUNT(*) FILTER (WHERE wait_event_type = 'Lock') AS waiting,
        current_setting('max_connections')::int AS max_connections,
        usename, datname
      FROM pg_stat_activity
      WHERE pid != pg_backend_pid()
      GROUP BY ROLLUP(usename, datname)
    `;

    const rows = await this.query<Record<string, unknown>>(sql);
    const totals = rows.find(r => r['usename'] === null && r['datname'] === null) ?? {};
    const maxConn = Number(totals['max_connections'] ?? 100);
    const total = Number(totals['total'] ?? 0);

    const byUser: Record<string, number> = {};
    const byDatabase: Record<string, number> = {};
    for (const r of rows) {
      if (r['usename'] && r['datname'] === null) {
        byUser[String(r['usename'])] = Number(r['total']);
      }
      if (r['datname'] && r['usename'] === null) {
        byDatabase[String(r['datname'])] = Number(r['total']);
      }
    }

    return {
      total,
      active: Number(totals['active'] ?? 0),
      idle: Number(totals['idle'] ?? 0),
      idleInTransaction: Number(totals['idle_in_transaction'] ?? 0),
      waiting: Number(totals['waiting'] ?? 0),
      maxConnections: maxConn,
      usagePct: Math.round((total / maxConn) * 100),
      byUser,
      byDatabase,
    };
  }

  async getWaitEvents(): Promise<WaitEventDTO[]> {
    const sql = `
      SELECT
        COALESCE(wait_event_type, 'None') AS wait_event_type,
        COALESCE(wait_event, 'None') AS wait_event,
        COUNT(*) AS count
      FROM pg_stat_activity
      WHERE pid != pg_backend_pid() AND state = 'active'
      GROUP BY wait_event_type, wait_event
      ORDER BY count DESC
    `;

    const rows = await this.query<{ wait_event_type: string; wait_event: string; count: string }>(sql);
    return rows.map(r => ({
      waitEventType: r.wait_event_type,
      waitEvent: r.wait_event,
      count: parseInt(r.count ?? '0'),
    }));
  }

  async getDatabaseStats(): Promise<DatabaseStatsDTO[]> {
    const sql = `
      SELECT
        datname AS database_name,
        numbackends AS num_backends,
        xact_commit,
        xact_rollback,
        blks_read,
        blks_hit,
        CASE WHEN blks_read + blks_hit > 0
          THEN ROUND(100.0 * blks_hit / (blks_read + blks_hit), 2)
          ELSE 100
        END AS cache_hit_ratio_pct,
        temp_files,
        temp_bytes,
        deadlocks,
        COALESCE(conflicts, 0) AS conflicts_total
      FROM pg_stat_database
      WHERE datname NOT IN ('template0', 'template1')
      ORDER BY numbackends DESC
    `;

    const rows = await this.query<{
      database_name: string; num_backends: number; xact_commit: string;
      xact_rollback: string; blks_read: string; blks_hit: string;
      cache_hit_ratio_pct: string; temp_files: string; temp_bytes: string;
      deadlocks: string; conflicts_total: string;
    }>(sql);

    return rows.map(r => ({
      databaseName: r.database_name,
      numBackends: r.num_backends,
      xactCommit: parseInt(r.xact_commit ?? '0'),
      xactRollback: parseInt(r.xact_rollback ?? '0'),
      blksRead: parseInt(r.blks_read ?? '0'),
      blksHit: parseInt(r.blks_hit ?? '0'),
      cacheHitRatioPct: parseFloat(r.cache_hit_ratio_pct ?? '100'),
      tempFiles: parseInt(r.temp_files ?? '0'),
      tempBytes: parseInt(r.temp_bytes ?? '0'),
      deadlocks: parseInt(r.deadlocks ?? '0'),
      conflictsTotal: parseInt(r.conflicts_total ?? '0'),
    }));
  }

  async getIoStats(): Promise<IoStatsDTO[]> {
    const sql = `
      SELECT
        backend_type,
        object,
        context,
        reads,
        writes,
        extends,
        hits,
        evictions,
        reuses,
        fsyncs,
        read_time,
        write_time
      FROM pg_stat_io
      ORDER BY reads DESC NULLS LAST
    `;

    const rows = await this.query<Record<string, unknown>>(sql);
    return rows.map(r => ({
      backendType: String(r['backend_type'] ?? ''),
      object: String(r['object'] ?? ''),
      context: String(r['context'] ?? ''),
      reads: Number(r['reads'] ?? 0),
      writes: Number(r['writes'] ?? 0),
      extends: Number(r['extends'] ?? 0),
      hits: Number(r['hits'] ?? 0),
      evictions: Number(r['evictions'] ?? 0),
      reuses: Number(r['reuses'] ?? 0),
      fsyncs: Number(r['fsyncs'] ?? 0),
      readTime: Number(r['read_time'] ?? 0),
      writeTime: Number(r['write_time'] ?? 0),
    }));
  }

  async getWalStats(): Promise<WalStatsDTO> {
    const sql = `SELECT * FROM pg_stat_wal`;
    const row = await this.queryOne<Record<string, unknown>>(sql);
    if (!row) return { walRecords: 0, walFpi: 0, walBytes: 0, walBuffersFull: 0, walWrite: 0, walSync: 0, walWriteTime: 0, walSyncTime: 0, statsReset: null };

    return {
      walRecords: Number(row['wal_records'] ?? 0),
      walFpi: Number(row['wal_fpi'] ?? 0),
      walBytes: Number(row['wal_bytes'] ?? 0),
      walBuffersFull: Number(row['wal_buffers_full'] ?? 0),
      walWrite: Number(row['wal_write'] ?? 0),
      walSync: Number(row['wal_sync'] ?? 0),
      walWriteTime: Number(row['wal_write_time'] ?? 0),
      walSyncTime: Number(row['wal_sync_time'] ?? 0),
      statsReset: row['stats_reset'] as Date | null,
    };
  }

  async getReplicationStatus(): Promise<ReplicationStatusDTO[]> {
    const sql = `
      SELECT
        pid,
        usename AS username,
        application_name,
        client_addr::text AS client_addr,
        state,
        sent_lsn::text AS sent_lsn,
        write_lsn::text AS write_lsn,
        flush_lsn::text AS flush_lsn,
        replay_lsn::text AS replay_lsn,
        write_lag::text AS write_lag,
        flush_lag::text AS flush_lag,
        replay_lag::text AS replay_lag,
        sync_state
      FROM pg_stat_replication
    `;

    const rows = await this.query<{
      pid: number; username: string; application_name: string;
      client_addr: string; state: string; sent_lsn: string;
      write_lsn: string; flush_lsn: string; replay_lsn: string;
      write_lag: string | null; flush_lag: string | null; replay_lag: string | null;
      sync_state: string;
    }>(sql);

    return rows.map(r => ({
      pid: r.pid,
      username: r.username ?? '',
      applicationName: r.application_name,
      clientAddr: r.client_addr,
      state: r.state,
      sentLsn: r.sent_lsn,
      writeLsn: r.write_lsn,
      flushLsn: r.flush_lsn,
      replayLsn: r.replay_lsn,
      writeLag: r.write_lag,
      flushLag: r.flush_lag,
      replayLag: r.replay_lag,
      syncState: r.sync_state,
    }));
  }

  async getCheckpointStats(): Promise<CheckpointStatsDTO> {
    const sql = this.isPg17Plus
      ? `SELECT * FROM pg_stat_checkpointer`
      : `SELECT
          checkpoints_timed, checkpoints_req AS checkpoints_requested,
          checkpoint_write_time, checkpoint_sync_time,
          buffers_checkpoint, buffers_clean, maxwritten_clean AS max_written_clean,
          buffers_backend, buffers_alloc, stats_reset
         FROM pg_stat_bgwriter`;

    const row = await this.queryOne<Record<string, unknown>>(sql);
    if (!row) {
      return {
        checkpointsTimed: 0, checkpointsRequested: 0, checkpointWriteTime: 0,
        checkpointSyncTime: 0, buffersCheckpoint: 0, buffersClean: 0,
        maxWrittenClean: 0, buffersBackend: 0, buffersAlloc: 0, statsReset: null,
      };
    }

    return {
      checkpointsTimed: Number(row['checkpoints_timed'] ?? 0),
      checkpointsRequested: Number(row['checkpoints_requested'] ?? row['checkpoints_req'] ?? 0),
      checkpointWriteTime: Number(row['checkpoint_write_time'] ?? 0),
      checkpointSyncTime: Number(row['checkpoint_sync_time'] ?? 0),
      buffersCheckpoint: Number(row['buffers_checkpoint'] ?? 0),
      buffersClean: Number(row['buffers_clean'] ?? 0),
      maxWrittenClean: Number(row['max_written_clean'] ?? row['maxwritten_clean'] ?? 0),
      buffersBackend: Number(row['buffers_backend'] ?? 0),
      buffersAlloc: Number(row['buffers_alloc'] ?? 0),
      statsReset: row['stats_reset'] as Date | null,
    };
  }
}
