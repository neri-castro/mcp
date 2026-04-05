// services/integrity.service.ts
import { SchemaRepository } from '../repositories/schema.repository.js';
import { IndexRepository } from '../repositories/index.repository.js';
import { ConstraintDTO } from '../dtos/schema.dto.js';
import { dbClient, McpError } from '../db/client.js';
import { config } from '../config/config.js';

export interface IntegrityReportDTO {
  tablesWithoutPk: string[];
  fkWithoutIndex: { childTable: string; fkColumn: string; parentTable: string }[];
  nullableFkColumns: { tableName: string; columnName: string }[];
  checkConstraints: ConstraintDTO[];
  invalidConstraints: { tableName: string; constraintName: string }[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    warnings: number;
  };
}

export interface TriggerDTO {
  tableName: string;
  triggerName: string;
  event: string;
  timing: string;
  functionName: string;
  isEnabled: boolean;
  forEach: string;
}

export interface DomainDTO {
  schemaName: string;
  domainName: string;
  dataType: string;
  notNull: boolean;
  defaultValue: string | null;
  constraintName: string | null;
  checkExpression: string | null;
}

export interface IIntegrityService {
  getIntegrityReport(schema: string): Promise<IntegrityReportDTO>;
  getMissingPk(schema: string): Promise<string[]>;
  getMissingFkIndex(schema: string): Promise<{ childTable: string; fkColumn: string; parentTable: string; ddlFix: string }[]>;
  getNullableFkColumns(schema: string): Promise<{ tableName: string; columnName: string }[]>;
  getCheckConstraints(schema: string): Promise<ConstraintDTO[]>;
  validateConstraint(schema: string, table: string, constraintName: string): Promise<string>;
  getTriggerList(schema: string): Promise<TriggerDTO[]>;
  getDomainList(schema: string): Promise<DomainDTO[]>;
}

export class IntegrityService implements IIntegrityService {
  private readonly schemaRepo: SchemaRepository;
  private readonly indexRepo: IndexRepository;

  constructor() {
    this.schemaRepo = new SchemaRepository();
    this.indexRepo = new IndexRepository();
  }

  async getIntegrityReport(schema: string): Promise<IntegrityReportDTO> {
    const [tablesWithoutPk, fkWithoutIndex, nullableFk, checkConstraints] = await Promise.all([
      this.getMissingPk(schema),
      this.indexRepo.getMissingFkIndexes(schema),
      this.getNullableFkColumns(schema),
      this.getCheckConstraints(schema),
    ]);

    const criticalIssues = tablesWithoutPk.length + fkWithoutIndex.length;
    const warnings = nullableFk.length;

    return {
      tablesWithoutPk,
      fkWithoutIndex,
      nullableFkColumns: nullableFk,
      checkConstraints,
      invalidConstraints: [],
      summary: {
        totalIssues: criticalIssues + warnings,
        criticalIssues,
        warnings,
      },
    };
  }

  async getMissingPk(schema: string): Promise<string[]> {
    const tables = await this.schemaRepo.getTableList(schema);
    return tables.filter(t => !t.hasPk).map(t => t.tableName);
  }

  async getMissingFkIndex(schema: string): Promise<{ childTable: string; fkColumn: string; parentTable: string; ddlFix: string }[]> {
    const missing = await this.indexRepo.getMissingFkIndexes(schema);
    return missing.map(m => ({
      ...m,
      ddlFix: `CREATE INDEX CONCURRENTLY ON ${m.childTable} (${m.fkColumn});`,
    }));
  }

  async getNullableFkColumns(schema: string): Promise<{ tableName: string; columnName: string }[]> {
    const constraints = await this.schemaRepo.getConstraintList(schema);
    const fkConstraints = constraints.filter(c => c.constraintType === 'FOREIGN KEY');

    const nullable: { tableName: string; columnName: string }[] = [];
    for (const fk of fkConstraints) {
      for (const col of fk.columns) {
        const tableColumns = await this.schemaRepo.getTableDetail(schema, fk.tableName);
        const column = tableColumns.find(c => c.columnName === col);
        if (column?.isNullable) {
          nullable.push({ tableName: fk.tableName, columnName: col });
        }
      }
    }
    return nullable;
  }

  async getCheckConstraints(schema: string): Promise<ConstraintDTO[]> {
    const all = await this.schemaRepo.getConstraintList(schema);
    return all.filter(c => c.constraintType === 'CHECK');
  }

  async validateConstraint(schema: string, table: string, constraintName: string): Promise<string> {
    if (!config.permissions.allowDdl) {
      throw new McpError('DDL deshabilitado. Configurar PG_ALLOW_DDL=true.', 'DDL_DISABLED');
    }
    const sql = `ALTER TABLE ${schema}.${table} VALIDATE CONSTRAINT ${constraintName}`;
    await dbClient.execute(sql);
    return `VALIDATE CONSTRAINT ${constraintName} ejecutado correctamente en ${schema}.${table}`;
  }

  async getTriggerList(schema: string): Promise<TriggerDTO[]> {
    const sql = `
      SELECT
        c.relname AS table_name,
        t.tgname AS trigger_name,
        CASE
          WHEN t.tgtype & 4 != 0 THEN 'INSERT'
          WHEN t.tgtype & 8 != 0 THEN 'DELETE'
          WHEN t.tgtype & 16 != 0 THEN 'UPDATE'
          ELSE 'TRUNCATE'
        END AS event,
        CASE
          WHEN t.tgtype & 2 != 0 THEN 'BEFORE'
          WHEN t.tgtype & 64 != 0 THEN 'INSTEAD OF'
          ELSE 'AFTER'
        END AS timing,
        p.proname AS function_name,
        t.tgenabled != 'D' AS is_enabled,
        CASE WHEN t.tgtype & 1 != 0 THEN 'ROW' ELSE 'STATEMENT' END AS for_each
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_proc p ON p.oid = t.tgfoid
      WHERE n.nspname = $1
        AND NOT t.tgisinternal
      ORDER BY c.relname, t.tgname
    `;

    const rows = await dbClient.query<{
      table_name: string; trigger_name: string; event: string; timing: string;
      function_name: string; is_enabled: boolean; for_each: string;
    }>(sql, [schema]);

    return rows.map(r => ({
      tableName: r.table_name,
      triggerName: r.trigger_name,
      event: r.event,
      timing: r.timing,
      functionName: r.function_name,
      isEnabled: r.is_enabled,
      forEach: r.for_each,
    }));
  }

  async getDomainList(schema: string): Promise<DomainDTO[]> {
    const sql = `
      SELECT
        n.nspname AS schema_name,
        t.typname AS domain_name,
        bt.typname AS data_type,
        t.typnotnull AS not_null,
        t.typdefault AS default_value,
        co.conname AS constraint_name,
        pg_get_constraintdef(co.oid) AS check_expression
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      JOIN pg_type bt ON bt.oid = t.typbasetype
      LEFT JOIN pg_constraint co ON co.contypid = t.oid
      WHERE t.typtype = 'd'
        AND n.nspname = $1
      ORDER BY t.typname
    `;

    const rows = await dbClient.query<{
      schema_name: string; domain_name: string; data_type: string;
      not_null: boolean; default_value: string | null;
      constraint_name: string | null; check_expression: string | null;
    }>(sql, [schema]);

    return rows.map(r => ({
      schemaName: r.schema_name,
      domainName: r.domain_name,
      dataType: r.data_type,
      notNull: r.not_null,
      defaultValue: r.default_value,
      constraintName: r.constraint_name,
      checkExpression: r.check_expression,
    }));
  }
}
