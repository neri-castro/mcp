import { KeycloakHttpClient } from '../http/KeycloakHttpClient.js';
import { ClientRepresentationDTO, ProtocolMapperDTO, ClientSecretDTO } from '../dto/client/index.js';

export class ClientRepository {
  constructor(
    private readonly client: KeycloakHttpClient,
    private readonly realm: string
  ) {}

  async list(params?: Record<string, unknown>): Promise<ClientRepresentationDTO[]> {
    return this.client.get(`/admin/realms/${this.realm}/clients`, params, this.realm);
  }

  async create(dto: ClientRepresentationDTO): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/clients`, dto, this.realm);
  }

  async get(clientId: string): Promise<ClientRepresentationDTO> {
    return this.client.get(`/admin/realms/${this.realm}/clients/${clientId}`, undefined, this.realm);
  }

  async update(clientId: string, dto: Partial<ClientRepresentationDTO>): Promise<void> {
    await this.client.put(`/admin/realms/${this.realm}/clients/${clientId}`, dto, this.realm);
  }

  async delete(clientId: string): Promise<void> {
    await this.client.delete(`/admin/realms/${this.realm}/clients/${clientId}`, undefined, this.realm);
  }

  async getSecret(clientId: string): Promise<ClientSecretDTO> {
    return this.client.get(`/admin/realms/${this.realm}/clients/${clientId}/client-secret`, undefined, this.realm);
  }

  async regenerateSecret(clientId: string): Promise<ClientSecretDTO> {
    return this.client.post(`/admin/realms/${this.realm}/clients/${clientId}/client-secret`, {}, this.realm);
  }

  async getServiceAccountUser(clientId: string): Promise<unknown> {
    return this.client.get(`/admin/realms/${this.realm}/clients/${clientId}/service-account-user`, undefined, this.realm);
  }

  async getSessions(clientId: string): Promise<unknown[]> {
    return this.client.get(`/admin/realms/${this.realm}/clients/${clientId}/sessions`, undefined, this.realm);
  }

  async getOfflineSessions(clientId: string): Promise<unknown[]> {
    return this.client.get(`/admin/realms/${this.realm}/clients/${clientId}/offline-sessions`, undefined, this.realm);
  }

  async listMappers(clientId: string): Promise<ProtocolMapperDTO[]> {
    return this.client.get(`/admin/realms/${this.realm}/clients/${clientId}/protocol-mappers/models`, undefined, this.realm);
  }

  async createMapper(clientId: string, dto: ProtocolMapperDTO): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/clients/${clientId}/protocol-mappers/models`, dto, this.realm);
  }

  async deleteMapper(clientId: string, mapperId: string): Promise<void> {
    await this.client.delete(`/admin/realms/${this.realm}/clients/${clientId}/protocol-mappers/models/${mapperId}`, undefined, this.realm);
  }

  async enableAuthorizationServices(clientId: string): Promise<void> {
    await this.client.put(`/admin/realms/${this.realm}/clients/${clientId}`, { authorizationServicesEnabled: true, serviceAccountsEnabled: true }, this.realm);
  }

  async getInstallation(clientId: string, provider: string): Promise<unknown> {
    return this.client.get(`/admin/realms/${this.realm}/clients/${clientId}/installation/providers/${provider}`, undefined, this.realm);
  }
}
