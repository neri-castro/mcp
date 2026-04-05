// dtos/index.dto.ts

export interface IndexDetailDTO {
  schemaName: string;
  tableName: string;
  indexName: string;
  indexType: 'btree' | 'hash' | 'gin' | 'gist' | 'spgist' | 'brin';
  columns: string[];
  includeColumns: string[];
  isUnique: boolean;
  isPrimary: boolean;
  isValid: boolean;
  isPartial: boolean;
  whereClause: string | null;
  sizeBytes: number;
  sizeHuman: string;
  idxScan: number;
  idxTupRead: number;
  idxTupFetch: number;
  indexDef: string;
}

export interface IndexRecommendationDTO {
  tableName: string;
  recommendedColumns: string[];
  indexType: string;
  reason: string;
  estimatedImpact: 'HIGH' | 'MEDIUM' | 'LOW';
  ddlSuggestion: string;
}

export interface UnusedIndexDTO {
  schemaName: string;
  tableName: string;
  indexName: string;
  indexSize: string;
  idxScan: number;
  indexDef: string;
  recommendation: string;
}

export interface DuplicateIndexDTO {
  schemaName: string;
  tableName: string;
  indexName: string;
  duplicateOf: string;
  columns: string[];
  indexSize: string;
  recommendation: string;
}

export interface IndexBloatDTO {
  schemaName: string;
  tableName: string;
  indexName: string;
  bloatRatioPct: number;
  wastedBytes: number;
  wastedSize: string;
  totalSize: string;
  recommendation: string;
}

export interface HypoPgSimulationDTO {
  hypotheticalIndex: string;
  query: string;
  originalPlan: object;
  simulatedPlan: object;
  indexUsed: boolean;
  estimatedSpeedup: string;
}
