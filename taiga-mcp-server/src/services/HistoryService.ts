import { HistoryRepository, HistoryEntityType } from '../repositories/HistoryRepository.js';

interface HistoryEntry {
  id: string;
  created_at: string;
  type: 'create' | 'change' | 'comment' | 'delete_comment';
  user_id: number | null;
  user_name: string;
  comment: string;
  values_diff: Record<string, unknown>;
  is_hidden: boolean;
  edit_comment_date: string | null;
  delete_comment_date: string | null;
}

function mapEntry(e: Record<string, unknown>): HistoryEntry {
  const user = e.user as { pk?: number; username?: string; name?: string } | null;
  const typeNum = e.type as number;
  const comment = e.comment as string ?? '';

  let entryType: HistoryEntry['type'];
  if (typeNum === 1) {
    entryType = 'create';
  } else if (comment.trim().length > 0) {
    entryType = 'comment';
  } else if (typeNum === 3) {
    entryType = 'delete_comment';
  } else {
    entryType = 'change';
  }

  return {
    id: e.id as string,
    created_at: e.created_at as string,
    type: entryType,
    user_id: user?.pk ?? null,
    user_name: user?.name ?? user?.username ?? '',
    comment,
    values_diff: (e.values_diff as Record<string, unknown>) ?? {},
    is_hidden: e.is_hidden as boolean ?? false,
    edit_comment_date: e.edit_comment_date as string | null ?? null,
    delete_comment_date: e.delete_comment_date as string | null ?? null,
  };
}

export class HistoryService {
  constructor(private readonly repo: HistoryRepository) {}

  async getHistory(
    entityType: HistoryEntityType,
    entityId: number,
    limit = 50
  ): Promise<HistoryEntry[]> {
    const raw = await this.repo.getHistory(entityType, entityId) as Record<string, unknown>[];
    return raw.slice(0, limit).map(mapEntry);
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
    return this.repo.editComment(entityType, entityId, commentId, comment);
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
