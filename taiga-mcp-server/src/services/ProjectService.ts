import { ProjectRepository, CreateProjectDTO, EditProjectDTO } from '../repositories/ProjectRepository.js';
import { logger } from '../utils/logger.js';

interface ProjectSummary {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_private: boolean;
  is_backlog_activated: boolean;
  is_kanban_activated: boolean;
  is_wiki_activated: boolean;
  is_issues_activated: boolean;
  is_epics_activated: boolean;
  members: number[];
  total_milestones: number | null;
  total_story_points: number | null;
  tags: string[];
  blocked_code: string | null;
  created_date: string;
  modified_date: string;
}

export class ProjectService {
  constructor(private readonly repo: ProjectRepository) {}

  async list(filters?: Record<string, unknown>): Promise<ProjectSummary[]> {
    const projects = await this.repo.list(filters) as Record<string, unknown>[];
    return projects.map((p) => ({
      id: p.id as number,
      name: p.name as string,
      slug: p.slug as string,
      description: p.description as string,
      is_private: p.is_private as boolean,
      is_backlog_activated: p.is_backlog_activated as boolean,
      is_kanban_activated: p.is_kanban_activated as boolean,
      is_wiki_activated: p.is_wiki_activated as boolean,
      is_issues_activated: p.is_issues_activated as boolean,
      is_epics_activated: p.is_epics_activated as boolean,
      members: p.members as number[],
      total_milestones: p.total_milestones as number | null,
      total_story_points: p.total_story_points as number | null,
      tags: p.tags as string[],
      blocked_code: p.blocked_code as string | null,
      created_date: p.created_date as string,
      modified_date: p.modified_date as string,
    }));
  }

  async get(id: number): Promise<unknown> {
    return this.repo.get(id);
  }

  async getBySlug(slug: string): Promise<unknown> {
    return this.repo.getBySlug(slug);
  }

  async create(dto: CreateProjectDTO): Promise<unknown> {
    logger.info({ name: dto.name }, 'Creando proyecto');
    return this.repo.create(dto);
  }

  async edit(id: number, dto: EditProjectDTO): Promise<unknown> {
    return this.repo.edit(id, dto);
  }

  async delete(id: number): Promise<void> {
    return this.repo.delete(id);
  }

  async getStats(projectId: number): Promise<unknown> {
    return this.repo.getStats(projectId);
  }

  async getModules(projectId: number): Promise<unknown> {
    return this.repo.getModules(projectId);
  }

  async updateModules(projectId: number, modules: Record<string, boolean>): Promise<unknown> {
    return this.repo.updateModules(projectId, modules);
  }

  async createTag(projectId: number, tag: string, color: string): Promise<unknown> {
    return this.repo.createTag(projectId, tag, color);
  }

  async duplicate(projectId: number, name: string, users: number[]): Promise<unknown> {
    return this.repo.duplicate(projectId, name, users);
  }
}
