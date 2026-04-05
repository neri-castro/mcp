# Bruno MCP Server - Guía del Usuario

Esta guía explica cómo manejar tus colecciones de API de Bruno directamente desde Claude u otros clientes compatibles con MCP.

## 🚀 Inicio Rápido

El servidor MCP para Bruno expone **65 herramientas** que permiten crear, editar y ejecutar requests de API almacenados en archivos `.bru`.

### Configuración de Entorno

Configura estas variables en tu cliente MCP:

| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `BRUNO_COLLECTIONS_BASE_PATH` | Ruta absoluta a tu directorio de colecciones | `C:/Users/neri/Documents/bruno` |
| `BRUNO_DEFAULT_COLLECTION` | Colección para acciones sin ruta completa | `my-api` |

---

## 🛠️ Herramientas Principales

El servidor opera directamente sobre el sistema de archivos, parseando archivos `.bru`:

1.  **Colecciones:** Crear/listar colecciones y gestionar el archivo `bruno.json`.
2.  **Requests:** Crear requests `.bru` (GET, POST, etc.), definir headers, query params y bodies.
3.  **Ambientes:** Crear ambientes (`.bru`) y gestionar variables globales.
4.  **Autenticación:** Configurar Bearer, Basic, OAuth2, etc., en carpetas o requests individuales.
5.  **Scripts & Tests:** Definir scripts pre-request, post-response y aserciones Chai.
6.  **Runner:** Ejecutar colecciones, carpetas o requests individuales y obtener resultados.
7.  **Import/Export:** Importar desde Postman, Insomnia o OpenAPI (v3.0).

---

## 💡 Ejemplos de Uso Reales

### 1. Crear una nueva colección desde OpenAPI
**Prompt:** "Importa este archivo OpenAPI `swagger.json` y crea una nueva colección llamada 'payment-service'."
**Herramienta Interna:** `bruno_import_openapi`
```json
{
  "collection": "payment-service",
  "openapi_path": "/path/to/swagger.json"
}
```

### 2. Ejecutar un request y ver el resultado
**Prompt:** "Ejecuta el request 'Login' en la colección 'my-api' usando el ambiente 'production'."
**Herramienta Interna:** `bruno_run_request`
```json
{
  "path": "auth/login.bru",
  "env": "production"
}
```

### 3. Crear un request con Auth heredada
**Prompt:** "Crea un nuevo request GET 'GetProfile' en la carpeta 'users' que herede la autenticación del padre."
**Herramienta Interna:** `bruno_request_create`
```json
{
  "name": "GetProfile",
  "method": "GET",
  "url": "{{base_url}}/me",
  "auth": { "type": "inherit" }
}
```

---

## ❓ Solución de Problemas

-   **Ruta no permitida:** Por seguridad, el servidor solo puede acceder a rutas dentro de `BRUNO_COLLECTIONS_BASE_PATH`. Asegúrate de que tus colecciones estén dentro de ese directorio.
-   **Error de sintaxis descriptivo:** Si un archivo `.bru` está mal formado, el servidor devolverá un error detallando la línea y causa del fallo de parseo.
-   **Variables no resueltas:** Si usas `{{variable}}`, asegúrate de que el ambiente correspondiente esté cargado o definido por defecto.
