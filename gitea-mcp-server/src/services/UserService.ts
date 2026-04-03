// src/services/UserService.ts

import type { GiteaHttpClient } from '../http/GiteaHttpClient.js';
import type {
  UpdateUserSettingsDto, AddSshKeyDto, AddGpgKeyDto,
  CreateOAuth2AppDto, UpdateOAuth2AppDto, CreateAccessTokenDto
} from '../dto/user/UserDto.js';

export class UserService {
  constructor(private readonly client: GiteaHttpClient) {}

  // ─── Perfil ──────────────────────────────────────────────────────────────────
  getAuthenticated() { return this.client.get('/user'); }
  updateSettings(dto: UpdateUserSettingsDto) { return this.client.patch('/user/settings', dto); }
  getUser(username: string) { return this.client.get(`/users/${username}`); }
  search(params?: Record<string, unknown>) { return this.client.get('/users/search', params); }

  // ─── Seguidores ──────────────────────────────────────────────────────────────
  listFollowers(username: string, params?: Record<string, unknown>) { return this.client.get(`/users/${username}/followers`, params); }
  listFollowing(username: string, params?: Record<string, unknown>) { return this.client.get(`/users/${username}/following`, params); }
  follow(username: string) { return this.client.put(`/user/following/${username}`); }
  unfollow(username: string) { return this.client.delete(`/user/following/${username}`); }
  checkFollowing(username: string) { return this.client.get(`/user/following/${username}`); }

  // ─── Repositorios ────────────────────────────────────────────────────────────
  listRepos(username: string, params?: Record<string, unknown>) { return this.client.get(`/users/${username}/repos`, params); }
  listStarred(username: string, params?: Record<string, unknown>) { return this.client.get(`/users/${username}/starred`, params); }
  starRepo(owner: string, repo: string) { return this.client.put(`/user/starred/${owner}/${repo}`); }
  unstarRepo(owner: string, repo: string) { return this.client.delete(`/user/starred/${owner}/${repo}`); }
  checkStarred(owner: string, repo: string) { return this.client.get(`/user/starred/${owner}/${repo}`); }
  listWatched(username: string, params?: Record<string, unknown>) { return this.client.get(`/users/${username}/subscriptions`, params); }
  watchRepo(owner: string, repo: string) { return this.client.put(`/repos/${owner}/${repo}/subscription`); }
  unwatchRepo(owner: string, repo: string) { return this.client.delete(`/repos/${owner}/${repo}/subscription`); }

  // ─── Claves GPG ──────────────────────────────────────────────────────────────
  listGpgKeys(params?: Record<string, unknown>) { return this.client.get('/user/gpg_keys', params); }
  addGpgKey(dto: AddGpgKeyDto) { return this.client.post('/user/gpg_keys', dto); }
  deleteGpgKey(id: number) { return this.client.delete(`/user/gpg_keys/${id}`); }

  // ─── Claves SSH ──────────────────────────────────────────────────────────────
  listSshKeys(params?: Record<string, unknown>) { return this.client.get('/user/keys', params); }
  addSshKey(dto: AddSshKeyDto) { return this.client.post('/user/keys', dto); }
  deleteSshKey(id: number) { return this.client.delete(`/user/keys/${id}`); }

  // ─── OAuth2 ──────────────────────────────────────────────────────────────────
  listOAuth2Apps(params?: Record<string, unknown>) { return this.client.get('/user/applications/oauth2', params); }
  createOAuth2App(dto: CreateOAuth2AppDto) { return this.client.post('/user/applications/oauth2', dto); }
  getOAuth2App(id: number) { return this.client.get(`/user/applications/oauth2/${id}`); }
  updateOAuth2App(id: number, dto: UpdateOAuth2AppDto) { return this.client.patch(`/user/applications/oauth2/${id}`, dto); }
  deleteOAuth2App(id: number) { return this.client.delete(`/user/applications/oauth2/${id}`); }

  // ─── Tokens ──────────────────────────────────────────────────────────────────
  listTokens(username: string, params?: Record<string, unknown>) { return this.client.get(`/users/${username}/tokens`, params); }
  createToken(username: string, dto: CreateAccessTokenDto) { return this.client.post(`/users/${username}/tokens`, dto); }
  deleteToken(username: string, token: string) { return this.client.delete(`/users/${username}/tokens/${token}`); }

  // ─── Heatmap ─────────────────────────────────────────────────────────────────
  getHeatmap(username: string) { return this.client.get(`/users/${username}/heatmap`); }
}
