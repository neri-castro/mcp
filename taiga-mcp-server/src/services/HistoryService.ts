import { HistoryRepository, HistoryEntityType } from '../repositories/HistoryRepository.js';

export class HistoryService {
  constructor(private readonly repo: HistoryRepository) {}

  async getHistory(entityType: HistoryEntityType, entityId: number): Promise<unknown> {
    return this.repo.getHistory(entityType, entityId);
  }

  async addComment(
    entityType: HistoryEntityType,
    entityId: number,
    comment: string,
    version: number
  ): Promise<unknown> {
    return this.repo.addComment(entityType, entityId, comment, version);
  }

  async editComment(
    entityType: HistoryEntityType,
    entityId: number,
    commentId: string,
    comment: string
  ): Promise<unknown> {
    return this.repo.editComment(entityType, entityId, commentId);
  }

  async deleteComment(
    entityType: HistoryEntityType,
    entityId: number,
    commentId: string
  ): Promise<void> {
    return this.repo.deleteComment(entityType, entityId, commentId);
  }

  async restoreComment(
    entityType: HistoryEntityType,
    entityId: number,
    commentId: string
  ): Promise<void> {
    return this.repo.restoreComment(entityType, entityId, commentId);
  }

  async getCommentVersions(
    entityType: HistoryEntityType,
    entityId: number,
    commentId: string
  ): Promise<unknown> {
    return this.repo.getCommentVersions(entityType, entityId, commentId);
  }
}
