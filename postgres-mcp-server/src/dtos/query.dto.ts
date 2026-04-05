// dtos/query.dto.ts

export interface SlowQueryDTO {
  queryId: string;
  query: string;
  calls: number;
  totalExecTimeMs: number;
  meanExecTimeMs: number;
  stddevExecTimeMs: number;
  minExecTimeMs: number;
  maxExecTimeMs: number;
  rows: number;
  sharedBlksHit: number;
  sharedBlksRead: number;
  cacheHitRatioPct: number;
  tempBlksRead: number;
  tempBlksWritten: number;
  statsSince?: Date;
  minmaxStatsSince?: Date;
}

export interface ExplainPlanDTO {
  query: string;
  planJson: object;
  totalCost: number;
  actualTimeMs: number;
  rows: number;
  loops: number;
  sharedHit: number;
  sharedRead: number;
  hasSeqScan: boolean;
  hasIndexScan: boolean;
  hasHashJoin: boolean;
  hasNestedLoop: boolean;
  planningTimeMs: number;
  executionTimeMs: number;
}

export interface SequentialScanDTO {
  schemaName: string;
  tableName: string;
  seqScan: number;
  idxScan: number;
  seqScanRatioPct: number;
  liveTuples: number;
  tableSize: string;
  recommendation: string;
}

export interface QueryPlannerStatsDTO {
  tableName: string;
  columnName: string;
  nDistinct: number;
  correlation: number;
  mostCommonVals: string[] | null;
  nullFraction: number;
  avgWidth: number;
}

export interface StatStatementsInfoDTO {
  version: string;
  maxStatements: number;
  dealloc: number;
  statsReset: Date | null;
}
