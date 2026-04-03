// src/services/CommitService.ts

import type { GiteaHttpClient } from '../http/GiteaHttpClient.js';
import type { CreateCommitStatusDto } from '../dto/actions/ActionsDto.js';

export class CommitService {
  constructor(private readonly client: GiteaHttpClient) {}

  listCommits(owner: string, repo: string, params?: Record<string, unknown>) {
    return this.client.get(`/repos/${owner}/${repo}/commits`, params);
  }

  getCommit(owner: string, repo: string, sha: string) {
    return this.client.get(`/repos/${owner}/${repo}/git/commits/${sha}`);
  }

  getStatuses(owner: string, repo: string, sha: string, params?: Record<string, unknown>) {
    return this.client.get(`/repos/${owner}/${repo}/statuses/${sha}`, params);
  }

  createStatus(owner: string, repo: string, sha: string, dto: CreateCommitStatusDto) {
    return this.client.post(`/repos/${owner}/${repo}/statuses/${sha}`, dto);
  }

  getCombinedStatus(owner: string, repo: string, ref: string) {
    return this.client.get(`/repos/${owner}/${repo}/commits/${ref}/statuses`);
  }

  compare(owner: string, repo: string, base: string, head: string) {
    return this.client.get(`/repos/${owner}/${repo}/compare/${base}...${head}`);
  }

  getDiff(owner: string, repo: string, sha: string, diffType: 'diff' | 'patch') {
    return this.client.get(`/repos/${owner}/${repo}/git/commits/${sha}.${diffType}`);
  }

  getPullRequests(owner: string, repo: string, sha: string) {
    return this.client.get(`/repos/${owner}/${repo}/commits/${sha}/pull`);
  }

  listChecks(owner: string, repo: string, ref: string, params?: Record<string, unknown>) {
    return this.client.get(`/repos/${owner}/${repo}/commits/${ref}/checks`, params);
  }
}
