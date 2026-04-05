import { KeycloakHttpClient } from '../http/KeycloakHttpClient.js';

export interface LdapProviderDTO {
  id?: string;
  name: string;
  providerId: string;
  providerType: string;
  config: Record<string, string[]>;
}

export class LdapFederationRepository {
  constructor(
    private readonly client: KeycloakHttpClient,
    private readonly realm: string
  ) {}

  async list(): Promise<LdapProviderDTO[]> {
    return this.client.get(
      `/admin/realms/${this.realm}/components`,
      { type: 'org.keycloak.storage.UserStorageProvider' },
      this.realm
    );
  }

  async create(dto: LdapProviderDTO): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/components`, dto, this.realm);
  }

  async get(componentId: string): Promise<LdapProviderDTO> {
    return this.client.get(`/admin/realms/${this.realm}/components/${componentId}`, undefined, this.realm);
  }

  async update(componentId: string, dto: Partial<LdapProviderDTO>): Promise<void> {
    await this.client.put(`/admin/realms/${this.realm}/components/${componentId}`, dto, this.realm);
  }

  async delete(componentId: string): Promise<void> {
    await this.client.delete(`/admin/realms/${this.realm}/components/${componentId}`, undefined, this.realm);
  }

  async sync(componentId: string, action: 'triggerFullSync' | 'triggerChangedUsersSync'): Promise<unknown> {
    return this.client.post(
      `/admin/realms/${this.realm}/user-storage/${componentId}/sync?action=${action}`,
      {},
      this.realm
    );
  }

  async listMappers(parentId: string): Promise<unknown[]> {
    return this.client.get(
      `/admin/realms/${this.realm}/components`,
      { parent: parentId, type: 'org.keycloak.storage.ldap.mappers.LDAPStorageMapper' },
      this.realm
    );
  }

  async createMapper(dto: Record<string, unknown>): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/components`, dto, this.realm);
  }

  async syncMapper(parentId: string, mapperId: string, direction: string): Promise<unknown> {
    return this.client.post(
      `/admin/realms/${this.realm}/user-storage/${parentId}/mappers/${mapperId}/sync?direction=${direction}`,
      {},
      this.realm
    );
  }
}
