import { KeycloakHttpClient } from '../http/KeycloakHttpClient.js';
import { RealmRepository, RealmRepresentationDTO } from '../repositories/RealmRepository.js';
import { RoleRepository } from '../repositories/RoleRepository.js';
import { RoleRepresentationDTO } from '../dto/user/index.js';
import { GroupRepository, GroupRepresentationDTO } from '../repositories/GroupRepository.js';
import { ClientRepository } from '../repositories/ClientRepository.js';
import { ClientRepresentationDTO, ProtocolMapperDTO } from '../dto/client/index.js';
import { ClientScopeRepository, ClientScopeRepresentationDTO } from '../repositories/ClientScopeRepository.js';
import { SessionRepository } from '../repositories/SessionRepository.js';
import { IdentityProviderRepository, IdentityProviderDTO, IdentityProviderMapperDTO } from '../repositories/IdentityProviderRepository.js';
import { AuthFlowRepository, AuthFlowDTO, AuthExecutionDTO } from '../repositories/AuthFlowRepository.js';
import { LdapFederationRepository, LdapProviderDTO } from '../repositories/LdapFederationRepository.js';
import { AuthzRepository } from '../repositories/AuthzRepository.js';
import { OrganizationRepository, OrganizationDTO } from '../repositories/OrganizationRepository.js';
import { AttackDetectionRepository } from '../repositories/AttackDetectionRepository.js';
import { EventRepository } from '../repositories/EventRepository.js';

// ─── RealmService ───────────────────────────────────────────────────────────
export class RealmService {
  constructor(private readonly client: KeycloakHttpClient) {}
  private repo() { return new RealmRepository(this.client); }

  list() { return this.repo().list(); }
  get(realm: string) { return this.repo().get(realm); }
  create(dto: RealmRepresentationDTO) { return this.repo().create(dto); }
  update(realm: string, dto: Partial<RealmRepresentationDTO>) { return this.repo().update(realm, dto); }
  delete(realm: string) { return this.repo().delete(realm); }
  export(realm: string, exportClients = false, exportGroupsAndRoles = false) {
    return this.repo().export(realm, exportClients, exportGroupsAndRoles);
  }
  import(realm: string, payload: unknown) { return this.repo().import(realm, payload); }
  logoutAll(realm: string) { return this.repo().logoutAll(realm); }
  getEvents(realm: string, params?: Record<string, unknown>) { return this.repo().getEvents(realm, params); }
  getAdminEvents(realm: string, params?: Record<string, unknown>) { return this.repo().getAdminEvents(realm, params); }
  clearEvents(realm: string) { return this.repo().clearEvents(realm); }
  getEventsConfig(realm: string) { return this.repo().getEventsConfig(realm); }
  updateEventsConfig(realm: string, cfg: unknown) { return this.repo().updateEventsConfig(realm, cfg); }
  getKeys(realm: string) { return this.repo().getKeys(realm); }
}

// ─── RoleService ────────────────────────────────────────────────────────────
export class RoleService {
  constructor(private readonly client: KeycloakHttpClient) {}
  private repo(realm: string) { return new RoleRepository(this.client, realm); }

  listRealm(realm: string) { return this.repo(realm).listRealmRoles(); }
  createRealm(realm: string, dto: RoleRepresentationDTO) { return this.repo(realm).createRealmRole(dto); }
  getRealm(realm: string, roleName: string) { return this.repo(realm).getRealmRole(roleName); }
  updateRealm(realm: string, roleName: string, dto: Partial<RoleRepresentationDTO>) {
    return this.repo(realm).updateRealmRole(roleName, dto);
  }
  deleteRealm(realm: string, roleName: string) { return this.repo(realm).deleteRealmRole(roleName); }
  addComposites(realm: string, roleName: string, roles: RoleRepresentationDTO[]) {
    return this.repo(realm).addComposites(roleName, roles);
  }
  getUsersWithRole(realm: string, roleName: string, params?: Record<string, unknown>) {
    return this.repo(realm).getUsersWithRole(roleName, params);
  }
  listClient(realm: string, clientId: string) { return this.repo(realm).listClientRoles(clientId); }
  createClient(realm: string, clientId: string, dto: RoleRepresentationDTO) {
    return this.repo(realm).createClientRole(clientId, dto);
  }
  deleteClient(realm: string, clientId: string, roleName: string) {
    return this.repo(realm).deleteClientRole(clientId, roleName);
  }
  getMappingAll(realm: string, userId: string) {
    // delegated to UserService, here just for completeness
    return this.repo(realm).listRealmRoles();
  }
  addScopeMappings(realm: string, clientId: string, roles: RoleRepresentationDTO[]) {
    return this.repo(realm).addScopeMappings(clientId, roles);
  }
  removeScopeMappings(realm: string, clientId: string, roles: RoleRepresentationDTO[]) {
    return this.repo(realm).removeScopeMappings(clientId, roles);
  }
}

// ─── GroupService ────────────────────────────────────────────────────────────
export class GroupService {
  constructor(private readonly client: KeycloakHttpClient) {}
  private repo(realm: string) { return new GroupRepository(this.client, realm); }
  private roleRepo(realm: string) { return new RoleRepository(this.client, realm); }

  list(realm: string, params?: Record<string, unknown>) { return this.repo(realm).list(params); }
  create(realm: string, dto: GroupRepresentationDTO) { return this.repo(realm).create(dto); }
  createChild(realm: string, parentGroupId: string, dto: GroupRepresentationDTO) {
    return this.repo(realm).createChild(parentGroupId, dto);
  }
  get(realm: string, groupId: string) { return this.repo(realm).get(groupId); }
  update(realm: string, groupId: string, dto: Partial<GroupRepresentationDTO>) {
    return this.repo(realm).update(groupId, dto);
  }
  delete(realm: string, groupId: string) { return this.repo(realm).delete(groupId); }
  getMembers(realm: string, groupId: string, params?: Record<string, unknown>) {
    return this.repo(realm).getMembers(groupId, params);
  }
  getRoles(realm: string, groupId: string) { return this.repo(realm).getRoleMappings(groupId); }

  async assignRoles(realm: string, groupId: string, roleNames: string[]): Promise<void> {
    const roles = await Promise.all(roleNames.map((n) => this.roleRepo(realm).getRealmRole(n)));
    return this.repo(realm).assignRoles(groupId, roles);
  }

  async removeRoles(realm: string, groupId: string, roleNames: string[]): Promise<void> {
    const roles = await Promise.all(roleNames.map((n) => this.roleRepo(realm).getRealmRole(n)));
    return this.repo(realm).removeRoles(groupId, roles);
  }

  setDefault(realm: string, groupId: string) { return this.repo(realm).setDefault(groupId); }
}

// ─── ClientService ───────────────────────────────────────────────────────────
export class ClientService {
  constructor(private readonly client: KeycloakHttpClient) {}
  private repo(realm: string) { return new ClientRepository(this.client, realm); }

  list(realm: string, params?: Record<string, unknown>) { return this.repo(realm).list(params); }
  create(realm: string, dto: ClientRepresentationDTO) { return this.repo(realm).create(dto); }
  get(realm: string, clientId: string) { return this.repo(realm).get(clientId); }
  update(realm: string, clientId: string, dto: Partial<ClientRepresentationDTO>) {
    return this.repo(realm).update(clientId, dto);
  }
  delete(realm: string, clientId: string) { return this.repo(realm).delete(clientId); }
  getSecret(realm: string, clientId: string) { return this.repo(realm).getSecret(clientId); }
  regenerateSecret(realm: string, clientId: string) { return this.repo(realm).regenerateSecret(clientId); }
  getServiceAccount(realm: string, clientId: string) { return this.repo(realm).getServiceAccountUser(clientId); }
  getSessions(realm: string, clientId: string) { return this.repo(realm).getSessions(clientId); }
  listMappers(realm: string, clientId: string) { return this.repo(realm).listMappers(clientId); }
  createMapper(realm: string, clientId: string, dto: ProtocolMapperDTO) {
    return this.repo(realm).createMapper(clientId, dto);
  }
  deleteMapper(realm: string, clientId: string, mapperId: string) {
    return this.repo(realm).deleteMapper(clientId, mapperId);
  }
  enableAuthz(realm: string, clientId: string) { return this.repo(realm).enableAuthorizationServices(clientId); }
  getInstallation(realm: string, clientId: string, provider: string) {
    return this.repo(realm).getInstallation(clientId, provider);
  }
}

// ─── ClientScopeService ──────────────────────────────────────────────────────
export class ClientScopeService {
  constructor(private readonly client: KeycloakHttpClient) {}
  private repo(realm: string) { return new ClientScopeRepository(this.client, realm); }

  list(realm: string) { return this.repo(realm).list(); }
  create(realm: string, dto: ClientScopeRepresentationDTO) { return this.repo(realm).create(dto); }
  get(realm: string, scopeId: string) { return this.repo(realm).get(scopeId); }
  update(realm: string, scopeId: string, dto: Partial<ClientScopeRepresentationDTO>) {
    return this.repo(realm).update(scopeId, dto);
  }
  delete(realm: string, scopeId: string) { return this.repo(realm).delete(scopeId); }
  addMapper(realm: string, scopeId: string, dto: ProtocolMapperDTO) {
    return this.repo(realm).addMapper(scopeId, dto);
  }
  assignToClient(realm: string, clientId: string, scopeId: string, optional?: boolean) {
    return this.repo(realm).assignToClient(clientId, scopeId, optional);
  }
  removeFromClient(realm: string, clientId: string, scopeId: string, optional?: boolean) {
    return this.repo(realm).removeFromClient(clientId, scopeId, optional);
  }
}

// ─── SessionService ──────────────────────────────────────────────────────────
export class SessionService {
  constructor(private readonly client: KeycloakHttpClient) {}
  private repo(realm: string) { return new SessionRepository(this.client, realm); }

  get(realm: string, sessionId: string) { return this.repo(realm).get(sessionId); }
  delete(realm: string, sessionId: string) { return this.repo(realm).delete(sessionId); }
  listByUser(realm: string, userId: string) { return this.repo(realm).listByUser(userId); }
  listByClient(realm: string, clientId: string, params?: Record<string, unknown>) {
    return this.repo(realm).listByClient(clientId, params);
  }
  countByClient(realm: string, clientId: string) { return this.repo(realm).countByClient(clientId); }
  listOfflineByClient(realm: string, clientId: string) { return this.repo(realm).listOfflineByClient(clientId); }
  logoutUser(realm: string, userId: string) { return this.repo(realm).logoutUser(userId); }
  logoutAll(realm: string) { return this.repo(realm).logoutAll(); }
  revokeTokensBefore(realm: string, notBefore: number) { return this.repo(realm).revokeTokensBefore(notBefore); }
}

// ─── IdentityProviderService ─────────────────────────────────────────────────
export class IdentityProviderService {
  constructor(private readonly client: KeycloakHttpClient) {}
  private repo(realm: string) { return new IdentityProviderRepository(this.client, realm); }

  list(realm: string) { return this.repo(realm).list(); }
  create(realm: string, dto: IdentityProviderDTO) { return this.repo(realm).create(dto); }
  get(realm: string, alias: string) { return this.repo(realm).get(alias); }
  update(realm: string, alias: string, dto: Partial<IdentityProviderDTO>) {
    return this.repo(realm).update(alias, dto);
  }
  delete(realm: string, alias: string) { return this.repo(realm).delete(alias); }
  listMappers(realm: string, alias: string) { return this.repo(realm).listMappers(alias); }
  createMapper(realm: string, alias: string, dto: IdentityProviderMapperDTO) {
    return this.repo(realm).createMapper(alias, dto);
  }
  deleteMapper(realm: string, alias: string, mapperId: string) {
    return this.repo(realm).deleteMapper(alias, mapperId);
  }
}

// ─── AuthFlowService ─────────────────────────────────────────────────────────
export class AuthFlowService {
  constructor(private readonly client: KeycloakHttpClient) {}
  private repo(realm: string) { return new AuthFlowRepository(this.client, realm); }

  list(realm: string) { return this.repo(realm).list(); }
  create(realm: string, dto: Omit<AuthFlowDTO, 'id'>) { return this.repo(realm).create(dto); }
  copy(realm: string, flowAlias: string, newName: string) { return this.repo(realm).copy(flowAlias, newName); }
  delete(realm: string, flowId: string) { return this.repo(realm).delete(flowId); }
  getExecutions(realm: string, flowAlias: string) { return this.repo(realm).getExecutions(flowAlias); }
  updateExecution(realm: string, flowAlias: string, dto: AuthExecutionDTO) {
    return this.repo(realm).updateExecution(flowAlias, dto);
  }
  listRequiredActions(realm: string) { return this.repo(realm).listRequiredActions(); }
  updateRequiredAction(realm: string, alias: string, dto: Record<string, unknown>) {
    return this.repo(realm).updateRequiredAction(alias, dto);
  }
}

// ─── LdapFederationService ───────────────────────────────────────────────────
export class LdapFederationService {
  constructor(private readonly client: KeycloakHttpClient) {}
  private repo(realm: string) { return new LdapFederationRepository(this.client, realm); }

  list(realm: string) { return this.repo(realm).list(); }
  create(realm: string, dto: LdapProviderDTO) { return this.repo(realm).create(dto); }
  get(realm: string, componentId: string) { return this.repo(realm).get(componentId); }
  update(realm: string, componentId: string, dto: Partial<LdapProviderDTO>) {
    return this.repo(realm).update(componentId, dto);
  }
  delete(realm: string, componentId: string) { return this.repo(realm).delete(componentId); }
  sync(realm: string, componentId: string, action: 'triggerFullSync' | 'triggerChangedUsersSync') {
    return this.repo(realm).sync(componentId, action);
  }
  listMappers(realm: string, parentId: string) { return this.repo(realm).listMappers(parentId); }
  createMapper(realm: string, dto: Record<string, unknown>) { return this.repo(realm).createMapper(dto); }
  syncMapper(realm: string, parentId: string, mapperId: string, direction: string) {
    return this.repo(realm).syncMapper(parentId, mapperId, direction);
  }
}

// ─── AuthzService ────────────────────────────────────────────────────────────
export class AuthzService {
  constructor(private readonly client: KeycloakHttpClient) {}
  private repo(realm: string) { return new AuthzRepository(this.client, realm); }

  listResources(realm: string, clientId: string, params?: Record<string, unknown>) {
    return this.repo(realm).listResources(clientId, params);
  }
  createResource(realm: string, clientId: string, dto: unknown) {
    return this.repo(realm).createResource(clientId, dto);
  }
  updateResource(realm: string, clientId: string, resourceId: string, dto: unknown) {
    return this.repo(realm).updateResource(clientId, resourceId, dto);
  }
  deleteResource(realm: string, clientId: string, resourceId: string) {
    return this.repo(realm).deleteResource(clientId, resourceId);
  }
  listPolicies(realm: string, clientId: string, params?: Record<string, unknown>) {
    return this.repo(realm).listPolicies(clientId, params);
  }
  createPolicy(realm: string, clientId: string, type: string, dto: unknown) {
    return this.repo(realm).createPolicy(clientId, type, dto);
  }
  deletePolicy(realm: string, clientId: string, policyId: string) {
    return this.repo(realm).deletePolicy(clientId, policyId);
  }
  listPermissions(realm: string, clientId: string) { return this.repo(realm).listPermissions(clientId); }
  createPermission(realm: string, clientId: string, type: 'resource' | 'scope', dto: unknown) {
    return this.repo(realm).createPermission(clientId, type, dto);
  }
  deletePermission(realm: string, clientId: string, permissionId: string) {
    return this.repo(realm).deletePermission(clientId, permissionId);
  }
  evaluate(realm: string, clientId: string, dto: unknown) { return this.repo(realm).evaluate(clientId, dto); }
  exportSettings(realm: string, clientId: string) { return this.repo(realm).exportSettings(clientId); }
  importSettings(realm: string, clientId: string, dto: unknown) {
    return this.repo(realm).importSettings(clientId, dto);
  }
}

// ─── OrganizationService ─────────────────────────────────────────────────────
export class OrganizationService {
  constructor(private readonly client: KeycloakHttpClient) {}
  private repo(realm: string) { return new OrganizationRepository(this.client, realm); }

  list(realm: string, params?: Record<string, unknown>) { return this.repo(realm).list(params); }
  create(realm: string, dto: OrganizationDTO) { return this.repo(realm).create(dto); }
  get(realm: string, orgId: string) { return this.repo(realm).get(orgId); }
  update(realm: string, orgId: string, dto: Partial<OrganizationDTO>) {
    return this.repo(realm).update(orgId, dto);
  }
  delete(realm: string, orgId: string) { return this.repo(realm).delete(orgId); }
  listMembers(realm: string, orgId: string, params?: Record<string, unknown>) {
    return this.repo(realm).listMembers(orgId, params);
  }
  addMember(realm: string, orgId: string, userId: string) { return this.repo(realm).addMember(orgId, userId); }
  removeMember(realm: string, orgId: string, userId: string) {
    return this.repo(realm).removeMember(orgId, userId);
  }
  linkIdp(realm: string, orgId: string, idpAlias: string) { return this.repo(realm).linkIdp(orgId, idpAlias); }
  unlinkIdp(realm: string, orgId: string, idpAlias: string) {
    return this.repo(realm).unlinkIdp(orgId, idpAlias);
  }
  inviteMember(realm: string, orgId: string, dto: { email: string; firstName?: string; lastName?: string }) {
    return this.repo(realm).inviteMember(orgId, dto);
  }
}

// ─── AttackDetectionService ──────────────────────────────────────────────────
export class AttackDetectionService {
  constructor(private readonly client: KeycloakHttpClient) {}
  private repo(realm: string) { return new AttackDetectionRepository(this.client, realm); }

  getUserStatus(realm: string, userId: string) { return this.repo(realm).getUserStatus(userId); }
  clearUser(realm: string, userId: string) { return this.repo(realm).clearUser(userId); }
  clearAll(realm: string) { return this.repo(realm).clearAll(); }
}

// ─── EventService ────────────────────────────────────────────────────────────
export class EventService {
  constructor(private readonly client: KeycloakHttpClient) {}
  private repo(realm: string) { return new EventRepository(this.client, realm); }

  listUserEvents(realm: string, params?: Record<string, unknown>) {
    return this.repo(realm).listUserEvents(params);
  }
  listAdminEvents(realm: string, params?: Record<string, unknown>) {
    return this.repo(realm).listAdminEvents(params);
  }
  clearUserEvents(realm: string) { return this.repo(realm).clearUserEvents(); }
  clearAdminEvents(realm: string) { return this.repo(realm).clearAdminEvents(); }
  getConfig(realm: string) { return this.repo(realm).getConfig(); }
  updateConfig(realm: string, cfg: unknown) { return this.repo(realm).updateConfig(cfg); }
}
