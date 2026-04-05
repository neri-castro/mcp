import { KeycloakHttpClient } from '../http/KeycloakHttpClient.js';

export class SessionRepository {
  constructor(
    private readonly client: KeycloakHttpClient,
    private readonly realm: string
  ) {}

  async get(sessionId: string): Promise<unknown> {
    return this.client.get(`/admin/realms/${this.realm}/sessions/${sessionId}`, undefined, this.realm);
  }

  async delete(sessionId: string): Promise<void> {
    await this.client.delete(`/admin/realms/${this.realm}/sessions/${sessionId}`, undefined, this.realm);
  }

  async listByUser(userId: string): Promise<unknown[]> {
    return this.client.get(`/admin/realms/${this.realm}/users/${userId}/sessions`, undefined, this.realm);
  }

  async listByClient(clientId: string, params?: Record<string, unknown>): Promise<unknown[]> {
    return this.client.get(`/admin/realms/${this.realm}/clients/${clientId}/sessions`, params, this.realm);
  }

  async countByClient(clientId: string): Promise<{ count: number }> {
    return this.client.get(`/admin/realms/${this.realm}/clients/${clientId}/session-count`, undefined, this.realm);
  }

  async listOfflineByClient(clientId: string): Promise<unknown[]> {
    return this.client.get(`/admin/realms/${this.realm}/clients/${clientId}/offline-sessions`, undefined, this.realm);
  }

  async logoutUser(userId: string): Promise<void> {
    await this.client.delete(`/admin/realms/${this.realm}/users/${userId}/logout`, undefined, this.realm);
  }

  async logoutAll(): Promise<void> {
    await this.client.post(`/admin/realms/${this.realm}/logout-all`, {}, this.realm);
  }

  async revokeTokensBefore(notBefore: number): Promise<void> {
    await this.client.put(`/admin/realms/${this.realm}`, { notBefore, bruteForceProtected: undefined }, this.realm);
  }
}
