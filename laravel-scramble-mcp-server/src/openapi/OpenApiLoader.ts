import axios from 'axios';
import { logger } from '../utils/logger.js';
import type { OpenApiDocumentDTO } from './dto/OpenApiDocumentDTO.js';
import type { AppConfig } from '../config/config.js';

// ──────────────────────────────────────────────────────────────────
// OpenApiLoader: carga y cachea el documento /docs/api.json
// Principio: SRP — solo responsable de obtener el documento OpenAPI
// ──────────────────────────────────────────────────────────────────

interface CacheEntry {
  document: OpenApiDocumentDTO;
  loadedAt: number;
}

export class OpenApiLoader {
  private cache: Map<string, CacheEntry> = new Map();

  constructor(private readonly config: AppConfig) {}

  /**
   * Carga el documento OpenAPI de Scramble con soporte de caché.
   * Soporta múltiples versiones via OPENAPI_DOCS_URLS.
   */
  async load(docsUrl: string, forceRefresh = false): Promise<OpenApiDocumentDTO> {
    const cached = this.cache.get(docsUrl);
    const ttl = this.config.openapiCacheTtlMs;

    if (!forceRefresh && cached && ttl > 0) {
      const age = Date.now() - cached.loadedAt;
      if (age < ttl) {
        logger.debug({ docsUrl, ageMs: age }, 'Returning cached OpenAPI document');
        return cached.document;
      }
    }

    logger.info({ docsUrl }, 'Loading OpenAPI document from Scramble');

    try {
      const response = await axios.get<OpenApiDocumentDTO>(docsUrl, {
        timeout: this.config.httpTimeoutMs,
        headers: { Accept: 'application/json' },
      });

      const document = response.data;
      this.validateDocument(document);

      this.cache.set(docsUrl, { document, loadedAt: Date.now() });
      logger.info(
        { title: document.info.title, version: document.info.version, paths: Object.keys(document.paths).length },
        'OpenAPI document loaded successfully',
      );

      return document;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to load Scramble docs from ${docsUrl}: ${error.message} (${error.response?.status ?? 'no response'})`,
        );
      }
      throw error;
    }
  }

  /**
   * Carga todos los documentos configurados en OPENAPI_DOCS_URLS
   */
  async loadAll(forceRefresh = false): Promise<Map<string, OpenApiDocumentDTO>> {
    const urls = this.config.openapiDocsUrls ?? [this.config.scrambleDocsUrl];
    const results = new Map<string, OpenApiDocumentDTO>();

    await Promise.all(
      urls.map(async (url) => {
        const doc = await this.load(url, forceRefresh);
        results.set(url, doc);
      }),
    );

    return results;
  }

  invalidateCache(docsUrl?: string): void {
    if (docsUrl) {
      this.cache.delete(docsUrl);
    } else {
      this.cache.clear();
    }
    logger.info({ docsUrl: docsUrl ?? 'all' }, 'OpenAPI cache invalidated');
  }

  private validateDocument(doc: unknown): asserts doc is OpenApiDocumentDTO {
    if (typeof doc !== 'object' || doc === null) {
      throw new Error('Invalid OpenAPI document: not an object');
    }

    const d = doc as Record<string, unknown>;

    if (!d['openapi'] || !String(d['openapi']).startsWith('3.')) {
      throw new Error(`Invalid OpenAPI version: ${d['openapi']}. Expected 3.x`);
    }

    if (!d['paths'] || typeof d['paths'] !== 'object') {
      throw new Error('Invalid OpenAPI document: missing paths');
    }
  }
}
