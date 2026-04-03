import { BaseRepository } from './base/BaseRepository.js';
import { TaigaHttpClient } from '../http/TaigaHttpClient.js';

export interface CreateEpicDTO {
  project: number;
  subject: string;
  description?: string;
  color?: string;
  status?: number;
  order?: number;
  tags?: string[];
  assigned_to?: number;
  watchers?: number[];
}

export interface EditEpicDTO extends Partial<CreateEpicDTO> {
  version: number;
}

export class EpicRepository extends BaseRepository<unknown, CreateEpicDTO, EditEpicDTO> {
  constructor(client: TaigaHttpClient) {
    super(client, '/epics');
  }

  async getByRef(ref: number, projectId: number): Promise<unknown> {
    const response = await this.client.get('/epics/by_ref', { params: { ref, project: projectId } });
    return response.data;
  }

  async bulkCreate(projectId: number, subjects: string[], statusId?: number): Promise<unknown> {
    const response = await this.client.post('/epics/bulk_create', {
      project_id: projectId,
      bulk_epics: subjects.join('\n'),
      status_id: statusId,
    });
    return response.data;
  }

  async listRelatedUserStories(epicId: number): Promise<unknown> {
    const response = await this.client.get(`/epics/${epicId}/related_userstories`);
    return response.data;
  }

  async linkUserStory(epicId: number, userStoryId: number): Promise<unknown> {
    const response = await this.client.post(`/epics/${epicId}/related_userstories`, {
      user_story: userStoryId,
    });
    return response.data;
  }

  async unlinkUserStory(epicId: number, userStoryId: number): Promise<void> {
    await this.client.delete(`/epics/${epicId}/related_userstories/${userStoryId}`);
  }

  async bulkLinkUserStories(epicId: number, userStoryIds: number[]): Promise<unknown> {
    const response = await this.client.post(`/epics/${epicId}/related_userstories/bulk_create`, {
      bulk_userstories: userStoryIds,
    });
    return response.data;
  }

  async upvote(epicId: number): Promise<void> {
    await this.client.post(`/epics/${epicId}/upvote`);
  }

  async downvote(epicId: number): Promise<void> {
    await this.client.post(`/epics/${epicId}/downvote`);
  }

  async watch(epicId: number): Promise<void> {
    await this.client.post(`/epics/${epicId}/watch`);
  }

  async unwatch(epicId: number): Promise<void> {
    await this.client.post(`/epics/${epicId}/unwatch`);
  }

  async listAttachments(epicId: number): Promise<unknown> {
    const response = await this.client.get(`/epics/${epicId}/attachments`);
    return response.data;
  }

  async getFiltersData(projectId: number): Promise<unknown> {
    const response = await this.client.get('/epics/filters_data', { params: { project: projectId } });
    return response.data;
  }
}
