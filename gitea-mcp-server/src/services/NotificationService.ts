// src/services/NotificationService.ts

import type { GiteaHttpClient } from '../http/GiteaHttpClient.js';

export class NotificationService {
  constructor(private readonly client: GiteaHttpClient) {}

  list(params?: Record<string, unknown>) { return this.client.get('/notifications', params); }
  markAllRead(params?: Record<string, unknown>) { return this.client.put('/notifications', params); }
  listRepo(owner: string, repo: string, params?: Record<string, unknown>) { return this.client.get(`/repos/${owner}/${repo}/notifications`, params); }
  markRepoRead(owner: string, repo: string, params?: Record<string, unknown>) { return this.client.put(`/repos/${owner}/${repo}/notifications`, params); }
  get(id: number) { return this.client.get(`/notifications/threads/${id}`); }
  markRead(id: number) { return this.client.patch(`/notifications/threads/${id}`); }
  checkNew() { return this.client.get('/notifications/new'); }
}
