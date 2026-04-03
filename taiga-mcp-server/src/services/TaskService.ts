// TaskService.ts
import { TaskRepository, CreateTaskDTO, EditTaskDTO } from '../repositories/TaskRepository.js';
import { withCurrentVersion } from '../utils/occ.js';
import { logger } from '../utils/logger.js';

export class TaskService {
  constructor(private readonly repo: TaskRepository) {}

  async list(projectId: number, filters?: Record<string, unknown>): Promise<unknown> {
    return this.repo.list({ project: projectId, ...filters });
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
