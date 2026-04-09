import { ImporterRepository, ImporterSource } from '../repositories/ImporterRepository.js';
import { logger } from '../utils/logger.js';

interface ImportResult {
  success: boolean;
  count: number;
  sample_ids: number[];
  errors: string[];
}

interface ExportResult {
  slug: string;
  name: string;
}

function toImportResult(raw: unknown): ImportResult {
  if (!raw || typeof raw !== 'object') {
    return { success: false, count: 0, sample_ids: [], errors: ['No response from importer'] };
  }
  const r = raw as Record<string, unknown>;
  // Taiga import response varies by source; normalise common shapes
  const imported = (r.imported ?? r.data ?? r.result) as unknown[] | null;
  const errors = r.errors as string[] ?? [];
  const items = Array.isArray(imported) ? imported : [];
  return {
    success: errors.length === 0,
    count: items.length,
    sample_ids: items.slice(0, 10).map((i) => (i as Record<string, unknown>).id as number).filter(Boolean),
    errors,
  };
}

export class ImporterService {
  constructor(private readonly repo: ImporterRepository) {}

  async exportProject(projectId: number): Promise<ExportResult> {
    logger.info({ projectId }, 'Exportando proyecto');
    const raw = await this.repo.exportProject(projectId) as Record<string, unknown>;
    return {
      slug: raw.slug as string ?? '',
      name: raw.name as string ?? '',
    };
  }

  async importProject(dump: unknown): Promise<ImportResult> {
    logger.info('Importando proyecto desde dump JSON');
    const raw = await this.repo.importProject(dump);
    return toImportResult(raw);
  }

  async importFromTrello(dto: unknown): Promise<ImportResult> {
    logger.info('Importando desde Trello');
    const raw = await this.repo.importFromSource('trello', dto);
    return toImportResult(raw);
  }

  async importFromGitHub(dto: unknown): Promise<ImportResult> {
    logger.info('Importando desde GitHub');
    const raw = await this.repo.importFromSource('github', dto);
    return toImportResult(raw);
  }

  async importFromJira(dto: unknown): Promise<ImportResult> {
    logger.info('Importando desde Jira');
    const raw = await this.repo.importFromSource('jira', dto);
    return toImportResult(raw);
  }

  async getAuthUrl(source: ImporterSource): Promise<{ url: string }> {
    const raw = await this.repo.getAuthUrl(source) as Record<string, unknown>;
    return { url: raw.url as string ?? '' };
  }
}
