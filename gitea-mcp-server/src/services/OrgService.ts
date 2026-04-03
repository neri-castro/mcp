// src/services/OrgService.ts

import type { GiteaHttpClient } from '../http/GiteaHttpClient.js';
import type {
  CreateOrgDto, UpdateOrgDto, CreateTeamDto, UpdateTeamDto
} from '../dto/user/UserDto.js';

export class OrgService {
  constructor(private readonly client: GiteaHttpClient) {}

  // ─── Organizaciones ──────────────────────────────────────────────────────────
  listAll(params?: Record<string, unknown>) { return this.client.get('/organizations', params); }
  listForUser(params?: Record<string, unknown>) { return this.client.get('/user/orgs', params); }
  get(org: string) { return this.client.get(`/orgs/${org}`); }
  create(dto: CreateOrgDto) { return this.client.post('/orgs', dto); }
  update(org: string, dto: UpdateOrgDto) { return this.client.patch(`/orgs/${org}`, dto); }
  delete(org: string) { return this.client.delete(`/orgs/${org}`); }

  // ─── Miembros ────────────────────────────────────────────────────────────────
  listMembers(org: string, params?: Record<string, unknown>) { return this.client.get(`/orgs/${org}/members`, params); }
  checkMember(org: string, username: string) { return this.client.get(`/orgs/${org}/members/${username}`); }
  removeMember(org: string, username: string) { return this.client.delete(`/orgs/${org}/members/${username}`); }
  listPublicMembers(org: string, params?: Record<string, unknown>) { return this.client.get(`/orgs/${org}/public_members`, params); }
  publicizeMember(org: string, username: string) { return this.client.put(`/orgs/${org}/public_members/${username}`); }
  concealMember(org: string, username: string) { return this.client.delete(`/orgs/${org}/public_members/${username}`); }

  // ─── Repositorios ────────────────────────────────────────────────────────────
  listRepos(org: string, params?: Record<string, unknown>) { return this.client.get(`/orgs/${org}/repos`, params); }

  // ─── Webhooks ────────────────────────────────────────────────────────────────
  listHooks(org: string) { return this.client.get(`/orgs/${org}/hooks`); }
  createHook(org: string, dto: unknown) { return this.client.post(`/orgs/${org}/hooks`, dto); }
  getHook(org: string, id: number) { return this.client.get(`/orgs/${org}/hooks/${id}`); }
  updateHook(org: string, id: number, dto: unknown) { return this.client.patch(`/orgs/${org}/hooks/${id}`, dto); }
  deleteHook(org: string, id: number) { return this.client.delete(`/orgs/${org}/hooks/${id}`); }

  // ─── Equipos ─────────────────────────────────────────────────────────────────
  listTeams(org: string, params?: Record<string, unknown>) { return this.client.get(`/orgs/${org}/teams`, params); }
  searchTeams(org: string, params?: Record<string, unknown>) { return this.client.get(`/orgs/${org}/teams/search`, params); }
  getTeam(id: number) { return this.client.get(`/teams/${id}`); }
  createTeam(org: string, dto: CreateTeamDto) { return this.client.post(`/orgs/${org}/teams`, dto); }
  updateTeam(id: number, dto: UpdateTeamDto) { return this.client.patch(`/teams/${id}`, dto); }
  deleteTeam(id: number) { return this.client.delete(`/teams/${id}`); }
  listTeamMembers(id: number, params?: Record<string, unknown>) { return this.client.get(`/teams/${id}/members`, params); }
  checkTeamMember(id: number, username: string) { return this.client.get(`/teams/${id}/members/${username}`); }
  addTeamMember(id: number, username: string) { return this.client.put(`/teams/${id}/members/${username}`); }
  removeTeamMember(id: number, username: string) { return this.client.delete(`/teams/${id}/members/${username}`); }
  listTeamRepos(id: number, params?: Record<string, unknown>) { return this.client.get(`/teams/${id}/repos`, params); }
  checkTeamRepo(id: number, org: string, repo: string) { return this.client.get(`/teams/${id}/repos/${org}/${repo}`); }
  addTeamRepo(id: number, org: string, repo: string) { return this.client.put(`/teams/${id}/repos/${org}/${repo}`); }
  removeTeamRepo(id: number, org: string, repo: string) { return this.client.delete(`/teams/${id}/repos/${org}/${repo}`); }
  listUserTeams(params?: Record<string, unknown>) { return this.client.get('/user/teams', params); }
}
