# Keycloak MCP Server

**Model Context Protocol Server para Keycloak Admin REST API v26.x**

## Descripción

Expone 120 herramientas MCP que permiten a un LLM (Claude, GPT-4, etc.) gestionar completamente Keycloak: realms, usuarios, roles, grupos, clientes, autorización fine-grained, sesiones, federación LDAP/AD, proveedores de identidad, flujos de autenticación, auditoría y análisis directo de la base de datos PostgreSQL.

## Stack Técnico

| Componente | Tecnología |
|---|---|
| Runtime | Node.js 20+ con TypeScript 5+ |
| MCP SDK | @modelcontextprotocol/sdk |
| HTTP Client | axios + interceptors |
| Validación | Zod |
| DB Client | pg (node-postgres) |
| Logging | pino |
| Config | dotenv + zod schema |

## Arquitectura

```
MCP Tool Layer     →  src/tools/index.ts
Service Layer      →  src/services/
Repository Layer   →  src/repositories/
HTTP Client/Auth   →  src/http/ + src/auth/
DB Inspector       →  src/db/
```

Patrones aplicados: **SOLID · DRY · Tell Don't Ask · ISP · Repository · Service Layer · DTO**

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Keycloak

# 3. Compilar TypeScript
npm run build

# 4. Ejecutar
npm start
```

## Configuración (.env)

```env
# Conexión Keycloak
KC_HOST=https://keycloak.empresa.com
KC_AUTH_REALM=master

# Autenticación (Client Credentials — recomendado)
KC_AUTH_GRANT_TYPE=client_credentials
KC_CLIENT_ID=keycloak-mcp-client
KC_CLIENT_SECRET=your-secret

# DB Inspector (opcional)
KC_DB_HOST=localhost
KC_DB_NAME=keycloak
KC_DB_USERNAME=keycloak_reader
KC_DB_PASSWORD=readonly-password
```

## Configuración en Claude Desktop

Agrega en `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "keycloak": {
      "command": "node",
      "args": ["/ruta/al/keycloak-mcp/dist/index.js"],
      "env": {
        "KC_HOST": "https://keycloak.empresa.com",
        "KC_CLIENT_ID": "keycloak-mcp-client",
        "KC_CLIENT_SECRET": "your-secret"
      }
    }
  }
}
```

## Prerequisitos en Keycloak

### Opción A: Client Credentials (recomendado)

1. Crear cliente `keycloak-mcp-client` en el realm `master`
2. Activar `Service Accounts Enabled`
3. Asignar al service account los roles:
   - `realm-management: manage-realm`
   - `realm-management: manage-users`
   - `realm-management: manage-clients`
   - etc. (según permisos requeridos)

### Opción B: Admin Password

```env
KC_AUTH_GRANT_TYPE=password
KC_ADMIN_USERNAME=admin
KC_ADMIN_PASSWORD=adminpassword
```

## Módulos y Herramientas (120 tools)

| Módulo | Tools |
|---|---|
| Autenticación | 4 |
| Realms | 13 |
| Usuarios | 25 |
| Roles y Permisos | 17 |
| Grupos | 11 |
| Clientes | 14 |
| Client Scopes | 8 |
| Autorización | 18 |
| Sesiones | 9 |
| Identity Providers | 8 |
| Flujos de Auth | 8 |
| Federación LDAP/AD | 9 |
| Eventos y Auditoría | 6 |
| Organizaciones | 11 |
| Detección de Ataques | 3 |
| DB Inspector | 17 |

## Flujo de Onboarding (ejemplo)

```
1. kc_realm_list          → Identificar realm "mi-empresa"
2. kc_role_list_realm     → Ver roles disponibles
3. kc_group_list          → Identificar grupos
4. kc_user_create         → Crear usuario con contraseña temporal
5. kc_user_assign_realm_roles  → Asignar roles
6. kc_user_join_group     → Agregar a grupo
7. kc_user_send_verify_email   → Email de verificación
8. kc_event_list_user     → Monitorear primer login
```

## DB Inspector

El módulo DB Inspector conecta directamente a PostgreSQL de Keycloak para análisis que no expone la REST API:

- Usuarios inactivos, bloqueados, sin verificar
- Roles sin usar, distribución de roles
- Sesiones offline candidatas a limpieza
- Top errores de autenticación
- Análisis de rendimiento (tablas, índices)
- Integridad referencial

> **IMPORTANTE:** Solo lectura. Todas las modificaciones deben hacerse por la Admin REST API.

## Manejo de Errores

El servidor retorna errores estructurados:

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "El usuario 'john.doe' ya existe en el realm 'mi-empresa'.",
    "hint": "Usa kc_user_list con search='john.doe' para verificar.",
    "details": { "error": "User exists with same username" }
  }
}
```

Estrategia de retry:
- **401**: Auto-refresh de token + reintento
- **429**: Exponential backoff (1s, 2s, 4s)
- **503**: Retry con backoff

## Desarrollo

```bash
npm run dev       # Modo desarrollo con ts-node
npm run typecheck # Verificación de tipos
npm test          # Tests con vitest
```
