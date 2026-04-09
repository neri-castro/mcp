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

interface SprintDetail extends SprintSummary {
  user_stories: { id: number; ref: number; subject: string; status_name: string | null; is_closed: boolean; assigned_to_name: string | null }[];
  total_watchers: number;
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

  async get(sprintId: number): Promise<SprintDetail> {
    const raw = await this.milestoneRepo.get(sprintId) as Record<string, unknown>;
    const userStories = (raw.user_stories as Record<string, unknown>[] | null) ?? [];
    return {
      id: raw.id as number,
      name: raw.name as string,
      slug: raw.slug as string,
      project: raw.project as number,
      estimated_start: raw.estimated_start as string | null,
      estimated_finish: raw.estimated_finish as string | null,
      closed: raw.closed as boolean,
      total_points: raw.total_points as number | null,
      completed_points: raw.completed_points as number | null,
      created_date: raw.created_date as string,
      modified_date: raw.modified_date as string,
      total_watchers: raw.total_watchers as number ?? 0,
      user_stories: userStories.map((us) => {
        const si = us.status_extra_info as { name?: string } | null;
        const ai = us.assigned_to_extra_info as { full_name_display?: string } | null;
        return {
          id: us.id as number,
          ref: us.ref as number,
          subject: us.subject as string,
          status_name: si?.name ?? null,
          is_closed: us.is_closed as boolean,
          assigned_to_name: ai?.full_name_display ?? null,
        };
      }),
    };
  }

  async create(dto: CreateMilestoneDTO): Promise<SprintSummary> {
    logger.info({ projectId: dto.project, name: dto.name }, 'Creando sprint');
    const raw = await this.milestoneRepo.create(dto) as Record<string, unknown>;
    return this.toSummary(raw);
  }

  async edit(sprintId: number, dto: EditMilestoneDTO): Promise<SprintSummary> {
    const raw = await this.milestoneRepo.edit(sprintId, dto) as Record<string, unknown>;
    return this.toSummary(raw);
  }

  private toSummary(s: Record<string, unknown>): SprintSummary {
    return {
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
    };
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
