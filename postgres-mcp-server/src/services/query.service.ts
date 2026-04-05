// services/query.service.ts
import { StatsRepository } from '../repositories/stats.repository.js';
import { SlowQueryDTO, ExplainPlanDTO, SequentialScanDTO, QueryPlannerStatsDTO } from '../dtos/query.dto.js';
import { config } from '../config/config.js';

export interface IQueryService {
  getSlowQueries(limit: number, orderBy: string, minCalls: number, dbName?: string): Promise<SlowQueryDTO[]>;
  getHighIoQueries(limit: number): Promise<SlowQueryDTO[]>;
  getFrequentQueries(limit: number): Promise<SlowQueryDTO[]>;
  explainQuery(query: string, verbose?: boolean): Promise<ExplainPlanDTO>;
  explainVerbose(query: string): Promise<ExplainPlanDTO>;
  getSequentialScans(schema: string): Promise<SequentialScanDTO[]>;
  resetStatStatements(): Promise<{ success: boolean; message: string }>;
  getQueryPlannerStats(schema: string, tableName: string): Promise<QueryPlannerStatsDTO[]>;
}

export class QueryService implements IQueryService {
  private readonly repository: StatsRepository;

  constructor() {
    this.repository = new StatsRepository();
  }

  async getSlowQueries(
    limit: number = config.analysis.statStatementsLimit,
    orderBy: string = 'total_time',
    minCalls: number = 0,
    dbName?: string,
  ): Promise<SlowQueryDTO[]> {
    return this.repository.getSlowQueries(limit, orderBy, minCalls, dbName);
  }

  async getHighIoQueries(limit: number = 20): Promise<SlowQueryDTO[]> {
    return this.repository.getHighIoQueries(limit);
  }

  async getFrequentQueries(limit: number = 20): Promise<SlowQueryDTO[]> {
    return this.repository.getFrequentQueries(limit);
  }

  async explainQuery(query: string, verbose: boolean = false): Promise<ExplainPlanDTO> {
    return this.repository.explainQuery(query, verbose);
  }

  async explainVerbose(query: string): Promise<ExplainPlanDTO> {
    return this.repository.explainQuery(query, true);
  }

  async getSequentialScans(schema: string): Promise<SequentialScanDTO[]> {
    return this.repository.getSequentialScans(schema);
  }

  async resetStatStatements(): Promise<{ success: boolean; message: string }> {
    await this.repository.resetStatStatements();
    return { success: true, message: 'pg_stat_statements reseteado correctamente.' };
  }

  async getQueryPlannerStats(schema: string, tableName: string): Promise<QueryPlannerStatsDTO[]> {
    return this.repository.getQueryPlannerStats(schema, tableName);
  }
}
