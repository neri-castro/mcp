import { BaseRepository } from './base/BaseRepository.js';
import { KeycloakHttpClient } from '../http/KeycloakHttpClient.js';
import {
  UserRepresentationDTO,
  CreateUserDTO,
  UpdateUserDTO,
  UserSearchParamsDTO,
  PasswordDTO,
  UserSessionRepresentationDTO,
  MappingsRepresentationDTO,
  ImpersonationResponseDTO,
  CredentialRepresentationDTO,
} from '../dto/user/index.js';
import { RoleRepresentationDTO } from '../dto/user/index.js';

export class UserRepository extends BaseRepository<UserRepresentationDTO, CreateUserDTO, UpdateUserDTO> {
  constructor(client: KeycloakHttpClient, realm: string) {
    super(client, realm, 'users');
  }

  async search(params: UserSearchParamsDTO): Promise<UserRepresentationDTO[]> {
    return this.client.get<UserRepresentationDTO[]>(
      `/admin/realms/${this.realm}/users`,
      params as Record<string, unknown>,
      this.realm
    );
  }

  async count(params?: UserSearchParamsDTO): Promise<number> {
    return this.client.get<number>(
      `/admin/realms/${this.realm}/users/count`,
      params as Record<string, unknown>,
      this.realm
    );
  }

  async setPassword(userId: string, dto: PasswordDTO): Promise<void> {
    await this.client.put(
      `/admin/realms/${this.realm}/users/${userId}/reset-password`,
      dto,
      this.realm
    );
  }

  async sendResetPasswordEmail(userId: string, clientId?: string, redirectUri?: string): Promise<void> {
    const params = new URLSearchParams();
    if (clientId) params.set('client_id', clientId);
    if (redirectUri) params.set('redirect_uri', redirectUri);
    await this.client.put(
      `/admin/realms/${this.realm}/users/${userId}/send-verify-email${params.size ? '?' + params : ''}`,
      {},
      this.realm
    );
  }

  async sendVerifyEmail(userId: string): Promise<void> {
    await this.client.put(
      `/admin/realms/${this.realm}/users/${userId}/send-verify-email`,
      {},
      this.realm
    );
  }

  async executeActionsEmail(userId: string, actions: string[], clientId?: string): Promise<void> {
    const params = clientId ? `?client_id=${clientId}` : '';
    await this.client.put(
      `/admin/realms/${this.realm}/users/${userId}/execute-actions-email${params}`,
      actions,
      this.realm
    );
  }

  async getRoleMappings(userId: string): Promise<MappingsRepresentationDTO> {
    return this.client.get<MappingsRepresentationDTO>(
      `/admin/realms/${this.realm}/users/${userId}/role-mappings`,
      undefined,
      this.realm
    );
  }

  async assignRealmRoles(userId: string, roles: RoleRepresentationDTO[]): Promise<void> {
    await this.client.post(
      `/admin/realms/${this.realm}/users/${userId}/role-mappings/realm`,
      roles,
      this.realm
    );
  }

  async removeRealmRoles(userId: string, roles: RoleRepresentationDTO[]): Promise<void> {
    await this.client.delete(
      `/admin/realms/${this.realm}/users/${userId}/role-mappings/realm`,
      roles,
      this.realm
    );
  }

  async assignClientRoles(userId: string, clientId: string, roles: RoleRepresentationDTO[]): Promise<void> {
    await this.client.post(
      `/admin/realms/${this.realm}/users/${userId}/role-mappings/clients/${clientId}`,
      roles,
      this.realm
    );
  }

  async removeClientRoles(userId: string, clientId: string, roles: RoleRepresentationDTO[]): Promise<void> {
    await this.client.delete(
      `/admin/realms/${this.realm}/users/${userId}/role-mappings/clients/${clientId}`,
      roles,
      this.realm
    );
  }

  async getGroups(userId: string): Promise<Array<{ id: string; name: string; path: string }>> {
    return this.client.get(
      `/admin/realms/${this.realm}/users/${userId}/groups`,
      undefined,
      this.realm
    );
  }

  async joinGroup(userId: string, groupId: string): Promise<void> {
    await this.client.put(
      `/admin/realms/${this.realm}/users/${userId}/groups/${groupId}`,
      {},
      this.realm
    );
  }

  async leaveGroup(userId: string, groupId: string): Promise<void> {
    await this.client.delete(
      `/admin/realms/${this.realm}/users/${userId}/groups/${groupId}`,
      undefined,
      this.realm
    );
  }

  async getSessions(userId: string): Promise<UserSessionRepresentationDTO[]> {
    return this.client.get(
      `/admin/realms/${this.realm}/users/${userId}/sessions`,
      undefined,
      this.realm
    );
  }

  async logout(userId: string): Promise<void> {
    await this.client.delete(
      `/admin/realms/${this.realm}/users/${userId}/logout`,
      undefined,
      this.realm
    );
  }

  async impersonate(userId: string): Promise<ImpersonationResponseDTO> {
    return this.client.post(
      `/admin/realms/${this.realm}/users/${userId}/impersonation`,
      {},
      this.realm
    );
  }

  async getCredentials(userId: string): Promise<CredentialRepresentationDTO[]> {
    return this.client.get(
      `/admin/realms/${this.realm}/users/${userId}/credentials`,
      undefined,
      this.realm
    );
  }

  async deleteCredential(userId: string, credentialId: string): Promise<void> {
    await this.client.delete(
      `/admin/realms/${this.realm}/users/${userId}/credentials/${credentialId}`,
      undefined,
      this.realm
    );
  }

  async getConsents(userId: string): Promise<unknown[]> {
    return this.client.get(
      `/admin/realms/${this.realm}/users/${userId}/consents`,
      undefined,
      this.realm
    );
  }

  async revokeConsent(userId: string, clientId: string): Promise<void> {
    await this.client.delete(
      `/admin/realms/${this.realm}/users/${userId}/consents/${clientId}`,
      undefined,
      this.realm
    );
  }
}
