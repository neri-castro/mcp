import { BaseRepository } from './base/BaseRepository.js';
import { TaigaHttpClient } from '../http/TaigaHttpClient.js';

export interface CreateProjectDTO {
  name: string;
  description?: string;
  is_private?: boolean;
  is_backlog_activated?: boolean;
  is_kanban_activated?: boolean;
  is_wiki_activated?: boolean;
  is_issues_activated?: boolean;
  videoconferences?: string | null;
  tags?: string[];
  total_milestones?: number;
  total_story_points?: number;
}

export interface EditProjectDTO extends Partial<CreateProjectDTO> {
  version?: number;
}

export class ProjectRepository extends BaseRepository<unknown, CreateProjectDTO, EditProjectDTO> {
  constructor(client: TaigaHttpClient) {
    super(client, '/projects');
  }

  async getBySlug(slug: string): Promise<unknown> {
    const response = await this.client.get(`/projects/by_slug`, { params: { slug } });
    return response.data;
  }

  async getStats(projectId: number): Promise<unknown> {
    const response = await this.client.get(`/projects/${projectId}/stats`);
    return response.data;
  }

  async getIssueStats(projectId: number): Promise<unknown> {
    const response = await this.client.get(`/projects/${projectId}/issues_stats`);
    return response.data;
  }

  async getModules(projectId: number): Promise<unknown> {
    const response = await this.client.get(`/projects/${projectId}/modules`);
    return response.data;
  }

  async updateModules(projectId: number, modules: Record<string, boolean>): Promise<unknown> {
    const response = await this.client.patch(`/projects/${projectId}/modules`, modules);
    return response.data;
  }

  async createTag(projectId: number, tag: string, color: string): Promise<unknown> {
    const response = await this.client.post(`/projects/${projectId}/create_tag`, { tag, color });
    return response.data;
  }

  async duplicate(projectId: number, name: string, users: number[]): Promise<unknown> {
    const response = await this.client.post(`/projects/${projectId}/duplicate`, { name, users });
    return response.data;
  }

  async leave(projectId: number): Promise<void> {
    await this.client.post(`/projects/${projectId}/leave`);
  }
}
