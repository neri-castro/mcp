// src/services/AdminService.ts

import type { GiteaHttpClient } from '../http/GiteaHttpClient.js';
import type { CreateUserDto, AdminUpdateUserDto } from '../dto/user/UserDto.js';
import type { CreateRepoDto } from '../dto/repo/RepoDto.js';
import type { CreateOrgDto } from '../dto/user/UserDto.js';
import type { AddSshKeyDto } from '../dto/user/UserDto.js';

export class AdminService {
  constructor(private readonly client: GiteaHttpClient) {}

  // ─── Usuarios ────────────────────────────────────────────────────────────────
  listUsers(params?: Record<string, unknown>) { return this.client.get('/admin/users', params); }
  createUser(dto: CreateUserDto) { return this.client.post('/admin/users', dto); }
  updateUser(username: string, dto: AdminUpdateUserDto) { return this.client.patch(`/admin/users/${username}`, dto); }
  deleteUser(username: string) { return this.client.delete(`/admin/users/${username}`); }
  renameUser(username: string, newName: string) { return this.client.post(`/admin/users/${username}/rename`, { new_name: newName }); }
  createRepoForUser(username: string, dto: CreateRepoDto) { return this.client.post(`/admin/users/${username}/repos`, dto); }
  createOrgForUser(username: string, dto: CreateOrgDto) { return this.client.post(`/admin/users/${username}/orgs`, dto); }
  addKeyToUser(username: string, dto: AddSshKeyDto) { return this.client.post(`/admin/users/${username}/keys`, dto); }
  deleteKeyFromUser(username: string, id: number) { return this.client.delete(`/admin/users/${username}/keys/${id}`); }

  // ─── Cron ────────────────────────────────────────────────────────────────────
  listCron() { return this.client.get('/admin/cron'); }
  runCron(task: string) { return this.client.post(`/admin/cron/${task}`); }

  // ─── Emails ──────────────────────────────────────────────────────────────────
  listEmails(params?: Record<string, unknown>) { return this.client.get('/admin/emails', params); }
  searchEmails(params?: Record<string, unknown>) { return this.client.get('/admin/emails/search', params); }

  // ─── Orgs ────────────────────────────────────────────────────────────────────
  listOrgs(params?: Record<string, unknown>) { return this.client.get('/admin/orgs', params); }

  // ─── Hooks globales ──────────────────────────────────────────────────────────
  listHooks() { return this.client.get('/admin/hooks'); }
  createHook(dto: unknown) { return this.client.post('/admin/hooks', dto); }
  getHook(id: number) { return this.client.get(`/admin/hooks/${id}`); }
  updateHook(id: number, dto: unknown) { return this.client.patch(`/admin/hooks/${id}`, dto); }
  deleteHook(id: number) { return this.client.delete(`/admin/hooks/${id}`); }

  // ─── Repositorios huérfanos ──────────────────────────────────────────────────
  listUnadopted(params?: Record<string, unknown>) { return this.client.get('/admin/unadopted', params); }
  adoptRepo(owner: string, repo: string) { return this.client.post(`/admin/unadopted/${owner}/${repo}`); }
  deleteUnadopted(owner: string, repo: string) { return this.client.delete(`/admin/unadopted/${owner}/${repo}`); }
}
