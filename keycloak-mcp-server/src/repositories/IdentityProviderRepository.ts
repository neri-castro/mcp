import { KeycloakHttpClient } from '../http/KeycloakHttpClient.js';

export interface IdentityProviderDTO {
  alias: string;
  displayName?: string;
  providerId: string;
  enabled?: boolean;
  trustEmail?: boolean;
  storeToken?: boolean;
  addReadTokenRoleOnCreate?: boolean;
  firstBrokerLoginFlowAlias?: string;
  config?: Record<string, string>;
}

export interface IdentityProviderMapperDTO {
  id?: string;
  name: string;
  identityProviderAlias: string;
  identityProviderMapper: string;
  config?: Record<string, string>;
}

export class IdentityProviderRepository {
  constructor(
    private readonly client: KeycloakHttpClient,
    private readonly realm: string
  ) {}

  async list(): Promise<IdentityProviderDTO[]> {
    return this.client.get(`/admin/realms/${this.realm}/identity-provider/instances`, undefined, this.realm);
  }

  async create(dto: IdentityProviderDTO): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/identity-provider/instances`, dto, this.realm);
  }

  async get(alias: string): Promise<IdentityProviderDTO> {
    return this.client.get(`/admin/realms/${this.realm}/identity-provider/instances/${alias}`, undefined, this.realm);
  }

  async update(alias: string, dto: Partial<IdentityProviderDTO>): Promise<void> {
    await this.client.put(`/admin/realms/${this.realm}/identity-provider/instances/${alias}`, dto, this.realm);
  }

  async delete(alias: string): Promise<void> {
    await this.client.delete(`/admin/realms/${this.realm}/identity-provider/instances/${alias}`, undefined, this.realm);
  }

  async listMappers(alias: string): Promise<IdentityProviderMapperDTO[]> {
    return this.client.get(`/admin/realms/${this.realm}/identity-provider/instances/${alias}/mappers`, undefined, this.realm);
  }

  async createMapper(alias: string, dto: IdentityProviderMapperDTO): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/identity-provider/instances/${alias}/mappers`, dto, this.realm);
  }

  async deleteMapper(alias: string, mapperId: string): Promise<void> {
    await this.client.delete(`/admin/realms/${this.realm}/identity-provider/instances/${alias}/mappers/${mapperId}`, undefined, this.realm);
  }
}
