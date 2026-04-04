# Laravel Scramble MCP

**Model Context Protocol Server** para APIs Laravel documentadas con [Scramble](https://scramble.dedoc.co/) (OpenAPI 3.1.0).

Expone dinámicamente **todos** los endpoints de tu API Laravel como tools MCP utilizables por Claude, GPT-4 y cualquier LLM compatible con el protocolo MCP.

---

## Características

| Capacidad | Descripción |
|-----------|-------------|
| **Discovery dinámico** | Consume `/docs/api.json` de Scramble en tiempo de ejecución |
| **Autenticación múltiple** | Bearer JWT, API Key (header/query), OAuth2 Client Credentials, Basic HTTP |
| **Requests tipados** | Path params, query params, body con tipos inferidos de validaciones Laravel |
| **Responses documentadas** | JSON Resources, paginación (LengthAware, Simple, Cursor), modelos, enums |
| **Manejo de errores** | Mapeo automático 401/403/404/409/422/429/500 con hints para el LLM |
| **Retry resiliente** | Auto-refresh de token en 401, backoff exponencial en 429 |
| **Paginación automática** | Soporte para los 3 tipos de paginadores de Laravel |
| **File uploads** | Soporte multipart/form-data detectado desde reglas `file`/`image` |
| **Múltiples versiones** | Soporte para múltiples documentos OpenAPI (v1, v2, etc.) |

---

## Stack Técnico

- **Runtime**: Node.js 20+ · TypeScript 5+
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **HTTP Client**: Axios ^1.x con interceptors para auth y retry
- **Validación**: Zod ^3.x (schemas generados desde OpenAPI JSON Schema)
- **Logging**: Pino + Pino-Pretty
- **Testing**: Vitest

---

## Instalación

```bash
git clone <repo>
cd laravel-scramble-mcp
npm install
cp .env.example .env
# Editar .env con la URL de tu API Laravel
npm run build
```

---

## Configuración

Edita `.env` con los datos de tu API:

```env
# URL base de la API Laravel (SIN trailing slash)
LARAVEL_API_BASE_URL=https://api.myapp.com

# Autenticación
AUTH_TYPE=bearer          # bearer | apiKey | basic | oauth2
AUTH_USERNAME=user@app.com
AUTH_PASSWORD=password
```

### Configuración con Claude Desktop

Agrega en `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "laravel-api": {
      "command": "node",
      "args": ["/ruta/a/laravel-scramble-mcp/dist/index.js"],
      "env": {
        "LARAVEL_API_BASE_URL": "https://api.myapp.com",
        "AUTH_TYPE": "bearer",
        "AUTH_USERNAME": "admin@myapp.com",
        "AUTH_PASSWORD": "secretpassword"
      }
    }
  }
}
```

---

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│              MCP Tool Layer                      │
│   (Tool definitions, JSON schemas, zod valid.)  │
├─────────────────────────────────────────────────┤
│           OpenAPI Discovery Layer                │
│   (Scramble /docs/api.json → Tool Registry)     │
├─────────────────────────────────────────────────┤
│              Service Layer                       │
│   (Business logic, orchestration, validation)   │
├─────────────────────────────────────────────────┤
│            Repository Layer                      │
│   (HTTP call abstraction per OpenAPI operation) │
├─────────────────────────────────────────────────┤
│         HTTP Client / Auth Layer                 │
│   (Token management, interceptors, retry)        │
├─────────────────────────────────────────────────┤
│       Laravel API (Scramble documented)          │
│       https://{host}/api/v1/...                  │
└─────────────────────────────────────────────────┘
```

### Principios aplicados

| Principio | Aplicación |
|-----------|------------|
| **SOLID** | Cada clase tiene una responsabilidad. Interfaces segregadas por dominio |
| **DRY** | Un único `LaravelHttpClient`. `BaseRepository<T>` genérico. `SchemaConverter` reutilizable |
| **Tell Don't Ask** | Los services orquestan operaciones completas sin exponer estado interno |
| **Repository Pattern** | `BaseRepository<T>` genérico con operaciones CRUD tipadas |
| **Service Layer** | Lógica de negocio en Services, nunca en MCP Tool handlers |
| **DTO** | Todos los datos se mapean a DTOs tipados generados desde el schema OpenAPI |

---

## Estructura de Directorios

```
src/
├── index.ts                    # Punto de entrada MCP Server
├── config/
│   └── config.ts               # Variables de entorno validadas con zod
├── openapi/
│   ├── OpenApiLoader.ts        # GET /docs/api.json + cache
│   ├── OpenApiParser.ts        # paths → Operations, parameters, schemas
│   ├── ToolRegistry.ts         # Registro dinámico de tools desde OpenAPI
│   └── dto/
│       └── OpenApiDocumentDTO.ts
├── auth/
│   ├── AuthService.ts          # Lógica de autenticación multi-esquema
│   ├── TokenManager.ts         # Ciclo de vida del token (refresh, retry)
│   └── dto/
│       └── AuthDTO.ts
├── http/
│   ├── LaravelHttpClient.ts    # Axios instance + interceptors
│   └── OperationExecutor.ts   # Ejecuta operations OpenAPI como HTTP calls
├── repositories/
│   └── base/
│       └── BaseRepository.ts  # CRUD genérico: list, get, create, edit, delete
├── services/
│   └── DiscoveryService.ts    # Orquesta carga y parseo del OpenAPI
├── tools/
│   └── core/
│       ├── auth.tools.ts       # Tools de autenticación
│       ├── discovery.tools.ts  # scramble_discover, scramble_list_tools, etc.
│       └── pagination.tools.ts # scramble_paginate_all, scramble_upload_file
├── dto/
│   └── common/
│       └── CommonDTO.ts        # PaginationDTO, ErrorDTO, ApiResponseDTO
└── utils/
    ├── errors.ts               # Jerarquía de errores personalizada
    ├── logger.ts               # Pino logger
    ├── markdown.ts             # Formateo de descriptions para el LLM
    ├── operation-id.ts         # Normalización de operationId → tool name
    ├── pagination.ts           # Helpers para paginadores Laravel
    └── schema-converter.ts    # JSON Schema → Zod runtime conversion
```

---

## Tools MCP Disponibles

### Core Tools (siempre disponibles)

| Tool | Descripción |
|------|-------------|
| `scramble_discover` | Recarga el documento OpenAPI de Scramble |
| `scramble_list_tools` | Lista todos los tools con filtros por tag y búsqueda |
| `scramble_get_schema` | Obtiene el schema JSON de un componente OpenAPI |
| `scramble_spec_info` | Retorna metadata del documento OpenAPI |
| `scramble_list_versions` | Lista versiones de API disponibles |
| `scramble_auth_set_token` | Establece manualmente el token de acceso |
| `scramble_auth_login` | Login via endpoint Laravel |
| `scramble_auth_refresh` | Renueva el access token |
| `scramble_auth_me` | Obtiene datos del usuario autenticado |
| `scramble_auth_oauth_token` | Obtiene token OAuth2 (client credentials) |
| `scramble_paginate_all` | Recupera todas las páginas de un endpoint paginado |
| `scramble_upload_file` | Sube un archivo (multipart/form-data) |

### Dynamic Tools (generados desde Scramble)

Por cada operación en el OpenAPI de Scramble:

| operationId Scramble | Tool MCP generado |
|---------------------|-------------------|
| `users.index` | `scramble_users_index` |
| `users.store` | `scramble_users_store` |
| `users.show` | `scramble_users_show` |
| `users.update` | `scramble_users_update` |
| `users.destroy` | `scramble_users_destroy` |
| `posts.publishedPosts` | `scramble_posts_published_posts` |

---

## Flujo de Uso

```
1. scramble_discover
   → Carga /docs/api.json y registra N tools

2. scramble_auth_login { username, password }
   → { token: "eyJ..." }

3. scramble_posts_index { per_page: 5, status: "published" }
   → { data: [...], meta: { total: 42 } }

4. scramble_posts_store { title: "Mi Post", content: "...", category_id: 1 }
   → PostResource (201)
```

---

## Desarrollo

```bash
# Modo desarrollo
npm run dev

# Tests
npm test

# Build
npm run build

# Lint
npm run lint
```

---

## Compatibilidad

- **Laravel**: 10.x+
- **Scramble**: 0.12.x+
- **OpenAPI**: 3.1.0
- **Node.js**: 20+
- **MCP**: Compatible con Claude Desktop, Claude Code y cualquier cliente MCP
