import { TaigaHttpClient } from '../http/TaigaHttpClient.js';

export class TimelineRepository {
  constructor(private readonly client: TaigaHttpClient) {}

  async getProjectTimeline(projectId: number, page?: number): Promise<unknown> {
    const response = await this.client.get(`/timeline/project/${projectId}`, {
      params: page ? { page } : {},
    });
    return response.data;
  }

  async getUserTimeline(userId: number, page?: number): Promise<unknown> {
    const response = await this.client.get(`/timeline/user/${userId}`, {
      params: page ? { page } : {},
    });
    return response.data;
  }

  async getProjectStats(projectId: number): Promise<unknown> {
    const response = await this.client.get(`/projects/${projectId}/stats`);
    return response.data;
  }

  async getIssueStats(projectId: number): Promise<unknown> {
    const response = await this.client.get(`/projects/${projectId}/issues_stats`);
    return response.data;
  }

  async getSprintStats(sprintId: number): Promise<unknown> {
    const response = await this.client.get(`/milestones/${sprintId}/stats`);
    return response.data;
  }
}
