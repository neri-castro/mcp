import {
  MilestoneRepository,
  CreateMilestoneDTO,
  EditMilestoneDTO,
} from '../repositories/MilestoneRepository.js';
import { UserStoryRepository } from '../repositories/UserStoryRepository.js';
import { logger } from '../utils/logger.js';
import { withCurrentVersion } from '../utils/occ.js';

interface SprintSummary {
  id: number;
  name: string;
  slug: string;
  project: number;
  estimated_start: string | null;
  estimated_finish: string | null;
  closed: boolean;
  total_points: number | null;
  completed_points: number | null;
  created_date: string;
  modified_date: string;
}

export class SprintService {
  constructor(
    private readonly milestoneRepo: MilestoneRepository,
    private readonly userStoryRepo: UserStoryRepository
  ) {}

  async list(projectId: number, closed?: boolean): Promise<SprintSummary[]> {
    const sprints = await this.milestoneRepo.list({ project: projectId, ...(closed !== undefined ? { closed } : {}) }) as Record<string, unknown>[];
    return sprints.map((s) => ({
      id: s.id as number,
      name: s.name as string,
      slug: s.slug as string,
      project: s.project as number,
      estimated_start: s.estimated_start as string | null,
      estimated_finish: s.estimated_finish as string | null,
      closed: s.closed as boolean,
      total_points: s.total_points as number | null,
      completed_points: s.completed_points as number | null,
      created_date: s.created_date as string,
      modified_date: s.modified_date as string,
    }));
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
