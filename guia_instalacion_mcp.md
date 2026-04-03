# Guía de Instalación y Configuración: MCP Servers (Gitea & Taiga)

Este documento detalla los pasos necesarios para instalar, configurar y ejecutar los servidores MCP de Gitea y Taiga en su entorno local.

---

## 1. Gitea MCP Server
**Ubicación:** `.\gitea-mcp-server`

Este servidor permite interactuar con la API de Gitea (v1.25) exponiendo aproximadamente 269 herramientas para gestionar repositorios, issues, pull requests, organizaciones y más.

### Pasos de Instalación
1.  **Navegar al directorio:**
    ```powershell
    cd c:\Users\nerie\Documents\mcp\gitea-mcp-server
    ```
2.  **Instalar dependencias:**
    ```powershell
    npm install
    ```
3.  **Compilar el proyecto:**
    ```powershell
    npm run build
    ```

### Configuración de Autenticación
Gitea MCP soporta tres tipos de autenticación. Debes definir las siguientes variables de entorno:

| Variable | Descripción |
| :--- | :--- |
| `GITEA_BASE_URL` | URL de tu instancia (ej: `https://gitea.tuempresa.com`) |
| `GITEA_AUTH_TYPE` | `token`, `native` o `ldap` |

- **Si usas `token` (Recomendado):** Requiere `GITEA_TOKEN`.
- **Si usas `native`:** Requiere `GITEA_USERNAME` y `GITEA_PASSWORD`.
- **Si usas `ldap`:** Requiere `GITEA_LDAP_USERNAME` y `GITEA_LDAP_PASSWORD`.

### Ejemplo de Configuración en `mcp.json`
Para usarlo con Claude Desktop u otros clientes MCP:

```json
{
  "mcpServers": {
    "gitea": {
      "command": "node",
      "args": ["c:/Users/nerie/Documents/mcp/gitea-mcp-server/dist/index.js"],
      "env": {
        "GITEA_BASE_URL": "https://tu-gitea.com",
        "GITEA_AUTH_TYPE": "token",
        "GITEA_TOKEN": "TU_TOKEN_AQUI"
      }
    }
  }
}
```

---

## 2. Taiga MCP Server
**Ubicación:** `.\taiga-mcp-server`

Este servidor expone 71 herramientas para la gestión completa de proyectos ágiles en Taiga (Epics, User Stories, Sprints, Tareas, etc.).

### Pasos de Instalación
1.  **Navegar al directorio:**
    ```powershell
    cd c:\Users\nerie\Documents\mcp\taiga-mcp-server
    ```
2.  **Instalar dependencias:**
    ```powershell
    npm install
    ```
3.  **Configurar archivo local (opcional para desarrollo):**
    ```powershell
    copy .env.example .env
    # Edita el archivo .env con tus credenciales
    ```
4.  **Compilar el proyecto:**
    ```powershell
    npm run build
    ```

### Configuración de Autenticación
| Variable | Descripción |
| :--- | :--- |
| `TAIGA_HOST` | URL de tu instancia (ej: `https://taiga.tuempresa.com`) |
| `TAIGA_AUTH_TYPE` | `normal` o `ldap` |
| `TAIGA_USERNAME` | Tu nombre de usuario |
| `TAIGA_PASSWORD` | Tu contraseña |

### Ejemplo de Configuración en `mcp.json`
```json
{
  "mcpServers": {
    "taiga": {
      "command": "node",
      "args": ["c:/Users/nerie/Documents/mcp/taiga-mcp-server/dist/index.js"],
      "env": {
        "TAIGA_HOST": "https://taiga.tuempresa.com",
        "TAIGA_AUTH_TYPE": "normal",
        "TAIGA_USERNAME": "usuario",
        "TAIGA_PASSWORD": "password"
      }
    }
  }
}
```

---

## Notas Generales
- **Requisitos:** Asegúrate de tener instalado **Node.js v20** o superior.
- **Rutas:** En los archivos de configuración JSON, asegúrate de usar rutas absolutas y barras inclinadas (`/`) o barras invertidas dobles (`\\`) para evitar errores en Windows.
- **Seguridad:** No compartas tus tokens o contraseñas en archivos públicos. Usa siempre las variables de entorno configuradas en el cliente MCP.
