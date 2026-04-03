# Gitea MCP

**Model Context Protocol** para Gitea API v1.25  
Autenticación LDAP + Nativa · ~269 tools · TypeScript

---

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│           MCP Tools Layer (~269 tools)              │
│  repo_*, issue_*, user_*, org_*, actions_*, ...     │
├─────────────────────────────────────────────────────┤
│              Service Layer (Dominio)                │
│  RepoService  IssueService  UserService  ...        │
├─────────────────────────────────────────────────────┤
│         Repository / HTTP Client Layer              │
│    GiteaHttpClient (retry, pagination, error map)   │
├─────────────────────────────────────────────────────┤
│              Authentication Layer                   │
│     NativeAuthProvider | LDAPAuthProvider           │
└─────────────────────────────────────────────────────┘
```

### Principios aplicados
- **SRP**: Cada tool encapsula exactamente una operación atómica
- **DRY**: Cliente HTTP único, builders de tools por dominio
- **Repository Pattern**: `GiteaHttpClient` desacoplado de la lógica de negocio
- **Service Layer**: Dominio separado por recurso (RepoService, IssueService...)
- **ISP**: `IAuthProvider` segregado → `NativeAuthProvider` / `LDAPAuthProvider`
- **DTOs**: Interfaces tipadas para cada operación
- **Tell Don't Ask**: Las tools ejecutan efectos directamente

---

## Instalación

```bash
npm install
npm run build
```

---

## Configuración

### Variables de entorno

| Variable              | Tipo              | Descripción                          | Obligatoria  |
|-----------------------|-------------------|--------------------------------------|-------------|
| `GITEA_BASE_URL`      | string            | URL base de la instancia Gitea       | Sí          |
| `GITEA_AUTH_TYPE`     | token\|native\|ldap | Tipo de autenticación              | Sí          |
| `GITEA_TOKEN`         | string            | Token personal de acceso (PAT)       | Condicional |
| `GITEA_USERNAME`      | string            | Usuario nativo                       | Condicional |
| `GITEA_PASSWORD`      | string            | Contraseña nativa                    | Condicional |
| `GITEA_LDAP_USERNAME` | string            | Usuario LDAP (uid/sAMAccountName)    | Condicional |
| `GITEA_LDAP_PASSWORD` | string            | Contraseña LDAP                      | Condicional |
| `GITEA_OTP`           | string            | Código TOTP si la cuenta tiene 2FA   | Opcional    |
| `GITEA_SUDO_USER`     | string            | Usuario a impersonar (solo admins)   | Opcional    |
| `GITEA_REQUEST_TIMEOUT` | number          | Timeout en ms (default: 30000)       | Opcional    |
| `GITEA_MAX_RETRIES`   | number            | Reintentos 5xx (default: 3)          | Opcional    |

---

## Configuración MCP (mcp.json)

### Con Token (recomendado)
```json
{
  "mcpServers": {
    "gitea": {
      "command": "node",
      "args": ["/ruta/a/gitea-mcp/dist/index.js"],
      "env": {
        "GITEA_BASE_URL": "https://git.empresa.com",
        "GITEA_AUTH_TYPE": "token",
        "GITEA_TOKEN": "tu_token_personal"
      }
    }
  }
}
```

### Con LDAP
```json
{
  "mcpServers": {
    "gitea": {
      "command": "node",
      "args": ["/ruta/a/gitea-mcp/dist/index.js"],
      "env": {
        "GITEA_BASE_URL": "https://git.empresa.com",
        "GITEA_AUTH_TYPE": "ldap",
        "GITEA_LDAP_USERNAME": "john.doe",
        "GITEA_LDAP_PASSWORD": "password_ldap"
      }
    }
  }
}
```

### Con usuario/contraseña nativa
```json
{
  "mcpServers": {
    "gitea": {
      "command": "node",
      "args": ["/ruta/a/gitea-mcp/dist/index.js"],
      "env": {
        "GITEA_BASE_URL": "https://git.empresa.com",
        "GITEA_AUTH_TYPE": "native",
        "GITEA_USERNAME": "admin",
        "GITEA_PASSWORD": "contraseña"
      }
    }
  }
}
```

---

## Scopes de Token requeridos

| Dominio          | Scopes                       |
|------------------|------------------------------|
| Repositorios     | `read/write:repository`      |
| Issues & PRs     | `read/write:issue`           |
| Organizaciones   | `read/write:organization`    |
| Usuarios         | `read/write:user`            |
| Notificaciones   | `read/write:notification`    |
| Paquetes         | `read/write:package`         |
| Admin del sistema| Token de site admin          |

---

## Tools disponibles (~269)

| Dominio               | Tools | Ejemplos                                    |
|-----------------------|-------|---------------------------------------------|
| Repositorios (CRUD)   | ~55   | `repo_create`, `repo_update`, `repo_fork`   |
| Branches & Protección | ~9    | `branch_create`, `branch_protection_create` |
| Tags & Releases       | ~14   | `tag_create`, `release_create`              |
| Contenido de archivos | ~7    | `file_get`, `file_create`, `file_update`    |
| Colaboradores         | ~8    | `collaborator_add`, `teams_list`            |
| Webhooks              | ~9    | `repo_hook_create`, `repo_hook_test`        |
| Commits & Diffs       | ~9    | `commit_list`, `commit_compare`             |
| Issues                | ~28   | `issue_create`, `issue_update`, `time_add`  |
| Pull Requests         | ~22   | `pr_create`, `pr_merge`, `review_create`    |
| Usuarios              | ~30   | `user_get`, `user_add_ssh_key`              |
| Organizaciones        | ~18   | `org_create`, `org_list_members`            |
| Teams                 | ~15   | `team_create`, `team_add_member`            |
| Gitea Actions         | ~40   | `actions_workflow_dispatch`, `actions_run_cancel` |
| Notificaciones        | ~7    | `notification_list`, `notification_mark_all_read` |
| Package Registry      | ~4    | `package_list_user`, `package_delete`       |
| Admin del sistema     | ~20   | `admin_user_create`, `admin_cron_run`       |
| Misceláneos           | ~12   | `gitea_version`, `render_markdown`          |

---

## Desarrollo

```bash
# Modo desarrollo con hot reload
npm run dev

# Tests
npm test

# Build producción
npm run build
npm start
```

---

## Notas de seguridad

- Nunca hardcodear tokens en el código fuente
- Usar el mínimo de scopes necesarios (Principio de Mínimo Privilegio)
- Para operaciones de solo lectura, crear tokens solo con scopes `read:*`
- Para TLS self-signed en desarrollo: `GITEA_TLS_VERIFY=false`
- Rotar tokens regularmente (Gitea no tiene expiración automática)

---

*Gitea MCP · Especificación Técnica v1.0 · 2026*
