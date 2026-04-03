// src/services/IssueService.ts

import type { GiteaHttpClient } from '../http/GiteaHttpClient.js';
import type {
  CreateIssueDto, UpdateIssueDto, CreateCommentDto, UpdateCommentDto,
  CreateLabelDto, UpdateLabelDto, IssueLabelsDto, CreateMilestoneDto,
  UpdateMilestoneDto, CreateTimeDto, IssueReactionDto, LockIssueDto
} from '../dto/issue/IssueDto.js';

export class IssueService {
  constructor(private readonly client: GiteaHttpClient) {}

  // ─── Issues ──────────────────────────────────────────────────────────────────
  list(owner: string, repo: string, params?: Record<string, unknown>) { return this.client.get(`/repos/${owner}/${repo}/issues`, params); }
  listForUser(params?: Record<string, unknown>) { return this.client.get('/issues', params); }
  get(owner: string, repo: string, index: number) { return this.client.get(`/repos/${owner}/${repo}/issues/${index}`); }
  create(owner: string, repo: string, dto: CreateIssueDto) { return this.client.post(`/repos/${owner}/${repo}/issues`, dto); }
  update(owner: string, repo: string, index: number, dto: UpdateIssueDto) { return this.client.patch(`/repos/${owner}/${repo}/issues/${index}`, dto); }
  delete(owner: string, repo: string, index: number) { return this.client.delete(`/repos/${owner}/${repo}/issues/${index}`); }
  lock(owner: string, repo: string, index: number, dto: LockIssueDto) { return this.client.post(`/repos/${owner}/${repo}/issues/${index}/lock`, dto); }
  unlock(owner: string, repo: string, index: number) { return this.client.delete(`/repos/${owner}/${repo}/issues/${index}/lock`); }
  subscribe(owner: string, repo: string, index: number, user: string) { return this.client.put(`/repos/${owner}/${repo}/issues/${index}/subscriptions/${user}`); }
  unsubscribe(owner: string, repo: string, index: number, user: string) { return this.client.delete(`/repos/${owner}/${repo}/issues/${index}/subscriptions/${user}`); }

  // ─── Comentarios ────────────────────────────────────────────────────────────
  listComments(owner: string, repo: string, index: number, params?: Record<string, unknown>) { return this.client.get(`/repos/${owner}/${repo}/issues/${index}/comments`, params); }
  listAllComments(owner: string, repo: string, params?: Record<string, unknown>) { return this.client.get(`/repos/${owner}/${repo}/issues/comments`, params); }
  getComment(owner: string, repo: string, id: number) { return this.client.get(`/repos/${owner}/${repo}/issues/comments/${id}`); }
  createComment(owner: string, repo: string, index: number, dto: CreateCommentDto) { return this.client.post(`/repos/${owner}/${repo}/issues/${index}/comments`, dto); }
  updateComment(owner: string, repo: string, id: number, dto: UpdateCommentDto) { return this.client.patch(`/repos/${owner}/${repo}/issues/comments/${id}`, dto); }
  deleteComment(owner: string, repo: string, id: number) { return this.client.delete(`/repos/${owner}/${repo}/issues/comments/${id}`); }

  // ─── Labels ──────────────────────────────────────────────────────────────────
  listLabels(owner: string, repo: string) { return this.client.get(`/repos/${owner}/${repo}/labels`); }
  createLabel(owner: string, repo: string, dto: CreateLabelDto) { return this.client.post(`/repos/${owner}/${repo}/labels`, dto); }
  getLabel(owner: string, repo: string, id: number) { return this.client.get(`/repos/${owner}/${repo}/labels/${id}`); }
  updateLabel(owner: string, repo: string, id: number, dto: UpdateLabelDto) { return this.client.patch(`/repos/${owner}/${repo}/labels/${id}`, dto); }
  deleteLabel(owner: string, repo: string, id: number) { return this.client.delete(`/repos/${owner}/${repo}/labels/${id}`); }
  addLabels(owner: string, repo: string, index: number, dto: IssueLabelsDto) { return this.client.post(`/repos/${owner}/${repo}/issues/${index}/labels`, dto); }
  replaceLabels(owner: string, repo: string, index: number, dto: IssueLabelsDto) { return this.client.put(`/repos/${owner}/${repo}/issues/${index}/labels`, dto); }
  removeAllLabels(owner: string, repo: string, index: number) { return this.client.delete(`/repos/${owner}/${repo}/issues/${index}/labels`); }

  // ─── Milestones ──────────────────────────────────────────────────────────────
  listMilestones(owner: string, repo: string, params?: Record<string, unknown>) { return this.client.get(`/repos/${owner}/${repo}/milestones`, params); }
  createMilestone(owner: string, repo: string, dto: CreateMilestoneDto) { return this.client.post(`/repos/${owner}/${repo}/milestones`, dto); }
  getMilestone(owner: string, repo: string, id: number) { return this.client.get(`/repos/${owner}/${repo}/milestones/${id}`); }
  updateMilestone(owner: string, repo: string, id: number, dto: UpdateMilestoneDto) { return this.client.patch(`/repos/${owner}/${repo}/milestones/${id}`, dto); }
  deleteMilestone(owner: string, repo: string, id: number) { return this.client.delete(`/repos/${owner}/${repo}/milestones/${id}`); }

  // ─── Reactions ───────────────────────────────────────────────────────────────
  listIssueReactions(owner: string, repo: string, index: number) { return this.client.get(`/repos/${owner}/${repo}/issues/${index}/reactions`); }
  addIssueReaction(owner: string, repo: string, index: number, dto: IssueReactionDto) { return this.client.post(`/repos/${owner}/${repo}/issues/${index}/reactions`, dto); }
  removeIssueReaction(owner: string, repo: string, index: number, dto: IssueReactionDto) { return this.client.delete(`/repos/${owner}/${repo}/issues/${index}/reactions`); }
  listCommentReactions(owner: string, repo: string, id: number) { return this.client.get(`/repos/${owner}/${repo}/issues/comments/${id}/reactions`); }
  addCommentReaction(owner: string, repo: string, id: number, dto: IssueReactionDto) { return this.client.post(`/repos/${owner}/${repo}/issues/comments/${id}/reactions`, dto); }

  // ─── Time Tracking ───────────────────────────────────────────────────────────
  listTimes(owner: string, repo: string, index: number) { return this.client.get(`/repos/${owner}/${repo}/issues/${index}/times`); }
  addTime(owner: string, repo: string, index: number, dto: CreateTimeDto) { return this.client.post(`/repos/${owner}/${repo}/issues/${index}/times`, dto); }
  deleteTime(owner: string, repo: string, index: number, id: number) { return this.client.delete(`/repos/${owner}/${repo}/issues/${index}/times/${id}`); }
  listAllTimes(owner: string, repo: string) { return this.client.get(`/repos/${owner}/${repo}/times`); }
}
