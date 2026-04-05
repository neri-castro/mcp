import { KeycloakHttpClient } from '../http/KeycloakHttpClient.js';

export interface AuthFlowDTO {
  id?: string;
  alias: string;
  description?: string;
  providerId?: string;
  topLevel?: boolean;
  builtIn?: boolean;
}

export interface AuthExecutionDTO {
  id?: string;
  requirement?: string;
  displayName?: string;
  configurable?: boolean;
  level?: number;
  index?: number;
}

export class AuthFlowRepository {
  constructor(
    private readonly client: KeycloakHttpClient,
    private readonly realm: string
  ) {}

  async list(): Promise<AuthFlowDTO[]> {
    return this.client.get(`/admin/realms/${this.realm}/authentication/flows`, undefined, this.realm);
  }

  async create(dto: Omit<AuthFlowDTO, 'id'>): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/authentication/flows`, dto, this.realm);
  }

  async get(flowId: string): Promise<AuthFlowDTO> {
    return this.client.get(`/admin/realms/${this.realm}/authentication/flows/${flowId}`, undefined, this.realm);
  }

  async update(flowId: string, dto: Partial<AuthFlowDTO>): Promise<void> {
    await this.client.put(`/admin/realms/${this.realm}/authentication/flows/${flowId}`, dto, this.realm);
  }

  async delete(flowId: string): Promise<void> {
    await this.client.delete(`/admin/realms/${this.realm}/authentication/flows/${flowId}`, undefined, this.realm);
  }

  async copy(flowAlias: string, newName: string): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/authentication/flows/${flowAlias}/copy`, { newName }, this.realm);
  }

  async getExecutions(flowAlias: string): Promise<AuthExecutionDTO[]> {
    return this.client.get(`/admin/realms/${this.realm}/authentication/flows/${flowAlias}/executions`, undefined, this.realm);
  }

  async updateExecution(flowAlias: string, dto: AuthExecutionDTO): Promise<void> {
    await this.client.put(`/admin/realms/${this.realm}/authentication/flows/${flowAlias}/executions`, dto, this.realm);
  }

  async listRequiredActions(): Promise<unknown[]> {
    return this.client.get(`/admin/realms/${this.realm}/authentication/required-actions`, undefined, this.realm);
  }

  async updateRequiredAction(alias: string, dto: Record<string, unknown>): Promise<void> {
    await this.client.put(`/admin/realms/${this.realm}/authentication/required-actions/${alias}`, dto, this.realm);
  }
}
