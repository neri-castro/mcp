import { TaigaHttpClient } from '../http/TaigaHttpClient.js';

export type HistoryEntityType = 'userstory' | 'task' | 'issue' | 'wiki' | 'epic';

export class HistoryRepository {
  constructor(private readonly client: TaigaHttpClient) {}

  async getHistory(entityType: HistoryEntityType, entityId: number): Promise<unknown> {
    const response = await this.client.get(`/history/${entityType}/${entityId}`);
    return response.data;
  }

  async addComment(
    entityType: HistoryEntityType,
    entityId: number,
    comment: string,
    version: number
  ): Promise<unknown> {
    const entityPaths: Record<HistoryEntityType, string> = {
      userstory: '/userstories',
      task: '/tasks',
      issue: '/issues',
      wiki: '/wiki',
      epic: '/epics',
    };
    const path = entityPaths[entityType];
    const response = await this.client.patch(`${path}/${entityId}`, { comment, version });
    return response.data;
  }

  async editComment(
    entityType: HistoryEntityType,
    entityId: number,
    commentId: string,
    comment: string
  ): Promise<unknown> {
    const response = await this.client.patch(
      `/history/${entityType}/${entityId}/edit_comment`,
      { comment },
      { params: { id: commentId } }
    );
    return response.data;
  }

  async deleteComment(
    entityType: HistoryEntityType,
    entityId: number,
    commentId: string
  ): Promise<void> {
    await this.client.delete(
      `/history/${entityType}/${entityId}/delete_comment`,
      { params: { id: commentId } }
    );
  }

  async restoreComment(
    entityType: HistoryEntityType,
    entityId: number,
    commentId: string
  ): Promise<void> {
    await this.client.post(
      `/history/${entityType}/${entityId}/undelete_comment`,
      {},
      { params: { id: commentId } }
    );
  }

  async getCommentVersions(
    entityType: HistoryEntityType,
    entityId: number,
    commentId: string
  ): Promise<unknown> {
    const response = await this.client.get(
      `/history/${entityType}/${entityId}/comment_versions`,
      { params: { id: commentId } }
    );
    return response.data;
  }
}
