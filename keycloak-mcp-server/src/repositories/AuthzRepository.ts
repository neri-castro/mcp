import { KeycloakHttpClient } from '../http/KeycloakHttpClient.js';

export class AuthzRepository {
  constructor(
    private readonly client: KeycloakHttpClient,
    private readonly realm: string
  ) {}

  private base(clientId: string): string {
    return `/admin/realms/${this.realm}/clients/${clientId}/authz/resource-server`;
  }

  // Resources
  async listResources(clientId: string, params?: Record<string, unknown>): Promise<unknown[]> {
    return this.client.get(`${this.base(clientId)}/resource`, params, this.realm);
  }

  async createResource(clientId: string, dto: unknown): Promise<unknown> {
    return this.client.post(`${this.base(clientId)}/resource`, dto, this.realm);
  }

  async updateResource(clientId: string, resourceId: string, dto: unknown): Promise<void> {
    await this.client.put(`${this.base(clientId)}/resource/${resourceId}`, dto, this.realm);
  }

  async deleteResource(clientId: string, resourceId: string): Promise<void> {
    await this.client.delete(`${this.base(clientId)}/resource/${resourceId}`, undefined, this.realm);
  }

  // Policies
  async listPolicies(clientId: string, params?: Record<string, unknown>): Promise<unknown[]> {
    return this.client.get(`${this.base(clientId)}/policy`, params, this.realm);
  }

  async createPolicy(clientId: string, type: string, dto: unknown): Promise<unknown> {
    return this.client.post(`${this.base(clientId)}/policy/${type}`, dto, this.realm);
  }

  async deletePolicy(clientId: string, policyId: string): Promise<void> {
    await this.client.delete(`${this.base(clientId)}/policy/${policyId}`, undefined, this.realm);
  }

  // Permissions
  async listPermissions(clientId: string): Promise<unknown[]> {
    return this.client.get(`${this.base(clientId)}/permission`, undefined, this.realm);
  }

  async createPermission(clientId: string, type: 'resource' | 'scope', dto: unknown): Promise<unknown> {
    return this.client.post(`${this.base(clientId)}/permission/${type}`, dto, this.realm);
  }

  async deletePermission(clientId: string, permissionId: string): Promise<void> {
    await this.client.delete(`${this.base(clientId)}/permission/${permissionId}`, undefined, this.realm);
  }

  async evaluate(clientId: string, dto: unknown): Promise<unknown> {
    return this.client.post(`${this.base(clientId)}/policy/evaluate`, dto, this.realm);
  }

  async exportSettings(clientId: string): Promise<unknown> {
    return this.client.get(`${this.base(clientId)}`, undefined, this.realm);
  }

  async importSettings(clientId: string, dto: unknown): Promise<void> {
    await this.client.put(`${this.base(clientId)}`, dto, this.realm);
  }
}
