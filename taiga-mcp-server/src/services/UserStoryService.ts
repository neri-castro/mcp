import {
  UserStoryRepository,
  CreateUserStoryDTO,
  EditUserStoryDTO,
} from '../repositories/UserStoryRepository.js';
import { withCurrentVersion } from '../utils/occ.js';
import { logger } from '../utils/logger.js';

export class UserStoryService {
  constructor(private readonly repo: UserStoryRepository) {}

  async list(projectId: number, filters?: Record<string, unknown>): Promise<unknown> {
    return this.repo.list({ project: projectId, ...filters });
  }

  async get(id: number): Promise<unknown> {
    return this.repo.get(id);
  }

  async getByRef(ref: number, projectId: number): Promise<unknown> {
    return this.repo.getByRef(ref, projectId);
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
