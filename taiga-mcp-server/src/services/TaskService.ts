// TaskService.ts
import { TaskRepository, CreateTaskDTO, EditTaskDTO } from '../repositories/TaskRepository.js';
import { withCurrentVersion } from '../utils/occ.js';
import { logger } from '../utils/logger.js';
import { FiltersDataSummary, toFiltersDataSummary } from './filtersData.js';

interface TaskSummary {
  id: number;
  ref: number;
  subject: string;
  status: number | null;
  status_extra_info: { name: string; color: string; is_closed: boolean } | null;
  project: number;
  user_story: number | null;
  milestone: number | null;
  assigned_to: number | null;
  assigned_to_extra_info: { full_name_display: string } | null;
  is_closed: boolean;
  tags: unknown[];
  due_date: string | null;
  created_date: string;
  modified_date: string;
}

interface TaskDetail extends TaskSummary {
  description: string;
  finish_date: string | null;
  is_blocked: boolean;
  blocked_note: string;
  total_comments: number;
  total_attachments: number;
  total_watchers: number;
  total_voters: number;
  version: number;
  user_story_extra_info: { id: number; ref: number; subject: string } | null;
  neighbors: { previous: { id: number; ref: number; subject: string } | null; next: { id: number; ref: number; subject: string } | null };
}

export class TaskService {
  constructor(private readonly repo: TaskRepository) {}

  async list(projectId: number, filters?: Record<string, unknown>): Promise<TaskSummary[]> {
    const tasks = await this.repo.list({ project: projectId, ...filters }) as Record<string, unknown>[];
    return tasks.map((t) => this.toSummary(t));
  }

  private toSummary(t: Record<string, unknown>): TaskSummary {
    const assignedInfo = t.assigned_to_extra_info as { full_name_display?: string } | null;
    return {
      id: t.id as number,
      ref: t.ref as number,
      subject: t.subject as string,
      status: t.status as number | null,
      status_extra_info: t.status_extra_info as TaskSummary['status_extra_info'],
      project: t.project as number,
      user_story: t.user_story as number | null,
      milestone: t.milestone as number | null,
      assigned_to: t.assigned_to as number | null,
      assigned_to_extra_info: assignedInfo ? { full_name_display: assignedInfo.full_name_display ?? '' } : null,
      is_closed: t.is_closed as boolean,
      tags: t.tags as unknown[],
      due_date: t.due_date as string | null,
      created_date: t.created_date as string,
      modified_date: t.modified_date as string,
    };
  }

  async get(id: number): Promise<TaskDetail> {
    const raw = await this.repo.get(id) as Record<string, unknown>;
    return this.toDetail(raw);
  }

  async getByRef(ref: number, projectId: number): Promise<TaskDetail> {
    const raw = await this.repo.getByRef(ref, projectId) as Record<string, unknown>;
    return this.toDetail(raw);
  }

  private toDetail(r: Record<string, unknown>): TaskDetail {
    const statusInfo = r.status_extra_info as TaskSummary['status_extra_info'];
    const assignedInfo = r.assigned_to_extra_info as { full_name_display?: string } | null;
    const usInfo = r.user_story_extra_info as { id?: number; ref?: number; subject?: string } | null;
    const neighbors = r.neighbors as { previous?: Record<string, unknown> | null; next?: Record<string, unknown> | null } | null;
    return {
      id: r.id as number,
      ref: r.ref as number,
      subject: r.subject as string,
      status: r.status as number | null,
      status_extra_info: statusInfo,
      project: r.project as number,
      user_story: r.user_story as number | null,
      milestone: r.milestone as number | null,
      assigned_to: r.assigned_to as number | null,
      assigned_to_extra_info: assignedInfo ? { full_name_display: assignedInfo.full_name_display ?? '' } : null,
      is_closed: r.is_closed as boolean,
      tags: r.tags as unknown[],
      due_date: r.due_date as string | null,
      created_date: r.created_date as string,
      modified_date: r.modified_date as string,
      description: r.description as string ?? '',
      finish_date: r.finish_date as string | null,
      is_blocked: r.is_blocked as boolean,
      blocked_note: r.blocked_note as string ?? '',
      total_comments: r.total_comments as number ?? 0,
      total_attachments: r.total_attachments as number ?? 0,
      total_watchers: r.total_watchers as number ?? 0,
      total_voters: r.total_voters as number ?? 0,
      version: r.version as number,
      user_story_extra_info: usInfo?.id != null ? { id: usInfo.id, ref: usInfo.ref!, subject: usInfo.subject! } : null,
      neighbors: {
        previous: neighbors?.previous ? { id: neighbors.previous.id as number, ref: neighbors.previous.ref as number, subject: neighbors.previous.subject as string } : null,
        next: neighbors?.next ? { id: neighbors.next.id as number, ref: neighbors.next.ref as number, subject: neighbors.next.subject as string } : null,
      },
    };
  }

  async create(dto: CreateTaskDTO): Promise<TaskSummary> {
    logger.info({ projectId: dto.project, subject: dto.subject }, 'Creando tarea');
    const raw = await this.repo.create(dto) as Record<string, unknown>;
    return this.toSummary(raw);
  }

  async edit(id: number, dto: EditTaskDTO): Promise<TaskSummary> {
    const raw = await this.repo.edit(id, dto) as Record<string, unknown>;
    return this.toSummary(raw);
  }

  async delete(id: number): Promise<void> {
    return this.repo.delete(id);
  }

  async bulkCreate(
    projectId: number,
    subjects: string[],
    usId?: number,
    milestoneId?: number,
    statusId?: number
  ): Promise<unknown> {
    return this.repo.bulkCreate({
      project_id: projectId,
      us_id: usId,
      milestone_id: milestoneId,
      bulk_tasks: subjects.join('\n'),
      status_id: statusId,
    });
  }

  // Tell Don't Ask
  async changeStatus(taskId: number, statusId: number): Promise<unknown> {
    return withCurrentVersion(
      () => this.repo.get(taskId),
      (version) => this.repo.edit(taskId, { status: statusId, version })
    );
  }

  async assign(taskId: number, userId: number): Promise<unknown> {
    return withCurrentVersion(
      () => this.repo.get(taskId),
      (version) => this.repo.edit(taskId, { assigned_to: userId, version })
    );
  }

  async vote(taskId: number): Promise<void> {
    return this.repo.upvote(taskId);
  }

  async watch(taskId: number): Promise<void> {
    return this.repo.watch(taskId);
  }

  async listAttachments(taskId: number): Promise<unknown> {
    return this.repo.listAttachments(taskId);
  }

  async getFiltersData(projectId: number): Promise<FiltersDataSummary> {
    const raw = await this.repo.getFiltersData(projectId) as Record<string, unknown>;
    return toFiltersDataSummary(raw);
  }
}
