import { KeycloakHttpClient } from '../http/KeycloakHttpClient.js';

export interface RealmRepresentationDTO {
  id?: string;
  realm: string;
  displayName?: string;
  displayNameHtml?: string;
  enabled?: boolean;
  registrationAllowed?: boolean;
  loginWithEmailAllowed?: boolean;
  duplicateEmailsAllowed?: boolean;
  resetPasswordAllowed?: boolean;
  verifyEmail?: boolean;
  bruteForceProtected?: boolean;
  accessTokenLifespan?: number;
  ssoSessionIdleTimeout?: number;
  ssoSessionMaxLifespan?: number;
  passwordPolicy?: string;
  smtpServer?: Record<string, string>;
  [key: string]: unknown;
}

export class RealmRepository {
  constructor(private readonly client: KeycloakHttpClient) {}

  async list(): Promise<RealmRepresentationDTO[]> {
    return this.client.get<RealmRepresentationDTO[]>('/admin/realms');
  }

  async get(realm: string): Promise<RealmRepresentationDTO> {
    return this.client.get<RealmRepresentationDTO>(`/admin/realms/${realm}`, undefined, realm);
  }

  async create(dto: RealmRepresentationDTO): Promise<void> {
    await this.client.post('/admin/realms', dto);
  }

  async update(realm: string, dto: Partial<RealmRepresentationDTO>): Promise<void> {
    await this.client.put(`/admin/realms/${realm}`, dto, realm);
  }

  async delete(realm: string): Promise<void> {
    await this.client.delete(`/admin/realms/${realm}`, undefined, realm);
  }

  async export(realm: string, exportClients = false, exportGroupsAndRoles = false): Promise<unknown> {
    return this.client.post(
      `/admin/realms/${realm}/partial-export?exportClients=${exportClients}&exportGroupsAndRoles=${exportGroupsAndRoles}`,
      {},
      realm
    );
  }

  async import(realm: string, payload: unknown): Promise<void> {
    await this.client.post(`/admin/realms/${realm}/partial-import`, payload, realm);
  }

  async logoutAll(realm: string): Promise<void> {
    await this.client.post(`/admin/realms/${realm}/logout-all`, {}, realm);
  }

  async getEvents(realm: string, params?: Record<string, unknown>): Promise<unknown[]> {
    return this.client.get(`/admin/realms/${realm}/events`, params, realm);
  }

  async getAdminEvents(realm: string, params?: Record<string, unknown>): Promise<unknown[]> {
    return this.client.get(`/admin/realms/${realm}/admin-events`, params, realm);
  }

  async clearEvents(realm: string): Promise<void> {
    await this.client.delete(`/admin/realms/${realm}/events`, undefined, realm);
  }

  async getEventsConfig(realm: string): Promise<unknown> {
    return this.client.get(`/admin/realms/${realm}/events/config`, undefined, realm);
  }

  async updateEventsConfig(realm: string, cfg: unknown): Promise<void> {
    await this.client.put(`/admin/realms/${realm}/events/config`, cfg, realm);
  }

  async getKeys(realm: string): Promise<unknown> {
    return this.client.get(`/admin/realms/${realm}/keys`, undefined, realm);
  }
}
