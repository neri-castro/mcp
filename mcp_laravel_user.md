# Laravel Scramble MCP Server - Guía del Usuario

Esta guía explica cómo interactuar dinámicamente con cualquier API Laravel documentada con Scramble mediante el protocolo MCP.

## 🚀 Inicio Rápido

A diferencia de los otros servidores, este se **adapta automáticamente** a tu API. Al iniciar, consume el archivo OpenAPI de Scramble (`/docs/api.json`) y genera herramientas MCP tipadas para cada endpoint detectado.

### Configuración de Entorno

Configura estas variables en tu cliente MCP:

| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `LARAVEL_API_BASE_URL` | URL base de tu API Laravel | `https://api.tu-app.com` |
| `AUTH_TYPE` | Método: `bearer`, `apiKey` o `basic` | `bearer` |
| `AUTH_TOKEN` | Tu Token JWT o API Key | `eyJ...` |

---

## 🛠️ Herramientas Dinámicas

El servidor genera herramientas automáticas basadas en el `operationId` de Scramble:

1.  **Core Tools:** `scramble_discover` (recargar API), `scramble_list_tools` (ver endpoints disponibles), `scramble_auth_login` (autenticarse vía endpoint).
2.  **API Tools (Generadas):** Para cada ruta en tu API Laravel, como `scramble_users_index`, `scramble_posts_store`, `scramble_orders_show`, etc.
3.  **Paginación Automática:** Herramienta `scramble_paginate_all` para obtener todos los resultados de endpoints paginados de Laravel.
4.  **File Uploads:** Soporte para subir archivos (`multipart/form-data`) si Scramble detecta validaciones de archivos en tu controlador.

---

## 💡 Ejemplos de Uso Reales

### 1. Descubrir la API
**Prompt:** "¿Qué puedo hacer en esta API? Actualiza las herramientas disponibles."
**Herramienta Interna:** `scramble_discover`
```json
{
  "docs_path": "/docs/api.json"
}
```

### 2. Crear un Recurso tipado
**Prompt:** "Crea un nuevo post 'Mi primer post' con la categoría #1."
**Herramienta Interna:** `scramble_posts_store` (Nombre generado dinámicamente)
```json
{
  "title": "Mi primer post",
  "content": "Contenido del post...",
  "category_id": 1
}
```

### 3. Login y persistencia
**Prompt:** "Haz login con mi usuario 'neri@example.com' y guarda el token para las siguientes peticiones."
**Herramienta Interna:** `scramble_auth_login`
```json
{
  "username": "neri@example.com",
  "password": "password123"
}
```

---

## ❓ Solución de Problemas

-   **Herramienta No Encontrada:** Si has añadido un nuevo controlador en Laravel, ejecuta `scramble_discover` para que el servidor regenere las herramientas MCP.
-   **Error de Validación (422):** El servidor mapea los errores de validación de Laravel a mensajes claros para el LLM. Revisa que los tipos de datos (string, int, etc.) coincidan con las reglas de validación de tu proyecto.
-   **Ruta de Documentación Distinta:** Por defecto el servidor busca `/docs/api.json`. Si tu Scramble está en otra ruta, configúralo en la variable `LARAVEL_DOCS_PATH`.
-   **Token Expirado:** Scramble MCP refrescará el token automáticamente si detecta un error 401 y tienes configurado el flow de `auth_login`.
