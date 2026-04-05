import { KeycloakHttpClient } from '../http/KeycloakHttpClient.js';

export class EventRepository {
  constructor(
    private readonly client: KeycloakHttpClient,
    private readonly realm: string
  ) {}

  async listUserEvents(params?: Record<string, unknown>): Promise<unknown[]> {
    return this.client.get(`/admin/realms/${this.realm}/events`, params, this.realm);
  }

  async listAdminEvents(params?: Record<string, unknown>): Promise<unknown[]> {
    return this.client.get(`/admin/realms/${this.realm}/admin-events`, params, this.realm);
  }

  async clearUserEvents(): Promise<void> {
    await this.client.delete(`/admin/realms/${this.realm}/events`, undefined, this.realm);
  }

  async clearAdminEvents(): Promise<void> {
    await this.client.delete(`/admin/realms/${this.realm}/admin-events`, undefined, this.realm);
  }

  async getConfig(): Promise<unknown> {
    return this.client.get(`/admin/realms/${this.realm}/events/config`, undefined, this.realm);
  }

  async updateConfig(cfg: unknown): Promise<void> {
    await this.client.put(`/admin/realms/${this.realm}/events/config`, cfg, this.realm);
  }
}
