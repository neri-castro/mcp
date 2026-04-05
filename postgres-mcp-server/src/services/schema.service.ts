// services/schema.service.ts
import { SchemaRepository } from '../repositories/schema.repository.js';
import {
  TableSummaryDTO,
  ColumnDetailDTO,
  ConstraintDTO,
  SchemaOverviewDTO,
  ForeignKeyMapDTO,
  TableSizeReportDTO,
  SequenceDTO,
  ViewDTO,
} from '../dtos/schema.dto.js';

export interface ISchemaService {
  getSchemaOverview(schema: string): Promise<SchemaOverviewDTO>;
  getTableList(schema: string): Promise<TableSummaryDTO[]>;
  getTableDetail(schema: string, tableName: string): Promise<ColumnDetailDTO[]>;
  getColumnAnalysis(schema: string): Promise<ColumnDetailDTO[]>;
  getConstraintList(schema: string): Promise<ConstraintDTO[]>;
  getForeignKeyMap(schema: string): Promise<ForeignKeyMapDTO[]>;
  getOrphanTables(schema: string): Promise<{ tableName: string; reason: string }[]>;
  getViewList(schema: string): Promise<ViewDTO[]>;
  getSequenceList(schema: string): Promise<SequenceDTO[]>;
  getTableSizeReport(schema: string): Promise<TableSizeReportDTO[]>;
}

export class SchemaService implements ISchemaService {
  private readonly repository: SchemaRepository;

  constructor() {
    this.repository = new SchemaRepository();
  }

  async getSchemaOverview(schema: string): Promise<SchemaOverviewDTO> {
    return this.repository.getSchemaOverview(schema);
  }

  async getTableList(schema: string): Promise<TableSummaryDTO[]> {
    return this.repository.getTableList(schema);
  }

  async getTableDetail(schema: string, tableName: string): Promise<ColumnDetailDTO[]> {
    return this.repository.getTableDetail(schema, tableName);
  }

  async getColumnAnalysis(schema: string): Promise<ColumnDetailDTO[]> {
    return this.repository.getColumnAnalysis(schema);
  }

  async getConstraintList(schema: string): Promise<ConstraintDTO[]> {
    return this.repository.getConstraintList(schema);
  }

  async getForeignKeyMap(schema: string): Promise<ForeignKeyMapDTO[]> {
    return this.repository.getForeignKeyMap(schema);
  }

  async getOrphanTables(schema: string): Promise<{ tableName: string; reason: string }[]> {
    const orphans = await this.repository.getOrphanTables(schema);
    return orphans.map(t => ({
      tableName: t,
      reason: 'Tabla sin PK y sin FK entrante ni saliente. Posible tabla aislada o sin usar.',
    }));
  }

  async getViewList(schema: string): Promise<ViewDTO[]> {
    return this.repository.getViewList(schema);
  }

  async getSequenceList(schema: string): Promise<SequenceDTO[]> {
    return this.repository.getSequenceList(schema);
  }

  async getTableSizeReport(schema: string): Promise<TableSizeReportDTO[]> {
    return this.repository.getTableSizeReport(schema);
  }
}
