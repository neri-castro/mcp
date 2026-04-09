import { WikiRepository, CreateWikiPageDTO, EditWikiPageDTO, CreateWikiLinkDTO } from '../repositories/WikiRepository.js';
import { logger } from '../utils/logger.js';

interface WikiPageSummary {
  id: number;
  slug: string;
  project: number;
  created_date: string;
  modified_date: string;
}

export class WikiService {
  constructor(private readonly repo: WikiRepository) {}

  async list(projectId: number): Promise<WikiPageSummary[]> {
    const pages = await this.repo.list({ project: projectId }) as Record<string, unknown>[];
    return pages.map((p) => ({
      id: p.id as number,
      slug: p.slug as string,
      project: p.project as number,
      created_date: p.created_date as string,
      modified_date: p.modified_date as string,
    }));
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
