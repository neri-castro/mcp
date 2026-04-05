// dtos/vacuum.dto.ts

export interface TableBloatDTO {
  schemaName: string;
  tableName: string;
  liveTuples: number;
  deadTuples: number;
  deadTupleRatioPct: number;
  totalSizeBytes: number;
  totalSize: string;
  estimatedWastePct: number;
  lastVacuum: Date | null;
  lastAutovacuum: Date | null;
  vacuumCount: number;
  recommendation: 'VACUUM' | 'VACUUM ANALYZE' | 'VACUUM FULL' | 'OK';
}

export interface XIDWraparoundDTO {
  schemaName: string;
  tableName: string;
  frozenXidAge: number;
  xidsUntilWraparound: number;
  databaseAge: number;
  riskLevel: 'CRITICAL' | 'WARNING' | 'OK';
  tableSize: string;
  recommendation: string;
}

export interface AutovacuumConfigDTO {
  paramName: string;
  currentValue: string;
  unit: string | null;
  description: string;
  recommendation: string | null;
}

export interface AutovacuumCandidateDTO {
  schemaName: string;
  tableName: string;
  liveTuples: number;
  deadTuples: number;
  deadTupleRatioPct: number;
  vacuumThreshold: number;
  daysSinceLastVacuum: number | null;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface VacuumProgressDTO {
  pid: number;
  databaseName: string;
  tableName: string;
  phase: string;
  heapBlksTotal: number;
  heapBlksScanned: number;
  heapBlksPct: number;
  indexVacuumCount: number;
  deadTuplesRemoved: number;
}

export interface VacuumResultDTO {
  table: string;
  mode: string;
  success: boolean;
  output: string;
  durationMs: number;
}

export interface ToastBloatDTO {
  schemaName: string;
  tableName: string;
  toastTableName: string;
  toastSize: string;
  tableSize: string;
  columns: string[];
}
