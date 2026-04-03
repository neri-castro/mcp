// src/services/MiscService.ts

import type { GiteaHttpClient } from '../http/GiteaHttpClient.js';

export class MiscService {
  constructor(private readonly client: GiteaHttpClient) {}

  getVersion() { return this.client.get('/version'); }
  getNodeInfo() { return this.client.get('/nodeinfo'); }
  renderMarkdown(body: { context?: string; mode?: string; text: string; wiki?: boolean }) { return this.client.post('/markdown', body); }
  renderMarkdownRaw(text: string) { return this.client.post('/markdown/raw', text); }
  listGitignoreTemplates() { return this.client.get('/gitignore/templates'); }
  getGitignoreTemplate(name: string) { return this.client.get(`/gitignore/templates/${name}`); }
  listLicenses() { return this.client.get('/licenses'); }
  getLicense(name: string) { return this.client.get(`/licenses/${name}`); }
  searchTopics(params?: Record<string, unknown>) { return this.client.get('/topics/search', params); }
  getSettings() { return this.client.get('/settings/api'); }
  getActivityPubActor(userId: number) { return this.client.get(`/activitypub/user-id/${userId}`); }
  sendActivityPubInbox(userId: number, activity: unknown) { return this.client.post(`/activitypub/user-id/${userId}/inbox`, activity); }
}
