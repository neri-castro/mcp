import { KeycloakHttpClient } from '../http/KeycloakHttpClient.js';
import { RoleRepresentationDTO } from '../dto/user/index.js';

export interface GroupRepresentationDTO {
  id?: string;
  name: string;
  path?: string;
  attributes?: Record<string, string[]>;
  realmRoles?: string[];
  clientRoles?: Record<string, string[]>;
  subGroups?: GroupRepresentationDTO[];
}

export class GroupRepository {
  constructor(
    private readonly client: KeycloakHttpClient,
    private readonly realm: string
  ) {}

  async list(params?: Record<string, unknown>): Promise<GroupRepresentationDTO[]> {
    return this.client.get(`/admin/realms/${this.realm}/groups`, params, this.realm);
  }

  async count(): Promise<{ count: number }> {
    return this.client.get(`/admin/realms/${this.realm}/groups/count`, undefined, this.realm);
  }

  async create(dto: GroupRepresentationDTO): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/groups`, dto, this.realm);
  }

  async createChild(parentGroupId: string, dto: GroupRepresentationDTO): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/groups/${parentGroupId}/children`, dto, this.realm);
  }

  async get(groupId: string): Promise<GroupRepresentationDTO> {
    return this.client.get(`/admin/realms/${this.realm}/groups/${groupId}`, undefined, this.realm);
  }

  async update(groupId: string, dto: Partial<GroupRepresentationDTO>): Promise<void> {
    await this.client.put(`/admin/realms/${this.realm}/groups/${groupId}`, dto, this.realm);
  }

  async delete(groupId: string): Promise<void> {
    await this.client.delete(`/admin/realms/${this.realm}/groups/${groupId}`, undefined, this.realm);
  }

  async getMembers(groupId: string, params?: Record<string, unknown>): Promise<unknown[]> {
    return this.client.get(`/admin/realms/${this.realm}/groups/${groupId}/members`, params, this.realm);
  }

  async getRoleMappings(groupId: string): Promise<unknown> {
    return this.client.get(`/admin/realms/${this.realm}/groups/${groupId}/role-mappings`, undefined, this.realm);
  }

  async assignRoles(groupId: string, roles: RoleRepresentationDTO[]): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/groups/${groupId}/role-mappings/realm`, roles, this.realm);
  }

  async removeRoles(groupId: string, roles: RoleRepresentationDTO[]): Promise<void> {
    await this.client.delete(`/admin/realms/${this.realm}/groups/${groupId}/role-mappings/realm`, roles, this.realm);
  }

  async setDefault(groupId: string): Promise<void> {
    await this.client.put(`/admin/realms/${this.realm}/default-groups/${groupId}`, {}, this.realm);
  }
}
