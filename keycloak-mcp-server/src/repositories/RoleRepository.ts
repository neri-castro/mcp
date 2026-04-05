import { KeycloakHttpClient } from '../http/KeycloakHttpClient.js';
import { RoleRepresentationDTO } from '../dto/user/index.js';

export class RoleRepository {
  constructor(
    private readonly client: KeycloakHttpClient,
    private readonly realm: string
  ) {}

  // Realm roles
  async listRealmRoles(): Promise<RoleRepresentationDTO[]> {
    return this.client.get(`/admin/realms/${this.realm}/roles`, undefined, this.realm);
  }

  async createRealmRole(dto: RoleRepresentationDTO): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/roles`, dto, this.realm);
  }

  async getRealmRole(roleName: string): Promise<RoleRepresentationDTO> {
    return this.client.get(`/admin/realms/${this.realm}/roles/${roleName}`, undefined, this.realm);
  }

  async updateRealmRole(roleName: string, dto: Partial<RoleRepresentationDTO>): Promise<void> {
    await this.client.put(`/admin/realms/${this.realm}/roles/${roleName}`, dto, this.realm);
  }

  async deleteRealmRole(roleName: string): Promise<void> {
    await this.client.delete(`/admin/realms/${this.realm}/roles/${roleName}`, undefined, this.realm);
  }

  async addComposites(roleName: string, roles: RoleRepresentationDTO[]): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/roles/${roleName}/composites`, roles, this.realm);
  }

  async getComposites(roleName: string): Promise<RoleRepresentationDTO[]> {
    return this.client.get(`/admin/realms/${this.realm}/roles/${roleName}/composites`, undefined, this.realm);
  }

  async getUsersWithRole(roleName: string, params?: Record<string, unknown>): Promise<unknown[]> {
    return this.client.get(`/admin/realms/${this.realm}/roles/${roleName}/users`, params, this.realm);
  }

  // Client roles
  async listClientRoles(clientId: string): Promise<RoleRepresentationDTO[]> {
    return this.client.get(`/admin/realms/${this.realm}/clients/${clientId}/roles`, undefined, this.realm);
  }

  async createClientRole(clientId: string, dto: RoleRepresentationDTO): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/clients/${clientId}/roles`, dto, this.realm);
  }

  async getClientRole(clientId: string, roleName: string): Promise<RoleRepresentationDTO> {
    return this.client.get(`/admin/realms/${this.realm}/clients/${clientId}/roles/${roleName}`, undefined, this.realm);
  }

  async deleteClientRole(clientId: string, roleName: string): Promise<void> {
    await this.client.delete(`/admin/realms/${this.realm}/clients/${clientId}/roles/${roleName}`, undefined, this.realm);
  }

  // Scope mappings
  async addScopeMappings(clientId: string, roles: RoleRepresentationDTO[]): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/clients/${clientId}/scope-mappings/realm`, roles, this.realm);
  }

  async removeScopeMappings(clientId: string, roles: RoleRepresentationDTO[]): Promise<void> {
    await this.client.delete(`/admin/realms/${this.realm}/clients/${clientId}/scope-mappings/realm`, roles, this.realm);
  }
}
