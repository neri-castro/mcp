// src/services/PullRequestService.ts

import type { GiteaHttpClient } from '../http/GiteaHttpClient.js';
import type {
  CreatePullRequestDto, UpdatePullRequestDto, MergePullRequestDto,
  CreateReviewDto, SubmitReviewDto, DismissReviewDto, RequestedReviewersDto
} from '../dto/pr/PullRequestDto.js';

export class PullRequestService {
  constructor(private readonly client: GiteaHttpClient) {}

  // ─── Pull Requests ───────────────────────────────────────────────────────────
  list(owner: string, repo: string, params?: Record<string, unknown>) { return this.client.get(`/repos/${owner}/${repo}/pulls`, params); }
  get(owner: string, repo: string, index: number) { return this.client.get(`/repos/${owner}/${repo}/pulls/${index}`); }
  create(owner: string, repo: string, dto: CreatePullRequestDto) { return this.client.post(`/repos/${owner}/${repo}/pulls`, dto); }
  update(owner: string, repo: string, index: number, dto: UpdatePullRequestDto) { return this.client.patch(`/repos/${owner}/${repo}/pulls/${index}`, dto); }
  merge(owner: string, repo: string, index: number, dto: MergePullRequestDto) { return this.client.post(`/repos/${owner}/${repo}/pulls/${index}/merge`, dto); }
  cancelMerge(owner: string, repo: string, index: number) { return this.client.delete(`/repos/${owner}/${repo}/pulls/${index}/merge`); }
  checkMerge(owner: string, repo: string, index: number) { return this.client.get(`/repos/${owner}/${repo}/pulls/${index}/merge`); }
  getDiff(owner: string, repo: string, index: number, diffType: 'diff' | 'patch') { return this.client.get(`/repos/${owner}/${repo}/pulls/${index}.${diffType}`); }
  getCommits(owner: string, repo: string, index: number, params?: Record<string, unknown>) { return this.client.get(`/repos/${owner}/${repo}/pulls/${index}/commits`, params); }
  getFiles(owner: string, repo: string, index: number, params?: Record<string, unknown>) { return this.client.get(`/repos/${owner}/${repo}/pulls/${index}/files`, params); }
  addRequestedReviewers(owner: string, repo: string, index: number, dto: RequestedReviewersDto) { return this.client.post(`/repos/${owner}/${repo}/pulls/${index}/requested_reviewers`, dto); }
  removeRequestedReviewers(owner: string, repo: string, index: number, dto: RequestedReviewersDto) { return this.client.delete(`/repos/${owner}/${repo}/pulls/${index}/requested_reviewers`); }

  // ─── Reviews ─────────────────────────────────────────────────────────────────
  listReviews(owner: string, repo: string, index: number, params?: Record<string, unknown>) { return this.client.get(`/repos/${owner}/${repo}/pulls/${index}/reviews`, params); }
  getReview(owner: string, repo: string, index: number, id: number) { return this.client.get(`/repos/${owner}/${repo}/pulls/${index}/reviews/${id}`); }
  createReview(owner: string, repo: string, index: number, dto: CreateReviewDto) { return this.client.post(`/repos/${owner}/${repo}/pulls/${index}/reviews`, dto); }
  submitReview(owner: string, repo: string, index: number, id: number, dto: SubmitReviewDto) { return this.client.post(`/repos/${owner}/${repo}/pulls/${index}/reviews/${id}`, dto); }
  dismissReview(owner: string, repo: string, index: number, id: number, dto: DismissReviewDto) { return this.client.post(`/repos/${owner}/${repo}/pulls/${index}/reviews/${id}/dismissals`, dto); }
  undismissReview(owner: string, repo: string, index: number, id: number) { return this.client.delete(`/repos/${owner}/${repo}/pulls/${index}/reviews/${id}/dismissals`); }
  listReviewComments(owner: string, repo: string, index: number, id: number) { return this.client.get(`/repos/${owner}/${repo}/pulls/${index}/reviews/${id}/comments`); }
  deleteReview(owner: string, repo: string, index: number, id: number) { return this.client.delete(`/repos/${owner}/${repo}/pulls/${index}/reviews/${id}`); }
}
