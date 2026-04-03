// src/services/PackageService.ts

import type { GiteaHttpClient } from '../http/GiteaHttpClient.js';

export class PackageService {
  constructor(private readonly client: GiteaHttpClient) {}

  listForUser(username: string, params?: Record<string, unknown>) { return this.client.get(`/packages/${username}`, params); }
  get(username: string, type: string, name: string, version: string) { return this.client.get(`/packages/${username}/${type}/${name}/${version}`); }
  delete(username: string, type: string, name: string, version: string) { return this.client.delete(`/packages/${username}/${type}/${name}/${version}`); }
  listFiles(username: string, type: string, name: string, version: string) { return this.client.get(`/packages/${username}/${type}/${name}/${version}/files`); }
}
