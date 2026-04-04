import { logger } from '../utils/logger.js';
import type { OpenApiLoader } from '../openapi/OpenApiLoader.js';
import type { OpenApiParser } from '../openapi/OpenApiParser.js';
import type { ToolRegistry } from '../openapi/ToolRegistry.js';
import type { OpenApiDocumentDTO } from '../openapi/dto/OpenApiDocumentDTO.js';
import type { AppConfig } from '../config/config.js';

// ──────────────────────────────────────────────────────────────────
// DiscoveryService: orquesta la carga del OpenAPI y el registro de tools
// Tell Don't Ask: el servicio decide todo el flujo sin exponer estado
// ──────────────────────────────────────────────────────────────────

export interface DiscoveryResult {
  toolsRegistered: number;
  versions: string[];
  documents: Map<string, OpenApiDocumentDTO>;
}

export class DiscoveryService {
  private loadedDocuments = new Map<string, OpenApiDocumentDTO>();

  constructor(
    private readonly loader: OpenApiLoader,
    private readonly parser: OpenApiParser,
    private readonly registry: ToolRegistry,
    private readonly config: AppConfig,
  ) {}

  /**
   * Inicializa el sistema: carga todos los documentos OpenAPI de Scramble
   * y registra todos los tools dinámicamente.
   * Tell Don't Ask: el service orquesta todo el ciclo de vida.
   */
  async initialize(): Promise<DiscoveryResult> {
    logger.info('Starting OpenAPI discovery...');

    const urls = this.config.openapiDocsUrls ?? [this.config.scrambleDocsUrl];
    this.registry.clearTools();
    this.loadedDocuments.clear();

    let totalTools = 0;

    for (const url of urls) {
      try {
        const toolCount = await this.loadAndRegister(url);
        totalTools += toolCount;
      } catch (error) {
        logger.error({ url, error }, 'Failed to load OpenAPI document');
      }
    }

    logger.info({ totalTools, urls: urls.length }, 'Discovery complete');

    return {
      toolsRegistered: totalTools,
      versions: urls,
      documents: new Map(this.loadedDocuments),
    };
  }

  /**
   * Recarga el documento y re-registra los tools (usado por scramble_discover)
   */
  async refresh(docsUrl?: string): Promise<DiscoveryResult> {
    const url = docsUrl ?? this.config.scrambleDocsUrl;
    logger.info({ url }, 'Refreshing OpenAPI discovery');

    this.registry.clearTools();
    await this.loadAndRegister(url, true);

    return {
      toolsRegistered: this.registry.size,
      versions: [url],
      documents: new Map(this.loadedDocuments),
    };
  }

  private async loadAndRegister(url: string, forceRefresh = false): Promise<number> {
    const document = await this.loader.load(url, forceRefresh);
    this.loadedDocuments.set(url, document);

    const operations = this.parser.parseOperations(document);
    const tools = this.registry.buildFromOpenApi(document, operations, url);

    return tools.length;
  }

  getDocument(url?: string): OpenApiDocumentDTO | undefined {
    const key = url ?? this.config.scrambleDocsUrl;
    return this.loadedDocuments.get(key);
  }

  getLoadedDocuments(): Map<string, OpenApiDocumentDTO> {
    return new Map(this.loadedDocuments);
  }
}
