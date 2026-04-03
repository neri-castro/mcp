import { BaseRepository } from './base/BaseRepository.js';
import { TaigaHttpClient } from '../http/TaigaHttpClient.js';

export interface CreateIssueDTO {
  project: number;
  subject: string;
  description?: string;
  type: number;
  status?: number;
  priority: number;
  severity: number;
  milestone?: number;
  assigned_to?: number;
  tags?: string[];
  watchers?: number[];
  due_date?: string;
}

export interface EditIssueDTO extends Partial<CreateIssueDTO> {
  version: number;
  comment?: string;
}

export class IssueRepository extends BaseRepository<unknown, CreateIssueDTO, EditIssueDTO> {
  constructor(client: TaigaHttpClient) {
    super(client, '/issues');
  }

  async getByRef(ref: number, projectId: number): Promise<unknown> {
    const response = await this.client.get('/issues/by_ref', {
      params: { ref, project: projectId },
    });
    return response.data;
  }

  async listTypes(projectId: number): Promise<unknown> {
    const response = await this.client.get('/issue-types', { params: { project: projectId } });
    return response.data;
  }

  async listPriorities(projectId: number): Promise<unknown> {
    const response = await this.client.get('/priorities', { params: { project: projectId } });
    return response.data;
  }

  async listSeverities(projectId: number): Promise<unknown> {
    const response = await this.client.get('/severities', { params: { project: projectId } });
    return response.data;
  }

  async promoteToUserStory(issueId: number, projectId: number): Promise<unknown> {
    const response = await this.client.post(`/issues/${issueId}/promote_to_user_story`, {
      project_id: projectId,
    });
    return response.data;
  }

  async upvote(issueId: number): Promise<void> {
    await this.client.post(`/issues/${issueId}/upvote`);
  }

  async watch(issueId: number): Promise<void> {
    await this.client.post(`/issues/${issueId}/watch`);
  }

  async listAttachments(issueId: number): Promise<unknown> {
    const response = await this.client.get(`/issues/${issueId}/attachments`);
    return response.data;
  }

  async getFiltersData(projectId: number): Promise<unknown> {
    const response = await this.client.get('/issues/filters_data', {
      params: { project: projectId },
    });
    return response.data;
  }
}
