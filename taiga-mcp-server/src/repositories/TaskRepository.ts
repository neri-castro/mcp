import { BaseRepository } from './base/BaseRepository.js';
import { TaigaHttpClient } from '../http/TaigaHttpClient.js';

export interface CreateTaskDTO {
  project: number;
  user_story?: number;
  milestone?: number;
  subject: string;
  description?: string;
  status?: number;
  assigned_to?: number;
  order?: number;
  tags?: string[];
  watchers?: number[];
  is_iocaine?: boolean;
  due_date?: string;
}

export interface EditTaskDTO extends Partial<CreateTaskDTO> {
  version: number;
  comment?: string;
}

export class TaskRepository extends BaseRepository<unknown, CreateTaskDTO, EditTaskDTO> {
  constructor(client: TaigaHttpClient) {
    super(client, '/tasks');
  }

  async getByRef(ref: number, projectId: number): Promise<unknown> {
    const response = await this.client.get('/tasks/by_ref', {
      params: { ref, project: projectId },
    });
    return response.data;
  }

  async bulkCreate(dto: {
    project_id: number;
    us_id?: number;
    milestone_id?: number;
    bulk_tasks: string;
    status_id?: number;
  }): Promise<unknown> {
    const response = await this.client.post('/tasks/bulk_create', dto);
    return response.data;
  }

  async upvote(taskId: number): Promise<void> {
    await this.client.post(`/tasks/${taskId}/upvote`);
  }

  async watch(taskId: number): Promise<void> {
    await this.client.post(`/tasks/${taskId}/watch`);
  }

  async listAttachments(taskId: number): Promise<unknown> {
    const response = await this.client.get(`/tasks/${taskId}/attachments`);
    return response.data;
  }

  async getFiltersData(projectId: number): Promise<unknown> {
    const response = await this.client.get('/tasks/filters_data', {
      params: { project: projectId },
    });
    return response.data;
  }
}
