import { KeycloakHttpClient } from '../http/KeycloakHttpClient.js';

export interface OrganizationDTO {
  id?: string;
  name: string;
  alias?: string;
  description?: string;
  enabled?: boolean;
  domains?: Array<{ name: string; verified: boolean }>;
  attributes?: Record<string, string[]>;
}

export class OrganizationRepository {
  constructor(
    private readonly client: KeycloakHttpClient,
    private readonly realm: string
  ) {}

  async list(params?: Record<string, unknown>): Promise<OrganizationDTO[]> {
    return this.client.get(`/admin/realms/${this.realm}/organizations`, params, this.realm);
  }

  async create(dto: OrganizationDTO): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/organizations`, dto, this.realm);
  }

  async get(orgId: string): Promise<OrganizationDTO> {
    return this.client.get(`/admin/realms/${this.realm}/organizations/${orgId}`, undefined, this.realm);
  }

  async update(orgId: string, dto: Partial<OrganizationDTO>): Promise<void> {
    await this.client.put(`/admin/realms/${this.realm}/organizations/${orgId}`, dto, this.realm);
  }

  async delete(orgId: string): Promise<void> {
    await this.client.delete(`/admin/realms/${this.realm}/organizations/${orgId}`, undefined, this.realm);
  }

  async listMembers(orgId: string, params?: Record<string, unknown>): Promise<unknown[]> {
    return this.client.get(`/admin/realms/${this.realm}/organizations/${orgId}/members`, params, this.realm);
  }

  async addMember(orgId: string, userId: string): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/organizations/${orgId}/members`, userId, this.realm);
  }

  async removeMember(orgId: string, userId: string): Promise<void> {
    await this.client.delete(`/admin/realms/${this.realm}/organizations/${orgId}/members/${userId}`, undefined, this.realm);
  }

  async linkIdp(orgId: string, idpAlias: string): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/organizations/${orgId}/identity-providers`, { alias: idpAlias }, this.realm);
  }

  async unlinkIdp(orgId: string, idpAlias: string): Promise<void> {
    await this.client.delete(`/admin/realms/${this.realm}/organizations/${orgId}/identity-providers/${idpAlias}`, undefined, this.realm);
  }

  async inviteMember(orgId: string, dto: { email: string; firstName?: string; lastName?: string }): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/organizations/${orgId}/members/invitation-email`, dto, this.realm);
  }
}
