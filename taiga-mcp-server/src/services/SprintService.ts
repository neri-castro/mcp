import {
  MilestoneRepository,
  CreateMilestoneDTO,
  EditMilestoneDTO,
} from '../repositories/MilestoneRepository.js';
import { UserStoryRepository } from '../repositories/UserStoryRepository.js';
import { logger } from '../utils/logger.js';
import { withCurrentVersion } from '../utils/occ.js';

export class SprintService {
  constructor(
    private readonly milestoneRepo: MilestoneRepository,
    private readonly userStoryRepo: UserStoryRepository
  ) {}

  async list(projectId: number, closed?: boolean): Promise<unknown> {
    return this.milestoneRepo.list({ project: projectId, ...(closed !== undefined ? { closed } : {}) });
  }

  async get(sprintId: number): Promise<unknown> {
    return this.milestoneRepo.get(sprintId);
  }

  async create(dto: CreateMilestoneDTO): Promise<unknown> {
    logger.info({ projectId: dto.project, name: dto.name }, 'Creando sprint');
    return this.milestoneRepo.create(dto);
  }

  async edit(sprintId: number, dto: EditMilestoneDTO): Promise<unknown> {
    return this.milestoneRepo.edit(sprintId, dto);
  }

  async delete(sprintId: number): Promise<void> {
    return this.milestoneRepo.delete(sprintId);
  }

  async getStats(sprintId: number): Promise<unknown> {
    return this.milestoneRepo.getStats(sprintId);
  }

  // Tell Don't Ask: obtiene la versión del US y lo asigna al sprint
  async addUserStory(sprintId: number, usId: number): Promise<unknown> {
    return withCurrentVersion(
      () => this.userStoryRepo.get(usId),
      (version) => this.userStoryRepo.edit(usId, { milestone: sprintId, version })
    );
  }

  async removeUserStory(usId: number): Promise<unknown> {
    return withCurrentVersion(
      () => this.userStoryRepo.get(usId),
      (version) => this.userStoryRepo.edit(usId, { milestone: null, version })
    );
  }

  async bulkAddUserStories(sprintId: number, usIds: number[]): Promise<void> {
    const projectData = await this.milestoneRepo.get(sprintId) as { project: number };
    return this.userStoryRepo.bulkAssignToMilestone({
      project_id: projectData.project,
      milestone_id: sprintId,
      bulk_stories: usIds,
    });
  }

  async watch(sprintId: number): Promise<void> {
    return this.milestoneRepo.watch(sprintId);
  }
}
