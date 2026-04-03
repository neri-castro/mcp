# taiga-mcp

Model Context Protocol Server para la **Taiga REST API**.
Expone **71 herramientas** para gestión completa de proyectos ágiles desde un LLM (Claude, GPT-4, etc.).

## Stack

| Tecnología | Uso |
|---|---|
| Node.js 20+ / TypeScript 5 | Runtime |
| `@modelcontextprotocol/sdk` | MCP Server |
| `axios` | HTTP Client con interceptors |
| `zod` | Validación de esquemas |
| `pino` | Logging estructurado JSON |
| `zod-to-json-schema` | Conversión de schemas para MCP |

## Arquitectura

```
MCP Tool Layer       →  src/tools/*.tools.ts       (71 herramientas, schemas Zod)
Service Layer        →  src/services/*.ts           (lógica de negocio, OCC)
Repository Layer     →  src/repositories/*.ts       (abstracción HTTP)
HTTP Client Layer    →  src/http/TaigaHttpClient.ts (Axios + interceptors)
Auth Layer           →  src/auth/                   (JWT, refresh, LDAP)
```

## Instalación

```bash
npm install
cp .env.example .env
# Edita .env con tus credenciales de Taiga
npm run build
```

## Configuración

```env
TAIGA_HOST=https://taiga.mycompany.com
TAIGA_AUTH_TYPE=normal          # o "ldap"
TAIGA_USERNAME=mi-usuario
TAIGA_PASSWORD=mi-contraseña
LOG_LEVEL=info
```

## Uso con Claude Desktop

Agrega en `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "taiga": {
      "command": "node",
      "args": ["/ruta/a/taiga-mcp/dist/index.js"],
      "env": {
        "TAIGA_HOST": "https://taiga.mycompany.com",
        "TAIGA_AUTH_TYPE": "normal",
        "TAIGA_USERNAME": "usuario",
        "TAIGA_PASSWORD": "contraseña"
      }
    }
  }
}
```

## Herramientas disponibles (71 tools)

| Módulo | Tools |
|---|---|
| Autenticación | `taiga_auth_login`, `taiga_auth_refresh`, `taiga_auth_me` |
| Proyectos (10) | `taiga_project_list/create/get/get_by_slug/edit/delete/stats/modules/create_tag/duplicate` |
| Épicas (16) | `taiga_epic_list/create/get/get_by_ref/edit/delete/bulk_create/link_userstory/unlink_userstory/bulk_link_userstories/list_related_userstories/change_status/add_attachment/list_attachments/watch/filters_data` |
| Historias de Usuario (16) | `taiga_us_list/create/get/get_by_ref/edit/delete/bulk_create/change_status/assign_to_sprint/move_to_kanban_column/bulk_update_order/bulk_assign_sprint/add_attachment/list_attachments/watch/vote` |
| Tareas (13) | `taiga_task_list/create/get/get_by_ref/edit/delete/bulk_create/change_status/assign/add_attachment/watch/vote/filters_data` |
| Issues (17) | `taiga_issue_list/create/get/edit/delete/change_status/change_priority/change_severity/assign/promote_to_us/add_attachment/watch/vote/list_types/list_priorities/list_severities/filters_data` |
| Sprints (10) | `taiga_sprint_list/create/get/edit/delete/stats/add_userstory/remove_userstory/bulk_add_userstories/watch` |
| Kanban & Estados (10) | `taiga_status_list_epic/us/task/issue/create/edit/delete/reorder`, `taiga_kanban_move_card/bulk_move` |
| Atributos Custom (6) | `taiga_custom_attr_list/create/edit/delete/get_values/set_values` |
| Wiki (9) | `taiga_wiki_list/create/get/get_by_slug/edit/delete/link_create/link_delete/watch` |
| Historial (6) | `taiga_history_get`, `taiga_comment_add/edit/delete/restore/versions` |
| Webhooks (7) | `taiga_webhook_list/create/edit/delete/test/logs/resend` |
| Búsqueda (1) | `taiga_search` |
| Usuarios (11) | `taiga_user_me/get/list`, `taiga_membership_list/invite/bulk_invite/change_role/remove`, `taiga_role_list/create/edit` |
| Estadísticas (5) | `taiga_timeline_project/user`, `taiga_stats_project/issues/sprint` |
| Importadores (5) | `taiga_export_project/import_project/import_from_trello/import_from_github/import_from_jira` |

## Patrones de diseño aplicados

- **SOLID**: cada clase tiene una única responsabilidad; interfaces segregadas por dominio (`IEpicReader`, `IEpicWriter`, `IEpicRelationManager`)
- **DRY**: `BaseRepository<T>` genérico con CRUD reutilizable; `withCurrentVersion()` para OCC
- **Tell Don't Ask**: los servicios orquestan sin exponer estado interno (ej: `changeStatus` obtiene la versión automáticamente)
- **Repository Pattern**: cada entidad Taiga tiene su propio repository
- **Service Layer**: lógica de negocio y validaciones en services, nunca en los handlers MCP
- **DTO**: todos los datos tipados con interfaces TypeScript

## Manejo de errores

| Error Taiga | Respuesta MCP |
|---|---|
| 401 Unauthorized | Auto-refresh del token + retry |
| 409 OCC Conflict | `OCCConflictError` con hint para obtener versión actual |
| 429 Rate Limit | Espera `retry-after` + retry automático |
| 400/403/404/500 | `TaigaAPIError` con mensaje descriptivo para el LLM |

