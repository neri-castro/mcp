import { WikiRepository, CreateWikiPageDTO, EditWikiPageDTO, CreateWikiLinkDTO } from '../repositories/WikiRepository.js';
import { logger } from '../utils/logger.js';

interface WikiPageSummary {
  id: number;
  slug: string;
  project: number;
  created_date: string;
  modified_date: string;
}

interface WikiPageDetail extends WikiPageSummary {
  content: string;
  total_comments: number;
  total_watchers: number;
  version: number;
  last_modifier: { id: number; username: string; full_name_display: string } | null;
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

  async get(wikiId: number): Promise<WikiPageDetail> {
    const raw = await this.repo.get(wikiId) as Record<string, unknown>;
    return this.toDetail(raw);
  }

  async getBySlug(slug: string, projectId: number): Promise<WikiPageDetail> {
    const raw = await this.repo.getBySlug(slug, projectId) as Record<string, unknown>;
    return this.toDetail(raw);
  }

  private toDetail(r: Record<string, unknown>): WikiPageDetail {
    const modifier = r.last_modifier as { id?: number; username?: string; full_name_display?: string } | null;
    return {
      id: r.id as number,
      slug: r.slug as string,
      project: r.project as number,
      created_date: r.created_date as string,
      modified_date: r.modified_date as string,
      content: r.content as string ?? '',
      total_comments: r.total_comments as number ?? 0,
      total_watchers: r.total_watchers as number ?? 0,
      version: r.version as number,
      last_modifier: modifier?.id != null
        ? { id: modifier.id, username: modifier.username ?? '', full_name_display: modifier.full_name_display ?? '' }
        : null,
    };
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
