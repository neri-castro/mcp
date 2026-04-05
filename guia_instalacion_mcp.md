# Guía de Instalación y Configuración: MCP Servers Ecosystem

Este documento detalla los pasos necesarios para instalar, configurar y ejecutar la suite completa de servidores MCP (Model Context Protocol) disponibles en este proyecto.

---

## 1. Gitea MCP Server
**Ubicación:** `.\gitea-mcp-server`

Permite interactuar con la API de Gitea (v1.25) exponiendo herramientas para gestionar repositorios, issues, pull requests, organizaciones y más.

### Pasos de Instalación
1.  **Navegar al directorio:** `cd c:\Users\nerie\Documents\mcp\gitea-mcp-server`
2.  **Instalar dependencias:** `npm install`
3.  **Compilar:** `npm run build`

### Configuración de Autenticación
| Variable | Descripción |
| :--- | :--- |
| `GITEA_BASE_URL` | URL de tu instancia (ej: `https://gitea.tuempresa.com`) |
| `GITEA_AUTH_TYPE` | `token`, `native` o `ldap` |

- **Si usas `token` (Recomendado):** Requiere `GITEA_TOKEN`.

### Ejemplo de Uso Real
**Herramienta:** `gitea_repository_create`
```json
{
  "name": "nuevo-proyecto-mcp",
  "private": true,
  "description": "Repositorio creado vía MCP"
}
```

---

## 2. Taiga MCP Server
**Ubicación:** `.\taiga-mcp-server`

Expone herramientas para la gestión completa de proyectos ágiles en Taiga (Epics, User Stories, Sprints, Tareas).

### Pasos de Instalación
1.  **Navegar al directorio:** `cd c:\Users\nerie\Documents\mcp\taiga-mcp-server`
2.  **Instalar dependencias:** `npm install`
3.  **Compilar:** `npm run build`

### Configuración de Autenticación
| Variable | Descripción |
| :--- | :--- |
| `TAIGA_HOST` | URL de tu instancia (ej: `https://taiga.tuempresa.com`) |
| `TAIGA_AUTH_TYPE` | `normal` o `ldap` |
| `TAIGA_USERNAME` | Tu nombre de usuario |
| `TAIGA_PASSWORD` | Tu contraseña |

### Ejemplo de Uso Real
**Herramienta:** `taiga_user_story_create`
```json
{
  "project_id": 123,
  "subject": "Implementar Login OAuth2",
  "status": "In Progress"
}
```

---

## 3. Bruno MCP Server
**Ubicación:** `.\bruno-mcp-server`

Expone 65 herramientas para gestionar colecciones de Bruno (REST API) de forma programática: requests, environments, ejecución de tests y scripts.

### Pasos de Instalación
1.  **Navegar al directorio:** `cd c:\Users\nerie\Documents\mcp\bruno-mcp-server`
2.  **Instalar dependencias:** `npm install`
3.  **Compilar:** `npm run build`

### Configuración de Entorno
| Variable | Descripción |
| :--- | :--- |
| `BRUNO_COLLECTIONS_BASE_PATH` | Ruta absoluta donde se encuentra tu colección `.bru` |
| `BRUNO_DEFAULT_COLLECTION` | Nombre de la colección por defecto |

### Ejemplo de Uso Real
**Herramienta:** `bruno_run_request`
```json
{
  "path": "auth/login.bru",
  "env": "production"
}
```

---

## 4. Keycloak MCP Server
**Ubicación:** `.\keycloak-mcp-server`

Permite la gestión completa de Keycloak (Admin REST API v26+) y análisis directo de su base de datos PostgreSQL (DB Inspector).

### Pasos de Instalación
1.  **Navegar al directorio:** `cd c:\Users\nerie\Documents\mcp\keycloak-mcp-server`
2.  **Instalar dependencias:** `npm install`
3.  **Compilar:** `npm run build`

### Configuración de Autenticación
| Variable | Descripción |
| :--- | :--- |
| `KC_HOST` | URL de Keycloak (ej: `https://auth.tuempresa.com`) |
| `KC_CLIENT_ID` | Client ID con permisos de admin |
| `KC_CLIENT_SECRET` | Secret del cliente |

### Ejemplo de Uso Real
**Herramienta:** `kc_user_create`
```json
{
  "realm": "master",
  "username": "jdoe",
  "email": "jdoe@example.com",
  "enabled": true
}
```

---

## 5. Laravel Scramble MCP Server
**Ubicación:** `.\laravel-scramble-mcp-server`

Descubre dinámicamente endpoints de APIs Laravel documentadas con Scramble y los expone como herramientas MCP tipadas.

### Pasos de Instalación
1.  **Navegar al directorio:** `cd c:\Users\nerie\Documents\mcp\laravel-scramble-mcp-server`
2.  **Instalar dependencias:** `npm install`
3.  **Compilar:** `npm run build`

### Configuración
| Variable | Descripción |
| :--- | :--- |
| `LARAVEL_API_BASE_URL` | URL base de la API (ej: `https://api.myapp.com`) |
| `AUTH_TYPE` | `bearer`, `apiKey`, `basic`, `oauth2` |

### Ejemplo de Uso Real
**Herramienta:** `scramble_users_index` (Nombre dinámico basado en operationId)
```json
{
  "per_page": 10,
  "search": "neri"
}
```

---

## 6. Postgres Optimizer MCP Server
**Ubicación:** `.\postgres-mcp-server`

Análisis, optimización y mantenimiento avanzado de bases de datos PostgreSQL (v16+). Detecta consultas lentas, indexación faltante y problemas de integridad.

### Pasos de Instalación
1.  **Navegar al directorio:** `cd c:\Users\nerie\Documents\mcp\postgres-mcp-server`
2.  **Instalar dependencias:** `npm install`
3.  **Compilar:** `npm run build`

### Configuración de Conexión
| Variable | Descripción |
| :--- | :--- |
| `PG_HOST` | Host de la DB |
| `PG_DATABASE` | Nombre de la DB |
| `PG_USER` | Usuario |
| `PG_PASSWORD` | Contraseña |
| `PG_ALLOW_MAINTENANCE` | `true`/`false` (Permite ejecutar VACUUM/REINDEX) |

### Ejemplo de Uso Real
**Herramienta:** `pg_table_detail`
```json
{
  "schema": "public",
  "table": "users"
}
```

---

## Ejemplo de `mcp.json` para Claude Desktop

Para habilitar todos los servidores a la vez (usando rutas absolutas en Windows):

```json
{
  "mcpServers": {
    "gitea": {
      "command": "node",
      "args": ["c:/Users/nerie/Documents/mcp/gitea-mcp-server/dist/index.js"],
      "env": { "GITEA_BASE_URL": "...", "GITEA_TOKEN": "..." }
    },
    "taiga": {
      "command": "node",
      "args": ["c:/Users/nerie/Documents/mcp/taiga-mcp-server/dist/index.js"],
      "env": { "TAIGA_HOST": "...", "TAIGA_USERNAME": "...", "TAIGA_PASSWORD": "..." }
    },
    "bruno": {
      "command": "node",
      "args": ["c:/Users/nerie/Documents/mcp/bruno-mcp-server/dist/index.js"],
      "env": { "BRUNO_COLLECTIONS_BASE_PATH": "C:/api-collections" }
    },
    "keycloak": {
      "command": "node",
      "args": ["c:/Users/nerie/Documents/mcp/keycloak-mcp-server/dist/index.js"],
      "env": { "KC_HOST": "...", "KC_CLIENT_ID": "...", "KC_CLIENT_SECRET": "..." }
    },
    "laravel": {
      "command": "node",
      "args": ["c:/Users/nerie/Documents/mcp/laravel-scramble-mcp-server/dist/index.js"],
      "env": { "LARAVEL_API_BASE_URL": "..." }
    },
    "postgres": {
      "command": "node",
      "args": ["c:/Users/nerie/Documents/mcp/postgres-mcp-server/dist/index.js"],
      "env": { "PG_HOST": "...", "PG_DATABASE": "...", "PG_USER": "...", "PG_PASSWORD": "..." }
    }
  }
}
```

---

## Notas Generales y Mejores Prácticas

-   **Node.js:** Requiere **v20** o superior.
-   **TypeScript:** Todos los proyectos están en TS y requieren `npm run build` antes de ejecutarse si se usa `node dist/index.js`. También puedes usar `npm run dev` para desarrollo.
-   **Rutas en Windows:** En archivos JSON, usa barras inclinadas `/` o escapar las barras invertidas `\\`.
-   **Permisos de Base de Datos:** El servidor Postgres requiere privilegios suficientes para leer catálogos de sistema (`pg_catalog`) y vistas de estadísticas (`pg_stat_statements`).
-   **Tokens:** Nunca expongas tokens en repositorios públicos. Usa el archivo `.env` o la configuración directa del cliente MCP.
