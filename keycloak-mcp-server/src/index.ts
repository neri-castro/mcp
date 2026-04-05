import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { config } from './config/config.js';
import { logger } from './utils/logger.js';
import { KeycloakAPIError } from './utils/errors.js';
import { buildMCPError, buildMCPSuccess } from './utils/pagination.js';
import { tokenManager } from './auth/TokenManager.js';
import { httpClient } from './http/KeycloakHttpClient.js';
import { ALL_TOOLS } from './tools/index.js';
import { closeDbPool } from './db/DbConnection.js';
import { dbInspector } from './db/DbInspectorService.js';

import { UserService } from './services/UserService.js';
import {
  RealmService, RoleService, GroupService, ClientService, ClientScopeService,
  SessionService, IdentityProviderService, AuthFlowService, LdapFederationService,
  AuthzService, OrganizationService, AttackDetectionService, EventService,
} from './services/index.js';

// ── Service singletons ──────────────────────────────────────────────────────

const userSvc = new UserService(httpClient);
const realmSvc = new RealmService(httpClient);
const roleSvc = new RoleService(httpClient);
const groupSvc = new GroupService(httpClient);
const clientSvc = new ClientService(httpClient);
const scopeSvc = new ClientScopeService(httpClient);
const sessionSvc = new SessionService(httpClient);
const idpSvc = new IdentityProviderService(httpClient);
const flowSvc = new AuthFlowService(httpClient);
const ldapSvc = new LdapFederationService(httpClient);
const authzSvc = new AuthzService(httpClient);
const orgSvc = new OrganizationService(httpClient);
const attackSvc = new AttackDetectionService(httpClient);
const eventSvc = new EventService(httpClient);

// ── MCP Server ───────────────────────────────────────────────────────────────

const server = new Server(
  { name: config.mcpServerName, version: config.mcpServerVersion },
  { capabilities: { tools: {} } }
);

// ── List Tools ───────────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: ALL_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: {
      type: 'object' as const,
      properties: Object.fromEntries(
        Object.entries((tool.inputSchema as z.ZodObject<z.ZodRawShape>).shape).map(([key, schema]) => [
          key,
          {
            type: 'string',
            description: (schema as z.ZodTypeAny).description,
          },
        ])
      ),
    },
  })),
}));

// ── Tool Handler ─────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    const result = await handleTool(name, args);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    const errorResult = formatError(name, error);
    return {
      content: [{ type: 'text', text: JSON.stringify(errorResult, null, 2) }],
      isError: true,
    };
  }
});

function formatError(toolName: string, error: unknown) {
  if (error instanceof KeycloakAPIError) {
    const codeMap: Record<number, string> = {
      400: 'BAD_REQUEST', 401: 'UNAUTHORIZED', 403: 'FORBIDDEN',
      404: 'NOT_FOUND', 409: 'CONFLICT', 429: 'RATE_LIMITED', 500: 'SERVER_ERROR',
    };
    return buildMCPError(
      codeMap[error.statusCode] ?? 'UNKNOWN',
      error.message,
      `Tool: ${toolName}`,
      error.kcError
    );
  }
  return buildMCPError('UNKNOWN', (error as Error).message ?? String(error), `Tool: ${toolName}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleTool(name: string, args: Record<string, any>): Promise<unknown> {
  switch (name) {

    // ── Auth ────────────────────────────────────────────────────────────────
    case 'kc_auth_token_obtain':
      return buildMCPSuccess(await tokenManager.obtain(args.realm));
    case 'kc_auth_token_refresh':
      return buildMCPSuccess(await tokenManager.getValidToken(args.realm));
    case 'kc_auth_token_introspect': {
      const token = await tokenManager.getValidToken(args.realm);
      const params = new URLSearchParams({
        token: args.token,
        client_id: config.kcClientId,
        ...(config.kcClientSecret ? { client_secret: config.kcClientSecret } : {}),
      });
      const response = await fetch(
        `${config.kcHost}/realms/${args.realm}/protocol/openid-connect/token/introspect`,
        { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Bearer ${token}` }, body: params }
      );
      return buildMCPSuccess(await response.json());
    }
    case 'kc_auth_userinfo': {
      const response = await fetch(
        `${config.kcHost}/realms/${args.realm}/protocol/openid-connect/userinfo`,
        { headers: { Authorization: `Bearer ${args.token}` } }
      );
      return buildMCPSuccess(await response.json());
    }

    // ── Realms ──────────────────────────────────────────────────────────────
    case 'kc_realm_list': return buildMCPSuccess(await realmSvc.list());
    case 'kc_realm_create': {
      const dto = {
        realm: args.realm, displayName: args.displayName, enabled: args.enabled ?? true,
        registrationAllowed: args.registrationAllowed, loginWithEmailAllowed: args.loginWithEmailAllowed,
        verifyEmail: args.verifyEmail, resetPasswordAllowed: args.resetPasswordAllowed,
        bruteForceProtected: args.bruteForceProtected, accessTokenLifespan: args.accessTokenLifespan,
        passwordPolicy: args.passwordPolicy, defaultLocale: args.defaultLocale,
        ...(args.smtpHost ? { smtpServer: { host: args.smtpHost, port: args.smtpPort ?? '587', from: args.smtpFrom ?? '' } } : {}),
      };
      await realmSvc.create(dto);
      return buildMCPSuccess({ created: args.realm });
    }
    case 'kc_realm_get': return buildMCPSuccess(await realmSvc.get(args.realm));
    case 'kc_realm_update': {
      await realmSvc.update(args.realm, args.fields);
      return buildMCPSuccess({ updated: args.realm });
    }
    case 'kc_realm_delete': {
      await realmSvc.delete(args.realm);
      return buildMCPSuccess({ deleted: args.realm });
    }
    case 'kc_realm_export': return buildMCPSuccess(await realmSvc.export(args.realm, args.exportClients, args.exportGroupsAndRoles));
    case 'kc_realm_import': {
      await realmSvc.import(args.realm, args.payload);
      return buildMCPSuccess({ imported: true });
    }
    case 'kc_realm_logout_all': {
      await realmSvc.logoutAll(args.realm);
      return buildMCPSuccess({ loggedOut: true });
    }
    case 'kc_realm_events_get': return buildMCPSuccess(await realmSvc.getEvents(args.realm, args));
    case 'kc_realm_admin_events_get': return buildMCPSuccess(await realmSvc.getAdminEvents(args.realm, args));
    case 'kc_realm_events_clear': {
      await realmSvc.clearEvents(args.realm);
      return buildMCPSuccess({ cleared: true });
    }
    case 'kc_realm_events_config': {
      if (args.eventsEnabled !== undefined || args.adminEventsEnabled !== undefined) {
        await realmSvc.updateEventsConfig(args.realm, {
          eventsEnabled: args.eventsEnabled, eventsExpiration: args.eventsExpiration,
          enabledEventTypes: args.enabledEventTypes, adminEventsEnabled: args.adminEventsEnabled,
          adminEventsDetailsEnabled: args.adminEventsDetailsEnabled,
        });
        return buildMCPSuccess({ updated: true });
      }
      return buildMCPSuccess(await realmSvc.getEventsConfig(args.realm));
    }
    case 'kc_realm_keys_get': return buildMCPSuccess(await realmSvc.getKeys(args.realm));

    // ── Users ───────────────────────────────────────────────────────────────
    case 'kc_user_list': return buildMCPSuccess(await userSvc.listInRealm(args.realm, args));
    case 'kc_user_count': return buildMCPSuccess(await userSvc.count(args.realm, args));
    case 'kc_user_create': {
      const dto = {
        username: args.username, email: args.email, firstName: args.firstName,
        lastName: args.lastName, enabled: args.enabled ?? true, emailVerified: args.emailVerified ?? false,
        attributes: args.attributes, requiredActions: args.requiredActions, groups: args.groups,
        ...(args.temporaryPassword ? {
          credentials: [{ type: 'password' as const, value: args.temporaryPassword, temporary: true }],
        } : {}),
      };
      await userSvc.create(args.realm, dto);
      return buildMCPSuccess({ created: args.username });
    }
    case 'kc_user_get': return buildMCPSuccess(await userSvc.get(args.realm, args.userId));
    case 'kc_user_update': {
      await userSvc.update(args.realm, args.userId, args.fields);
      return buildMCPSuccess({ updated: args.userId });
    }
    case 'kc_user_delete': {
      await userSvc.remove(args.realm, args.userId);
      return buildMCPSuccess({ deleted: args.userId });
    }
    case 'kc_user_set_password': {
      await userSvc.setPassword(args.realm, args.userId, args.password, args.temporary ?? false);
      return buildMCPSuccess({ passwordSet: true });
    }
    case 'kc_user_reset_password_email': {
      await userSvc.sendResetPasswordEmail(args.realm, args.userId, args.clientId);
      return buildMCPSuccess({ sent: true });
    }
    case 'kc_user_send_verify_email': {
      await userSvc.sendVerifyEmail(args.realm, args.userId);
      return buildMCPSuccess({ sent: true });
    }
    case 'kc_user_execute_actions': {
      await userSvc.executeActionsEmail(args.realm, args.userId, args.actions, args.clientId);
      return buildMCPSuccess({ executed: args.actions });
    }
    case 'kc_user_get_roles': return buildMCPSuccess(await userSvc.getRoles(args.realm, args.userId));
    case 'kc_user_assign_realm_roles': {
      await userSvc.assignRealmRoles(args.realm, args.userId, args.roleNames);
      return buildMCPSuccess({ assigned: args.roleNames });
    }
    case 'kc_user_remove_realm_roles': {
      await userSvc.removeRealmRoles(args.realm, args.userId, args.roleNames);
      return buildMCPSuccess({ removed: args.roleNames });
    }
    case 'kc_user_assign_client_roles': {
      await userSvc.assignClientRoles(args.realm, args.userId, args.clientId, args.roleNames);
      return buildMCPSuccess({ assigned: args.roleNames });
    }
    case 'kc_user_remove_client_roles': {
      await userSvc.removeClientRoles(args.realm, args.userId, args.clientId, args.roleNames);
      return buildMCPSuccess({ removed: args.roleNames });
    }
    case 'kc_user_get_groups': return buildMCPSuccess(await userSvc.getGroups(args.realm, args.userId));
    case 'kc_user_join_group': {
      await userSvc.joinGroup(args.realm, args.userId, args.groupId);
      return buildMCPSuccess({ joined: args.groupId });
    }
    case 'kc_user_leave_group': {
      await userSvc.leaveGroup(args.realm, args.userId, args.groupId);
      return buildMCPSuccess({ left: args.groupId });
    }
    case 'kc_user_get_sessions': return buildMCPSuccess(await userSvc.getSessions(args.realm, args.userId));
    case 'kc_user_logout': {
      await userSvc.logout(args.realm, args.userId);
      return buildMCPSuccess({ loggedOut: true });
    }
    case 'kc_user_impersonate': return buildMCPSuccess(await userSvc.impersonate(args.realm, args.userId));
    case 'kc_user_get_credentials': return buildMCPSuccess(await userSvc.getCredentials(args.realm, args.userId));
    case 'kc_user_delete_credential': {
      await userSvc.deleteCredential(args.realm, args.userId, args.credentialId);
      return buildMCPSuccess({ deleted: args.credentialId });
    }
    case 'kc_user_get_consents': return buildMCPSuccess(await userSvc.getConsents(args.realm, args.userId));
    case 'kc_user_revoke_consent': {
      await userSvc.revokeConsent(args.realm, args.userId, args.clientId);
      return buildMCPSuccess({ revoked: args.clientId });
    }

    // ── Roles ───────────────────────────────────────────────────────────────
    case 'kc_role_list_realm': return buildMCPSuccess(await roleSvc.listRealm(args.realm));
    case 'kc_role_create_realm': {
      await roleSvc.createRealm(args.realm, { name: args.name, description: args.description, composite: args.composite ?? false });
      return buildMCPSuccess({ created: args.name });
    }
    case 'kc_role_get_realm': return buildMCPSuccess(await roleSvc.getRealm(args.realm, args.roleName));
    case 'kc_role_update_realm': {
      await roleSvc.updateRealm(args.realm, args.roleName, args.fields);
      return buildMCPSuccess({ updated: args.roleName });
    }
    case 'kc_role_delete_realm': {
      await roleSvc.deleteRealm(args.realm, args.roleName);
      return buildMCPSuccess({ deleted: args.roleName });
    }
    case 'kc_role_add_composites': {
      await roleSvc.addComposites(args.realm, args.roleName, args.roles);
      return buildMCPSuccess({ composites: args.roles.length });
    }
    case 'kc_role_get_users': return buildMCPSuccess(await roleSvc.getUsersWithRole(args.realm, args.roleName, { first: args.first, max: args.max }));
    case 'kc_role_list_client': return buildMCPSuccess(await roleSvc.listClient(args.realm, args.clientId));
    case 'kc_role_create_client': {
      await roleSvc.createClient(args.realm, args.clientId, { name: args.name, description: args.description });
      return buildMCPSuccess({ created: args.name });
    }
    case 'kc_role_delete_client': {
      await roleSvc.deleteClient(args.realm, args.clientId, args.roleName);
      return buildMCPSuccess({ deleted: args.roleName });
    }
    case 'kc_role_mapping_get': return buildMCPSuccess(await userSvc.getRoles(args.realm, args.userId));
    case 'kc_role_mapping_assign_realm': {
      await userSvc.assignRealmRoles(args.realm, args.userId, args.roleNames);
      return buildMCPSuccess({ assigned: args.roleNames });
    }
    case 'kc_role_mapping_remove_realm': {
      await userSvc.removeRealmRoles(args.realm, args.userId, args.roleNames);
      return buildMCPSuccess({ removed: args.roleNames });
    }
    case 'kc_role_mapping_assign_client': {
      await userSvc.assignClientRoles(args.realm, args.userId, args.clientId, args.roleNames);
      return buildMCPSuccess({ assigned: args.roleNames });
    }
    case 'kc_role_mapping_remove_client': {
      await userSvc.removeClientRoles(args.realm, args.userId, args.clientId, args.roleNames);
      return buildMCPSuccess({ removed: args.roleNames });
    }
    case 'kc_scope_mapping_add': {
      await roleSvc.addScopeMappings(args.realm, args.clientId, args.roles);
      return buildMCPSuccess({ added: args.roles.length });
    }
    case 'kc_scope_mapping_remove': {
      await roleSvc.removeScopeMappings(args.realm, args.clientId, args.roles);
      return buildMCPSuccess({ removed: args.roles.length });
    }

    // ── Groups ──────────────────────────────────────────────────────────────
    case 'kc_group_list': return buildMCPSuccess(await groupSvc.list(args.realm, { search: args.search, first: args.first, max: args.max }));
    case 'kc_group_create': {
      await groupSvc.create(args.realm, { name: args.name, attributes: args.attributes, realmRoles: args.realmRoles });
      return buildMCPSuccess({ created: args.name });
    }
    case 'kc_group_create_child': {
      await groupSvc.createChild(args.realm, args.parentGroupId, { name: args.name, attributes: args.attributes });
      return buildMCPSuccess({ created: args.name });
    }
    case 'kc_group_get': return buildMCPSuccess(await groupSvc.get(args.realm, args.groupId));
    case 'kc_group_update': {
      await groupSvc.update(args.realm, args.groupId, { name: args.name, attributes: args.attributes });
      return buildMCPSuccess({ updated: args.groupId });
    }
    case 'kc_group_delete': {
      await groupSvc.delete(args.realm, args.groupId);
      return buildMCPSuccess({ deleted: args.groupId });
    }
    case 'kc_group_members': return buildMCPSuccess(await groupSvc.getMembers(args.realm, args.groupId, { first: args.first, max: args.max }));
    case 'kc_group_get_roles': return buildMCPSuccess(await groupSvc.getRoles(args.realm, args.groupId));
    case 'kc_group_assign_roles': {
      await groupSvc.assignRoles(args.realm, args.groupId, args.roleNames);
      return buildMCPSuccess({ assigned: args.roleNames });
    }
    case 'kc_group_remove_roles': {
      await groupSvc.removeRoles(args.realm, args.groupId, args.roleNames);
      return buildMCPSuccess({ removed: args.roleNames });
    }
    case 'kc_group_set_default': {
      await groupSvc.setDefault(args.realm, args.groupId);
      return buildMCPSuccess({ defaultSet: args.groupId });
    }

    // ── Clients ─────────────────────────────────────────────────────────────
    case 'kc_client_list': return buildMCPSuccess(await clientSvc.list(args.realm, { clientId: args.clientId, search: args.search }));
    case 'kc_client_create': {
      await clientSvc.create(args.realm, {
        clientId: args.clientId, name: args.name, protocol: args.protocol ?? 'openid-connect',
        publicClient: args.publicClient ?? false, bearerOnly: args.bearerOnly ?? false,
        standardFlowEnabled: args.standardFlowEnabled ?? true, serviceAccountsEnabled: args.serviceAccountsEnabled ?? false,
        authorizationServicesEnabled: args.authorizationServicesEnabled ?? false,
        redirectUris: args.redirectUris, webOrigins: args.webOrigins, rootUrl: args.rootUrl,
      });
      return buildMCPSuccess({ created: args.clientId });
    }
    case 'kc_client_get': return buildMCPSuccess(await clientSvc.get(args.realm, args.clientId));
    case 'kc_client_update': {
      await clientSvc.update(args.realm, args.clientId, args.fields);
      return buildMCPSuccess({ updated: args.clientId });
    }
    case 'kc_client_delete': {
      await clientSvc.delete(args.realm, args.clientId);
      return buildMCPSuccess({ deleted: args.clientId });
    }
    case 'kc_client_get_secret': return buildMCPSuccess(await clientSvc.getSecret(args.realm, args.clientId));
    case 'kc_client_regenerate_secret': return buildMCPSuccess(await clientSvc.regenerateSecret(args.realm, args.clientId));
    case 'kc_client_get_service_account': return buildMCPSuccess(await clientSvc.getServiceAccount(args.realm, args.clientId));
    case 'kc_client_get_sessions': return buildMCPSuccess(await clientSvc.getSessions(args.realm, args.clientId));
    case 'kc_client_mapper_list': return buildMCPSuccess(await clientSvc.listMappers(args.realm, args.clientId));
    case 'kc_client_mapper_create': {
      await clientSvc.createMapper(args.realm, args.clientId, { name: args.name, protocol: args.protocol ?? 'openid-connect', protocolMapper: args.protocolMapper, config: args.config });
      return buildMCPSuccess({ created: args.name });
    }
    case 'kc_client_mapper_delete': {
      await clientSvc.deleteMapper(args.realm, args.clientId, args.mapperId);
      return buildMCPSuccess({ deleted: args.mapperId });
    }
    case 'kc_client_authz_enable': {
      await clientSvc.enableAuthz(args.realm, args.clientId);
      return buildMCPSuccess({ authzEnabled: true });
    }
    case 'kc_client_installation_get': return buildMCPSuccess(await clientSvc.getInstallation(args.realm, args.clientId, args.provider));

    // ── Client Scopes ────────────────────────────────────────────────────────
    case 'kc_scope_list': return buildMCPSuccess(await scopeSvc.list(args.realm));
    case 'kc_scope_create': {
      await scopeSvc.create(args.realm, { name: args.name, protocol: args.protocol, description: args.description });
      return buildMCPSuccess({ created: args.name });
    }
    case 'kc_scope_get': return buildMCPSuccess(await scopeSvc.get(args.realm, args.scopeId));
    case 'kc_scope_update': {
      await scopeSvc.update(args.realm, args.scopeId, args.fields);
      return buildMCPSuccess({ updated: args.scopeId });
    }
    case 'kc_scope_delete': {
      await scopeSvc.delete(args.realm, args.scopeId);
      return buildMCPSuccess({ deleted: args.scopeId });
    }
    case 'kc_scope_mapper_add': {
      await scopeSvc.addMapper(args.realm, args.scopeId, { name: args.name, protocol: 'openid-connect', protocolMapper: args.protocolMapper, config: args.config });
      return buildMCPSuccess({ added: true });
    }
    case 'kc_scope_assign_to_client': {
      await scopeSvc.assignToClient(args.realm, args.clientId, args.scopeId, args.optional);
      return buildMCPSuccess({ assigned: true });
    }
    case 'kc_scope_remove_from_client': {
      await scopeSvc.removeFromClient(args.realm, args.clientId, args.scopeId, args.optional);
      return buildMCPSuccess({ removed: true });
    }

    // ── Authz ────────────────────────────────────────────────────────────────
    case 'kc_authz_resource_list': return buildMCPSuccess(await authzSvc.listResources(args.realm, args.clientId, { name: args.name, type: args.type }));
    case 'kc_authz_resource_create': return buildMCPSuccess(await authzSvc.createResource(args.realm, args.clientId, { name: args.name, type: args.type, uris: args.uris, scopes: args.scopes?.map((s: string) => ({ name: s })), ownerManagedAccess: args.ownerManagedAccess }));
    case 'kc_authz_resource_update': {
      await authzSvc.updateResource(args.realm, args.clientId, args.resourceId, args.fields);
      return buildMCPSuccess({ updated: args.resourceId });
    }
    case 'kc_authz_resource_delete': {
      await authzSvc.deleteResource(args.realm, args.clientId, args.resourceId);
      return buildMCPSuccess({ deleted: args.resourceId });
    }
    case 'kc_authz_policy_list': return buildMCPSuccess(await authzSvc.listPolicies(args.realm, args.clientId, { type: args.type }));
    case 'kc_authz_policy_create_role': return buildMCPSuccess(await authzSvc.createPolicy(args.realm, args.clientId, 'role', args));
    case 'kc_authz_policy_create_group': return buildMCPSuccess(await authzSvc.createPolicy(args.realm, args.clientId, 'group', args));
    case 'kc_authz_policy_create_js': return buildMCPSuccess(await authzSvc.createPolicy(args.realm, args.clientId, 'js', args));
    case 'kc_authz_policy_create_time': return buildMCPSuccess(await authzSvc.createPolicy(args.realm, args.clientId, 'time', args));
    case 'kc_authz_policy_create_aggregated': return buildMCPSuccess(await authzSvc.createPolicy(args.realm, args.clientId, 'aggregate', args));
    case 'kc_authz_policy_delete': {
      await authzSvc.deletePolicy(args.realm, args.clientId, args.policyId);
      return buildMCPSuccess({ deleted: args.policyId });
    }
    case 'kc_authz_permission_list': return buildMCPSuccess(await authzSvc.listPermissions(args.realm, args.clientId));
    case 'kc_authz_permission_create_resource': return buildMCPSuccess(await authzSvc.createPermission(args.realm, args.clientId, 'resource', args));
    case 'kc_authz_permission_create_scope': return buildMCPSuccess(await authzSvc.createPermission(args.realm, args.clientId, 'scope', args));
    case 'kc_authz_permission_delete': {
      await authzSvc.deletePermission(args.realm, args.clientId, args.permissionId);
      return buildMCPSuccess({ deleted: args.permissionId });
    }
    case 'kc_authz_evaluate': return buildMCPSuccess(await authzSvc.evaluate(args.realm, args.clientId, args));
    case 'kc_authz_export': return buildMCPSuccess(await authzSvc.exportSettings(args.realm, args.clientId));
    case 'kc_authz_import': {
      await authzSvc.importSettings(args.realm, args.clientId, args.payload);
      return buildMCPSuccess({ imported: true });
    }

    // ── Sessions ─────────────────────────────────────────────────────────────
    case 'kc_session_get': return buildMCPSuccess(await sessionSvc.get(args.realm, args.sessionId));
    case 'kc_session_delete': {
      await sessionSvc.delete(args.realm, args.sessionId);
      return buildMCPSuccess({ deleted: args.sessionId });
    }
    case 'kc_session_list_by_user': return buildMCPSuccess(await sessionSvc.listByUser(args.realm, args.userId));
    case 'kc_session_list_by_client': return buildMCPSuccess(await sessionSvc.listByClient(args.realm, args.clientId, { first: args.first, max: args.max }));
    case 'kc_session_count_client': return buildMCPSuccess(await sessionSvc.countByClient(args.realm, args.clientId));
    case 'kc_session_offline_list': return buildMCPSuccess(await sessionSvc.listOfflineByClient(args.realm, args.clientId));
    case 'kc_session_logout_user': {
      await sessionSvc.logoutUser(args.realm, args.userId);
      return buildMCPSuccess({ loggedOut: true });
    }
    case 'kc_session_logout_all': {
      await sessionSvc.logoutAll(args.realm);
      return buildMCPSuccess({ loggedOut: true });
    }
    case 'kc_session_revoke_policies': {
      await sessionSvc.revokeTokensBefore(args.realm, args.notBefore);
      return buildMCPSuccess({ revoked: true });
    }

    // ── IdP ──────────────────────────────────────────────────────────────────
    case 'kc_idp_list': return buildMCPSuccess(await idpSvc.list(args.realm));
    case 'kc_idp_create': {
      await idpSvc.create(args.realm, { alias: args.alias, displayName: args.displayName, providerId: args.providerId, enabled: args.enabled, trustEmail: args.trustEmail, config: args.config });
      return buildMCPSuccess({ created: args.alias });
    }
    case 'kc_idp_get': return buildMCPSuccess(await idpSvc.get(args.realm, args.alias));
    case 'kc_idp_update': {
      await idpSvc.update(args.realm, args.alias, args.fields);
      return buildMCPSuccess({ updated: args.alias });
    }
    case 'kc_idp_delete': {
      await idpSvc.delete(args.realm, args.alias);
      return buildMCPSuccess({ deleted: args.alias });
    }
    case 'kc_idp_mapper_list': return buildMCPSuccess(await idpSvc.listMappers(args.realm, args.alias));
    case 'kc_idp_mapper_create': {
      await idpSvc.createMapper(args.realm, args.alias, { name: args.name, identityProviderAlias: args.alias, identityProviderMapper: args.identityProviderMapper, config: args.config });
      return buildMCPSuccess({ created: args.name });
    }
    case 'kc_idp_mapper_delete': {
      await idpSvc.deleteMapper(args.realm, args.alias, args.mapperId);
      return buildMCPSuccess({ deleted: args.mapperId });
    }

    // ── Auth Flows ────────────────────────────────────────────────────────────
    case 'kc_flow_list': return buildMCPSuccess(await flowSvc.list(args.realm));
    case 'kc_flow_create': {
      await flowSvc.create(args.realm, { alias: args.alias, description: args.description, providerId: args.providerId ?? 'basic-flow', topLevel: true, builtIn: false });
      return buildMCPSuccess({ created: args.alias });
    }
    case 'kc_flow_copy': {
      await flowSvc.copy(args.realm, args.flowAlias, args.newName);
      return buildMCPSuccess({ copied: args.newName });
    }
    case 'kc_flow_delete': {
      await flowSvc.delete(args.realm, args.flowId);
      return buildMCPSuccess({ deleted: args.flowId });
    }
    case 'kc_flow_executions_get': return buildMCPSuccess(await flowSvc.getExecutions(args.realm, args.flowAlias));
    case 'kc_flow_execution_update': {
      await flowSvc.updateExecution(args.realm, args.flowAlias, args.execution);
      return buildMCPSuccess({ updated: true });
    }
    case 'kc_flow_required_actions_list': return buildMCPSuccess(await flowSvc.listRequiredActions(args.realm));
    case 'kc_flow_required_action_update': {
      await flowSvc.updateRequiredAction(args.realm, args.alias, { enabled: args.enabled, defaultAction: args.defaultAction });
      return buildMCPSuccess({ updated: args.alias });
    }

    // ── LDAP ─────────────────────────────────────────────────────────────────
    case 'kc_ldap_list': return buildMCPSuccess(await ldapSvc.list(args.realm));
    case 'kc_ldap_create': {
      const dto = {
        name: args.name, providerId: 'ldap', providerType: 'org.keycloak.storage.UserStorageProvider',
        config: {
          connectionUrl: [args.connectionUrl], usersDn: [args.usersDn], bindDn: [args.bindDn],
          bindCredential: [args.bindCredential], vendor: [args.vendor ?? 'ad'],
          usernameLDAPAttribute: [args.usernameLDAPAttribute ?? 'sAMAccountName'],
          editMode: [args.editMode ?? 'READ_ONLY'], importEnabled: [String(args.importEnabled ?? true)],
          fullSyncPeriod: [args.fullSyncPeriod ?? '86400'], changedSyncPeriod: [args.changedSyncPeriod ?? '900'],
          enabled: ['true'], pagination: ['true'], connectionPooling: ['true'],
        },
      };
      await ldapSvc.create(args.realm, dto);
      return buildMCPSuccess({ created: args.name });
    }
    case 'kc_ldap_get': return buildMCPSuccess(await ldapSvc.get(args.realm, args.componentId));
    case 'kc_ldap_update': {
      await ldapSvc.update(args.realm, args.componentId, args.fields);
      return buildMCPSuccess({ updated: args.componentId });
    }
    case 'kc_ldap_delete': {
      await ldapSvc.delete(args.realm, args.componentId);
      return buildMCPSuccess({ deleted: args.componentId });
    }
    case 'kc_ldap_sync': return buildMCPSuccess(await ldapSvc.sync(args.realm, args.componentId, args.action));
    case 'kc_ldap_mapper_list': return buildMCPSuccess(await ldapSvc.listMappers(args.realm, args.parentId));
    case 'kc_ldap_mapper_create': {
      await ldapSvc.createMapper(args.realm, { name: args.name, providerId: args.providerId, providerType: 'org.keycloak.storage.ldap.mappers.LDAPStorageMapper', parentId: args.parentId, config: args.config ?? {} });
      return buildMCPSuccess({ created: args.name });
    }
    case 'kc_ldap_mapper_sync': return buildMCPSuccess(await ldapSvc.syncMapper(args.realm, args.parentId, args.mapperId, args.direction));

    // ── Events ────────────────────────────────────────────────────────────────
    case 'kc_event_list_user': return buildMCPSuccess(await eventSvc.listUserEvents(args.realm, args));
    case 'kc_event_list_admin': return buildMCPSuccess(await eventSvc.listAdminEvents(args.realm, args));
    case 'kc_event_clear_user': {
      await eventSvc.clearUserEvents(args.realm);
      return buildMCPSuccess({ cleared: true });
    }
    case 'kc_event_clear_admin': {
      await eventSvc.clearAdminEvents(args.realm);
      return buildMCPSuccess({ cleared: true });
    }
    case 'kc_event_config_get': return buildMCPSuccess(await eventSvc.getConfig(args.realm));
    case 'kc_event_config_update': {
      await eventSvc.updateConfig(args.realm, args);
      return buildMCPSuccess({ updated: true });
    }

    // ── Organizations ─────────────────────────────────────────────────────────
    case 'kc_org_list': return buildMCPSuccess(await orgSvc.list(args.realm, { search: args.search, first: args.first, max: args.max }));
    case 'kc_org_create': {
      await orgSvc.create(args.realm, { name: args.name, alias: args.alias, description: args.description, enabled: args.enabled, domains: args.domains, attributes: args.attributes });
      return buildMCPSuccess({ created: args.name });
    }
    case 'kc_org_get': return buildMCPSuccess(await orgSvc.get(args.realm, args.orgId));
    case 'kc_org_update': {
      await orgSvc.update(args.realm, args.orgId, args.fields);
      return buildMCPSuccess({ updated: args.orgId });
    }
    case 'kc_org_delete': {
      await orgSvc.delete(args.realm, args.orgId);
      return buildMCPSuccess({ deleted: args.orgId });
    }
    case 'kc_org_members_list': return buildMCPSuccess(await orgSvc.listMembers(args.realm, args.orgId, { first: args.first, max: args.max }));
    case 'kc_org_member_add': {
      await orgSvc.addMember(args.realm, args.orgId, args.userId);
      return buildMCPSuccess({ added: args.userId });
    }
    case 'kc_org_member_remove': {
      await orgSvc.removeMember(args.realm, args.orgId, args.userId);
      return buildMCPSuccess({ removed: args.userId });
    }
    case 'kc_org_idp_link': {
      await orgSvc.linkIdp(args.realm, args.orgId, args.idpAlias);
      return buildMCPSuccess({ linked: args.idpAlias });
    }
    case 'kc_org_idp_unlink': {
      await orgSvc.unlinkIdp(args.realm, args.orgId, args.idpAlias);
      return buildMCPSuccess({ unlinked: args.idpAlias });
    }
    case 'kc_org_invite_member': {
      await orgSvc.inviteMember(args.realm, args.orgId, { email: args.email, firstName: args.firstName, lastName: args.lastName });
      return buildMCPSuccess({ invited: args.email });
    }

    // ── Attack Detection ──────────────────────────────────────────────────────
    case 'kc_bruteforce_status': return buildMCPSuccess(await attackSvc.getUserStatus(args.realm, args.userId));
    case 'kc_bruteforce_clear_user': {
      await attackSvc.clearUser(args.realm, args.userId);
      return buildMCPSuccess({ cleared: args.userId });
    }
    case 'kc_bruteforce_clear_all': {
      await attackSvc.clearAll(args.realm);
      return buildMCPSuccess({ clearedAll: true });
    }

    // ── DB Inspector ──────────────────────────────────────────────────────────
    case 'kc_db_users_inactive': return buildMCPSuccess(await dbInspector.getUsersInactive(args.realmId, args.days, args.limit));
    case 'kc_db_users_locked': return buildMCPSuccess(await dbInspector.getUsersLocked(args.realmId));
    case 'kc_db_users_unverified': return buildMCPSuccess(await dbInspector.getUsersUnverified(args.realmId, args.days));
    case 'kc_db_users_count_by_realm': return buildMCPSuccess(await dbInspector.getUsersCountByRealm());
    case 'kc_db_roles_unused': return buildMCPSuccess(await dbInspector.getRolesUnused(args.realmId));
    case 'kc_db_roles_distribution': return buildMCPSuccess(await dbInspector.getRolesDistribution(args.realmId));
    case 'kc_db_clients_inactive': return buildMCPSuccess(await dbInspector.getClientsInactive(args.realmId, args.days));
    case 'kc_db_sessions_active_summary': return buildMCPSuccess(await dbInspector.getSessionsActiveSummary(args.realmId));
    case 'kc_db_sessions_offline_old': return buildMCPSuccess(await dbInspector.getSessionsOfflineOld(args.realmId, args.days));
    case 'kc_db_events_login_errors': return buildMCPSuccess(await dbInspector.getEventsLoginErrors(args.realmId, args.dateFrom, args.dateTo, args.limit));
    case 'kc_db_events_failed_users': return buildMCPSuccess(await dbInspector.getEventsFailedUsers(args.realmId, args.dateFrom, args.dateTo, args.limit));
    case 'kc_db_events_activity_by_hour': return buildMCPSuccess(await dbInspector.getEventsActivityByHour(args.realmId, args.dateFrom, args.dateTo));
    case 'kc_db_integrity_orphans': return buildMCPSuccess(await dbInspector.getIntegrityOrphans());
    case 'kc_db_integrity_expired_tokens': return buildMCPSuccess(await dbInspector.getIntegrityExpiredTokens());
    case 'kc_db_perf_table_sizes': return buildMCPSuccess(await dbInspector.getPerfTableSizes());
    case 'kc_db_perf_indexes': return buildMCPSuccess(await dbInspector.getPerfIndexes());
    case 'kc_db_raw_query': return buildMCPSuccess(await dbInspector.rawQuery(args.sql, args.params ?? []));

    default:
      return buildMCPError('NOT_FOUND', `Tool '${name}' no encontrada.`, 'Usa kc_realm_list para empezar.');
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function main() {
  logger.info({ name: config.mcpServerName, version: config.mcpServerVersion }, 'Starting Keycloak MCP Server');

  try {
    // Warm up token on start
    await tokenManager.obtain(config.kcAuthRealm);
    logger.info('Authentication successful');
  } catch (err) {
    logger.error({ err }, 'Initial authentication failed — server will still start');
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('Keycloak MCP Server running on stdio');

  process.on('SIGINT', async () => {
    await closeDbPool();
    await server.close();
    process.exit(0);
  });
}

main().catch((err) => {
  logger.error({ err }, 'Fatal error');
  process.exit(1);
});
