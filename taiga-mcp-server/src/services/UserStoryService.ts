import {
  UserStoryRepository,
  CreateUserStoryDTO,
  EditUserStoryDTO,
} from '../repositories/UserStoryRepository.js';
import { withCurrentVersion } from '../utils/occ.js';
import { logger } from '../utils/logger.js';

interface UserStorySummary {
  id: number;
  ref: number;
  subject: string;
  status: number | null;
  status_extra_info: { name: string; color: string; is_closed: boolean } | null;
  project: number;
  milestone: number | null;
  milestone_name: string | null;
  assigned_to: number | null;
  assigned_to_extra_info: { full_name_display: string } | null;
  is_closed: boolean;
  total_points: number | null;
  tags: unknown[];
  created_date: string;
  modified_date: string;
}

type NeighborRef = { id: number; ref: number; subject: string } | null;

interface UserStoryDetail extends UserStorySummary {
  description: string;
  finish_date: string | null;
  due_date: string | null;
  is_blocked: boolean;
  blocked_note: string;
  total_comments: number;
  total_attachments: number;
  total_watchers: number;
  total_voters: number;
  version: number;
  epics: { id: number; ref: number; subject: string; color: string }[];
  tasks: { id: number; ref: number; subject: string; status_name: string | null; assigned_to_name: string | null }[];
  neighbors: { previous: NeighborRef; next: NeighborRef };
}

export class UserStoryService {
  constructor(private readonly repo: UserStoryRepository) {}

  async list(projectId: number, filters?: Record<string, unknown>): Promise<UserStorySummary[]> {
    const stories = await this.repo.list({ project: projectId, ...filters }) as Record<string, unknown>[];
    return stories.map((s) => ({
      id: s.id as number,
      ref: s.ref as number,
      subject: s.subject as string,
      status: s.status as number | null,
      status_extra_info: s.status_extra_info as UserStorySummary['status_extra_info'],
      project: s.project as number,
      milestone: s.milestone as number | null,
      milestone_name: s.milestone_name as string | null,
      assigned_to: s.assigned_to as number | null,
      assigned_to_extra_info: s.assigned_to_extra_info as UserStorySummary['assigned_to_extra_info'],
      is_closed: s.is_closed as boolean,
      total_points: s.total_points as number | null,
      tags: s.tags as unknown[],
      created_date: s.created_date as string,
      modified_date: s.modified_date as string,
    }));
  }

  async get(id: number): Promise<UserStoryDetail> {
    const raw = await this.repo.get(id) as Record<string, unknown>;
    return this.toDetail(raw);
  }

  async getByRef(ref: number, projectId: number): Promise<UserStoryDetail> {
    const raw = await this.repo.getByRef(ref, projectId) as Record<string, unknown>;
    return this.toDetail(raw);
  }

  private toDetail(r: Record<string, unknown>): UserStoryDetail {
    const tasks = (r.tasks as Record<string, unknown>[] | null) ?? [];
    const epics = (r.epics as Record<string, unknown>[] | null) ?? [];
    const neighbors = r.neighbors as { previous?: Record<string, unknown> | null; next?: Record<string, unknown> | null } | null;
    const statusInfo = r.status_extra_info as UserStorySummary['status_extra_info'];
    const assignedInfo = r.assigned_to_extra_info as { full_name_display?: string } | null;
    return {
      id: r.id as number,
      ref: r.ref as number,
      subject: r.subject as string,
      status: r.status as number | null,
      status_extra_info: statusInfo,
      project: r.project as number,
      milestone: r.milestone as number | null,
      milestone_name: r.milestone_name as string | null,
      assigned_to: r.assigned_to as number | null,
      assigned_to_extra_info: assignedInfo ? { full_name_display: assignedInfo.full_name_display ?? '' } : null,
      is_closed: r.is_closed as boolean,
      total_points: r.total_points as number | null,
      tags: r.tags as unknown[],
      created_date: r.created_date as string,
      modified_date: r.modified_date as string,
      description: r.description as string ?? '',
      finish_date: r.finish_date as string | null,
      due_date: r.due_date as string | null,
      is_blocked: r.is_blocked as boolean,
      blocked_note: r.blocked_note as string ?? '',
      total_comments: r.total_comments as number ?? 0,
      total_attachments: r.total_attachments as number ?? 0,
      total_watchers: r.total_watchers as number ?? 0,
      total_voters: r.total_voters as number ?? 0,
      version: r.version as number,
      epics: epics.map((e) => ({
        id: e.id as number,
        ref: e.ref as number,
        subject: e.subject as string,
        color: e.color as string,
      })),
      tasks: tasks.map((t) => {
        const ts = t.status_extra_info as { name?: string } | null;
        const ta = t.assigned_to_extra_info as { full_name_display?: string } | null;
        return {
          id: t.id as number,
          ref: t.ref as number,
          subject: t.subject as string,
          status_name: ts?.name ?? null,
          assigned_to_name: ta?.full_name_display ?? null,
        };
      }),
      neighbors: {
        previous: neighbors?.previous ? { id: neighbors.previous.id as number, ref: neighbors.previous.ref as number, subject: neighbors.previous.subject as string } : null,
        next: neighbors?.next ? { id: neighbors.next.id as number, ref: neighbors.next.ref as number, subject: neighbors.next.subject as string } : null,
      },
    };
  }

  async create(dto: CreateUserStoryDTO): Promise<unknown> {
    logger.info({ projectId: dto.project, subject: dto.subject }, 'Creando Historia de Usuario');
    return this.repo.create(dto);
  }

  async edit(id: number, dto: EditUserStoryDTO): Promise<unknown> {
    return this.repo.edit(id, dto);
  }

  async delete(id: number): Promise<void> {
    return this.repo.delete(id);
  }

  async bulkCreate(projectId: number, subjects: string[], statusId?: number): Promise<unknown> {
    return this.repo.bulkCreate(projectId, subjects, statusId);
  }

  // Tell Don't Ask: obtiene la versión y aplica el cambio internamente
  async changeStatus(usId: number, statusId: number): Promise<unknown> {
    return withCurrentVersion(
      () => this.repo.get(usId),
      (version) => this.repo.edit(usId, { status: statusId, version })
    );
  }

  async assignToSprint(usId: number, milestoneId: number | null): Promise<unknown> {
    return withCurrentVersion(
      () => this.repo.get(usId),
      (version) => this.repo.edit(usId, { milestone: milestoneId, version })
    );
  }

  async moveToKanbanColumn(
    projectId: number,
    usIds: number[],
    statusId: number
  ): Promise<void> {
    const stories = usIds.map((id, idx) => ({ us_id: id, order: idx + 1 }));
    return this.repo.bulkUpdateKanbanOrder({ project_id: projectId, status_id: statusId, bulk_stories: stories });
  }

  async bulkUpdateOrder(
    projectId: number,
    orderData: { us_id: number; order: number }[],
    board: 'backlog' | 'kanban' | 'sprint',
    extraId?: number
  ): Promise<void> {
    if (board === 'kanban' && extraId !== undefined) {
      return this.repo.bulkUpdateKanbanOrder({
        project_id: projectId,
        status_id: extraId,
        bulk_stories: orderData,
      });
    }
    if (board === 'sprint' && extraId !== undefined) {
      return this.repo.bulkUpdateSprintOrder({
        project_id: projectId,
        milestone_id: extraId,
        bulk_stories: orderData,
      });
    }
    return this.repo.bulkUpdateBacklogOrder({ project_id: projectId, bulk_stories: orderData });
  }

  async bulkAssignSprint(
    projectId: number,
    milestoneId: number,
    usIds: number[]
  ): Promise<void> {
    return this.repo.bulkAssignToMilestone({
      project_id: projectId,
      milestone_id: milestoneId,
      bulk_stories: usIds,
    });
  }

  async vote(usId: number): Promise<void> {
    return this.repo.upvote(usId);
  }

  async watch(usId: number): Promise<void> {
    return this.repo.watch(usId);
  }

  async listAttachments(usId: number): Promise<unknown> {
    return this.repo.listAttachments(usId);
  }
}
