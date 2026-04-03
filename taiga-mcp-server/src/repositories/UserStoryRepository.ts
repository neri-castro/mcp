import { BaseRepository } from './base/BaseRepository.js';
import { TaigaHttpClient } from '../http/TaigaHttpClient.js';

export interface CreateUserStoryDTO {
  project: number;
  subject: string;
  description?: string;
  status?: number;
  milestone?: number | null;
  points?: { role: number; points: number }[];
  order?: number;
  backlog_order?: number;
  sprint_order?: number;
  kanban_order?: number;
  assigned_to?: number;
  assigned_users?: number[];
  tags?: string[];
  watchers?: number[];
  is_blocked?: boolean;
  blocked_note?: string;
  client_requirement?: boolean;
  team_requirement?: boolean;
}

export interface EditUserStoryDTO extends Partial<CreateUserStoryDTO> {
  version: number;
  comment?: string;
}

export interface BulkUpdateOrderDTO {
  project_id: number;
  milestone_id?: number;
  bulk_stories: { us_id: number; order: number }[];
}

export class UserStoryRepository extends BaseRepository<unknown, CreateUserStoryDTO, EditUserStoryDTO> {
  constructor(client: TaigaHttpClient) {
    super(client, '/userstories');
  }

  async getByRef(ref: number, projectId: number): Promise<unknown> {
    const response = await this.client.get('/userstories/by_ref', {
      params: { ref, project: projectId },
    });
    return response.data;
  }

  async bulkCreate(projectId: number, subjects: string[], statusId?: number): Promise<unknown> {
    const response = await this.client.post('/userstories/bulk_create', {
      project_id: projectId,
      bulk_stories: subjects.join('\n'),
      status_id: statusId,
    });
    return response.data;
  }

  async bulkUpdateKanbanOrder(dto: {
    project_id: number;
    status_id: number;
    bulk_stories: { us_id: number; order: number }[];
  }): Promise<void> {
    await this.client.post('/userstories/bulk_update_kanban_order', dto);
  }

  async bulkUpdateSprintOrder(dto: {
    project_id: number;
    milestone_id: number;
    bulk_stories: { us_id: number; order: number }[];
  }): Promise<void> {
    await this.client.post('/userstories/bulk_update_sprint_order', dto);
  }

  async bulkUpdateBacklogOrder(dto: {
    project_id: number;
    bulk_stories: { us_id: number; order: number }[];
  }): Promise<void> {
    await this.client.post('/userstories/bulk_update_backlog_order', dto);
  }

  async bulkAssignToMilestone(dto: {
    project_id: number;
    milestone_id: number;
    bulk_stories: number[];
  }): Promise<void> {
    await this.client.post('/userstories/bulk_update_milestone', dto);
  }

  async upvote(usId: number): Promise<void> {
    await this.client.post(`/userstories/${usId}/upvote`);
  }

  async downvote(usId: number): Promise<void> {
    await this.client.post(`/userstories/${usId}/downvote`);
  }

  async watch(usId: number): Promise<void> {
    await this.client.post(`/userstories/${usId}/watch`);
  }

  async unwatch(usId: number): Promise<void> {
    await this.client.post(`/userstories/${usId}/unwatch`);
  }

  async listAttachments(usId: number): Promise<unknown> {
    const response = await this.client.get(`/userstories/${usId}/attachments`);
    return response.data;
  }
}
