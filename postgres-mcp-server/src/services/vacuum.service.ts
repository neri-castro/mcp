// services/vacuum.service.ts
import { VacuumRepository } from '../repositories/vacuum.repository.js';
import {
  TableBloatDTO,
  XIDWraparoundDTO,
  AutovacuumConfigDTO,
  AutovacuumCandidateDTO,
  VacuumProgressDTO,
  VacuumResultDTO,
  ToastBloatDTO,
} from '../dtos/vacuum.dto.js';
import { config } from '../config/config.js';
import { McpError } from '../db/client.js';

export interface IVacuumService {
  getVacuumStatus(schema: string): Promise<TableBloatDTO[]>;
  getTableBloatEstimate(schema: string): Promise<TableBloatDTO[]>;
  getAutovacuumConfig(): Promise<AutovacuumConfigDTO[]>;
  getAutovacuumCandidates(schema: string): Promise<AutovacuumCandidateDTO[]>;
  getXidWraparoundRisk(): Promise<XIDWraparoundDTO[]>;
  runVacuum(schema: string, table: string | undefined, mode: string, verbose: boolean): Promise<VacuumResultDTO>;
  runAnalyze(schema: string, table?: string): Promise<VacuumResultDTO>;
  getVacuumProgress(): Promise<VacuumProgressDTO[]>;
  getToastBloat(schema: string): Promise<ToastBloatDTO[]>;
}

export class VacuumService implements IVacuumService {
  private readonly repository: VacuumRepository;

  constructor() {
    this.repository = new VacuumRepository();
  }

  async getVacuumStatus(schema: string): Promise<TableBloatDTO[]> {
    return this.repository.getVacuumStatus(schema);
  }

  async getTableBloatEstimate(schema: string): Promise<TableBloatDTO[]> {
    return this.repository.getTableBloatEstimate(schema);
  }

  async getAutovacuumConfig(): Promise<AutovacuumConfigDTO[]> {
    return this.repository.getAutovacuumConfig();
  }

  async getAutovacuumCandidates(schema: string): Promise<AutovacuumCandidateDTO[]> {
    const threshold = config.analysis.bloatThresholdPct;
    const candidates = await this.repository.getAutovacuumCandidates(schema);
    return candidates.filter(c => c.deadTupleRatioPct >= threshold);
  }

  async getXidWraparoundRisk(): Promise<XIDWraparoundDTO[]> {
    return this.repository.getXidWraparoundRisk();
  }

  async runVacuum(schema: string, table: string | undefined, mode: string, verbose: boolean): Promise<VacuumResultDTO> {
    if (!config.permissions.allowMaintenance) {
      throw new McpError(
        'Mantenimiento deshabilitado. Configurar PG_ALLOW_MAINTENANCE=true para ejecutar VACUUM.',
        'MAINTENANCE_DISABLED',
      );
    }
    if (mode === 'VACUUM_FULL') {
      console.warn(`[WARN] VACUUM FULL en ${schema}.${table ?? 'schema'} — requiere lock exclusivo. Usar solo en ventana de mantenimiento.`);
    }
    return this.repository.runVacuum(schema, table, mode, verbose);
  }

  async runAnalyze(schema: string, table?: string): Promise<VacuumResultDTO> {
    if (!config.permissions.allowMaintenance) {
      throw new McpError('Mantenimiento deshabilitado. Configurar PG_ALLOW_MAINTENANCE=true.', 'MAINTENANCE_DISABLED');
    }
    return this.repository.runAnalyze(schema, table);
  }

  async getVacuumProgress(): Promise<VacuumProgressDTO[]> {
    return this.repository.getVacuumProgress();
  }

  async getToastBloat(schema: string): Promise<ToastBloatDTO[]> {
    return this.repository.getToastBloat(schema);
  }
}
