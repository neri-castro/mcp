// dtos/schema.dto.ts

export interface TableSummaryDTO {
  schema: string;
  tableName: string;
  estimatedRows: number;
  totalSizeBytes: number;
  tableSizeBytes: number;
  indexSizeBytes: number;
  lastVacuum: Date | null;
  lastAnalyze: Date | null;
  hasPk: boolean;
  indexCount: number;
}

export interface ColumnDetailDTO {
  ordinalPosition: number;
  columnName: string;
  dataType: string;
  isNullable: boolean;
  columnDefault: string | null;
  characterMaxLength: number | null;
  numericPrecision: number | null;
  numericScale: number | null;
}

export interface ConstraintDTO {
  constraintName: string;
  constraintType: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK';
  tableName: string;
  columns: string[];
  referencedTable?: string;
  referencedColumns?: string[];
  onDelete?: 'NO ACTION' | 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT';
  onUpdate?: 'NO ACTION' | 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT';
  checkClause?: string;
  isNotValid?: boolean;
}

export interface SchemaOverviewDTO {
  schema: string;
  tableCount: number;
  viewCount: number;
  materializedViewCount: number;
  functionCount: number;
  triggerCount: number;
  sequenceCount: number;
  totalSizeBytes: number;
}

export interface ForeignKeyMapDTO {
  childSchema: string;
  childTable: string;
  childColumn: string;
  parentSchema: string;
  parentTable: string;
  parentColumn: string;
  onUpdate: string;
  onDelete: string;
  constraintName: string;
}

export interface TableSizeReportDTO {
  schema: string;
  tableName: string;
  totalSize: string;
  tableSize: string;
  indexSize: string;
  toastSize: string;
  totalSizeBytes: number;
}

export interface SequenceDTO {
  schema: string;
  sequenceName: string;
  currentValue: number | null;
  minValue: number;
  maxValue: number;
  increment: number;
  isCycled: boolean;
  associatedTable: string | null;
  associatedColumn: string | null;
}

export interface ViewDTO {
  schema: string;
  viewName: string;
  viewType: 'VIEW' | 'MATERIALIZED VIEW';
  definition: string;
  isUpdatable: boolean;
}
