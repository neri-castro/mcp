import { BaseRepository } from './base/BaseRepository.js';
import { TaigaHttpClient } from '../http/TaigaHttpClient.js';

export interface CreateWikiPageDTO {
  project: number;
  slug: string;
  content: string;
  watchers?: number[];
}

export interface EditWikiPageDTO {
  content?: string;
  watchers?: number[];
  version: number;
}

export interface CreateWikiLinkDTO {
  project: number;
  title: string;
  href: string;
  order?: number;
}

export class WikiRepository extends BaseRepository<unknown, CreateWikiPageDTO, EditWikiPageDTO> {
  constructor(client: TaigaHttpClient) {
    super(client, '/wiki');
  }

  async getBySlug(slug: string, projectId: number): Promise<unknown> {
    const response = await this.client.get('/wiki/by_slug', {
      params: { slug, project: projectId },
    });
    return response.data;
  }

  async watch(wikiId: number): Promise<void> {
    await this.client.post(`/wiki/${wikiId}/watch`);
  }

  async listLinks(projectId: number): Promise<unknown> {
    const response = await this.client.get('/wiki-links', { params: { project: projectId } });
    return response.data;
  }

  async createLink(dto: CreateWikiLinkDTO): Promise<unknown> {
    const response = await this.client.post('/wiki-links', dto);
    return response.data;
  }

  async deleteLink(linkId: number): Promise<void> {
    await this.client.delete(`/wiki-links/${linkId}`);
  }
}
