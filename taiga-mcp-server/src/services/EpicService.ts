import { EpicRepository, CreateEpicDTO, EditEpicDTO } from '../repositories/EpicRepository.js';
import { withCurrentVersion } from '../utils/occ.js';
import { logger } from '../utils/logger.js';

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

export class EpicService implements IEpicReader, IEpicWriter, IEpicRelationManager {
  constructor(private readonly repo: EpicRepository) {}

  async list(projectId: number, filters?: Record<string, unknown>): Promise<EpicSummary[]> {
    const epics = await this.repo.list({ project: projectId, ...filters }) as Record<string, unknown>[];
    return epics.map((e) => ({
      id: e.id as number,
      ref: e.ref as number,
      subject: e.subject as string,
      status: e.status as number | null,
      status_extra_info: e.status_extra_info as EpicSummary['status_extra_info'],
      project: e.project as number,
      assigned_to: e.assigned_to as number | null,
      assigned_to_extra_info: e.assigned_to_extra_info as EpicSummary['assigned_to_extra_info'],
      is_closed: e.is_closed as boolean,
      color: e.color as string,
      tags: e.tags as unknown[],
      created_date: e.created_date as string,
      modified_date: e.modified_date as string,
    }));
  }

  async get(id: number): Promise<unknown> {
    return this.repo.get(id);
  }

  async getByRef(ref: number, projectId: number): Promise<unknown> {
    return this.repo.getByRef(ref, projectId);
  }

  async create(dto: CreateEpicDTO): Promise<unknown> {
    logger.info({ projectId: dto.project, subject: dto.subject }, 'Creando épica');
    return this.repo.create(dto);
  }

  async edit(id: number, dto: EditEpicDTO): Promise<unknown> {
    return this.repo.edit(id, dto);
  }

  async delete(id: number): Promise<void> {
    logger.info({ epicId: id }, 'Eliminando épica');
    return this.repo.delete(id);
  }

  async bulkCreate(projectId: number, subjects: string[], statusId?: number): Promise<unknown> {
    return this.repo.bulkCreate(projectId, subjects, statusId);
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

  async bulkLinkUserStories(epicId: number, userStoryIds: number[]): Promise<unknown> {
    return this.repo.bulkLinkUserStories(epicId, userStoryIds);
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

  async getFiltersData(projectId: number): Promise<unknown> {
    return this.repo.getFiltersData(projectId);
  }
}
