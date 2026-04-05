// services/config.service.ts
import { ConfigRepository, ServerConfigDTO, ExtensionStatusDTO, ServerVersionDTO } from '../repositories/config.repository.js';

export interface IConfigService {
  getConfigOverview(): Promise<ServerConfigDTO[]>;
  getMemoryConfig(): Promise<ServerConfigDTO[]>;
  getAutovacuumConfig(): Promise<ServerConfigDTO[]>;
  getConnectionsConfig(): Promise<ServerConfigDTO[]>;
  getWalConfig(): Promise<ServerConfigDTO[]>;
  getIoConfig(): Promise<ServerConfigDTO[]>;
  getParallelConfig(): Promise<ServerConfigDTO[]>;
  getLoggingConfig(): Promise<ServerConfigDTO[]>;
  getServerVersion(): Promise<ServerVersionDTO>;
  getExtensionsStatus(): Promise<ExtensionStatusDTO[]>;
}

export class ConfigService implements IConfigService {
  private readonly repository: ConfigRepository;

  constructor() {
    this.repository = new ConfigRepository();
  }

  async getConfigOverview(): Promise<ServerConfigDTO[]> {
    return this.repository.getConfigOverview();
  }

  async getMemoryConfig(): Promise<ServerConfigDTO[]> {
    return this.repository.getMemoryConfig();
  }

  async getAutovacuumConfig(): Promise<ServerConfigDTO[]> {
    return this.repository.getAutovacuumConfig();
  }

  async getConnectionsConfig(): Promise<ServerConfigDTO[]> {
    return this.repository.getConnectionsConfig();
  }

  async getWalConfig(): Promise<ServerConfigDTO[]> {
    return this.repository.getWalConfig();
  }

  async getIoConfig(): Promise<ServerConfigDTO[]> {
    return this.repository.getIoConfig();
  }

  async getParallelConfig(): Promise<ServerConfigDTO[]> {
    return this.repository.getParallelConfig();
  }

  async getLoggingConfig(): Promise<ServerConfigDTO[]> {
    return this.repository.getLoggingConfig();
  }

  async getServerVersion(): Promise<ServerVersionDTO> {
    return this.repository.getServerVersion();
  }

  async getExtensionsStatus(): Promise<ExtensionStatusDTO[]> {
    return this.repository.getExtensionsStatus();
  }
}
