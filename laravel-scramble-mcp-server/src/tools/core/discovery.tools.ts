import { z } from 'zod';
import type { DiscoveryService } from '../../services/DiscoveryService.js';
import type { ToolRegistry } from '../../openapi/ToolRegistry.js';
import type { OpenApiParser } from '../../openapi/OpenApiParser.js';
import type { AppConfig } from '../../config/config.js';

// ──────────────────────────────────────────────────────────────────
// Discovery Tools: siempre disponibles, independientes del OpenAPI
// Principio: Tell Don't Ask — los tools delegan al service
// ──────────────────────────────────────────────────────────────────

export interface CoreTool {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  handler: (input: Record<string, unknown>) => Promise<unknown>;
}

export function buildDiscoveryTools(
  discoveryService: DiscoveryService,
  registry: ToolRegistry,
  parser: OpenApiParser,
  config: AppConfig,
): CoreTool[] {
  return [
    // ─────────────────────────────────────────────
    // scramble_discover
    // ─────────────────────────────────────────────
    {
      name: 'scramble_discover',
      description: `Recarga y re-parsea el documento OpenAPI de Scramble desde ${config.scrambleDocsUrl}.
Usa este tool para refrescar los endpoints disponibles si la API Laravel cambió.
Retorna: número de tools registrados y lista de versiones disponibles.`,
      inputSchema: z.object({
        refresh: z.boolean().optional().describe('Forzar recarga ignorando caché (default: true)'),
        docs_url: z.string().url().optional().describe('URL específica del documento OpenAPI'),
      }),
      handler: async (input) => {
        const result = await discoveryService.refresh(input['docs_url'] as string | undefined);
        return {
          success: true,
          toolsRegistered: result.toolsRegistered,
          versions: result.versions,
          message: `${result.toolsRegistered} tools registrados desde ${result.versions.length} documento(s) OpenAPI`,
        };
      },
    },

    // ─────────────────────────────────────────────
    // scramble_list_tools
    // ─────────────────────────────────────────────
    {
      name: 'scramble_list_tools',
      description: `Lista todos los tools MCP disponibles generados desde el OpenAPI de Scramble.
Soporta filtrado por tag (grupo de endpoints) y búsqueda por texto.
Usa scramble_discover primero si no hay tools listados.`,
      inputSchema: z.object({
        tag: z.string().optional().describe('Filtrar por tag (ej: "Users", "Posts")'),
        search: z.string().optional().describe('Búsqueda en nombre y descripción'),
        include_deprecated: z.boolean().optional().describe('Incluir tools deprecated (default: false)'),
      }),
      handler: async (input) => {
        let tools = registry.getAllTools();

        if (input['tag']) {
          tools = registry.getToolsByTag(input['tag'] as string);
        } else if (input['search']) {
          tools = registry.searchTools(input['search'] as string);
        }

        if (!input['include_deprecated']) {
          tools = tools.filter((t) => !t.deprecated);
        }

        return {
          count: tools.length,
          tools: tools.map((t) => ({
            name: t.name,
            description: t.description.split('\n')[0], // Solo primera línea
            method: t.method.toUpperCase(),
            path: t.path,
            tags: t.tags,
            deprecated: t.deprecated,
          })),
        };
      },
    },

    // ─────────────────────────────────────────────
    // scramble_get_schema
    // ─────────────────────────────────────────────
    {
      name: 'scramble_get_schema',
      description: `Obtiene el schema JSON de un componente OpenAPI (ej: "UserResource", "PostCollection").
Útil para entender la estructura de datos que retorna un endpoint.`,
      inputSchema: z.object({
        schema_name: z.string().describe('Nombre del schema en components.schemas del OpenAPI'),
        docs_url: z.string().url().optional().describe('URL del documento OpenAPI (si hay múltiples versiones)'),
      }),
      handler: async (input) => {
        const document = discoveryService.getDocument(input['docs_url'] as string | undefined);

        if (!document) {
          return {
            success: false,
            error: 'No hay documento OpenAPI cargado. Usa scramble_discover primero.',
          };
        }

        const schemaName = input['schema_name'] as string;
        const schema = document.components?.schemas?.[schemaName];

        if (!schema) {
          const available = Object.keys(document.components?.schemas ?? {});
          return {
            success: false,
            error: `Schema "${schemaName}" no encontrado`,
            available_schemas: available,
          };
        }

        return { success: true, schema_name: schemaName, schema };
      },
    },

    // ─────────────────────────────────────────────
    // scramble_spec_info
    // ─────────────────────────────────────────────
    {
      name: 'scramble_spec_info',
      description: `Retorna metadata del documento OpenAPI de Scramble: título, versión, servidores y estadísticas.
Útil para verificar que se está conectado a la API correcta.`,
      inputSchema: z.object({
        docs_url: z.string().url().optional().describe('URL del documento OpenAPI'),
      }),
      handler: async (input) => {
        const documents = discoveryService.getLoadedDocuments();

        if (documents.size === 0) {
          return {
            success: false,
            error: 'No hay documentos OpenAPI cargados. Usa scramble_discover primero.',
          };
        }

        const specs = Array.from(documents.entries()).map(([url, doc]) => ({
          docs_url: url,
          openapi_version: doc.openapi,
          title: doc.info.title,
          api_version: doc.info.version,
          description: doc.info.description,
          servers: doc.servers,
          paths_count: Object.keys(doc.paths).length,
          schemas_count: Object.keys(doc.components?.schemas ?? {}).length,
          tags: parser.parseTags(doc),
          security_schemes: Object.keys(doc.components?.securitySchemes ?? {}),
        }));

        return { success: true, specs, tools_registered: registry.size };
      },
    },

    // ─────────────────────────────────────────────
    // scramble_list_versions
    // ─────────────────────────────────────────────
    {
      name: 'scramble_list_versions',
      description: 'Lista todas las versiones de API disponibles con sus URLs de documentación.',
      inputSchema: z.object({}),
      handler: async () => {
        const urls = config.openapiDocsUrls ?? [config.scrambleDocsUrl];
        const documents = discoveryService.getLoadedDocuments();

        return {
          versions: urls.map((url) => {
            const doc = documents.get(url);
            return {
              docs_url: url,
              loaded: !!doc,
              title: doc?.info?.title,
              version: doc?.info?.version,
            };
          }),
        };
      },
    },
  ];
}
