import { z } from 'zod';

// ── Auth Tools ────────────────────────────────────────────────────────────────

export const authTools = [
  {
    name: 'kc_auth_token_obtain',
    description: 'Obtiene un access token de Keycloak usando client_credentials o password grant. Necesario antes de cualquier operación si el token expiró.',
    inputSchema: z.object({
      realm: z.string().default('master').describe('Realm donde autenticar'),
      grantType: z.enum(['client_credentials', 'password']).default('client_credentials'),
    }),
  },
  {
    name: 'kc_auth_token_refresh',
    description: 'Renueva el access token usando el refresh token almacenado internamente.',
    inputSchema: z.object({
      realm: z.string().default('master'),
    }),
  },
  {
    name: 'kc_auth_token_introspect',
    description: 'Introspección de token: valida y devuelve todos los claims.',
    inputSchema: z.object({
      realm: z.string().describe('Realm del token'),
      token: z.string().describe('JWT a introspeccionar'),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
    }),
  },
  {
    name: 'kc_auth_userinfo',
    description: 'Obtiene la información del usuario autenticado desde el endpoint /userinfo.',
    inputSchema: z.object({
      realm: z.string(),
      token: z.string().describe('Access token Bearer'),
    }),
  },
];

// ── Realm Tools ───────────────────────────────────────────────────────────────

export const realmTools = [
  {
    name: 'kc_realm_list',
    description: 'Lista todos los realms accesibles con el service account configurado.',
    inputSchema: z.object({}),
  },
  {
    name: 'kc_realm_create',
    description: 'Crea un nuevo realm con configuración completa de SSO, seguridad y políticas de contraseña.',
    inputSchema: z.object({
      realm: z.string().min(1).describe('Nombre único del realm (slug, ej: "mi-empresa")'),
      displayName: z.string().optional(),
      displayNameHtml: z.string().optional(),
      enabled: z.boolean().default(true),
      registrationAllowed: z.boolean().default(false),
      loginWithEmailAllowed: z.boolean().default(true),
      verifyEmail: z.boolean().default(true),
      resetPasswordAllowed: z.boolean().default(true),
      bruteForceProtected: z.boolean().default(true),
      accessTokenLifespan: z.number().int().optional().describe('Segundos de vida del access token'),
      ssoSessionIdleTimeout: z.number().int().optional(),
      passwordPolicy: z.string().optional().describe('Ej: "length(12) and upperCase(1) and digits(1)"'),
      defaultLocale: z.string().optional().default('es'),
      smtpHost: z.string().optional(),
      smtpPort: z.string().optional(),
      smtpFrom: z.string().optional(),
    }),
  },
  {
    name: 'kc_realm_get',
    description: 'Obtiene la configuración completa de un realm.',
    inputSchema: z.object({ realm: z.string() }),
  },
  {
    name: 'kc_realm_update',
    description: 'Actualiza configuración de un realm (password policy, SSO, SMTP, brute force, etc.).',
    inputSchema: z.object({
      realm: z.string(),
      fields: z.record(z.unknown()).describe('Campos a actualizar según RealmRepresentation de Keycloak'),
    }),
  },
  {
    name: 'kc_realm_delete',
    description: 'Elimina un realm y TODOS sus datos. Operación irreversible.',
    inputSchema: z.object({ realm: z.string() }),
  },
  {
    name: 'kc_realm_export',
    description: 'Exporta la configuración del realm como JSON (partial-export).',
    inputSchema: z.object({
      realm: z.string(),
      exportClients: z.boolean().default(false),
      exportGroupsAndRoles: z.boolean().default(true),
    }),
  },
  {
    name: 'kc_realm_import',
    description: 'Importa configuración parcial a un realm existente.',
    inputSchema: z.object({
      realm: z.string(),
      payload: z.record(z.unknown()).describe('JSON de configuración a importar'),
    }),
  },
  {
    name: 'kc_realm_logout_all',
    description: 'Invalida TODAS las sesiones activas del realm. Usar con precaución.',
    inputSchema: z.object({ realm: z.string() }),
  },
  {
    name: 'kc_realm_events_get',
    description: 'Consulta eventos de usuario con filtros.',
    inputSchema: z.object({
      realm: z.string(),
      type: z.string().optional().describe('Ej: LOGIN, LOGIN_ERROR, LOGOUT'),
      client: z.string().optional(),
      user: z.string().optional(),
      dateFrom: z.string().optional().describe('ISO 8601'),
      dateTo: z.string().optional(),
      first: z.number().int().optional(),
      max: z.number().int().optional(),
    }),
  },
  {
    name: 'kc_realm_admin_events_get',
    description: 'Consulta eventos de administración del realm.',
    inputSchema: z.object({
      realm: z.string(),
      operationType: z.enum(['CREATE', 'UPDATE', 'DELETE', 'ACTION']).optional(),
      resourceType: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      first: z.number().int().optional(),
      max: z.number().int().optional(),
    }),
  },
  {
    name: 'kc_realm_events_clear',
    description: 'Limpia el historial de eventos de usuario del realm.',
    inputSchema: z.object({ realm: z.string() }),
  },
  {
    name: 'kc_realm_events_config',
    description: 'Obtiene o actualiza la configuración de auditoría de eventos.',
    inputSchema: z.object({
      realm: z.string(),
      eventsEnabled: z.boolean().optional(),
      eventsExpiration: z.number().int().optional().describe('Segundos de retención'),
      enabledEventTypes: z.array(z.string()).optional(),
      adminEventsEnabled: z.boolean().optional(),
      adminEventsDetailsEnabled: z.boolean().optional(),
    }),
  },
  {
    name: 'kc_realm_keys_get',
    description: 'Obtiene los metadatos de claves criptográficas del realm.',
    inputSchema: z.object({ realm: z.string() }),
  },
];

// ── User Tools ────────────────────────────────────────────────────────────────

export const userTools = [
  {
    name: 'kc_user_list',
    description: 'Lista y busca usuarios del realm. Soporta filtros por username, email, nombre, estado y atributos.',
    inputSchema: z.object({
      realm: z.string().describe('Nombre del realm'),
      search: z.string().optional().describe('Búsqueda en username, email, firstName, lastName'),
      username: z.string().optional(),
      email: z.string().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      enabled: z.boolean().optional(),
      emailVerified: z.boolean().optional(),
      exact: z.boolean().optional(),
      first: z.number().int().optional().default(0),
      max: z.number().int().optional().default(100),
      q: z.string().optional().describe('Búsqueda por atributo: "key:value"'),
    }),
  },
  {
    name: 'kc_user_count',
    description: 'Cuenta usuarios del realm con filtros opcionales.',
    inputSchema: z.object({
      realm: z.string(),
      search: z.string().optional(),
      email: z.string().optional(),
      enabled: z.boolean().optional(),
    }),
  },
  {
    name: 'kc_user_create',
    description: `Crea un nuevo usuario en un realm de Keycloak.
Soporta asignación inicial de credenciales, atributos, grupos y roles.
Si temporary=true el usuario deberá cambiar la contraseña en el próximo login.
Usa kc_realm_list para identificar el realm correcto primero.`,
    inputSchema: z.object({
      realm: z.string(),
      username: z.string().min(1).describe('Username único en el realm'),
      email: z.string().email().optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      enabled: z.boolean().default(true),
      emailVerified: z.boolean().default(false),
      temporaryPassword: z.string().optional().describe('Contraseña temporal inicial'),
      attributes: z.record(z.array(z.string())).optional().describe('Ej: {"department": ["Engineering"]}'),
      requiredActions: z.array(z.enum([
        'UPDATE_PASSWORD', 'VERIFY_EMAIL', 'UPDATE_PROFILE',
        'CONFIGURE_TOTP', 'TERMS_AND_CONDITIONS',
      ])).optional(),
      groups: z.array(z.string()).optional().describe('Paths de grupos: ["/engineering/backend"]'),
    }),
  },
  {
    name: 'kc_user_get',
    description: 'Obtiene todos los datos de un usuario por su UUID.',
    inputSchema: z.object({
      realm: z.string(),
      userId: z.string().uuid(),
    }),
  },
  {
    name: 'kc_user_update',
    description: 'Actualiza datos de un usuario (email, nombre, atributos, estado, etc.).',
    inputSchema: z.object({
      realm: z.string(),
      userId: z.string().uuid(),
      fields: z.record(z.unknown()).describe('Campos a actualizar'),
    }),
  },
  {
    name: 'kc_user_delete',
    description: 'Elimina permanentemente un usuario del realm.',
    inputSchema: z.object({ realm: z.string(), userId: z.string().uuid() }),
  },
  {
    name: 'kc_user_set_password',
    description: 'Establece una nueva contraseña para el usuario.',
    inputSchema: z.object({
      realm: z.string(),
      userId: z.string().uuid(),
      password: z.string().min(1),
      temporary: z.boolean().default(false).describe('Si true, el usuario debe cambiarla en el próximo login'),
    }),
  },
  {
    name: 'kc_user_reset_password_email',
    description: 'Envía email de reset de contraseña al usuario.',
    inputSchema: z.object({
      realm: z.string(),
      userId: z.string().uuid(),
      clientId: z.string().optional(),
      redirectUri: z.string().optional(),
    }),
  },
  {
    name: 'kc_user_send_verify_email',
    description: 'Envía email de verificación de dirección de email.',
    inputSchema: z.object({ realm: z.string(), userId: z.string().uuid() }),
  },
  {
    name: 'kc_user_execute_actions',
    description: 'Dispara acciones requeridas (UPDATE_PASSWORD, VERIFY_EMAIL, CONFIGURE_TOTP, etc.) enviando email al usuario.',
    inputSchema: z.object({
      realm: z.string(),
      userId: z.string().uuid(),
      actions: z.array(z.string()).min(1),
      clientId: z.string().optional(),
    }),
  },
  {
    name: 'kc_user_get_roles',
    description: 'Obtiene todos los roles asignados al usuario (realm + clientes).',
    inputSchema: z.object({ realm: z.string(), userId: z.string().uuid() }),
  },
  {
    name: 'kc_user_assign_realm_roles',
    description: 'Asigna roles del realm a un usuario. Esta operación es aditiva.',
    inputSchema: z.object({
      realm: z.string(),
      userId: z.string().uuid(),
      roleNames: z.array(z.string()).min(1).describe('Ej: ["developer", "viewer"]'),
    }),
  },
  {
    name: 'kc_user_remove_realm_roles',
    description: 'Quita roles del realm de un usuario.',
    inputSchema: z.object({
      realm: z.string(),
      userId: z.string().uuid(),
      roleNames: z.array(z.string()).min(1),
    }),
  },
  {
    name: 'kc_user_assign_client_roles',
    description: 'Asigna roles de un cliente específico al usuario.',
    inputSchema: z.object({
      realm: z.string(),
      userId: z.string().uuid(),
      clientId: z.string().describe('UUID interno del cliente (obtenido con kc_client_list)'),
      roleNames: z.array(z.string()).min(1),
    }),
  },
  {
    name: 'kc_user_remove_client_roles',
    description: 'Quita roles de cliente del usuario.',
    inputSchema: z.object({
      realm: z.string(),
      userId: z.string().uuid(),
      clientId: z.string(),
      roleNames: z.array(z.string()).min(1),
    }),
  },
  {
    name: 'kc_user_get_groups',
    description: 'Lista los grupos a los que pertenece el usuario.',
    inputSchema: z.object({ realm: z.string(), userId: z.string().uuid() }),
  },
  {
    name: 'kc_user_join_group',
    description: 'Agrega el usuario a un grupo.',
    inputSchema: z.object({ realm: z.string(), userId: z.string().uuid(), groupId: z.string() }),
  },
  {
    name: 'kc_user_leave_group',
    description: 'Quita al usuario de un grupo.',
    inputSchema: z.object({ realm: z.string(), userId: z.string().uuid(), groupId: z.string() }),
  },
  {
    name: 'kc_user_get_sessions',
    description: 'Obtiene las sesiones activas del usuario.',
    inputSchema: z.object({ realm: z.string(), userId: z.string().uuid() }),
  },
  {
    name: 'kc_user_logout',
    description: 'Cierra todas las sesiones activas del usuario.',
    inputSchema: z.object({ realm: z.string(), userId: z.string().uuid() }),
  },
  {
    name: 'kc_user_impersonate',
    description: 'Impersona al usuario: obtiene un token con su identidad.',
    inputSchema: z.object({ realm: z.string(), userId: z.string().uuid() }),
  },
  {
    name: 'kc_user_get_credentials',
    description: 'Lista las credenciales registradas del usuario.',
    inputSchema: z.object({ realm: z.string(), userId: z.string().uuid() }),
  },
  {
    name: 'kc_user_delete_credential',
    description: 'Elimina una credencial específica del usuario (ej: OTP, WebAuthn).',
    inputSchema: z.object({
      realm: z.string(),
      userId: z.string().uuid(),
      credentialId: z.string(),
    }),
  },
  {
    name: 'kc_user_get_consents',
    description: 'Lista los consentimientos OAuth activos del usuario por cliente.',
    inputSchema: z.object({ realm: z.string(), userId: z.string().uuid() }),
  },
  {
    name: 'kc_user_revoke_consent',
    description: 'Revoca el consentimiento OAuth del usuario para un cliente.',
    inputSchema: z.object({ realm: z.string(), userId: z.string().uuid(), clientId: z.string() }),
  },
];

// ── Role Tools ────────────────────────────────────────────────────────────────

export const roleTools = [
  {
    name: 'kc_role_list_realm',
    description: 'Lista todos los roles del realm.',
    inputSchema: z.object({ realm: z.string() }),
  },
  {
    name: 'kc_role_create_realm',
    description: 'Crea un nuevo rol en el realm.',
    inputSchema: z.object({
      realm: z.string(),
      name: z.string().min(1),
      description: z.string().optional(),
      composite: z.boolean().default(false),
      attributes: z.record(z.array(z.string())).optional(),
    }),
  },
  {
    name: 'kc_role_get_realm',
    description: 'Obtiene un rol del realm por nombre.',
    inputSchema: z.object({ realm: z.string(), roleName: z.string() }),
  },
  {
    name: 'kc_role_update_realm',
    description: 'Actualiza un rol del realm.',
    inputSchema: z.object({
      realm: z.string(),
      roleName: z.string(),
      fields: z.record(z.unknown()),
    }),
  },
  {
    name: 'kc_role_delete_realm',
    description: 'Elimina un rol del realm.',
    inputSchema: z.object({ realm: z.string(), roleName: z.string() }),
  },
  {
    name: 'kc_role_add_composites',
    description: 'Convierte un rol en rol compuesto añadiéndole sub-roles.',
    inputSchema: z.object({
      realm: z.string(),
      roleName: z.string(),
      roles: z.array(z.object({ id: z.string(), name: z.string() })),
    }),
  },
  {
    name: 'kc_role_get_users',
    description: 'Lista los usuarios que tienen asignado el rol.',
    inputSchema: z.object({
      realm: z.string(),
      roleName: z.string(),
      first: z.number().int().optional(),
      max: z.number().int().optional(),
    }),
  },
  {
    name: 'kc_role_list_client',
    description: 'Lista los roles de un cliente.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string() }),
  },
  {
    name: 'kc_role_create_client',
    description: 'Crea un rol dentro de un cliente.',
    inputSchema: z.object({
      realm: z.string(),
      clientId: z.string(),
      name: z.string().min(1),
      description: z.string().optional(),
    }),
  },
  {
    name: 'kc_role_delete_client',
    description: 'Elimina un rol de cliente.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string(), roleName: z.string() }),
  },
  {
    name: 'kc_role_mapping_get',
    description: 'Ve todos los roles (realm + clientes) asignados a un usuario.',
    inputSchema: z.object({ realm: z.string(), userId: z.string().uuid() }),
  },
  {
    name: 'kc_role_mapping_assign_realm',
    description: 'Asigna roles del realm a un usuario.',
    inputSchema: z.object({
      realm: z.string(),
      userId: z.string().uuid(),
      roleNames: z.array(z.string()).min(1),
    }),
  },
  {
    name: 'kc_role_mapping_remove_realm',
    description: 'Quita roles del realm de un usuario.',
    inputSchema: z.object({
      realm: z.string(),
      userId: z.string().uuid(),
      roleNames: z.array(z.string()).min(1),
    }),
  },
  {
    name: 'kc_role_mapping_assign_client',
    description: 'Asigna roles de cliente a un usuario.',
    inputSchema: z.object({
      realm: z.string(),
      userId: z.string().uuid(),
      clientId: z.string(),
      roleNames: z.array(z.string()).min(1),
    }),
  },
  {
    name: 'kc_role_mapping_remove_client',
    description: 'Quita roles de cliente de un usuario.',
    inputSchema: z.object({
      realm: z.string(),
      userId: z.string().uuid(),
      clientId: z.string(),
      roleNames: z.array(z.string()).min(1),
    }),
  },
  {
    name: 'kc_scope_mapping_add',
    description: 'Agrega scope mappings a un cliente.',
    inputSchema: z.object({
      realm: z.string(),
      clientId: z.string(),
      roles: z.array(z.object({ id: z.string(), name: z.string() })),
    }),
  },
  {
    name: 'kc_scope_mapping_remove',
    description: 'Quita scope mappings de un cliente.',
    inputSchema: z.object({
      realm: z.string(),
      clientId: z.string(),
      roles: z.array(z.object({ id: z.string(), name: z.string() })),
    }),
  },
];

// ── Group Tools ───────────────────────────────────────────────────────────────

export const groupTools = [
  {
    name: 'kc_group_list',
    description: 'Lista la jerarquía de grupos del realm.',
    inputSchema: z.object({
      realm: z.string(),
      search: z.string().optional(),
      first: z.number().int().optional(),
      max: z.number().int().optional(),
    }),
  },
  {
    name: 'kc_group_create',
    description: 'Crea un grupo raíz en el realm.',
    inputSchema: z.object({
      realm: z.string(),
      name: z.string().min(1),
      attributes: z.record(z.array(z.string())).optional(),
      realmRoles: z.array(z.string()).optional(),
    }),
  },
  {
    name: 'kc_group_create_child',
    description: 'Crea un subgrupo dentro de un grupo existente.',
    inputSchema: z.object({
      realm: z.string(),
      parentGroupId: z.string(),
      name: z.string().min(1),
      attributes: z.record(z.array(z.string())).optional(),
    }),
  },
  {
    name: 'kc_group_get',
    description: 'Obtiene un grupo con todos sus subgrupos.',
    inputSchema: z.object({ realm: z.string(), groupId: z.string() }),
  },
  {
    name: 'kc_group_update',
    description: 'Actualiza un grupo.',
    inputSchema: z.object({
      realm: z.string(),
      groupId: z.string(),
      name: z.string().optional(),
      attributes: z.record(z.array(z.string())).optional(),
    }),
  },
  {
    name: 'kc_group_delete',
    description: 'Elimina un grupo y todos sus subgrupos.',
    inputSchema: z.object({ realm: z.string(), groupId: z.string() }),
  },
  {
    name: 'kc_group_members',
    description: 'Lista los miembros de un grupo.',
    inputSchema: z.object({
      realm: z.string(),
      groupId: z.string(),
      first: z.number().int().optional(),
      max: z.number().int().optional(),
    }),
  },
  {
    name: 'kc_group_get_roles',
    description: 'Lista los roles asignados al grupo.',
    inputSchema: z.object({ realm: z.string(), groupId: z.string() }),
  },
  {
    name: 'kc_group_assign_roles',
    description: 'Asigna roles del realm al grupo.',
    inputSchema: z.object({
      realm: z.string(),
      groupId: z.string(),
      roleNames: z.array(z.string()).min(1),
    }),
  },
  {
    name: 'kc_group_remove_roles',
    description: 'Quita roles del grupo.',
    inputSchema: z.object({
      realm: z.string(),
      groupId: z.string(),
      roleNames: z.array(z.string()).min(1),
    }),
  },
  {
    name: 'kc_group_set_default',
    description: 'Configura el grupo como grupo por defecto para nuevos usuarios.',
    inputSchema: z.object({ realm: z.string(), groupId: z.string() }),
  },
];

// ── Client Tools ──────────────────────────────────────────────────────────────

export const clientTools = [
  {
    name: 'kc_client_list',
    description: 'Lista los clientes del realm.',
    inputSchema: z.object({
      realm: z.string(),
      clientId: z.string().optional().describe('Filtrar por clientId'),
      search: z.boolean().optional(),
    }),
  },
  {
    name: 'kc_client_create',
    description: 'Crea un cliente OIDC o SAML en el realm.',
    inputSchema: z.object({
      realm: z.string(),
      clientId: z.string().min(1),
      name: z.string().optional(),
      protocol: z.enum(['openid-connect', 'saml']).default('openid-connect'),
      publicClient: z.boolean().default(false),
      bearerOnly: z.boolean().default(false),
      standardFlowEnabled: z.boolean().default(true),
      serviceAccountsEnabled: z.boolean().default(false),
      authorizationServicesEnabled: z.boolean().default(false),
      redirectUris: z.array(z.string()).optional(),
      webOrigins: z.array(z.string()).optional(),
      rootUrl: z.string().optional(),
    }),
  },
  {
    name: 'kc_client_get',
    description: 'Obtiene la configuración completa de un cliente por UUID interno.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string().describe('UUID interno del cliente') }),
  },
  {
    name: 'kc_client_update',
    description: 'Actualiza un cliente.',
    inputSchema: z.object({
      realm: z.string(),
      clientId: z.string(),
      fields: z.record(z.unknown()),
    }),
  },
  {
    name: 'kc_client_delete',
    description: 'Elimina un cliente del realm.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string() }),
  },
  {
    name: 'kc_client_get_secret',
    description: 'Obtiene el client secret actual.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string() }),
  },
  {
    name: 'kc_client_regenerate_secret',
    description: 'Regenera el client secret. El secret anterior deja de funcionar inmediatamente.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string() }),
  },
  {
    name: 'kc_client_get_service_account',
    description: 'Obtiene el usuario service account del cliente (requiere serviceAccountsEnabled=true).',
    inputSchema: z.object({ realm: z.string(), clientId: z.string() }),
  },
  {
    name: 'kc_client_get_sessions',
    description: 'Lista las sesiones activas en el cliente.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string() }),
  },
  {
    name: 'kc_client_mapper_list',
    description: 'Lista los protocol mappers del cliente.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string() }),
  },
  {
    name: 'kc_client_mapper_create',
    description: 'Crea un protocol mapper en el cliente.',
    inputSchema: z.object({
      realm: z.string(),
      clientId: z.string(),
      name: z.string(),
      protocolMapper: z.string().describe('Ej: oidc-user-attribute-mapper'),
      protocol: z.enum(['openid-connect', 'saml']).default('openid-connect'),
      config: z.record(z.string()).optional(),
    }),
  },
  {
    name: 'kc_client_mapper_delete',
    description: 'Elimina un protocol mapper del cliente.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string(), mapperId: z.string() }),
  },
  {
    name: 'kc_client_authz_enable',
    description: 'Habilita Authorization Services en un cliente.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string() }),
  },
  {
    name: 'kc_client_installation_get',
    description: 'Obtiene la configuración de instalación para la app (keycloak.json, etc.).',
    inputSchema: z.object({
      realm: z.string(),
      clientId: z.string(),
      provider: z.string().default('keycloak-oidc-keycloak-json'),
    }),
  },
];

// ── Client Scope Tools ────────────────────────────────────────────────────────

export const clientScopeTools = [
  {
    name: 'kc_scope_list',
    description: 'Lista todos los client scopes del realm.',
    inputSchema: z.object({ realm: z.string() }),
  },
  {
    name: 'kc_scope_create',
    description: 'Crea un client scope.',
    inputSchema: z.object({
      realm: z.string(),
      name: z.string().min(1),
      protocol: z.enum(['openid-connect', 'saml']).default('openid-connect'),
      description: z.string().optional(),
    }),
  },
  {
    name: 'kc_scope_get',
    description: 'Obtiene un scope con sus mappers.',
    inputSchema: z.object({ realm: z.string(), scopeId: z.string() }),
  },
  {
    name: 'kc_scope_update',
    description: 'Actualiza un client scope.',
    inputSchema: z.object({ realm: z.string(), scopeId: z.string(), fields: z.record(z.unknown()) }),
  },
  {
    name: 'kc_scope_delete',
    description: 'Elimina un client scope.',
    inputSchema: z.object({ realm: z.string(), scopeId: z.string() }),
  },
  {
    name: 'kc_scope_mapper_add',
    description: 'Agrega un mapper al scope.',
    inputSchema: z.object({
      realm: z.string(),
      scopeId: z.string(),
      name: z.string(),
      protocolMapper: z.string(),
      config: z.record(z.string()).optional(),
    }),
  },
  {
    name: 'kc_scope_assign_to_client',
    description: 'Asigna un scope a un cliente (default u optional).',
    inputSchema: z.object({
      realm: z.string(),
      clientId: z.string(),
      scopeId: z.string(),
      optional: z.boolean().default(false),
    }),
  },
  {
    name: 'kc_scope_remove_from_client',
    description: 'Quita un scope de un cliente.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string(), scopeId: z.string(), optional: z.boolean().default(false) }),
  },
];

// ── Authz Tools ───────────────────────────────────────────────────────────────

export const authzTools = [
  {
    name: 'kc_authz_resource_list',
    description: 'Lista los recursos de autorización de un cliente.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string(), name: z.string().optional(), type: z.string().optional() }),
  },
  {
    name: 'kc_authz_resource_create',
    description: 'Crea un recurso de autorización.',
    inputSchema: z.object({
      realm: z.string(),
      clientId: z.string(),
      name: z.string(),
      type: z.string().optional(),
      uris: z.array(z.string()).optional(),
      scopes: z.array(z.string()).optional(),
      ownerManagedAccess: z.boolean().default(false),
    }),
  },
  {
    name: 'kc_authz_resource_update',
    description: 'Actualiza un recurso de autorización.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string(), resourceId: z.string(), fields: z.record(z.unknown()) }),
  },
  {
    name: 'kc_authz_resource_delete',
    description: 'Elimina un recurso de autorización.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string(), resourceId: z.string() }),
  },
  {
    name: 'kc_authz_policy_list',
    description: 'Lista las políticas de autorización.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string(), type: z.string().optional() }),
  },
  {
    name: 'kc_authz_policy_create_role',
    description: 'Crea una política RBAC basada en roles.',
    inputSchema: z.object({
      realm: z.string(),
      clientId: z.string(),
      name: z.string(),
      description: z.string().optional(),
      logic: z.enum(['POSITIVE', 'NEGATIVE']).default('POSITIVE'),
      decisionStrategy: z.enum(['UNANIMOUS', 'AFFIRMATIVE', 'CONSENSUS']).default('UNANIMOUS'),
      roles: z.array(z.object({ id: z.string(), required: z.boolean().default(false) })),
    }),
  },
  {
    name: 'kc_authz_policy_create_group',
    description: 'Crea una política basada en grupos.',
    inputSchema: z.object({
      realm: z.string(),
      clientId: z.string(),
      name: z.string(),
      groups: z.array(z.object({ id: z.string(), extendChildren: z.boolean().default(false) })),
      logic: z.enum(['POSITIVE', 'NEGATIVE']).default('POSITIVE'),
    }),
  },
  {
    name: 'kc_authz_policy_create_js',
    description: 'Crea una política con lógica JavaScript personalizada.',
    inputSchema: z.object({
      realm: z.string(),
      clientId: z.string(),
      name: z.string(),
      description: z.string().optional(),
      code: z.string().describe('Código JS. Ej: $evaluation.grant();'),
      logic: z.enum(['POSITIVE', 'NEGATIVE']).default('POSITIVE'),
    }),
  },
  {
    name: 'kc_authz_policy_create_time',
    description: 'Crea una política temporal (acceso por rango de fechas/horas).',
    inputSchema: z.object({
      realm: z.string(),
      clientId: z.string(),
      name: z.string(),
      notBefore: z.string().optional().describe('Formato: 2026-01-01 09:00:00'),
      notOnOrAfter: z.string().optional(),
      dayMonth: z.string().optional(),
      dayMonthEnd: z.string().optional(),
      month: z.string().optional(),
      hour: z.string().optional(),
      hourEnd: z.string().optional(),
    }),
  },
  {
    name: 'kc_authz_policy_create_aggregated',
    description: 'Crea una política agregada que combina otras políticas.',
    inputSchema: z.object({
      realm: z.string(),
      clientId: z.string(),
      name: z.string(),
      policies: z.array(z.string()).describe('IDs de políticas a combinar'),
      decisionStrategy: z.enum(['UNANIMOUS', 'AFFIRMATIVE', 'CONSENSUS']).default('UNANIMOUS'),
    }),
  },
  {
    name: 'kc_authz_policy_delete',
    description: 'Elimina una política.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string(), policyId: z.string() }),
  },
  {
    name: 'kc_authz_permission_list',
    description: 'Lista los permisos del cliente.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string() }),
  },
  {
    name: 'kc_authz_permission_create_resource',
    description: 'Crea un permiso basado en recurso.',
    inputSchema: z.object({
      realm: z.string(),
      clientId: z.string(),
      name: z.string(),
      resources: z.array(z.string()),
      policies: z.array(z.string()),
      decisionStrategy: z.enum(['UNANIMOUS', 'AFFIRMATIVE', 'CONSENSUS']).default('UNANIMOUS'),
    }),
  },
  {
    name: 'kc_authz_permission_create_scope',
    description: 'Crea un permiso basado en scope.',
    inputSchema: z.object({
      realm: z.string(),
      clientId: z.string(),
      name: z.string(),
      scopes: z.array(z.string()),
      policies: z.array(z.string()),
      resources: z.array(z.string()).optional(),
    }),
  },
  {
    name: 'kc_authz_permission_delete',
    description: 'Elimina un permiso.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string(), permissionId: z.string() }),
  },
  {
    name: 'kc_authz_evaluate',
    description: 'Evalúa permisos para un usuario y recursos dados. Útil para testing.',
    inputSchema: z.object({
      realm: z.string(),
      clientId: z.string(),
      userId: z.string().describe('UUID del usuario a evaluar'),
      resources: z.array(z.string()).optional(),
      scopes: z.array(z.string()).optional(),
    }),
  },
  {
    name: 'kc_authz_export',
    description: 'Exporta la configuración completa de autorización del cliente.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string() }),
  },
  {
    name: 'kc_authz_import',
    description: 'Importa configuración de autorización a un cliente.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string(), payload: z.record(z.unknown()) }),
  },
];

// ── Session Tools ─────────────────────────────────────────────────────────────

export const sessionTools = [
  {
    name: 'kc_session_get',
    description: 'Obtiene el detalle de una sesión.',
    inputSchema: z.object({ realm: z.string(), sessionId: z.string() }),
  },
  {
    name: 'kc_session_delete',
    description: 'Termina una sesión específica.',
    inputSchema: z.object({ realm: z.string(), sessionId: z.string() }),
  },
  {
    name: 'kc_session_list_by_user',
    description: 'Lista sesiones activas de un usuario.',
    inputSchema: z.object({ realm: z.string(), userId: z.string().uuid() }),
  },
  {
    name: 'kc_session_list_by_client',
    description: 'Lista sesiones activas en un cliente.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string(), first: z.number().int().optional(), max: z.number().int().optional() }),
  },
  {
    name: 'kc_session_count_client',
    description: 'Cuenta sesiones activas en un cliente.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string() }),
  },
  {
    name: 'kc_session_offline_list',
    description: 'Lista sesiones offline de un cliente.',
    inputSchema: z.object({ realm: z.string(), clientId: z.string() }),
  },
  {
    name: 'kc_session_logout_user',
    description: 'Cierra todas las sesiones de un usuario.',
    inputSchema: z.object({ realm: z.string(), userId: z.string().uuid() }),
  },
  {
    name: 'kc_session_logout_all',
    description: 'Logout masivo: invalida TODAS las sesiones del realm.',
    inputSchema: z.object({ realm: z.string() }),
  },
  {
    name: 'kc_session_revoke_policies',
    description: 'Revoca todos los tokens emitidos antes de la fecha indicada.',
    inputSchema: z.object({ realm: z.string(), notBefore: z.number().int().describe('Unix timestamp en segundos') }),
  },
];

// ── IdP Tools ─────────────────────────────────────────────────────────────────

export const idpTools = [
  {
    name: 'kc_idp_list',
    description: 'Lista los proveedores de identidad del realm.',
    inputSchema: z.object({ realm: z.string() }),
  },
  {
    name: 'kc_idp_create',
    description: 'Crea un Identity Provider (Google, GitHub, SAML, OIDC custom).',
    inputSchema: z.object({
      realm: z.string(),
      alias: z.string(),
      displayName: z.string().optional(),
      providerId: z.string().describe('Ej: google, github, oidc, saml'),
      enabled: z.boolean().default(true),
      trustEmail: z.boolean().default(false),
      config: z.record(z.string()).describe('clientId, clientSecret, defaultScope, etc.'),
    }),
  },
  {
    name: 'kc_idp_get',
    description: 'Obtiene la configuración del Identity Provider.',
    inputSchema: z.object({ realm: z.string(), alias: z.string() }),
  },
  {
    name: 'kc_idp_update',
    description: 'Actualiza un Identity Provider.',
    inputSchema: z.object({ realm: z.string(), alias: z.string(), fields: z.record(z.unknown()) }),
  },
  {
    name: 'kc_idp_delete',
    description: 'Elimina un Identity Provider.',
    inputSchema: z.object({ realm: z.string(), alias: z.string() }),
  },
  {
    name: 'kc_idp_mapper_list',
    description: 'Lista los mappers del Identity Provider.',
    inputSchema: z.object({ realm: z.string(), alias: z.string() }),
  },
  {
    name: 'kc_idp_mapper_create',
    description: 'Crea un mapper del IdP (claim → atributo/rol de Keycloak).',
    inputSchema: z.object({
      realm: z.string(),
      alias: z.string(),
      name: z.string(),
      identityProviderMapper: z.string().describe('Ej: oidc-role-idp-mapper, hardcoded-role-idp-mapper'),
      config: z.record(z.string()).optional(),
    }),
  },
  {
    name: 'kc_idp_mapper_delete',
    description: 'Elimina un mapper del IdP.',
    inputSchema: z.object({ realm: z.string(), alias: z.string(), mapperId: z.string() }),
  },
];

// ── AuthFlow Tools ────────────────────────────────────────────────────────────

export const authFlowTools = [
  {
    name: 'kc_flow_list',
    description: 'Lista los flujos de autenticación del realm.',
    inputSchema: z.object({ realm: z.string() }),
  },
  {
    name: 'kc_flow_create',
    description: 'Crea un nuevo flujo de autenticación.',
    inputSchema: z.object({
      realm: z.string(),
      alias: z.string(),
      description: z.string().optional(),
      providerId: z.string().default('basic-flow'),
    }),
  },
  {
    name: 'kc_flow_copy',
    description: 'Copia un flujo existente con un nuevo nombre.',
    inputSchema: z.object({ realm: z.string(), flowAlias: z.string(), newName: z.string() }),
  },
  {
    name: 'kc_flow_delete',
    description: 'Elimina un flujo de autenticación (solo flows no built-in).',
    inputSchema: z.object({ realm: z.string(), flowId: z.string() }),
  },
  {
    name: 'kc_flow_executions_get',
    description: 'Obtiene los ejecutores de un flujo.',
    inputSchema: z.object({ realm: z.string(), flowAlias: z.string() }),
  },
  {
    name: 'kc_flow_execution_update',
    description: 'Actualiza la configuración/orden de un ejecutor.',
    inputSchema: z.object({
      realm: z.string(),
      flowAlias: z.string(),
      execution: z.object({
        id: z.string(),
        requirement: z.enum(['REQUIRED', 'ALTERNATIVE', 'DISABLED', 'CONDITIONAL']).optional(),
      }),
    }),
  },
  {
    name: 'kc_flow_required_actions_list',
    description: 'Lista las acciones requeridas disponibles.',
    inputSchema: z.object({ realm: z.string() }),
  },
  {
    name: 'kc_flow_required_action_update',
    description: 'Habilita, deshabilita o configura una acción requerida.',
    inputSchema: z.object({
      realm: z.string(),
      alias: z.string().describe('Ej: UPDATE_PASSWORD, CONFIGURE_TOTP, VERIFY_EMAIL'),
      enabled: z.boolean().optional(),
      defaultAction: z.boolean().optional(),
    }),
  },
];

// ── LDAP Tools ────────────────────────────────────────────────────────────────

export const ldapTools = [
  {
    name: 'kc_ldap_list',
    description: 'Lista los proveedores de federación LDAP/AD del realm.',
    inputSchema: z.object({ realm: z.string() }),
  },
  {
    name: 'kc_ldap_create',
    description: 'Configura un proveedor de federación LDAP/Active Directory.',
    inputSchema: z.object({
      realm: z.string(),
      name: z.string(),
      connectionUrl: z.string().describe('Ej: ldap://ad.empresa.com:389'),
      usersDn: z.string().describe('Ej: OU=Users,DC=empresa,DC=com'),
      bindDn: z.string(),
      bindCredential: z.string(),
      vendor: z.enum(['ad', 'rhds', 'other']).default('ad'),
      usernameLDAPAttribute: z.string().default('sAMAccountName'),
      editMode: z.enum(['READ_ONLY', 'WRITABLE', 'UNSYNCED']).default('READ_ONLY'),
      importEnabled: z.boolean().default(true),
      fullSyncPeriod: z.string().default('86400'),
      changedSyncPeriod: z.string().default('900'),
    }),
  },
  {
    name: 'kc_ldap_get',
    description: 'Obtiene la configuración de un proveedor LDAP.',
    inputSchema: z.object({ realm: z.string(), componentId: z.string() }),
  },
  {
    name: 'kc_ldap_update',
    description: 'Actualiza la configuración del proveedor LDAP.',
    inputSchema: z.object({ realm: z.string(), componentId: z.string(), fields: z.record(z.unknown()) }),
  },
  {
    name: 'kc_ldap_delete',
    description: 'Elimina el proveedor de federación LDAP.',
    inputSchema: z.object({ realm: z.string(), componentId: z.string() }),
  },
  {
    name: 'kc_ldap_sync',
    description: 'Sincroniza usuarios desde LDAP.',
    inputSchema: z.object({
      realm: z.string(),
      componentId: z.string(),
      action: z.enum(['triggerFullSync', 'triggerChangedUsersSync']).default('triggerChangedUsersSync'),
    }),
  },
  {
    name: 'kc_ldap_mapper_list',
    description: 'Lista los mappers LDAP del proveedor.',
    inputSchema: z.object({ realm: z.string(), parentId: z.string() }),
  },
  {
    name: 'kc_ldap_mapper_create',
    description: 'Crea un mapper de atributo LDAP.',
    inputSchema: z.object({
      realm: z.string(),
      parentId: z.string(),
      name: z.string(),
      providerId: z.string().describe('Ej: user-attribute-ldap-mapper, role-ldap-mapper'),
      config: z.record(z.array(z.string())).optional(),
    }),
  },
  {
    name: 'kc_ldap_mapper_sync',
    description: 'Sincroniza un mapper LDAP.',
    inputSchema: z.object({
      realm: z.string(),
      parentId: z.string(),
      mapperId: z.string(),
      direction: z.enum(['fedToKeycloak', 'keycloakToFed']).default('fedToKeycloak'),
    }),
  },
];

// ── Event Tools ───────────────────────────────────────────────────────────────

export const eventTools = [
  {
    name: 'kc_event_list_user',
    description: 'Lista eventos de usuario con filtros (LOGIN, LOGOUT, LOGIN_ERROR, etc.).',
    inputSchema: z.object({
      realm: z.string(),
      type: z.string().optional(),
      client: z.string().optional(),
      user: z.string().optional(),
      ipAddress: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      first: z.number().int().optional(),
      max: z.number().int().optional(),
    }),
  },
  {
    name: 'kc_event_list_admin',
    description: 'Lista eventos de administración del realm.',
    inputSchema: z.object({
      realm: z.string(),
      operationType: z.enum(['CREATE', 'UPDATE', 'DELETE', 'ACTION']).optional(),
      resourceType: z.string().optional(),
      authRealm: z.string().optional(),
      authClient: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      first: z.number().int().optional(),
      max: z.number().int().optional(),
    }),
  },
  {
    name: 'kc_event_clear_user',
    description: 'Limpia el log de eventos de usuario del realm.',
    inputSchema: z.object({ realm: z.string() }),
  },
  {
    name: 'kc_event_clear_admin',
    description: 'Limpia el log de eventos de administración del realm.',
    inputSchema: z.object({ realm: z.string() }),
  },
  {
    name: 'kc_event_config_get',
    description: 'Obtiene la configuración de retención y tipos de eventos.',
    inputSchema: z.object({ realm: z.string() }),
  },
  {
    name: 'kc_event_config_update',
    description: 'Actualiza la configuración de auditoría de eventos.',
    inputSchema: z.object({
      realm: z.string(),
      eventsEnabled: z.boolean().optional(),
      eventsExpiration: z.number().int().optional(),
      enabledEventTypes: z.array(z.string()).optional(),
      adminEventsEnabled: z.boolean().optional(),
      adminEventsDetailsEnabled: z.boolean().optional(),
    }),
  },
];

// ── Organization Tools ────────────────────────────────────────────────────────

export const orgTools = [
  {
    name: 'kc_org_list',
    description: 'Lista las organizaciones del realm (requiere Keycloak 26+ con feature organization activo).',
    inputSchema: z.object({
      realm: z.string(),
      search: z.string().optional(),
      first: z.number().int().optional(),
      max: z.number().int().optional(),
    }),
  },
  {
    name: 'kc_org_create',
    description: 'Crea una nueva organización.',
    inputSchema: z.object({
      realm: z.string(),
      name: z.string(),
      alias: z.string().optional(),
      description: z.string().optional(),
      enabled: z.boolean().default(true),
      domains: z.array(z.object({ name: z.string(), verified: z.boolean().default(false) })).optional(),
      attributes: z.record(z.array(z.string())).optional(),
    }),
  },
  {
    name: 'kc_org_get',
    description: 'Obtiene una organización por ID.',
    inputSchema: z.object({ realm: z.string(), orgId: z.string() }),
  },
  {
    name: 'kc_org_update',
    description: 'Actualiza una organización.',
    inputSchema: z.object({ realm: z.string(), orgId: z.string(), fields: z.record(z.unknown()) }),
  },
  {
    name: 'kc_org_delete',
    description: 'Elimina una organización.',
    inputSchema: z.object({ realm: z.string(), orgId: z.string() }),
  },
  {
    name: 'kc_org_members_list',
    description: 'Lista los miembros de la organización.',
    inputSchema: z.object({ realm: z.string(), orgId: z.string(), first: z.number().int().optional(), max: z.number().int().optional() }),
  },
  {
    name: 'kc_org_member_add',
    description: 'Agrega un usuario a la organización.',
    inputSchema: z.object({ realm: z.string(), orgId: z.string(), userId: z.string() }),
  },
  {
    name: 'kc_org_member_remove',
    description: 'Quita un usuario de la organización.',
    inputSchema: z.object({ realm: z.string(), orgId: z.string(), userId: z.string() }),
  },
  {
    name: 'kc_org_idp_link',
    description: 'Vincula un Identity Provider a la organización.',
    inputSchema: z.object({ realm: z.string(), orgId: z.string(), idpAlias: z.string() }),
  },
  {
    name: 'kc_org_idp_unlink',
    description: 'Desvincula un Identity Provider de la organización.',
    inputSchema: z.object({ realm: z.string(), orgId: z.string(), idpAlias: z.string() }),
  },
  {
    name: 'kc_org_invite_member',
    description: 'Invita a un usuario por email a unirse a la organización.',
    inputSchema: z.object({
      realm: z.string(),
      orgId: z.string(),
      email: z.string().email(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    }),
  },
];

// ── Attack Detection Tools ────────────────────────────────────────────────────

export const attackDetectionTools = [
  {
    name: 'kc_bruteforce_status',
    description: 'Obtiene el estado de bloqueo brute-force de un usuario.',
    inputSchema: z.object({ realm: z.string(), userId: z.string().uuid() }),
  },
  {
    name: 'kc_bruteforce_clear_user',
    description: 'Desbloquea un usuario específico bloqueado por brute-force.',
    inputSchema: z.object({ realm: z.string(), userId: z.string().uuid() }),
  },
  {
    name: 'kc_bruteforce_clear_all',
    description: 'Desbloquea a TODOS los usuarios del realm bloqueados por brute-force.',
    inputSchema: z.object({ realm: z.string() }),
  },
];

// ── DB Inspector Tools ────────────────────────────────────────────────────────

export const dbInspectorTools = [
  {
    name: 'kc_db_users_inactive',
    description: 'Usuarios que no han iniciado sesión en los últimos N días.',
    inputSchema: z.object({ realmId: z.string(), days: z.number().int().positive(), limit: z.number().int().optional().default(100) }),
  },
  {
    name: 'kc_db_users_locked',
    description: 'Usuarios actualmente bloqueados por brute-force (consulta directa a DB).',
    inputSchema: z.object({ realmId: z.string() }),
  },
  {
    name: 'kc_db_users_unverified',
    description: 'Usuarios con email sin verificar hace más de N días.',
    inputSchema: z.object({ realmId: z.string(), days: z.number().int().positive() }),
  },
  {
    name: 'kc_db_users_count_by_realm',
    description: 'Conteo de usuarios activos e inactivos por realm.',
    inputSchema: z.object({}),
  },
  {
    name: 'kc_db_roles_unused',
    description: 'Roles sin ningún usuario ni grupo asignado.',
    inputSchema: z.object({ realmId: z.string() }),
  },
  {
    name: 'kc_db_roles_distribution',
    description: 'Distribución de usuarios por rol en el realm.',
    inputSchema: z.object({ realmId: z.string() }),
  },
  {
    name: 'kc_db_clients_inactive',
    description: 'Clientes sin actividad en los últimos N días.',
    inputSchema: z.object({ realmId: z.string(), days: z.number().int().positive() }),
  },
  {
    name: 'kc_db_sessions_active_summary',
    description: 'Resumen de sesiones activas por cliente.',
    inputSchema: z.object({ realmId: z.string() }),
  },
  {
    name: 'kc_db_sessions_offline_old',
    description: 'Sesiones offline candidatas a expiración (más de N días).',
    inputSchema: z.object({ realmId: z.string(), days: z.number().int().positive() }),
  },
  {
    name: 'kc_db_events_login_errors',
    description: 'Top errores de autenticación en el período indicado.',
    inputSchema: z.object({
      realmId: z.string(),
      dateFrom: z.number().int().describe('Unix ms'),
      dateTo: z.number().int().describe('Unix ms'),
      limit: z.number().int().optional().default(20),
    }),
  },
  {
    name: 'kc_db_events_failed_users',
    description: 'Usuarios con más intentos de login fallidos en el período.',
    inputSchema: z.object({
      realmId: z.string(),
      dateFrom: z.number().int(),
      dateTo: z.number().int(),
      limit: z.number().int().optional().default(20),
    }),
  },
  {
    name: 'kc_db_events_activity_by_hour',
    description: 'Distribución de logins exitosos por hora del día.',
    inputSchema: z.object({ realmId: z.string(), dateFrom: z.number().int(), dateTo: z.number().int() }),
  },
  {
    name: 'kc_db_integrity_orphans',
    description: 'Detecta registros huérfanos en tablas clave de Keycloak.',
    inputSchema: z.object({}),
  },
  {
    name: 'kc_db_integrity_expired_tokens',
    description: 'Tokens offline expirados que no fueron limpiados.',
    inputSchema: z.object({}),
  },
  {
    name: 'kc_db_perf_table_sizes',
    description: 'Tamaño en disco de las tablas de Keycloak (top 20).',
    inputSchema: z.object({}),
  },
  {
    name: 'kc_db_perf_indexes',
    description: 'Análisis de índices utilizados y no utilizados.',
    inputSchema: z.object({}),
  },
  {
    name: 'kc_db_raw_query',
    description: 'Ejecuta una consulta SQL arbitraria (SOLO SELECT/WITH). No se permiten DML ni DDL.',
    inputSchema: z.object({
      sql: z.string().describe('Consulta SELECT o WITH. Usa $1, $2... para parámetros.'),
      params: z.array(z.unknown()).optional().default([]),
    }),
  },
];

// ── Registry ──────────────────────────────────────────────────────────────────

export const ALL_TOOLS = [
  ...authTools,
  ...realmTools,
  ...userTools,
  ...roleTools,
  ...groupTools,
  ...clientTools,
  ...clientScopeTools,
  ...authzTools,
  ...sessionTools,
  ...idpTools,
  ...authFlowTools,
  ...ldapTools,
  ...eventTools,
  ...orgTools,
  ...attackDetectionTools,
  ...dbInspectorTools,
];
