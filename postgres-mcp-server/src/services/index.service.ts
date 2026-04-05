// services/index.service.ts
import { IndexRepository } from '../repositories/index.repository.js';
import { SchemaRepository } from '../repositories/schema.repository.js';
import { StatsRepository } from '../repositories/stats.repository.js';
import { dbClient } from '../db/client.js';
import {
  IndexDetailDTO,
  IndexRecommendationDTO,
  UnusedIndexDTO,
  DuplicateIndexDTO,
  IndexBloatDTO,
} from '../dtos/index.dto.js';
import { config } from '../config/config.js';
import { McpError } from '../db/client.js';

export interface IIndexService {
  getIndexList(schema: string): Promise<IndexDetailDTO[]>;
  getUnusedIndexes(schema: string, minScans?: number): Promise<UnusedIndexDTO[]>;
  getDuplicateIndexes(schema: string): Promise<DuplicateIndexDTO[]>;
  getMissingFkIndexes(schema: string): Promise<{ childTable: string; fkColumn: string; parentTable: string; ddlFix: string }[]>;
  getInvalidIndexes(schema: string): Promise<IndexDetailDTO[]>;
  getIndexBloat(schema: string): Promise<IndexBloatDTO[]>;
  getIndexRecommendations(schema: string, minSeqScanRatio: number, topNTables: number): Promise<IndexRecommendationDTO[]>;
  createIndex(schema: string, table: string, columns: string[], options: CreateIndexOptions): Promise<string>;
  dropIndex(schema: string, indexName: string): Promise<string>;
  reindexTable(schema: string, table: string): Promise<string>;
  getIndexCoverage(schema: string): Promise<{ indexName: string; tableName: string; coverage: string }[]>;
}

export interface CreateIndexOptions {
  indexType?: string;
  unique?: boolean;
  whereClause?: string;
  includeColumns?: string[];
  concurrent?: boolean;
}

export class IndexService implements IIndexService {
  private readonly indexRepo: IndexRepository;
  private readonly schemaRepo: SchemaRepository;
  private readonly statsRepo: StatsRepository;

  constructor() {
    this.indexRepo = new IndexRepository();
    this.schemaRepo = new SchemaRepository();
    this.statsRepo = new StatsRepository();
  }

  async getIndexList(schema: string): Promise<IndexDetailDTO[]> {
    return this.indexRepo.getIndexList(schema);
  }

  async getUnusedIndexes(schema: string, minScans: number = 50): Promise<UnusedIndexDTO[]> {
    return this.indexRepo.getUnusedIndexes(schema, minScans);
  }

  async getDuplicateIndexes(schema: string): Promise<DuplicateIndexDTO[]> {
    return this.indexRepo.getDuplicateIndexes(schema);
  }

  async getMissingFkIndexes(schema: string): Promise<{ childTable: string; fkColumn: string; parentTable: string; ddlFix: string }[]> {
    const missing = await this.indexRepo.getMissingFkIndexes(schema);
    return missing.map(m => ({
      ...m,
      ddlFix: `CREATE INDEX CONCURRENTLY ON ${m.childTable} (${m.fkColumn}); -- FK sin índice → child of ${m.parentTable}`,
    }));
  }

  async getInvalidIndexes(schema: string): Promise<IndexDetailDTO[]> {
    return this.indexRepo.getInvalidIndexes(schema);
  }

  async getIndexBloat(schema: string): Promise<IndexBloatDTO[]> {
    return this.indexRepo.getIndexBloat(schema);
  }

  async getIndexRecommendations(
    schema: string,
    minSeqScanRatio: number = 80,
    topNTables: number = 10,
  ): Promise<IndexRecommendationDTO[]> {
    const recommendations: IndexRecommendationDTO[] = [];

    // 1. Sequential scans con alta ratio
    const seqScans = await this.statsRepo.getSequentialScans(schema);
    const highSeqScans = seqScans
      .filter(s => s.seqScanRatioPct >= minSeqScanRatio)
      .slice(0, topNTables);

    for (const t of highSeqScans) {
      recommendations.push({
        tableName: t.tableName,
        recommendedColumns: ['<columna_filtro_frecuente>'],
        indexType: 'B-tree',
        reason: `Alta proporción de seq_scan (${t.seqScanRatioPct}%). La tabla ${t.tableName} es escaneada secuencialmente con frecuencia.`,
        estimatedImpact: t.seqScanRatioPct > 95 ? 'HIGH' : 'MEDIUM',
        ddlSuggestion: `CREATE INDEX CONCURRENTLY ON ${schema}.${t.tableName} (<columna_filtro_frecuente>);`,
      });
    }

    // 2. FK sin índice
    const missingFk = await this.indexRepo.getMissingFkIndexes(schema);
    for (const fk of missingFk) {
      recommendations.push({
        tableName: fk.childTable,
        recommendedColumns: [fk.fkColumn],
        indexType: 'B-tree',
        reason: `FK sin índice en columna hija: ${fk.fkColumn}. Causa full-scan en DELETE/UPDATE de ${fk.parentTable}.`,
        estimatedImpact: 'HIGH',
        ddlSuggestion: `CREATE INDEX CONCURRENTLY ON ${fk.childTable} (${fk.fkColumn});`,
      });
    }

    return recommendations;
  }

  async createIndex(schema: string, table: string, columns: string[], options: CreateIndexOptions = {}): Promise<string> {
    if (!config.permissions.allowDdl) {
      throw new McpError(
        'DDL deshabilitado. Configurar PG_ALLOW_DDL=true para crear índices.',
        'DDL_DISABLED',
      );
    }

    const concurrent = options.concurrent !== false ? 'CONCURRENTLY' : '';
    const unique = options.unique ? 'UNIQUE' : '';
    const indexType = options.indexType ? `USING ${options.indexType}` : '';
    const cols = columns.join(', ');
    const include = options.includeColumns?.length
      ? `INCLUDE (${options.includeColumns.join(', ')})`
      : '';
    const where = options.whereClause ? `WHERE ${options.whereClause}` : '';

    const indexName = `idx_${table}_${columns.join('_')}`;
    const ddl = `CREATE ${unique} INDEX ${concurrent} ${indexName} ON ${schema}.${table} ${indexType} (${cols}) ${include} ${where}`.trim().replace(/\s+/g, ' ');

    await dbClient.execute(ddl);
    return ddl;
  }

  async dropIndex(schema: string, indexName: string): Promise<string> {
    if (!config.permissions.allowDdl) {
      throw new McpError('DDL deshabilitado. Configurar PG_ALLOW_DDL=true.', 'DDL_DISABLED');
    }
    const ddl = `DROP INDEX CONCURRENTLY IF EXISTS ${schema}.${indexName}`;
    await dbClient.execute(ddl);
    return ddl;
  }

  async reindexTable(schema: string, table: string): Promise<string> {
    if (!config.permissions.allowMaintenance) {
      throw new McpError(
        'Mantenimiento deshabilitado. Configurar PG_ALLOW_MAINTENANCE=true.',
        'MAINTENANCE_DISABLED',
      );
    }
    const ddl = `REINDEX TABLE CONCURRENTLY ${schema}.${table}`;
    await dbClient.execute(ddl);
    return ddl;
  }

  async getIndexCoverage(schema: string): Promise<{ indexName: string; tableName: string; coverage: string }[]> {
    const indexes = await this.indexRepo.getIndexList(schema);
    return indexes.map(idx => ({
      indexName: idx.indexName,
      tableName: idx.tableName,
      coverage: idx.includeColumns.length > 0
        ? `Covering index: key cols=${idx.columns.join(',')}, include=${idx.includeColumns.join(',')}`
        : `Regular index: ${idx.columns.join(', ')}`,
    }));
  }
}
