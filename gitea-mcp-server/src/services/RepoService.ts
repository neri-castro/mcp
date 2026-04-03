// src/services/RepoService.ts

import type { GiteaHttpClient } from '../http/GiteaHttpClient.js';
import type {
  CreateRepoDto, UpdateRepoDto, TransferRepoDto, ForkRepoDto,
  CreateBranchDto, CreateTagDto, CreateReleaseDto, UpdateReleaseDto,
  FileOperationDto, DeleteFileDto, AddCollaboratorDto,
  CreateHookDto, UpdateHookDto, CreateBranchProtectionDto, RepoFromTemplateDto
} from '../dto/repo/RepoDto.js';

export class RepoService {
  constructor(private readonly client: GiteaHttpClient) {}

  // ─── Repositorios ───────────────────────────────────────────────────────────
  search(params?: Record<string, unknown>) { return this.client.get('/repos/search', params); }
  create(dto: CreateRepoDto) { return this.client.post('/user/repos', dto); }
  createForOrg(org: string, dto: CreateRepoDto) { return this.client.post(`/orgs/${org}/repos`, dto); }
  get(owner: string, repo: string) { return this.client.get(`/repos/${owner}/${repo}`); }
  getById(id: number) { return this.client.get(`/repositories/${id}`); }
  update(owner: string, repo: string, dto: UpdateRepoDto) { return this.client.patch(`/repos/${owner}/${repo}`, dto); }
  delete(owner: string, repo: string) { return this.client.delete(`/repos/${owner}/${repo}`); }
  transfer(owner: string, repo: string, dto: TransferRepoDto) { return this.client.post(`/repos/${owner}/${repo}/transfer`, dto); }
  fork(owner: string, repo: string, dto: ForkRepoDto) { return this.client.post(`/repos/${owner}/${repo}/forks`, dto); }
  listForks(owner: string, repo: string, params?: Record<string, unknown>) { return this.client.get(`/repos/${owner}/${repo}/forks`, params); }
  fromTemplate(tmplOwner: string, tmplRepo: string, dto: RepoFromTemplateDto) { return this.client.post(`/repos/${tmplOwner}/${tmplRepo}/generate`, dto); }
  getTopics(owner: string, repo: string) { return this.client.get(`/repos/${owner}/${repo}/topics`); }
  replaceTopics(owner: string, repo: string, topics: string[]) { return this.client.put(`/repos/${owner}/${repo}/topics`, { topics }); }
  addTopic(owner: string, repo: string, topic: string) { return this.client.put(`/repos/${owner}/${repo}/topics/${topic}`); }
  deleteTopic(owner: string, repo: string, topic: string) { return this.client.delete(`/repos/${owner}/${repo}/topics/${topic}`); }
  getLanguages(owner: string, repo: string) { return this.client.get(`/repos/${owner}/${repo}/languages`); }
  getGitRefs(owner: string, repo: string, params?: Record<string, unknown>) { return this.client.get(`/repos/${owner}/${repo}/git/refs`, params); }

  // ─── Branches ───────────────────────────────────────────────────────────────
  listBranches(owner: string, repo: string, params?: Record<string, unknown>) { return this.client.get(`/repos/${owner}/${repo}/branches`, params); }
  getBranch(owner: string, repo: string, branch: string) { return this.client.get(`/repos/${owner}/${repo}/branches/${branch}`); }
  createBranch(owner: string, repo: string, dto: CreateBranchDto) { return this.client.post(`/repos/${owner}/${repo}/branches`, dto); }
  deleteBranch(owner: string, repo: string, branch: string) { return this.client.delete(`/repos/${owner}/${repo}/branches/${branch}`); }
  listBranchProtections(owner: string, repo: string) { return this.client.get(`/repos/${owner}/${repo}/branch_protections`); }
  createBranchProtection(owner: string, repo: string, dto: CreateBranchProtectionDto) { return this.client.post(`/repos/${owner}/${repo}/branch_protections`, dto); }
  getBranchProtection(owner: string, repo: string, name: string) { return this.client.get(`/repos/${owner}/${repo}/branch_protections/${name}`); }
  editBranchProtection(owner: string, repo: string, name: string, dto: Partial<CreateBranchProtectionDto>) { return this.client.patch(`/repos/${owner}/${repo}/branch_protections/${name}`, dto); }
  deleteBranchProtection(owner: string, repo: string, name: string) { return this.client.delete(`/repos/${owner}/${repo}/branch_protections/${name}`); }

  // ─── Tags ────────────────────────────────────────────────────────────────────
  listTags(owner: string, repo: string, params?: Record<string, unknown>) { return this.client.get(`/repos/${owner}/${repo}/tags`, params); }
  getTag(owner: string, repo: string, tag: string) { return this.client.get(`/repos/${owner}/${repo}/tags/${tag}`); }
  createTag(owner: string, repo: string, dto: CreateTagDto) { return this.client.post(`/repos/${owner}/${repo}/tags`, dto); }
  deleteTag(owner: string, repo: string, tag: string) { return this.client.delete(`/repos/${owner}/${repo}/tags/${tag}`); }

  // ─── Releases ───────────────────────────────────────────────────────────────
  listReleases(owner: string, repo: string, params?: Record<string, unknown>) { return this.client.get(`/repos/${owner}/${repo}/releases`, params); }
  getRelease(owner: string, repo: string, id: number) { return this.client.get(`/repos/${owner}/${repo}/releases/${id}`); }
  getLatestRelease(owner: string, repo: string) { return this.client.get(`/repos/${owner}/${repo}/releases/latest`); }
  getReleaseByTag(owner: string, repo: string, tag: string) { return this.client.get(`/repos/${owner}/${repo}/releases/tags/${tag}`); }
  createRelease(owner: string, repo: string, dto: CreateReleaseDto) { return this.client.post(`/repos/${owner}/${repo}/releases`, dto); }
  updateRelease(owner: string, repo: string, id: number, dto: UpdateReleaseDto) { return this.client.patch(`/repos/${owner}/${repo}/releases/${id}`, dto); }
  deleteRelease(owner: string, repo: string, id: number) { return this.client.delete(`/repos/${owner}/${repo}/releases/${id}`); }
  listReleaseAttachments(owner: string, repo: string, id: number) { return this.client.get(`/repos/${owner}/${repo}/releases/${id}/assets`); }
  deleteReleaseAttachment(owner: string, repo: string, id: number, attachmentId: number) { return this.client.delete(`/repos/${owner}/${repo}/releases/${id}/assets/${attachmentId}`); }

  // ─── Contenido de archivos ───────────────────────────────────────────────────
  getFile(owner: string, repo: string, filepath: string, params?: Record<string, unknown>) { return this.client.get(`/repos/${owner}/${repo}/contents/${filepath}`, params); }
  createFile(owner: string, repo: string, filepath: string, dto: FileOperationDto) { return this.client.post(`/repos/${owner}/${repo}/contents/${filepath}`, dto); }
  updateFile(owner: string, repo: string, filepath: string, dto: FileOperationDto) { return this.client.put(`/repos/${owner}/${repo}/contents/${filepath}`, dto); }
  deleteFile(owner: string, repo: string, filepath: string, dto: DeleteFileDto) { return this.client.delete(`/repos/${owner}/${repo}/contents/${filepath}`); }
  getTree(owner: string, repo: string, sha: string, params?: Record<string, unknown>) { return this.client.get(`/repos/${owner}/${repo}/git/trees/${sha}`, params); }

  // ─── Colaboradores ──────────────────────────────────────────────────────────
  listCollaborators(owner: string, repo: string, params?: Record<string, unknown>) { return this.client.get(`/repos/${owner}/${repo}/collaborators`, params); }
  checkCollaborator(owner: string, repo: string, collaborator: string) { return this.client.get(`/repos/${owner}/${repo}/collaborators/${collaborator}`); }
  addCollaborator(owner: string, repo: string, collaborator: string, dto: AddCollaboratorDto) { return this.client.put(`/repos/${owner}/${repo}/collaborators/${collaborator}`, dto); }
  removeCollaborator(owner: string, repo: string, collaborator: string) { return this.client.delete(`/repos/${owner}/${repo}/collaborators/${collaborator}`); }
  getCollaboratorPermission(owner: string, repo: string, collaborator: string) { return this.client.get(`/repos/${owner}/${repo}/collaborators/${collaborator}/permission`); }
  listTeams(owner: string, repo: string) { return this.client.get(`/repos/${owner}/${repo}/teams`); }

  // ─── Webhooks ────────────────────────────────────────────────────────────────
  listHooks(owner: string, repo: string) { return this.client.get(`/repos/${owner}/${repo}/hooks`); }
  getHook(owner: string, repo: string, id: number) { return this.client.get(`/repos/${owner}/${repo}/hooks/${id}`); }
  createHook(owner: string, repo: string, dto: CreateHookDto) { return this.client.post(`/repos/${owner}/${repo}/hooks`, dto); }
  updateHook(owner: string, repo: string, id: number, dto: UpdateHookDto) { return this.client.patch(`/repos/${owner}/${repo}/hooks/${id}`, dto); }
  deleteHook(owner: string, repo: string, id: number) { return this.client.delete(`/repos/${owner}/${repo}/hooks/${id}`); }
  testHook(owner: string, repo: string, id: number) { return this.client.post(`/repos/${owner}/${repo}/hooks/${id}/tests`); }
  listGitHooks(owner: string, repo: string) { return this.client.get(`/repos/${owner}/${repo}/git/hooks`); }
  getGitHook(owner: string, repo: string, id: string) { return this.client.get(`/repos/${owner}/${repo}/git/hooks/${id}`); }
  updateGitHook(owner: string, repo: string, id: string, dto: { content?: string }) { return this.client.patch(`/repos/${owner}/${repo}/git/hooks/${id}`, dto); }
}
