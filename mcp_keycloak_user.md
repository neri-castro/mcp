# Keycloak MCP Server - Guía del Usuario

Esta guía detalla cómo gestionar tu infraestructura de Keycloak (v26+) y analizar su base de datos PostgreSQL utilizando el protocolo MCP.

## 🚀 Inicio Rápido

El servidor MCP para Keycloak expone **120 herramientas** organizadas en módulos para la gestión total de realms, usuarios, roles, grupos, clientes y auditoría.

### Configuración de Credenciales

Configura estas variables en tu cliente MCP:

| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `KC_HOST` | URL base de tu Keycloak | `https://auth.tuempresa.com` |
| `KC_AUTH_REALM` | Realm para autenticación inicial | `master` |
| `KC_CLIENT_ID` | Client ID con roles de admin | `keycloak-mcp-client` |
| `KC_CLIENT_SECRET` | Secret del cliente | `your-secret-here` |

---

## 🛠️ Herramientas Principales

El servidor se divide en dos grandes áreas funcionales:

### 1. Gestión Admin (REST API)
-   **Realms & Usuarios:** Listar, crear y editar reinos y usuarios.
-   **Roles & Grupos:** Gestión de permisos y membresías.
-   **Clientes & Scopes:** Configuración de aplicaciones y scopes de autorización.
-   **Seguridad:** Detección de ataques, sesiones, federación LDAP/AD y eventos de auditoría.

### 2. DB Inspector (Direct PostgreSQL)
Acceso de solo lectura al PostgreSQL de Keycloak para análisis avanzado:
-   **Sesiones Offline:** Ver volumen candidatos a limpieza.
-   **Detección de errores:** Top fallos de autenticación.
-   **Integridad:** Usuarios sin roles o grupos vacíos.

---

## 💡 Ejemplos de Uso Reales

### 1. Crear un Usuario con Roles
**Prompt:** "Crea un usuario 'neri' en el realm 'my-app' y asígnale el rol de 'admin'."
**Herramienta Interna:** `kc_user_create` y `kc_user_assign_realm_roles`
```json
{
  "realm": "my-app",
  "username": "neri",
  "email": "neri@example.com",
  "enabled": true
}
```

### 2. Analizar sesiones bloqueadas en la DB
**Prompt:** "¿Cuántas sesiones de usuario inactivas hay actualmente en la base de datos?"
**Herramienta Interna:** `kc_db_sessions_offline_stats` 
```json
{
  "realm": "master"
}
```

### 3. Configurar federación LDAP
**Prompt:** "Muestra la configuración del componente LDAP en el realm 'corp' y comprueba los últimos errores de sincronización."
**Herramienta Interna:** `kc_ldap_list` y `kc_ldap_sync_stats`
```json
{
  "realm": "corp"
}
```

---

## ❓ Solución de Problemas

-   **401 Unauthorized:** El servidor intentará renovar el token automáticamente cada 4 minutos (configurable). Si el cliente ID es incorrecto, verificalo en la consola de Keycloak.
-   **DB Inspector No Conecta:** El módulo DB Inspector requiere que configures las variables `KC_DB_HOST`, `KC_DB_NAME`, `KC_DB_USER` y `KC_DB_PASSWORD`. Si no están, las herramientas de DB no aparecerán o darán error.
-   **Permisos de Service Account:** Asegúrate de que el cliente en Keycloak tenga `Service Accounts Enabled` y posea los roles `manage-users`, `view-realm`, etc., en el `realm-management` del realm correspondiente.
