import { ImporterRepository, ImporterSource } from '../repositories/ImporterRepository.js';
import { logger } from '../utils/logger.js';

export class ImporterService {
  constructor(private readonly repo: ImporterRepository) {}

  async exportProject(projectId: number): Promise<unknown> {
    logger.info({ projectId }, 'Exportando proyecto');
    return this.repo.exportProject(projectId);
  }

  async importProject(dump: unknown): Promise<unknown> {
    logger.info('Importando proyecto desde dump JSON');
    return this.repo.importProject(dump);
  }

  async importFromTrello(dto: unknown): Promise<unknown> {
    logger.info('Importando desde Trello');
    return this.repo.importFromSource('trello', dto);
  }

  async importFromGitHub(dto: unknown): Promise<unknown> {
    logger.info('Importando desde GitHub');
    return this.repo.importFromSource('github', dto);
  }

  async importFromJira(dto: unknown): Promise<unknown> {
    logger.info('Importando desde Jira');
    return this.repo.importFromSource('jira', dto);
  }

  async getAuthUrl(source: ImporterSource): Promise<unknown> {
    return this.repo.getAuthUrl(source);
  }
}
