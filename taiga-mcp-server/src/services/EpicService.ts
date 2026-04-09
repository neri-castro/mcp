import { EpicRepository, CreateEpicDTO, EditEpicDTO } from '../repositories/EpicRepository.js';
import { withCurrentVersion } from '../utils/occ.js';
import { logger } from '../utils/logger.js';
import { FiltersDataSummary, toFiltersDataSummary } from './filtersData.js';

export interface IEpicReader {
  list(projectId: number, filters?: Record<string, unknown>): Promise<unknown>;
  get(id: number): Promise<unknown>;
  getByRef(ref: number, projectId: number): Promise<unknown>;
}

export interface IEpicWriter {
  create(dto: CreateEpicDTO): Promise<unknown>;
  edit(id: number, dto: EditEpicDTO): Promise<unknown>;
  delete(id: number): Promise<void>;
  bulkCreate(projectId: number, subjects: string[], statusId?: number): Promise<unknown>;
}

export interface IEpicRelationManager {
  linkUserStory(epicId: number, userStoryId: number): Promise<unknown>;
  unlinkUserStory(epicId: number, userStoryId: number): Promise<void>;
  bulkLinkUserStories(epicId: number, userStoryIds: number[]): Promise<unknown>;
  listRelatedUserStories(epicId: number): Promise<unknown>;
}

interface EpicSummary {
  id: number;
  ref: number;
  subject: string;
  status: number | null;
  status_extra_info: { name: string; color: string; is_closed: boolean } | null;
  project: number;
  assigned_to: number | null;
  assigned_to_extra_info: { full_name_display: string } | null;
  is_closed: boolean;
  color: string;
  tags: unknown[];
  created_date: string;
  modified_date: string;
}

interface EpicDetail extends EpicSummary {
  description: string;
  is_blocked: boolean;
  blocked_note: string;
  total_comments: number;
  total_attachments: number;
  total_watchers: number;
  total_voters: number;
  version: number;
  user_stories_counts: { total: number; progress: number };
  neighbors: { previous: { id: number; ref: number; subject: string } | null; next: { id: number; ref: number; subject: string } | null };
}

export class EpicService implements IEpicReader, IEpicWriter, IEpicRelationManager {
  constructor(private readonly repo: EpicRepository) {}

  async list(projectId: number, filters?: Record<string, unknown>): Promise<EpicSummary[]> {
    const epics = await this.repo.list({ project: projectId, ...filters }) as Record<string, unknown>[];
    return epics.map((e) => this.toSummary(e));
  }

  private toSummary(e: Record<string, unknown>): EpicSummary {
    const assignedInfo = e.assigned_to_extra_info as { full_name_display?: string } | null;
    return {
      id: e.id as number,
      ref: e.ref as number,
      subject: e.subject as string,
      status: e.status as number | null,
      status_extra_info: e.status_extra_info as EpicSummary['status_extra_info'],
      project: e.project as number,
      assigned_to: e.assigned_to as number | null,
      assigned_to_extra_info: assignedInfo ? { full_name_display: assignedInfo.full_name_display ?? '' } : null,
      is_closed: e.is_closed as boolean,
      color: e.color as string,
      tags: e.tags as unknown[],
      created_date: e.created_date as string,
      modified_date: e.modified_date as string,
    };
  }

  async get(id: number): Promise<EpicDetail> {
    const raw = await this.repo.get(id) as Record<string, unknown>;
    return this.toDetail(raw);
  }

  async getByRef(ref: number, projectId: number): Promise<EpicDetail> {
    const raw = await this.repo.getByRef(ref, projectId) as Record<string, unknown>;
    return this.toDetail(raw);
  }

  private toDetail(r: Record<string, unknown>): EpicDetail {
    const statusInfo = r.status_extra_info as EpicSummary['status_extra_info'];
    const assignedInfo = r.assigned_to_extra_info as { full_name_display?: string } | null;
    const usCounts = r.user_stories_counts as { total?: number; progress?: number } | null;
    const neighbors = r.neighbors as { previous?: Record<string, unknown> | null; next?: Record<string, unknown> | null } | null;
    return {
      id: r.id as number,
      ref: r.ref as number,
      subject: r.subject as string,
      status: r.status as number | null,
      status_extra_info: statusInfo,
      project: r.project as number,
      assigned_to: r.assigned_to as number | null,
      assigned_to_extra_info: assignedInfo ? { full_name_display: assignedInfo.full_name_display ?? '' } : null,
      is_closed: r.is_closed as boolean,
      color: r.color as string,
      tags: r.tags as unknown[],
      created_date: r.created_date as string,
      modified_date: r.modified_date as string,
      description: r.description as string ?? '',
      is_blocked: r.is_blocked as boolean,
      blocked_note: r.blocked_note as string ?? '',
      total_comments: r.total_comments as number ?? 0,
      total_attachments: r.total_attachments as number ?? 0,
      total_watchers: r.total_watchers as number ?? 0,
      total_voters: r.total_voters as number ?? 0,
      version: r.version as number,
      user_stories_counts: { total: usCounts?.total ?? 0, progress: usCounts?.progress ?? 0 },
      neighbors: {
        previous: neighbors?.previous ? { id: neighbors.previous.id as number, ref: neighbors.previous.ref as number, subject: neighbors.previous.subject as string } : null,
        next: neighbors?.next ? { id: neighbors.next.id as number, ref: neighbors.next.ref as number, subject: neighbors.next.subject as string } : null,
      },
    };
  }

  async create(dto: CreateEpicDTO): Promise<EpicSummary> {
    logger.info({ projectId: dto.project, subject: dto.subject }, 'Creando épica');
    const raw = await this.repo.create(dto) as Record<string, unknown>;
    return this.toSummary(raw);
  }

  async edit(id: number, dto: EditEpicDTO): Promise<EpicSummary> {
    const raw = await this.repo.edit(id, dto) as Record<string, unknown>;
    return this.toSummary(raw);
  }

  async delete(id: number): Promise<void> {
    logger.info({ epicId: id }, 'Eliminando épica');
    return this.repo.delete(id);
  }

  async bulkCreate(projectId: number, subjects: string[], statusId?: number): Promise<EpicSummary[]> {
    const raw = await this.repo.bulkCreate(projectId, subjects, statusId) as Record<string, unknown>[];
    return raw.map((e) => this.toSummary(e));
  }

  // Tell Don't Ask: el servicio obtiene la versión actual e internamente aplica el cambio
  async changeStatus(epicId: number, statusId: number): Promise<unknown> {
    return withCurrentVersion(
      () => this.repo.get(epicId),
      (version) => this.repo.edit(epicId, { status: statusId, version })
    );
  }

  async linkUserStory(epicId: number, userStoryId: number): Promise<unknown> {
    return this.repo.linkUserStory(epicId, userStoryId);
  }

  async unlinkUserStory(epicId: number, userStoryId: number): Promise<void> {
    return this.repo.unlinkUserStory(epicId, userStoryId);
  }

  async bulkLinkUserStories(epicId: number, userStoryIds: number[]): Promise<{ epic: number; user_story: number }[]> {
    const raw = await this.repo.bulkLinkUserStories(epicId, userStoryIds) as Record<string, unknown>[];
    return raw.map((r) => ({ epic: r.epic as number, user_story: r.user_story as number }));
  }

  async listRelatedUserStories(epicId: number): Promise<unknown> {
    return this.repo.listRelatedUserStories(epicId);
  }

  async watch(epicId: number): Promise<void> {
    return this.repo.watch(epicId);
  }

  async listAttachments(epicId: number): Promise<unknown> {
    return this.repo.listAttachments(epicId);
  }

  async getFiltersData(projectId: number): Promise<FiltersDataSummary> {
    const raw = await this.repo.getFiltersData(projectId) as Record<string, unknown>;
    return toFiltersDataSummary(raw);
  }
}
