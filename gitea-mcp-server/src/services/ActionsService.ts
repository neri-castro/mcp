// src/services/ActionsService.ts

import type { GiteaHttpClient } from '../http/GiteaHttpClient.js';
import type {
  WorkflowDispatchDto, CreateSecretDto, CreateVariableDto, UpdateVariableDto
} from '../dto/actions/ActionsDto.js';

export class ActionsService {
  constructor(private readonly client: GiteaHttpClient) {}

  // ─── Workflows ───────────────────────────────────────────────────────────────
  listWorkflows(owner: string, repo: string) { return this.client.get(`/repos/${owner}/${repo}/actions/workflows`); }
  getWorkflow(owner: string, repo: string, workflowId: string) { return this.client.get(`/repos/${owner}/${repo}/actions/workflows/${workflowId}`); }
  disableWorkflow(owner: string, repo: string, workflowId: string) { return this.client.post(`/repos/${owner}/${repo}/actions/workflows/${workflowId}/disable`); }
  enableWorkflow(owner: string, repo: string, workflowId: string) { return this.client.post(`/repos/${owner}/${repo}/actions/workflows/${workflowId}/enable`); }
  dispatchWorkflow(owner: string, repo: string, workflowId: string, dto: WorkflowDispatchDto) { return this.client.post(`/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, dto); }

  // ─── Runs ────────────────────────────────────────────────────────────────────
  listRuns(owner: string, repo: string, params?: Record<string, unknown>) { return this.client.get(`/repos/${owner}/${repo}/actions/runs`, params); }
  getRun(owner: string, repo: string, runId: number) { return this.client.get(`/repos/${owner}/${repo}/actions/runs/${runId}`); }
  cancelRun(owner: string, repo: string, runId: number) { return this.client.post(`/repos/${owner}/${repo}/actions/runs/${runId}/cancel`); }
  approveRun(owner: string, repo: string, runId: number) { return this.client.post(`/repos/${owner}/${repo}/actions/runs/${runId}/approve`); }
  rerunAll(owner: string, repo: string, runId: number) { return this.client.post(`/repos/${owner}/${repo}/actions/runs/${runId}/rerun`); }
  rerunFailed(owner: string, repo: string, runId: number) { return this.client.post(`/repos/${owner}/${repo}/actions/runs/${runId}/rerun-failed-jobs`); }
  deleteRun(owner: string, repo: string, runId: number) { return this.client.delete(`/repos/${owner}/${repo}/actions/runs/${runId}`); }
  getRunArtifacts(owner: string, repo: string, runId: number) { return this.client.get(`/repos/${owner}/${repo}/actions/runs/${runId}/artifacts`); }
  deleteArtifact(owner: string, repo: string, artifactId: number) { return this.client.delete(`/repos/${owner}/${repo}/actions/artifacts/${artifactId}`); }
  adminListRuns(params?: Record<string, unknown>) { return this.client.get('/admin/actions/runs', params); }

  // ─── Jobs ────────────────────────────────────────────────────────────────────
  listJobs(owner: string, repo: string, runId: number, params?: Record<string, unknown>) { return this.client.get(`/repos/${owner}/${repo}/actions/runs/${runId}/jobs`, params); }
  getJob(owner: string, repo: string, runId: number, jobId: number) { return this.client.get(`/repos/${owner}/${repo}/actions/runs/${runId}/jobs/${jobId}`); }
  getJobLogs(owner: string, repo: string, jobId: number) { return this.client.get(`/repos/${owner}/${repo}/actions/jobs/${jobId}/logs`); }
  getTaskLogs(owner: string, repo: string, taskId: number) { return this.client.get(`/repos/${owner}/${repo}/actions/tasks/${taskId}/logs`); }
  adminListJobs(params?: Record<string, unknown>) { return this.client.get('/admin/actions/jobs', params); }

  // ─── Secrets (repo) ──────────────────────────────────────────────────────────
  listSecretsRepo(owner: string, repo: string) { return this.client.get(`/repos/${owner}/${repo}/actions/secrets`); }
  createSecretRepo(owner: string, repo: string, name: string, dto: CreateSecretDto) { return this.client.put(`/repos/${owner}/${repo}/actions/secrets/${name}`, dto); }
  deleteSecretRepo(owner: string, repo: string, name: string) { return this.client.delete(`/repos/${owner}/${repo}/actions/secrets/${name}`); }

  // ─── Secrets (org) ───────────────────────────────────────────────────────────
  listSecretsOrg(org: string) { return this.client.get(`/orgs/${org}/actions/secrets`); }
  createSecretOrg(org: string, name: string, dto: CreateSecretDto) { return this.client.put(`/orgs/${org}/actions/secrets/${name}`, dto); }
  deleteSecretOrg(org: string, name: string) { return this.client.delete(`/orgs/${org}/actions/secrets/${name}`); }

  // ─── Secrets (user) ──────────────────────────────────────────────────────────
  listSecretsUser() { return this.client.get('/user/secrets'); }
  createSecretUser(name: string, dto: CreateSecretDto) { return this.client.put(`/user/secrets/${name}`, dto); }
  deleteSecretUser(name: string) { return this.client.delete(`/user/secrets/${name}`); }

  // ─── Variables (repo) ────────────────────────────────────────────────────────
  listVariablesRepo(owner: string, repo: string) { return this.client.get(`/repos/${owner}/${repo}/actions/variables`); }
  createVariableRepo(owner: string, repo: string, dto: CreateVariableDto) { return this.client.post(`/repos/${owner}/${repo}/actions/variables`, dto); }
  getVariableRepo(owner: string, repo: string, name: string) { return this.client.get(`/repos/${owner}/${repo}/actions/variables/${name}`); }
  updateVariableRepo(owner: string, repo: string, name: string, dto: UpdateVariableDto) { return this.client.patch(`/repos/${owner}/${repo}/actions/variables/${name}`, dto); }
  deleteVariableRepo(owner: string, repo: string, name: string) { return this.client.delete(`/repos/${owner}/${repo}/actions/variables/${name}`); }

  // ─── Variables (org) ─────────────────────────────────────────────────────────
  listVariablesOrg(org: string) { return this.client.get(`/orgs/${org}/actions/variables`); }

  // ─── Variables (user) ────────────────────────────────────────────────────────
  listVariablesUser() { return this.client.get('/user/actions/variables'); }

  // ─── Runners (repo) ──────────────────────────────────────────────────────────
  listRunnersRepo(owner: string, repo: string) { return this.client.get(`/repos/${owner}/${repo}/actions/runners`); }
  getRunnerTokenRepo(owner: string, repo: string) { return this.client.get(`/repos/${owner}/${repo}/actions/runners/registration-token`); }
  deleteRunnerRepo(owner: string, repo: string, runnerId: number) { return this.client.delete(`/repos/${owner}/${repo}/actions/runners/${runnerId}`); }

  // ─── Runners (org) ───────────────────────────────────────────────────────────
  listRunnersOrg(org: string) { return this.client.get(`/orgs/${org}/actions/runners`); }
  getRunnerTokenOrg(org: string) { return this.client.get(`/orgs/${org}/actions/runners/registration-token`); }

  // ─── Runners (admin global) ──────────────────────────────────────────────────
  adminListRunners(params?: Record<string, unknown>) { return this.client.get('/admin/actions/runners', params); }
  adminGetRunner(runnerId: number) { return this.client.get(`/admin/actions/runners/${runnerId}`); }
  adminDeleteRunner(runnerId: number) { return this.client.delete(`/admin/actions/runners/${runnerId}`); }
  adminGetRunnerToken() { return this.client.post('/admin/actions/runners/registration-token'); }
}
