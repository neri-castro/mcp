// src/tools/actions/index.ts

import { z } from 'zod';
import type { ToolDefinition } from '../types.js';
import { safeResult } from '../types.js';
import type { ActionsService } from '../../services/ActionsService.js';

const ownerRepo = { owner: z.string(), repo: z.string() };
const pagination = { page: z.number().optional(), limit: z.number().optional() };

export function buildActionsTools(svc: ActionsService): ToolDefinition[] {
  return [
    // ─── Workflows ───────────────────────────────────────────────────────────
    { name: 'actions_workflow_list', description: 'Listar workflows del repositorio', inputSchema: z.object(ownerRepo), handler: async (args: any) => safeResult(await svc.listWorkflows(args.owner, args.repo)) },
    { name: 'actions_workflow_get', description: 'Obtener workflow (id o nombre de archivo)', inputSchema: z.object({ ...ownerRepo, workflow_id: z.string() }), handler: async (args: any) => safeResult(await svc.getWorkflow(args.owner, args.repo, args.workflow_id)) },
    { name: 'actions_workflow_disable', description: 'Deshabilitar workflow', inputSchema: z.object({ ...ownerRepo, workflow_id: z.string() }), handler: async (args: any) => safeResult(await svc.disableWorkflow(args.owner, args.repo, args.workflow_id)) },
    { name: 'actions_workflow_enable', description: 'Habilitar workflow', inputSchema: z.object({ ...ownerRepo, workflow_id: z.string() }), handler: async (args: any) => safeResult(await svc.enableWorkflow(args.owner, args.repo, args.workflow_id)) },
    {
      name: 'actions_workflow_dispatch',
      description: 'Trigger manual de workflow (ref, inputs)',
      inputSchema: z.object({ ...ownerRepo, workflow_id: z.string(), ref: z.string().describe('Branch o tag'), inputs: z.record(z.string()).optional() }),
      handler: async (args: any) => safeResult(await svc.dispatchWorkflow(args.owner, args.repo, args.workflow_id, { ref: args.ref, inputs: args.inputs })),
    },

    // ─── Runs ────────────────────────────────────────────────────────────────
    { name: 'actions_run_list', description: 'Listar ejecuciones (event, branch, status, actor, head_sha, page, limit)', inputSchema: z.object({ ...ownerRepo, event: z.string().optional(), branch: z.string().optional(), status: z.string().optional(), actor: z.string().optional(), ...pagination }), handler: async (args: any) => { const { owner, repo, ...params } = args; return safeResult(await svc.listRuns(owner, repo, params)); } },
    { name: 'actions_run_get', description: 'Obtener detalles de ejecución', inputSchema: z.object({ ...ownerRepo, run_id: z.number().int() }), handler: async (args: any) => safeResult(await svc.getRun(args.owner, args.repo, args.run_id)) },
    { name: 'actions_run_cancel', description: 'Cancelar ejecución en progreso', inputSchema: z.object({ ...ownerRepo, run_id: z.number().int() }), handler: async (args: any) => safeResult(await svc.cancelRun(args.owner, args.repo, args.run_id)) },
    { name: 'actions_run_approve', description: 'Aprobar ejecución pendiente', inputSchema: z.object({ ...ownerRepo, run_id: z.number().int() }), handler: async (args: any) => safeResult(await svc.approveRun(args.owner, args.repo, args.run_id)) },
    { name: 'actions_run_rerun', description: 'Rerun todos los jobs de la ejecución', inputSchema: z.object({ ...ownerRepo, run_id: z.number().int() }), handler: async (args: any) => safeResult(await svc.rerunAll(args.owner, args.repo, args.run_id)) },
    { name: 'actions_run_rerun_failed', description: 'Rerun solo jobs fallidos', inputSchema: z.object({ ...ownerRepo, run_id: z.number().int() }), handler: async (args: any) => safeResult(await svc.rerunFailed(args.owner, args.repo, args.run_id)) },
    { name: 'actions_run_delete', description: 'Eliminar registro de ejecución', inputSchema: z.object({ ...ownerRepo, run_id: z.number().int() }), handler: async (args: any) => { await svc.deleteRun(args.owner, args.repo, args.run_id); return JSON.stringify({ success: true }); } },
    { name: 'actions_run_get_artifacts', description: 'Listar artefactos de una ejecución', inputSchema: z.object({ ...ownerRepo, run_id: z.number().int() }), handler: async (args: any) => safeResult(await svc.getRunArtifacts(args.owner, args.repo, args.run_id)) },
    { name: 'actions_artifact_delete', description: 'Eliminar artefacto', inputSchema: z.object({ ...ownerRepo, artifact_id: z.number().int() }), handler: async (args: any) => { await svc.deleteArtifact(args.owner, args.repo, args.artifact_id); return JSON.stringify({ success: true }); } },
    { name: 'admin_actions_run_list', description: 'Listar todas las ejecuciones (admin global)', inputSchema: z.object({ ...pagination }), handler: async (args) => safeResult(await svc.adminListRuns(args as any)) },

    // ─── Jobs ────────────────────────────────────────────────────────────────
    { name: 'actions_job_list', description: 'Listar jobs de una ejecución (filter: latest, all)', inputSchema: z.object({ ...ownerRepo, run_id: z.number().int(), filter: z.enum(['latest', 'all']).optional(), ...pagination }), handler: async (args: any) => { const { owner, repo, run_id, ...params } = args; return safeResult(await svc.listJobs(owner, repo, run_id, params)); } },
    { name: 'actions_job_get', description: 'Obtener detalles de job', inputSchema: z.object({ ...ownerRepo, run_id: z.number().int(), job_id: z.number().int() }), handler: async (args: any) => safeResult(await svc.getJob(args.owner, args.repo, args.run_id, args.job_id)) },
    { name: 'actions_job_logs', description: 'Descargar logs de job', inputSchema: z.object({ ...ownerRepo, job_id: z.number().int() }), handler: async (args: any) => safeResult(await svc.getJobLogs(args.owner, args.repo, args.job_id)) },
    { name: 'actions_task_logs', description: 'Obtener logs de task individual', inputSchema: z.object({ ...ownerRepo, task_id: z.number().int() }), handler: async (args: any) => safeResult(await svc.getTaskLogs(args.owner, args.repo, args.task_id)) },
    { name: 'admin_actions_job_list', description: 'Listar todos los jobs (admin global)', inputSchema: z.object({ ...pagination }), handler: async (args) => safeResult(await svc.adminListJobs(args as any)) },

    // ─── Secrets (repo) ──────────────────────────────────────────────────────
    { name: 'actions_secret_list_repo', description: 'Listar secrets del repositorio', inputSchema: z.object(ownerRepo), handler: async (args: any) => safeResult(await svc.listSecretsRepo(args.owner, args.repo)) },
    { name: 'actions_secret_create_repo', description: 'Crear/actualizar secret en repositorio', inputSchema: z.object({ ...ownerRepo, secretname: z.string(), data: z.string() }), handler: async (args: any) => safeResult(await svc.createSecretRepo(args.owner, args.repo, args.secretname, { data: args.data })) },
    { name: 'actions_secret_delete_repo', description: 'Eliminar secret de repositorio', inputSchema: z.object({ ...ownerRepo, secretname: z.string() }), handler: async (args: any) => { await svc.deleteSecretRepo(args.owner, args.repo, args.secretname); return JSON.stringify({ success: true }); } },

    // ─── Secrets (org) ───────────────────────────────────────────────────────
    { name: 'actions_secret_list_org', description: 'Listar secrets de organización', inputSchema: z.object({ org: z.string() }), handler: async (args: any) => safeResult(await svc.listSecretsOrg(args.org)) },
    { name: 'actions_secret_create_org', description: 'Crear/actualizar secret en organización', inputSchema: z.object({ org: z.string(), secretname: z.string(), data: z.string() }), handler: async (args: any) => safeResult(await svc.createSecretOrg(args.org, args.secretname, { data: args.data })) },
    { name: 'actions_secret_delete_org', description: 'Eliminar secret de organización', inputSchema: z.object({ org: z.string(), secretname: z.string() }), handler: async (args: any) => { await svc.deleteSecretOrg(args.org, args.secretname); return JSON.stringify({ success: true }); } },

    // ─── Secrets (user) ──────────────────────────────────────────────────────
    { name: 'actions_secret_list_user', description: 'Listar secrets del usuario autenticado', inputSchema: z.object({}), handler: async () => safeResult(await svc.listSecretsUser()) },
    { name: 'actions_secret_create_user', description: 'Crear/actualizar secret de usuario', inputSchema: z.object({ secretname: z.string(), data: z.string() }), handler: async (args: any) => safeResult(await svc.createSecretUser(args.secretname, { data: args.data })) },
    { name: 'actions_secret_delete_user', description: 'Eliminar secret de usuario', inputSchema: z.object({ secretname: z.string() }), handler: async (args: any) => { await svc.deleteSecretUser(args.secretname); return JSON.stringify({ success: true }); } },

    // ─── Variables (repo) ────────────────────────────────────────────────────
    { name: 'actions_variable_list_repo', description: 'Listar variables de repositorio', inputSchema: z.object(ownerRepo), handler: async (args: any) => safeResult(await svc.listVariablesRepo(args.owner, args.repo)) },
    { name: 'actions_variable_create_repo', description: 'Crear variable en repositorio', inputSchema: z.object({ ...ownerRepo, name: z.string(), value: z.string() }), handler: async (args: any) => safeResult(await svc.createVariableRepo(args.owner, args.repo, { name: args.name, value: args.value })) },
    { name: 'actions_variable_get_repo', description: 'Obtener variable de repositorio', inputSchema: z.object({ ...ownerRepo, variablename: z.string() }), handler: async (args: any) => safeResult(await svc.getVariableRepo(args.owner, args.repo, args.variablename)) },
    { name: 'actions_variable_update_repo', description: 'Actualizar variable de repositorio', inputSchema: z.object({ ...ownerRepo, variablename: z.string(), value: z.string() }), handler: async (args: any) => safeResult(await svc.updateVariableRepo(args.owner, args.repo, args.variablename, { value: args.value })) },
    { name: 'actions_variable_delete_repo', description: 'Eliminar variable de repositorio', inputSchema: z.object({ ...ownerRepo, variablename: z.string() }), handler: async (args: any) => { await svc.deleteVariableRepo(args.owner, args.repo, args.variablename); return JSON.stringify({ success: true }); } },

    // ─── Variables (org/user) ────────────────────────────────────────────────
    { name: 'actions_variable_list_org', description: 'Listar variables de organización', inputSchema: z.object({ org: z.string() }), handler: async (args: any) => safeResult(await svc.listVariablesOrg(args.org)) },
    { name: 'actions_variable_list_user', description: 'Listar variables del usuario autenticado', inputSchema: z.object({}), handler: async () => safeResult(await svc.listVariablesUser()) },

    // ─── Runners ─────────────────────────────────────────────────────────────
    { name: 'actions_runner_list_repo', description: 'Listar runners del repositorio', inputSchema: z.object(ownerRepo), handler: async (args: any) => safeResult(await svc.listRunnersRepo(args.owner, args.repo)) },
    { name: 'actions_runner_token_repo', description: 'Obtener token de registro de runner para repositorio', inputSchema: z.object(ownerRepo), handler: async (args: any) => safeResult(await svc.getRunnerTokenRepo(args.owner, args.repo)) },
    { name: 'actions_runner_delete_repo', description: 'Eliminar runner del repositorio', inputSchema: z.object({ ...ownerRepo, runner_id: z.number().int() }), handler: async (args: any) => { await svc.deleteRunnerRepo(args.owner, args.repo, args.runner_id); return JSON.stringify({ success: true }); } },
    { name: 'actions_runner_list_org', description: 'Listar runners de la organización', inputSchema: z.object({ org: z.string() }), handler: async (args: any) => safeResult(await svc.listRunnersOrg(args.org)) },
    { name: 'actions_runner_token_org', description: 'Token de registro para runner de organización', inputSchema: z.object({ org: z.string() }), handler: async (args: any) => safeResult(await svc.getRunnerTokenOrg(args.org)) },
    { name: 'admin_runner_list', description: 'Listar todos los runners (admin global)', inputSchema: z.object({ ...pagination }), handler: async (args) => safeResult(await svc.adminListRunners(args as any)) },
    { name: 'admin_runner_get', description: 'Obtener runner por ID (admin global)', inputSchema: z.object({ runner_id: z.number().int() }), handler: async (args: any) => safeResult(await svc.adminGetRunner(args.runner_id)) },
    { name: 'admin_runner_delete', description: 'Eliminar runner (admin global)', inputSchema: z.object({ runner_id: z.number().int() }), handler: async (args: any) => { await svc.adminDeleteRunner(args.runner_id); return JSON.stringify({ success: true }); } },
    { name: 'admin_runner_registration_token', description: 'Obtener token de registro global de runner', inputSchema: z.object({}), handler: async () => safeResult(await svc.adminGetRunnerToken()) },
  ];
}
