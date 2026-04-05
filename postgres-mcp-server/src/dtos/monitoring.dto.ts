// dtos/monitoring.dto.ts

export interface ActiveConnectionDTO {
  pid: number;
  username: string;
  database: string;
  state: string;
  query: string;
  waitEventType: string | null;
  waitEvent: string | null;
  durationSeconds: number | null;
  clientAddr: string | null;
  applicationName: string;
}

export interface LockAnalysisDTO {
  blockedPid: number;
  blockedUser: string;
  blockingPid: number;
  blockingUser: string;
  blockedQuery: string;
  blockingQuery: string;
  blockedDurationSeconds: number;
  lockType: string;
  waitingMode: string;
  heldMode: string;
}

export interface ConnectionStatsDTO {
  total: number;
  active: number;
  idle: number;
  idleInTransaction: number;
  waiting: number;
  maxConnections: number;
  usagePct: number;
  byUser: Record<string, number>;
  byDatabase: Record<string, number>;
}

export interface WaitEventDTO {
  waitEventType: string;
  waitEvent: string;
  count: number;
}

export interface DatabaseStatsDTO {
  databaseName: string;
  numBackends: number;
  xactCommit: number;
  xactRollback: number;
  blksRead: number;
  blksHit: number;
  cacheHitRatioPct: number;
  tempFiles: number;
  tempBytes: number;
  deadlocks: number;
  conflictsTotal: number;
}

export interface IoStatsDTO {
  backendType: string;
  object: string;
  context: string;
  reads: number;
  writes: number;
  extends: number;
  hits: number;
  evictions: number;
  reuses: number;
  fsyncs: number;
  readTime: number;
  writeTime: number;
}

export interface WalStatsDTO {
  walRecords: number;
  walFpi: number;
  walBytes: number;
  walBuffersFull: number;
  walWrite: number;
  walSync: number;
  walWriteTime: number;
  walSyncTime: number;
  statsReset: Date | null;
}

export interface ReplicationStatusDTO {
  pid: number;
  username: string;
  applicationName: string;
  clientAddr: string;
  state: string;
  sentLsn: string;
  writeLsn: string;
  flushLsn: string;
  replayLsn: string;
  writeLag: string | null;
  flushLag: string | null;
  replayLag: string | null;
  syncState: string;
}

export interface CheckpointStatsDTO {
  checkpointsTimed: number;
  checkpointsRequested: number;
  checkpointWriteTime: number;
  checkpointSyncTime: number;
  buffersCheckpoint: number;
  buffersClean: number;
  maxWrittenClean: number;
  buffersBackend: number;
  buffersAlloc: number;
  statsReset: Date | null;
}
