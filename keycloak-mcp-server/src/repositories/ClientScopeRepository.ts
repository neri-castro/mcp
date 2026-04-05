import { KeycloakHttpClient } from '../http/KeycloakHttpClient.js';
import { ProtocolMapperDTO } from '../dto/client/index.js';

export interface ClientScopeRepresentationDTO {
  id?: string;
  name: string;
  description?: string;
  protocol?: 'openid-connect' | 'saml';
  attributes?: Record<string, string>;
  protocolMappers?: ProtocolMapperDTO[];
}

export class ClientScopeRepository {
  constructor(
    private readonly client: KeycloakHttpClient,
    private readonly realm: string
  ) {}

  async list(): Promise<ClientScopeRepresentationDTO[]> {
    return this.client.get(`/admin/realms/${this.realm}/client-scopes`, undefined, this.realm);
  }

  async create(dto: ClientScopeRepresentationDTO): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/client-scopes`, dto, this.realm);
  }

  async get(scopeId: string): Promise<ClientScopeRepresentationDTO> {
    return this.client.get(`/admin/realms/${this.realm}/client-scopes/${scopeId}`, undefined, this.realm);
  }

  async update(scopeId: string, dto: Partial<ClientScopeRepresentationDTO>): Promise<void> {
    await this.client.put(`/admin/realms/${this.realm}/client-scopes/${scopeId}`, dto, this.realm);
  }

  async delete(scopeId: string): Promise<void> {
    await this.client.delete(`/admin/realms/${this.realm}/client-scopes/${scopeId}`, undefined, this.realm);
  }

  async addMapper(scopeId: string, dto: ProtocolMapperDTO): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/client-scopes/${scopeId}/protocol-mappers/models`, dto, this.realm);
  }

  async assignToClient(clientId: string, scopeId: string, optional = false): Promise<void> {
    const type = optional ? 'optional-client-scopes' : 'default-client-scopes';
    await this.client.put(`/admin/realms/${this.realm}/clients/${clientId}/${type}/${scopeId}`, {}, this.realm);
  }

  async removeFromClient(clientId: string, scopeId: string, optional = false): Promise<void> {
    const type = optional ? 'optional-client-scopes' : 'default-client-scopes';
    await this.client.delete(`/admin/realms/${this.realm}/clients/${clientId}/${type}/${scopeId}`, undefined, this.realm);
  }
}
