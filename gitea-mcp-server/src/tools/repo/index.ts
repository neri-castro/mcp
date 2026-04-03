// src/tools/repo/index.ts

import { z } from 'zod';
import type { ToolDefinition } from '../types.js';
import { safeResult } from '../types.js';
import type { RepoService } from '../../services/RepoService.js';

// ─── Schemas reutilizables ───────────────────────────────────────────────────
const ownerRepo = { owner: z.string().describe('Propietario del repositorio'), repo: z.string().describe('Nombre del repositorio') };
const pagination = { page: z.number().int().positive().optional().describe('Número de página'), limit: z.number().int().positive().max(50).optional().describe('Resultados por página') };

export function buildRepoTools(svc: RepoService): ToolDefinition[] {
  return [
    // ── repo_search ──────────────────────────────────────────────────────────
    {
      name: 'repo_search',
      description: 'Buscar repositorios con filtros (q, topic, uid, private, archived, mode, sort, order)',
      inputSchema: z.object({
        q: z.string().optional().describe('Término de búsqueda'),
        topic: z.boolean().optional().describe('Buscar por tópico'),
        include_desc: z.boolean().optional(),
        uid: z.number().optional().describe('ID de usuario propietario'),
        limit: z.number().optional(),
        page: z.number().optional(),
        mode: z.enum(['fork', 'source', 'member', 'collaborative']).optional(),
        exclusive: z.boolean().optional(),
        sort: z.string().optional(),
        order: z.enum(['asc', 'desc']).optional(),
        archived: z.boolean().optional(),
        private: z.boolean().optional(),
      }),
      handler: async (args) => safeResult(await svc.search(args as Record<string, unknown>)),
    },
    // ── repo_create ──────────────────────────────────────────────────────────
    {
      name: 'repo_create',
      description: 'Crear repositorio para el usuario autenticado',
      inputSchema: z.object({
        name: z.string().min(1).max(100).describe('Nombre único del repositorio'),
        description: z.string().optional(),
        private: z.boolean().default(false),
        auto_init: z.boolean().default(false).describe('Inicializar con README'),
        gitignores: z.string().optional().describe('Template .gitignore ej: Node, Python'),
        license: z.string().optional().describe('Licencia ej: MIT, Apache-2.0'),
        default_branch: z.string().default('main'),
        is_template: z.boolean().optional(),
      }),
      handler: async (args) => safeResult(await svc.create(args as any)),
    },
    // ── repo_create_for_org ──────────────────────────────────────────────────
    {
      name: 'repo_create_for_org',
      description: 'Crear repositorio en una organización',
      inputSchema: z.object({
        org: z.string().describe('Nombre de la organización'),
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        private: z.boolean().default(false),
        auto_init: z.boolean().default(false),
        default_branch: z.string().default('main'),
      }),
      handler: async (args: any) => safeResult(await svc.createForOrg(args.org, args)),
    },
    // ── repo_get ─────────────────────────────────────────────────────────────
    {
      name: 'repo_get',
      description: 'Obtener detalles de un repositorio',
      inputSchema: z.object(ownerRepo),
      handler: async (args: any) => safeResult(await svc.get(args.owner, args.repo)),
    },
    // ── repo_get_by_id ───────────────────────────────────────────────────────
    {
      name: 'repo_get_by_id',
      description: 'Obtener repositorio por ID numérico',
      inputSchema: z.object({ id: z.number().int().describe('ID numérico del repositorio') }),
      handler: async (args: any) => safeResult(await svc.getById(args.id)),
    },
    // ── repo_update ──────────────────────────────────────────────────────────
    {
      name: 'repo_update',
      description: 'Actualizar propiedades del repositorio',
      inputSchema: z.object({
        ...ownerRepo,
        description: z.string().optional(),
        website: z.string().optional(),
        private: z.boolean().optional(),
        has_issues: z.boolean().optional(),
        has_wiki: z.boolean().optional(),
        has_pull_requests: z.boolean().optional(),
        default_branch: z.string().optional(),
        archived: z.boolean().optional(),
        allow_merge_commits: z.boolean().optional(),
        allow_rebase: z.boolean().optional(),
        allow_squash_merge: z.boolean().optional(),
        delete_branch_on_merge: z.boolean().optional(),
      }),
      handler: async (args: any) => {
        const { owner, repo, ...dto } = args;
        return safeResult(await svc.update(owner, repo, dto));
      },
    },
    // ── repo_delete ──────────────────────────────────────────────────────────
    {
      name: 'repo_delete',
      description: 'Eliminar repositorio permanentemente',
      inputSchema: z.object(ownerRepo),
      handler: async (args: any) => { await svc.delete(args.owner, args.repo); return JSON.stringify({ success: true }); },
    },
    // ── repo_transfer ────────────────────────────────────────────────────────
    {
      name: 'repo_transfer',
      description: 'Transferir ownership del repositorio',
      inputSchema: z.object({ ...ownerRepo, new_owner: z.string(), team_ids: z.array(z.number()).optional() }),
      handler: async (args: any) => {
        const { owner, repo, ...dto } = args;
        return safeResult(await svc.transfer(owner, repo, dto));
      },
    },
    // ── repo_fork ────────────────────────────────────────────────────────────
    {
      name: 'repo_fork',
      description: 'Crear fork del repositorio',
      inputSchema: z.object({ ...ownerRepo, organization: z.string().optional(), name: z.string().optional() }),
      handler: async (args: any) => {
        const { owner, repo, ...dto } = args;
        return safeResult(await svc.fork(owner, repo, dto));
      },
    },
    // ── repo_list_forks ──────────────────────────────────────────────────────
    {
      name: 'repo_list_forks',
      description: 'Listar forks de un repositorio',
      inputSchema: z.object({ ...ownerRepo, ...pagination }),
      handler: async (args: any) => {
        const { owner, repo, ...params } = args;
        return safeResult(await svc.listForks(owner, repo, params));
      },
    },
    // ── repo_from_template ───────────────────────────────────────────────────
    {
      name: 'repo_from_template',
      description: 'Generar repositorio desde template',
      inputSchema: z.object({
        tmpl_owner: z.string().describe('Propietario del template'),
        tmpl_repo: z.string().describe('Nombre del repositorio template'),
        owner: z.string().describe('Nuevo propietario'),
        name: z.string().describe('Nombre del nuevo repositorio'),
        description: z.string().optional(),
        private: z.boolean().optional(),
        git_content: z.boolean().optional(),
      }),
      handler: async (args: any) => {
        const { tmpl_owner, tmpl_repo, ...dto } = args;
        return safeResult(await svc.fromTemplate(tmpl_owner, tmpl_repo, dto));
      },
    },
    // ── repo_get_topics ──────────────────────────────────────────────────────
    {
      name: 'repo_get_topics',
      description: 'Listar tópicos del repositorio',
      inputSchema: z.object(ownerRepo),
      handler: async (args: any) => safeResult(await svc.getTopics(args.owner, args.repo)),
    },
    // ── repo_replace_topics ──────────────────────────────────────────────────
    {
      name: 'repo_replace_topics',
      description: 'Reemplazar todos los tópicos',
      inputSchema: z.object({ ...ownerRepo, topics: z.array(z.string()).describe('Lista completa de tópicos') }),
      handler: async (args: any) => safeResult(await svc.replaceTopics(args.owner, args.repo, args.topics)),
    },
    // ── repo_add_topic ───────────────────────────────────────────────────────
    {
      name: 'repo_add_topic',
      description: 'Agregar un tópico al repositorio',
      inputSchema: z.object({ ...ownerRepo, topic: z.string() }),
      handler: async (args: any) => safeResult(await svc.addTopic(args.owner, args.repo, args.topic)),
    },
    // ── repo_delete_topic ────────────────────────────────────────────────────
    {
      name: 'repo_delete_topic',
      description: 'Eliminar un tópico del repositorio',
      inputSchema: z.object({ ...ownerRepo, topic: z.string() }),
      handler: async (args: any) => { await svc.deleteTopic(args.owner, args.repo, args.topic); return JSON.stringify({ success: true }); },
    },
    // ── repo_get_languages ───────────────────────────────────────────────────
    {
      name: 'repo_get_languages',
      description: 'Obtener estadísticas de lenguajes del repositorio',
      inputSchema: z.object(ownerRepo),
      handler: async (args: any) => safeResult(await svc.getLanguages(args.owner, args.repo)),
    },
    // ── repo_get_git_refs ────────────────────────────────────────────────────
    {
      name: 'repo_get_git_refs',
      description: 'Listar todas las refs git del repositorio',
      inputSchema: z.object({ ...ownerRepo, type: z.string().optional() }),
      handler: async (args: any) => {
        const { owner, repo, ...params } = args;
        return safeResult(await svc.getGitRefs(owner, repo, params));
      },
    },

    // ════════════════════════════════════════════════════════════════
    // BRANCHES
    // ════════════════════════════════════════════════════════════════
    {
      name: 'branch_list',
      description: 'Listar branches con paginación',
      inputSchema: z.object({ ...ownerRepo, ...pagination }),
      handler: async (args: any) => {
        const { owner, repo, ...params } = args;
        return safeResult(await svc.listBranches(owner, repo, params));
      },
    },
    {
      name: 'branch_get',
      description: 'Obtener detalles de un branch',
      inputSchema: z.object({ ...ownerRepo, branch: z.string() }),
      handler: async (args: any) => safeResult(await svc.getBranch(args.owner, args.repo, args.branch)),
    },
    {
      name: 'branch_create',
      description: 'Crear branch (new_branch_name, old_branch_name u old_sha)',
      inputSchema: z.object({
        ...ownerRepo,
        new_branch_name: z.string(),
        old_branch_name: z.string().optional(),
        old_sha: z.string().optional(),
      }),
      handler: async (args: any) => {
        const { owner, repo, ...dto } = args;
        return safeResult(await svc.createBranch(owner, repo, dto));
      },
    },
    {
      name: 'branch_delete',
      description: 'Eliminar branch',
      inputSchema: z.object({ ...ownerRepo, branch: z.string() }),
      handler: async (args: any) => { await svc.deleteBranch(args.owner, args.repo, args.branch); return JSON.stringify({ success: true }); },
    },
    {
      name: 'branch_protection_list',
      description: 'Listar reglas de protección de branches',
      inputSchema: z.object(ownerRepo),
      handler: async (args: any) => safeResult(await svc.listBranchProtections(args.owner, args.repo)),
    },
    {
      name: 'branch_protection_create',
      description: 'Crear regla de protección de branch',
      inputSchema: z.object({
        ...ownerRepo,
        rule_name: z.string(),
        required_approvals: z.number().optional(),
        enable_push: z.boolean().optional(),
        enable_status_check: z.boolean().optional(),
        status_check_contexts: z.array(z.string()).optional(),
        push_whitelist_usernames: z.array(z.string()).optional(),
        merge_whitelist_usernames: z.array(z.string()).optional(),
        block_on_rejected_reviews: z.boolean().optional(),
        dismiss_stale_approvals: z.boolean().optional(),
      }),
      handler: async (args: any) => {
        const { owner, repo, ...dto } = args;
        return safeResult(await svc.createBranchProtection(owner, repo, dto));
      },
    },
    {
      name: 'branch_protection_get',
      description: 'Obtener regla de protección',
      inputSchema: z.object({ ...ownerRepo, name: z.string().describe('Nombre de la regla (pattern del branch)') }),
      handler: async (args: any) => safeResult(await svc.getBranchProtection(args.owner, args.repo, args.name)),
    },
    {
      name: 'branch_protection_edit',
      description: 'Editar regla de protección de branch',
      inputSchema: z.object({
        ...ownerRepo,
        name: z.string(),
        required_approvals: z.number().optional(),
        enable_push: z.boolean().optional(),
        block_on_rejected_reviews: z.boolean().optional(),
      }),
      handler: async (args: any) => {
        const { owner, repo, name, ...dto } = args;
        return safeResult(await svc.editBranchProtection(owner, repo, name, dto));
      },
    },
    {
      name: 'branch_protection_delete',
      description: 'Eliminar regla de protección de branch',
      inputSchema: z.object({ ...ownerRepo, name: z.string() }),
      handler: async (args: any) => { await svc.deleteBranchProtection(args.owner, args.repo, args.name); return JSON.stringify({ success: true }); },
    },

    // ════════════════════════════════════════════════════════════════
    // TAGS
    // ════════════════════════════════════════════════════════════════
    {
      name: 'tag_list',
      description: 'Listar tags del repositorio',
      inputSchema: z.object({ ...ownerRepo, ...pagination }),
      handler: async (args: any) => {
        const { owner, repo, ...params } = args;
        return safeResult(await svc.listTags(owner, repo, params));
      },
    },
    {
      name: 'tag_get',
      description: 'Obtener detalles de un tag',
      inputSchema: z.object({ ...ownerRepo, tag: z.string() }),
      handler: async (args: any) => safeResult(await svc.getTag(args.owner, args.repo, args.tag)),
    },
    {
      name: 'tag_create',
      description: 'Crear tag anotado o ligero',
      inputSchema: z.object({ ...ownerRepo, tag_name: z.string(), message: z.string().optional(), target: z.string().optional() }),
      handler: async (args: any) => {
        const { owner, repo, ...dto } = args;
        return safeResult(await svc.createTag(owner, repo, dto));
      },
    },
    {
      name: 'tag_delete',
      description: 'Eliminar tag',
      inputSchema: z.object({ ...ownerRepo, tag: z.string() }),
      handler: async (args: any) => { await svc.deleteTag(args.owner, args.repo, args.tag); return JSON.stringify({ success: true }); },
    },

    // ════════════════════════════════════════════════════════════════
    // RELEASES
    // ════════════════════════════════════════════════════════════════
    {
      name: 'release_list',
      description: 'Listar releases',
      inputSchema: z.object({ ...ownerRepo, ...pagination, draft: z.boolean().optional(), pre_release: z.boolean().optional() }),
      handler: async (args: any) => {
        const { owner, repo, ...params } = args;
        return safeResult(await svc.listReleases(owner, repo, params));
      },
    },
    {
      name: 'release_get',
      description: 'Obtener detalles de un release',
      inputSchema: z.object({ ...ownerRepo, id: z.number().int() }),
      handler: async (args: any) => safeResult(await svc.getRelease(args.owner, args.repo, args.id)),
    },
    {
      name: 'release_get_latest',
      description: 'Obtener último release',
      inputSchema: z.object(ownerRepo),
      handler: async (args: any) => safeResult(await svc.getLatestRelease(args.owner, args.repo)),
    },
    {
      name: 'release_get_by_tag',
      description: 'Obtener release por tag',
      inputSchema: z.object({ ...ownerRepo, tag: z.string() }),
      handler: async (args: any) => safeResult(await svc.getReleaseByTag(args.owner, args.repo, args.tag)),
    },
    {
      name: 'release_create',
      description: 'Crear release (tag_name, name, body, draft, prerelease)',
      inputSchema: z.object({
        ...ownerRepo,
        tag_name: z.string(),
        name: z.string().optional(),
        body: z.string().optional(),
        draft: z.boolean().optional(),
        prerelease: z.boolean().optional(),
        target_commitish: z.string().optional(),
      }),
      handler: async (args: any) => {
        const { owner, repo, ...dto } = args;
        return safeResult(await svc.createRelease(owner, repo, dto));
      },
    },
    {
      name: 'release_update',
      description: 'Actualizar release',
      inputSchema: z.object({
        ...ownerRepo,
        id: z.number().int(),
        tag_name: z.string().optional(),
        name: z.string().optional(),
        body: z.string().optional(),
        draft: z.boolean().optional(),
        prerelease: z.boolean().optional(),
      }),
      handler: async (args: any) => {
        const { owner, repo, id, ...dto } = args;
        return safeResult(await svc.updateRelease(owner, repo, id, dto));
      },
    },
    {
      name: 'release_delete',
      description: 'Eliminar release',
      inputSchema: z.object({ ...ownerRepo, id: z.number().int() }),
      handler: async (args: any) => { await svc.deleteRelease(args.owner, args.repo, args.id); return JSON.stringify({ success: true }); },
    },
    {
      name: 'release_attachment_list',
      description: 'Listar adjuntos de release',
      inputSchema: z.object({ ...ownerRepo, id: z.number().int() }),
      handler: async (args: any) => safeResult(await svc.listReleaseAttachments(args.owner, args.repo, args.id)),
    },
    {
      name: 'release_attachment_delete',
      description: 'Eliminar adjunto de release',
      inputSchema: z.object({ ...ownerRepo, id: z.number().int(), attachment_id: z.number().int() }),
      handler: async (args: any) => { await svc.deleteReleaseAttachment(args.owner, args.repo, args.id, args.attachment_id); return JSON.stringify({ success: true }); },
    },

    // ════════════════════════════════════════════════════════════════
    // CONTENIDO DE ARCHIVOS
    // ════════════════════════════════════════════════════════════════
    {
      name: 'file_get',
      description: 'Leer contenido de archivo (base64) o listar directorio',
      inputSchema: z.object({ ...ownerRepo, filepath: z.string(), ref: z.string().optional() }),
      handler: async (args: any) => {
        const { owner, repo, filepath, ...params } = args;
        return safeResult(await svc.getFile(owner, repo, filepath, params));
      },
    },
    {
      name: 'file_create',
      description: 'Crear archivo con contenido base64 y mensaje de commit',
      inputSchema: z.object({
        ...ownerRepo,
        filepath: z.string(),
        message: z.string().describe('Mensaje del commit'),
        content: z.string().describe('Contenido en base64'),
        branch: z.string().optional(),
      }),
      handler: async (args: any) => {
        const { owner, repo, filepath, ...dto } = args;
        return safeResult(await svc.createFile(owner, repo, filepath, dto));
      },
    },
    {
      name: 'file_update',
      description: 'Actualizar archivo (requiere SHA actual del archivo)',
      inputSchema: z.object({
        ...ownerRepo,
        filepath: z.string(),
        message: z.string(),
        content: z.string().describe('Contenido nuevo en base64'),
        sha: z.string().describe('SHA actual del archivo'),
        branch: z.string().optional(),
      }),
      handler: async (args: any) => {
        const { owner, repo, filepath, ...dto } = args;
        return safeResult(await svc.updateFile(owner, repo, filepath, dto));
      },
    },
    {
      name: 'file_delete',
      description: 'Eliminar archivo con mensaje de commit',
      inputSchema: z.object({
        ...ownerRepo,
        filepath: z.string(),
        message: z.string(),
        sha: z.string().describe('SHA actual del archivo'),
        branch: z.string().optional(),
      }),
      handler: async (args: any) => {
        const { owner, repo, filepath, ...dto } = args;
        return safeResult(await svc.deleteFile(owner, repo, filepath, dto));
      },
    },
    {
      name: 'tree_get',
      description: 'Obtener árbol git de un commit',
      inputSchema: z.object({ ...ownerRepo, sha: z.string(), recursive: z.boolean().optional() }),
      handler: async (args: any) => {
        const { owner, repo, sha, ...params } = args;
        return safeResult(await svc.getTree(owner, repo, sha, params));
      },
    },

    // ════════════════════════════════════════════════════════════════
    // COLABORADORES
    // ════════════════════════════════════════════════════════════════
    {
      name: 'collaborator_list',
      description: 'Listar colaboradores del repositorio',
      inputSchema: z.object({ ...ownerRepo, ...pagination }),
      handler: async (args: any) => {
        const { owner, repo, ...params } = args;
        return safeResult(await svc.listCollaborators(owner, repo, params));
      },
    },
    {
      name: 'collaborator_check',
      description: 'Verificar si un usuario es colaborador',
      inputSchema: z.object({ ...ownerRepo, collaborator: z.string() }),
      handler: async (args: any) => safeResult(await svc.checkCollaborator(args.owner, args.repo, args.collaborator)),
    },
    {
      name: 'collaborator_add',
      description: 'Agregar colaborador con permiso',
      inputSchema: z.object({ ...ownerRepo, collaborator: z.string(), permission: z.enum(['read', 'write', 'admin']).optional() }),
      handler: async (args: any) => {
        const { owner, repo, collaborator, ...dto } = args;
        return safeResult(await svc.addCollaborator(owner, repo, collaborator, dto));
      },
    },
    {
      name: 'collaborator_remove',
      description: 'Remover colaborador del repositorio',
      inputSchema: z.object({ ...ownerRepo, collaborator: z.string() }),
      handler: async (args: any) => { await svc.removeCollaborator(args.owner, args.repo, args.collaborator); return JSON.stringify({ success: true }); },
    },
    {
      name: 'collaborator_permission_get',
      description: 'Obtener nivel de permiso de colaborador',
      inputSchema: z.object({ ...ownerRepo, collaborator: z.string() }),
      handler: async (args: any) => safeResult(await svc.getCollaboratorPermission(args.owner, args.repo, args.collaborator)),
    },
    {
      name: 'teams_list',
      description: 'Listar equipos con acceso al repositorio',
      inputSchema: z.object(ownerRepo),
      handler: async (args: any) => safeResult(await svc.listTeams(args.owner, args.repo)),
    },

    // ════════════════════════════════════════════════════════════════
    // WEBHOOKS
    // ════════════════════════════════════════════════════════════════
    {
      name: 'repo_hook_list',
      description: 'Listar webhooks del repositorio',
      inputSchema: z.object({ ...ownerRepo, ...pagination }),
      handler: async (args: any) => {
        const { owner, repo, ...params } = args;
        return safeResult(await svc.listHooks(owner, repo));
      },
    },
    {
      name: 'repo_hook_get',
      description: 'Obtener detalles de webhook',
      inputSchema: z.object({ ...ownerRepo, id: z.number().int() }),
      handler: async (args: any) => safeResult(await svc.getHook(args.owner, args.repo, args.id)),
    },
    {
      name: 'repo_hook_create',
      description: 'Crear webhook (url, events, active, type)',
      inputSchema: z.object({
        ...ownerRepo,
        type: z.string().describe('Tipo de hook: gitea, slack, discord, etc.'),
        config: z.record(z.string()).describe('Configuración del hook (url, content_type, etc.)'),
        events: z.array(z.string()).optional(),
        active: z.boolean().optional(),
        branch_filter: z.string().optional(),
      }),
      handler: async (args: any) => {
        const { owner, repo, ...dto } = args;
        return safeResult(await svc.createHook(owner, repo, dto as any));
      },
    },
    {
      name: 'repo_hook_update',
      description: 'Actualizar webhook',
      inputSchema: z.object({
        ...ownerRepo,
        id: z.number().int(),
        config: z.record(z.string()).optional(),
        events: z.array(z.string()).optional(),
        active: z.boolean().optional(),
      }),
      handler: async (args: any) => {
        const { owner, repo, id, ...dto } = args;
        return safeResult(await svc.updateHook(owner, repo, id, dto));
      },
    },
    {
      name: 'repo_hook_delete',
      description: 'Eliminar webhook',
      inputSchema: z.object({ ...ownerRepo, id: z.number().int() }),
      handler: async (args: any) => { await svc.deleteHook(args.owner, args.repo, args.id); return JSON.stringify({ success: true }); },
    },
    {
      name: 'repo_hook_test',
      description: 'Enviar ping de prueba al webhook',
      inputSchema: z.object({ ...ownerRepo, id: z.number().int() }),
      handler: async (args: any) => safeResult(await svc.testHook(args.owner, args.repo, args.id)),
    },
    {
      name: 'repo_git_hooks_list',
      description: 'Listar git hooks del lado del servidor',
      inputSchema: z.object(ownerRepo),
      handler: async (args: any) => safeResult(await svc.listGitHooks(args.owner, args.repo)),
    },
    {
      name: 'repo_git_hook_get',
      description: 'Obtener git hook (pre-receive, post-receive, etc.)',
      inputSchema: z.object({ ...ownerRepo, id: z.string().describe('ID del hook: pre-receive, post-receive, update') }),
      handler: async (args: any) => safeResult(await svc.getGitHook(args.owner, args.repo, args.id)),
    },
    {
      name: 'repo_git_hook_update',
      description: 'Actualizar git hook',
      inputSchema: z.object({ ...ownerRepo, id: z.string(), content: z.string().optional() }),
      handler: async (args: any) => safeResult(await svc.updateGitHook(args.owner, args.repo, args.id, { content: args.content })),
    },
  ];
}
