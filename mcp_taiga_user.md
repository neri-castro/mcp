# Taiga MCP Server - Guía del Usuario

Esta guía detalla cómo interactuar con Taiga (v6+) utilizando el protocolo MCP desde Claude u otros clientes de IA.

## 🚀 Inicio Rápido

El servidor MCP de Taiga ofrece aproximadamente **71 herramientas** para la gestión de proyectos, épicas, historias de usuario, tareas, issues y sprints.

### Configuración de Credenciales

Configura estas variables en tu cliente MCP:

| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `TAIGA_HOST` | URL de tu instancia de Taiga | `https://taiga.tuempresa.com` |
| `TAIGA_AUTH_TYPE` | Método: `normal` o `ldap` | `normal` |
| `TAIGA_USERNAME` | Tu nombre de usuario | `neri` |
| `TAIGA_PASSWORD` | Tu contraseña | `********` |

---

## 🛠️ Herramientas Principales

El servidor se organiza en varios módulos para facilitar la interacción:

1.  **Proyectos:** Listado, creación, estadísticas y configuración de módulos.
2.  **Epics:** Gestión de épicas, vinculación con historias de usuario (US), adjuntos.
3.  **User Stories (US):** CRUD de historias, cambio de estados, asignación a sprints y votación.
4.  **Tareas & Issues:** Gestión del día a día, cambio de prioridades y severidad (Issues).
5.  **Sprints:** Planificación y gestión de backlogs por iteración.
6.  **Wiki:** Documentación de proyecto (crear/editar páginas de wiki).
7.  **Historial & Comentarios:** Consultar cambios pasados y añadir comentarios.

---

## 💡 Ejemplos de Uso Reales

### 1. Planificar un Sprint
**Prompt:** "¿Cuál es el sprint actual de 'mcp-project'? Lista las historias de usuario que tiene asignadas."
**Herramienta Interna:** `taiga_sprint_list` y `taiga_us_list`
```json
{
  "project": 12 
}
```

### 2. Crear una Épica y vincularla
**Prompt:** "Crea una épica llamada 'Migración a Next.js' en el proyecto de backend y asígnale mi usuario."
**Herramienta Interna:** `taiga_epic_create`
```json
{
  "project": 5,
  "subject": "Migración a Next.js",
  "assigned_to": 123 
}
```

### 3. Reportar un Issue con prioridad
**Prompt:** "Reporta un issue crítico de seguridad en 'ecommerce-site'. Ponle prioridad 'Alta' y severidad 'Brava'."
**Herramienta Interna:** `taiga_issue_create`
```json
{
  "project": 8,
  "subject": "Falla de seguridad: Inyección SQL",
  "priority": 3, 
  "severity": 4
}
```

---

## ❓ Solución de Problemas

-   **Error de Versión (OCC):** Taiga utiliza Optimistic Concurrency Control. Si recibes un error 409 al editar, primero obtén la versión más reciente del objeto usando la herramienta `get` correspondiente.
-   **Autenticación Fallida:** Si usas LDAP, asegúrate de que el `TAIGA_AUTH_TYPE` esté seteado correctamente. El servidor realizará login automático y refrescará el token JWT según sea necesario.
-   **IDs numéricos:** Muchas herramientas requieren el `project_id`. Puedes obtenerlo primero con `taiga_project_list` o `taiga_project_get_by_slug`.
