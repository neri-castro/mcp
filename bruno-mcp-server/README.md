# Bruno MCP Server

**Model Context Protocol Server** para Bruno REST API — v1.0.0

Expone las capacidades de Bruno como **65 herramientas MCP** utilizables por cualquier LLM compatible (Claude, GPT-4, etc.), permitiendo gestionar colecciones Bruno de forma programática: requests, environments, variables, autenticación, tests, scripts, assertions y más.

---

## Stack Técnico

| Componente | Tecnología |
|---|---|
| Runtime | Node.js 20+ / TypeScript 5+ |
| MCP SDK | `@modelcontextprotocol/sdk` |
| Parser .bru | `@usebruno/lang` |
| CLI Runner | `@usebruno/cli` |
| Validación | `zod` |
| Logging | `pino` |
| Testing | `vitest` |

---

## Arquitectura

```
MCP Tool Layer         ← 65 tools (Zod schemas, handlers)
    ↓
Service Layer          ← Lógica de negocio (Tell Don't Ask, ISP)
    ↓
Repository Layer       ← Abstracción filesystem (BaseFileRepository<T>)
    ↓
Bru Lang / FS Layer    ← @usebruno/lang parser + fs/promises
    ↓
Bruno CLI Layer        ← bru run (ejecución)
```

### Principios Aplicados

| Principio | Implementación |
|---|---|
| **SOLID** | Cada clase tiene responsabilidad única; interfaces segregadas por dominio |
| **DRY** | `BaseFileRepository<T>` genérico; `BruParser`/`BruSerializer` centralizados |
| **Tell Don't Ask** | Los tools delegan completamente al service layer |
| **ISP** | `ICollectionReader`, `ICollectionWriter`, `IRequestRunner`, `IEnvironmentManager`, etc. |
| **Repository Pattern** | `CollectionRepository`, `RequestRepository`, `EnvironmentRepository` |
| **Service Layer** | Lógica de negocio nunca en handlers MCP |
| **DTO** | Todos los datos de entrada/salida mapeados a DTOs Zod con validación |

---

## Instalación

```bash
# 1. Clonar / copiar el proyecto
cd bruno-mcp

# 2. Instalar dependencias
npm install

# 3. Configurar entorno
cp .env.example .env
# Editar .env: establecer BRUNO_COLLECTIONS_BASE_PATH

# 4. Compilar
npm run build

# 5. Ejecutar
npm start
```

---

## Configuración (.env)

```env
BRUNO_COLLECTIONS_BASE_PATH=/home/user/api-collections  # REQUERIDO
BRUNO_DEFAULT_COLLECTION=my-api
BRUNO_DEFAULT_TIMEOUT_MS=10000
BRUNO_BAIL_ON_FAILURE=false
BRUNO_INSECURE_SSL=false
BRUNO_REPORTS_DIR=/tmp/bruno-mcp-reports
BRUNO_DEFAULT_REPORT_FORMAT=json
BRUNO_ALLOWED_BASE_PATHS=/home/user,/workspace
BRUNO_SCRIPTS_FILESYSTEM_ACCESS=false
BRUNO_SCRIPTS_MODULE_WHITELIST=crypto,buffer
LOG_LEVEL=info
MCP_SERVER_NAME=bruno-mcp
MCP_TRANSPORT=stdio
```

---

## Registro de 65 Herramientas MCP

### Colecciones & Carpetas (10)
| Tool | Descripción |
|---|---|
| `bruno_collection_create` | Crear colección con `bruno.json` |
| `bruno_collection_get` | Leer metadatos de colección |
| `bruno_collection_list` | Listar colecciones en directorio |
| `bruno_collection_update` | Actualizar `bruno.json` |
| `bruno_collection_delete` | Eliminar colección |
| `bruno_collection_tree` | Árbol completo de carpetas/requests |
| `bruno_folder_create` | Crear carpeta con `folder.bru` |
| `bruno_folder_get` | Leer configuración de carpeta |
| `bruno_folder_update` | Actualizar `folder.bru` |
| `bruno_folder_delete` | Eliminar carpeta y sus requests |

### Requests .bru (12)
| Tool | Descripción |
|---|---|
| `bruno_request_create` | Crear request `.bru` completo |
| `bruno_request_get` | Leer y parsear request |
| `bruno_request_list` | Listar requests de carpeta |
| `bruno_request_update` | Actualizar campos del request |
| `bruno_request_delete` | Eliminar archivo `.bru` |
| `bruno_request_clone` | Clonar request existente |
| `bruno_request_set_header` | Agregar/editar header |
| `bruno_request_remove_header` | Eliminar header |
| `bruno_request_set_query_param` | Agregar/editar query param |
| `bruno_request_set_body` | Establecer body completo |
| `bruno_request_set_docs` | Documentar en Markdown |
| `bruno_request_reorder` | Reordenar por `seq` |

### Environments & Variables (9)
| Tool | Descripción |
|---|---|
| `bruno_env_list` | Listar environments |
| `bruno_env_create` | Crear environment `.bru` |
| `bruno_env_get` | Leer variables de environment |
| `bruno_env_update` | Actualizar variables |
| `bruno_env_delete` | Eliminar environment |
| `bruno_env_set_var` | Agregar/actualizar variable |
| `bruno_env_remove_var` | Eliminar variable |
| `bruno_env_mark_secret` | Marcar variables como secretas |
| `bruno_var_interpolate` | Interpolar `{{vars}}` en string |

### Autenticación (10)
| Tool | Descripción |
|---|---|
| `bruno_auth_set_bearer` | Bearer Token |
| `bruno_auth_set_basic` | Basic Auth |
| `bruno_auth_set_apikey` | API Key (header/query) |
| `bruno_auth_set_oauth2` | OAuth2 (4 grant types) |
| `bruno_auth_set_awsv4` | AWS Signature V4 |
| `bruno_auth_set_ntlm` | NTLM (Windows/AD) |
| `bruno_auth_set_digest` | Digest Auth |
| `bruno_auth_set_inherit` | Heredar auth de padre |
| `bruno_auth_set_none` | Sin autenticación |
| `bruno_auth_get` | Leer config de auth actual |

### Scripts (7)
| Tool | Descripción |
|---|---|
| `bruno_script_set_pre_request` | Script pre-request JavaScript |
| `bruno_script_set_post_response` | Script post-response JavaScript |
| `bruno_script_get` | Leer scripts actuales |
| `bruno_script_clear` | Eliminar script pre o post |
| `bruno_script_validate` | Validar sintaxis JS |
| `bruno_vars_pre_set` | `vars:pre-request` declarativo |
| `bruno_vars_post_set` | `vars:post-response` declarativo |

### Tests & Assertions (9)
| Tool | Descripción |
|---|---|
| `bruno_assertion_add` | Agregar assertion declarativa |
| `bruno_assertion_list` | Listar assertions |
| `bruno_assertion_remove` | Eliminar por índice |
| `bruno_assertion_toggle` | Habilitar/deshabilitar |
| `bruno_assertion_clear` | Eliminar todas |
| `bruno_test_set` | Establecer bloque `tests` (Chai) |
| `bruno_test_get` | Leer tests |
| `bruno_test_clear` | Eliminar tests |
| `bruno_test_validate_syntax` | Validar sintaxis JS |

### Runner & CLI (6)
| Tool | Descripción |
|---|---|
| `bruno_run_collection` | Ejecutar colección completa |
| `bruno_run_folder` | Ejecutar subcarpeta |
| `bruno_run_request` | Ejecutar request individual |
| `bruno_run_get_results` | Obtener resultados por ID |
| `bruno_run_generate_report` | Generar reporte JSON/JUnit/HTML |
| `bruno_run_list_reports` | Listar reportes generados |

### Secret Management (5)
| Tool | Descripción |
|---|---|
| `bruno_secret_get_env_template` | Generar `.env.example` |
| `bruno_secret_list` | Listar variables secretas |
| `bruno_secret_add` | Declarar variable como secreta |
| `bruno_secret_remove` | Quitar declaración secreta |
| `bruno_secret_generate_gitignore` | Generar `.gitignore` |

### Import / Export (6)
| Tool | Descripción |
|---|---|
| `bruno_import_postman` | Importar Postman Collection v2.1 |
| `bruno_import_insomnia` | Importar workspace Insomnia |
| `bruno_import_openapi` | Generar colección desde OpenAPI 3.0 |
| `bruno_import_wsdl` | Generar requests desde WSDL |
| `bruno_export_openapi` | Exportar como OpenAPI spec |
| `bruno_export_postman` | Exportar como Postman collection |

---

## Formato de Respuesta

Todas las herramientas devuelven JSON estructurado:

```json
// Éxito
{
  "success": true,
  "data": { ... },
  "meta": {
    "path": "/collections/my-api/auth/login.bru",
    "operation": "bruno_request_get",
    "timestamp": "2026-04-03T12:00:00Z"
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "FILE_NOT_FOUND",
    "message": "El archivo .bru no existe en la ruta especificada.",
    "path": "/collections/my-api/auth/login.bru",
    "hint": "Usa bruno_request_list para ver los requests disponibles."
  }
}
```

### Códigos de Error

| Código | Causa |
|---|---|
| `FILE_NOT_FOUND` | Ruta `.bru` no existe |
| `PARSE_ERROR` | `.bru` malformado |
| `VALIDATION_ERROR` | DTO inválido (Zod) |
| `COLLECTION_NOT_FOUND` | Colección no existe |
| `ENV_NOT_FOUND` | Environment no existe |
| `PATH_NOT_ALLOWED` | Ruta fuera de `allowedBasePaths` |
| `CLI_NOT_INSTALLED` | `bru` CLI no encontrado |
| `RUN_FAILED` | Error en ejecución |
| `PERMISSION_DENIED` | Sin permisos de escritura |

---

## Tests

```bash
# Ejecutar tests unitarios
npm test

# Con cobertura
npm run test:coverage
```

---

## Flujo Completo Recomendado

```
1. bruno_collection_create    → Crear colección
2. bruno_env_create (x3)      → development / staging / production
3. bruno_env_mark_secret      → Marcar secretos
4. bruno_folder_create        → Crear carpeta "auth"
5. bruno_auth_set_bearer      → Auth Bearer en folder.bru
6. bruno_request_create       → Request "Login" con vars_post + assertions + script_post
7. bruno_request_create (xN)  → Requests del negocio con auth: inherit
8. bruno_run_collection       → Ejecutar colección completa
9. bruno_run_get_results      → Ver resultados
10. bruno_secret_generate_gitignore → Proteger .env
```

---

**Basado en:** Bruno v3.x · Bru Lang · MCP SDK · Node.js 20+ · TypeScript 5+

**Documentación oficial Bruno:** https://docs.usebruno.com
