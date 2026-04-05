# Gitea MCP Server - Guía del Usuario

Esta guía explica cómo utilizar el servidor MCP para interactuar con Gitea desde clientes de IA como Claude Desktop.

## 🚀 Inicio Rápido

El servidor MCP de Gitea expone aproximadamente **269 herramientas** que permiten gestionar repositorios, issues, pull requests, organizaciones y configuraciones de administrador directamente desde tu chat de IA.

### Configuración de Credenciales

Debes configurar las siguientes variables de entorno en tu cliente MCP:

| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `GITEA_BASE_URL` | URL de tu instancia de Gitea | `https://git.tuempresa.com` |
| `GITEA_AUTH_TYPE` | Método de login: `token` o `ldap` | `token` |
| `GITEA_TOKEN` | Tu Token de Acceso Personal (PAT) | `3a1b2c...` |

### Scopes Sugeridos para el Token
Para una funcionalidad completa, asegúrate de que tu token tenga permisos de:
- `repository` (read/write)
- `issue` (read/write)
- `organization` (read/write)
- `user` (read/write)

---

## 🛠️ Herramientas Principales

El servidor divide las capacidades en varios dominios:

1.  **Repositorios:** Crear, listar, fork, editar ajustes de branches.
2.  **Issues & PRs:** Crear issues, comentar, gestionar estados de Pull Requests, revisiones.
3.  **Organizaciones:** Gestión de equipos, miembros y permisos.
4.  **Contenido:** Leer archivos (`file_get`), crear (`file_create`) o actualizar contenido directamente.
5.  **Admin:** Herramientas para la gestión de usuarios y sistema (requiere cuenta admin).

---

## 💡 Ejemplos de Uso Reales

### 1. Consultar el estado de un repositorio
**Prompt:** "¿Cuáles son las pull requests abiertas en el repo 'project-x' de la org 'dev-team'?"
**Herramienta Interna:** `pr_list`
```json
{
  "owner": "dev-team",
  "repo": "project-x",
  "state": "open"
}
```

### 2. Crear un nuevo Issue con etiquetas
**Prompt:** "Crea un issue en 'frontend-app' reportando un bug en el login. Asígnale la etiqueta 'bug' y prioridad 'alta'."
**Herramienta Interna:** `issue_create`
```json
{
  "owner": "neri",
  "repo": "frontend-app",
  "title": "Bug: Error 500 al intentar login con LDAP",
  "body": "Se ha detectado un error intermitente al usar el flow nativo...",
  "labels": [1, 5] 
}
```

### 3. Leer código de un archivo específico
**Prompt:** "Muéstrame el contenido del archivo `src/index.ts` en la rama `main`."
**Herramienta Interna:** `file_get`
```json
{
  "owner": "neri",
  "repo": "mcp-project",
  "filepath": "src/index.ts",
  "ref": "main"
}
```

---

## ❓ Solución de Problemas

-   **Error 401 (Unauthorized):** Verifica que tu `GITEA_TOKEN` no haya expirado y que la `GITEA_BASE_URL` sea correcta (sin `/api/v1` al final).
-   **Error 404 (Not Found):** Asegúrate de que el nombre del usuario/organización y el repositorio estén escritos correctamente (sensible a mayúsculas según configuración del servidor).
-   **Timeout:** Si el repositorio es muy grande, algunas operaciones de listado pueden tardar. Intenta filtrar los resultados.
