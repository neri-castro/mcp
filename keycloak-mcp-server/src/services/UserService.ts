import { UserRepository } from '../repositories/UserRepository.js';
import { RoleRepository } from '../repositories/RoleRepository.js';
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
  RoleRepresentationDTO,
} from '../dto/user/index.js';
import { KeycloakAPIError } from '../utils/errors.js';

// ISP: Segregated interfaces
export interface IUserReader {
  list(params: UserSearchParamsDTO): Promise<UserRepresentationDTO[]>;
  get(realm: string, userId: string): Promise<UserRepresentationDTO>;
  count(realm: string, params?: UserSearchParamsDTO): Promise<number>;
}

export interface IUserWriter {
  create(realm: string, dto: CreateUserDTO): Promise<void>;
  update(realm: string, userId: string, dto: UpdateUserDTO): Promise<void>;
  remove(realm: string, userId: string): Promise<void>;
}

export interface IUserCredentialManager {
  setPassword(realm: string, userId: string, password: string, temporary: boolean): Promise<void>;
  sendResetPasswordEmail(realm: string, userId: string, clientId?: string): Promise<void>;
  sendVerifyEmail(realm: string, userId: string): Promise<void>;
  executeActionsEmail(realm: string, userId: string, actions: string[], clientId?: string): Promise<void>;
  getCredentials(realm: string, userId: string): Promise<CredentialRepresentationDTO[]>;
  deleteCredential(realm: string, userId: string, credentialId: string): Promise<void>;
}

export interface IUserRoleManager {
  getRoles(realm: string, userId: string): Promise<MappingsRepresentationDTO>;
  assignRealmRoles(realm: string, userId: string, roleNames: string[]): Promise<void>;
  removeRealmRoles(realm: string, userId: string, roleNames: string[]): Promise<void>;
  assignClientRoles(realm: string, userId: string, clientId: string, roleNames: string[]): Promise<void>;
  removeClientRoles(realm: string, userId: string, clientId: string, roleNames: string[]): Promise<void>;
}

export interface IUserSessionManager {
  getSessions(realm: string, userId: string): Promise<UserSessionRepresentationDTO[]>;
  logout(realm: string, userId: string): Promise<void>;
  impersonate(realm: string, userId: string): Promise<ImpersonationResponseDTO>;
}

export class UserService implements IUserReader, IUserWriter, IUserCredentialManager, IUserRoleManager, IUserSessionManager {
  private getRepo(realm: string, client: KeycloakHttpClient) {
    return new UserRepository(client, realm);
  }

  private getRoleRepo(realm: string, client: KeycloakHttpClient) {
    return new RoleRepository(client, realm);
  }

  constructor(private readonly client: KeycloakHttpClient) {}

  async list(params: UserSearchParamsDTO): Promise<UserRepresentationDTO[]> {
    throw new Error('Use listInRealm with realm param');
  }

  async listInRealm(realm: string, params: UserSearchParamsDTO): Promise<UserRepresentationDTO[]> {
    return this.getRepo(realm, this.client).search(params);
  }

  async get(realm: string, userId: string): Promise<UserRepresentationDTO> {
    return this.getRepo(realm, this.client).get(userId);
  }

  async count(realm: string, params?: UserSearchParamsDTO): Promise<number> {
    return this.getRepo(realm, this.client).count(params);
  }

  async create(realm: string, dto: CreateUserDTO): Promise<void> {
    return this.getRepo(realm, this.client).create(dto);
  }

  async update(realm: string, userId: string, dto: UpdateUserDTO): Promise<void> {
    return this.getRepo(realm, this.client).update(userId, dto);
  }

  async enable(realm: string, userId: string): Promise<void> {
    await this.update(realm, userId, { enabled: true });
  }

  async disable(realm: string, userId: string): Promise<void> {
    await this.update(realm, userId, { enabled: false });
  }

  async remove(realm: string, userId: string): Promise<void> {
    return this.getRepo(realm, this.client).delete(userId);
  }

  async setPassword(realm: string, userId: string, password: string, temporary: boolean): Promise<void> {
    const dto: PasswordDTO = { type: 'password', value: password, temporary };
    return this.getRepo(realm, this.client).setPassword(userId, dto);
  }

  async sendResetPasswordEmail(realm: string, userId: string, clientId?: string): Promise<void> {
    return this.getRepo(realm, this.client).sendResetPasswordEmail(userId, clientId);
  }

  async sendVerifyEmail(realm: string, userId: string): Promise<void> {
    return this.getRepo(realm, this.client).sendVerifyEmail(userId);
  }

  async executeActionsEmail(realm: string, userId: string, actions: string[], clientId?: string): Promise<void> {
    return this.getRepo(realm, this.client).executeActionsEmail(userId, actions, clientId);
  }

  async getCredentials(realm: string, userId: string): Promise<CredentialRepresentationDTO[]> {
    return this.getRepo(realm, this.client).getCredentials(userId);
  }

  async deleteCredential(realm: string, userId: string, credentialId: string): Promise<void> {
    return this.getRepo(realm, this.client).deleteCredential(userId, credentialId);
  }

  async getRoles(realm: string, userId: string): Promise<MappingsRepresentationDTO> {
    return this.getRepo(realm, this.client).getRoleMappings(userId);
  }

  // Tell Don't Ask: resolves role IDs internally before assigning
  async assignRealmRoles(realm: string, userId: string, roleNames: string[]): Promise<void> {
    const roleRepo = this.getRoleRepo(realm, this.client);
    const roles = await Promise.all(roleNames.map((name) => roleRepo.getRealmRole(name)));
    return this.getRepo(realm, this.client).assignRealmRoles(userId, roles);
  }

  async removeRealmRoles(realm: string, userId: string, roleNames: string[]): Promise<void> {
    const roleRepo = this.getRoleRepo(realm, this.client);
    const roles = await Promise.all(roleNames.map((name) => roleRepo.getRealmRole(name)));
    return this.getRepo(realm, this.client).removeRealmRoles(userId, roles);
  }

  async assignClientRoles(realm: string, userId: string, clientId: string, roleNames: string[]): Promise<void> {
    const roleRepo = this.getRoleRepo(realm, this.client);
    const roles = await Promise.all(roleNames.map((name) => roleRepo.getClientRole(clientId, name)));
    return this.getRepo(realm, this.client).assignClientRoles(userId, clientId, roles);
  }

  async removeClientRoles(realm: string, userId: string, clientId: string, roleNames: string[]): Promise<void> {
    const roleRepo = this.getRoleRepo(realm, this.client);
    const roles = await Promise.all(roleNames.map((name) => roleRepo.getClientRole(clientId, name)));
    return this.getRepo(realm, this.client).removeClientRoles(userId, clientId, roles);
  }

  async getGroups(realm: string, userId: string) {
    return this.getRepo(realm, this.client).getGroups(userId);
  }

  async joinGroup(realm: string, userId: string, groupId: string): Promise<void> {
    return this.getRepo(realm, this.client).joinGroup(userId, groupId);
  }

  async leaveGroup(realm: string, userId: string, groupId: string): Promise<void> {
    return this.getRepo(realm, this.client).leaveGroup(userId, groupId);
  }

  async getSessions(realm: string, userId: string): Promise<UserSessionRepresentationDTO[]> {
    return this.getRepo(realm, this.client).getSessions(userId);
  }

  async logout(realm: string, userId: string): Promise<void> {
    return this.getRepo(realm, this.client).logout(userId);
  }

  async impersonate(realm: string, userId: string): Promise<ImpersonationResponseDTO> {
    return this.getRepo(realm, this.client).impersonate(userId);
  }

  async getConsents(realm: string, userId: string) {
    return this.getRepo(realm, this.client).getConsents(userId);
  }

  async revokeConsent(realm: string, userId: string, clientId: string): Promise<void> {
    return this.getRepo(realm, this.client).revokeConsent(userId, clientId);
  }
}
