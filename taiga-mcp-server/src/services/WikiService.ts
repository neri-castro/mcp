import { WikiRepository, CreateWikiPageDTO, EditWikiPageDTO, CreateWikiLinkDTO } from '../repositories/WikiRepository.js';
import { logger } from '../utils/logger.js';

export class WikiService {
  constructor(private readonly repo: WikiRepository) {}

  async list(projectId: number): Promise<unknown> {
    return this.repo.list({ project: projectId });
  }

  async get(wikiId: number): Promise<unknown> {
    return this.repo.get(wikiId);
  }

  async getBySlug(slug: string, projectId: number): Promise<unknown> {
    return this.repo.getBySlug(slug, projectId);
  }

  async create(dto: CreateWikiPageDTO): Promise<unknown> {
    logger.info({ projectId: dto.project, slug: dto.slug }, 'Creando página wiki');
    return this.repo.create(dto);
  }

  async edit(wikiId: number, dto: EditWikiPageDTO): Promise<unknown> {
    return this.repo.edit(wikiId, dto);
  }

  async delete(wikiId: number): Promise<void> {
    return this.repo.delete(wikiId);
  }

  async watch(wikiId: number): Promise<void> {
    return this.repo.watch(wikiId);
  }

  async listLinks(projectId: number): Promise<unknown> {
    return this.repo.listLinks(projectId);
  }

  async createLink(dto: CreateWikiLinkDTO): Promise<unknown> {
    return this.repo.createLink(dto);
  }

  async deleteLink(linkId: number): Promise<void> {
    return this.repo.deleteLink(linkId);
  }
}
