# Postgres Optimizer MCP Server - Guía del Usuario

Esta guía explica cómo optimizar, analizar y mantener tus bases de datos PostgreSQL (v16+) utilizando el protocolo MCP.

## 🚀 Inicio Rápido

El servidor para Postgres ofrece **75 herramientas** de diagnóstico y ejecución para administradores de base de datos y desarrolladores, permitiendo detectar cuellos de botella y mejorar el rendimiento de tus schemas.

### Configuración de Conexión

Configura estas variables en tu cliente MCP:

| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `PG_HOST` | Host de la base de datos | `localhost` |
| `PG_PORT` | Puerto de conexión (default 5432) | `5432` |
| `PG_DATABASE` | Base de datos a analizar | `mi_prod_db` |
| `PG_USER` | Usuario con permisos read/write | `pg_admin` |
| `PG_PASSWORD` | Contraseña del usuario | `********` |
| `PG_ALLOW_MAINTENANCE` | Permite ejecutar comandos físicos (`VACUUM`, `REINDEX`) | `true` |

---

## 🛠️ Herramientas Principales

El servidor se organiza en varios módulos de optimización:

1.  **Esquema:** Listar tablas, columnas, constraints, índices y relaciones (`pg_schema_overview`).
2.  **Rendimiento:** Listar queries lentas (`pg_list_slow_queries`), detectar tablas con bloat (fragmentación) (`pg_table_bloat_analysis`).
3.  **Índices:** Detectar índices duplicados, sin usar o necesarios para mejorar FKs (`pg_index_usage_report`).
4.  **Integridad:** Detectar tablas sin Primary Key o relaciones huérfanas (`pg_orphan_tables`).
5.  **Mantenimiento:** Ejecutar `VACUUM ANALYZE` o `REINDEX` (si está habilitado `PG_ALLOW_MAINTENANCE`).
6.  **Configuración:** Sugerencias para ajustar `postgresql.conf` según hardware (`pg_config_recommendations`).

---

## 💡 Ejemplos de Uso Reales

### 1. Detectar Queries Lentas
**Prompt:** "¿Cuáles son las 5 consultas que más tiempo de CPU están consumiendo actualmente?"
**Herramienta Interna:** `pg_list_slow_queries`
```json
{
  "limit": 5,
  "min_exec_time_ms": 1000
}
```

### 2. Analizar fragmentación (Bloat)
**Prompt:** "Analiza el hinchamiento (bloat) de la tabla 'orders' y dime si necesita un VACUUM."
**Herramienta Interna:** `pg_table_bloat_analysis`
```json
{
  "schema": "public",
  "table": "orders"
}
```

### 3. Verificar índices faltantes en FKs
**Prompt:** "Busca relaciones de clave foránea que no tengan índices en la tabla hijo, lo cual podría estar ralentizando los JOINs."
**Herramienta Interna:** `pg_foreign_key_index_check`
```json
{
  "schema": "public"
}
```

---

## ❓ Solución de Problemas

-   **Módulo pg_stat_statements:** Varias herramientas de rendimiento requieren que la extensión `pg_stat_statements` esté habilitada en tu base de datos PostgreSQL. Ejecuta `CREATE EXTENSION IF NOT EXISTS pg_stat_statements;` si es necesario.
-   **Permisos Denegados:** Se recomienda conectar con un usuario superuser o uno que tenga privilegios de lectura sobre el catálogo de sistema (`pg_catalog`) y las vistas de estadísticas.
-   **Timeout de Comandos:** Comandos de mantenimiento como `VACUUM FULL` pueden tardar mucho tiempo en tablas grandes y causar timeouts en el protocolo MCP. Úsalos con precaución en producción y solo si `PG_ALLOW_MAINTENANCE` es true.
