import { TimelineRepository } from '../repositories/TimelineRepository.js';

export class StatsService {
  constructor(private readonly repo: TimelineRepository) {}

  async getProjectTimeline(projectId: number, page?: number): Promise<unknown> {
    return this.repo.getProjectTimeline(projectId, page);
  }

  async getUserTimeline(userId: number, page?: number): Promise<unknown> {
    return this.repo.getUserTimeline(userId, page);
  }

  async getProjectStats(projectId: number): Promise<unknown> {
    return this.repo.getProjectStats(projectId);
  }

  async getIssueStats(projectId: number): Promise<unknown> {
    return this.repo.getIssueStats(projectId);
  }

  async getSprintStats(sprintId: number): Promise<unknown> {
    return this.repo.getSprintStats(sprintId);
  }
}
