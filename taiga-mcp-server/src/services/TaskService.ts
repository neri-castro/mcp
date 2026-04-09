// TaskService.ts
import { TaskRepository, CreateTaskDTO, EditTaskDTO } from '../repositories/TaskRepository.js';
import { withCurrentVersion } from '../utils/occ.js';
import { logger } from '../utils/logger.js';

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

export class TaskService {
  constructor(private readonly repo: TaskRepository) {}

  async list(projectId: number, filters?: Record<string, unknown>): Promise<TaskSummary[]> {
    const tasks = await this.repo.list({ project: projectId, ...filters }) as Record<string, unknown>[];
    return tasks.map((t) => ({
      id: t.id as number,
      ref: t.ref as number,
      subject: t.subject as string,
      status: t.status as number | null,
      status_extra_info: t.status_extra_info as TaskSummary['status_extra_info'],
      project: t.project as number,
      user_story: t.user_story as number | null,
      milestone: t.milestone as number | null,
      assigned_to: t.assigned_to as number | null,
      assigned_to_extra_info: t.assigned_to_extra_info as TaskSummary['assigned_to_extra_info'],
      is_closed: t.is_closed as boolean,
      tags: t.tags as unknown[],
      due_date: t.due_date as string | null,
      created_date: t.created_date as string,
      modified_date: t.modified_date as string,
    }));
  }

  async get(id: number): Promise<unknown> {
    return this.repo.get(id);
  }

  async getByRef(ref: number, projectId: number): Promise<unknown> {
    return this.repo.getByRef(ref, projectId);
  }

  async create(dto: CreateTaskDTO): Promise<unknown> {
    logger.info({ projectId: dto.project, subject: dto.subject }, 'Creando tarea');
    return this.repo.create(dto);
  }

  async edit(id: number, dto: EditTaskDTO): Promise<unknown> {
    return this.repo.edit(id, dto);
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

  async getFiltersData(projectId: number): Promise<unknown> {
    return this.repo.getFiltersData(projectId);
  }
}
