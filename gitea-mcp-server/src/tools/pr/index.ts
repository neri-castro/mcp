// src/tools/pr/index.ts

import { z } from 'zod';
import type { ToolDefinition } from '../types.js';
import { safeResult } from '../types.js';
import type { PullRequestService } from '../../services/PullRequestService.js';

const ownerRepo = { owner: z.string(), repo: z.string() };
const pagination = { page: z.number().optional(), limit: z.number().optional() };

export function buildPRTools(svc: PullRequestService): ToolDefinition[] {
  return [
    {
      name: 'pr_list',
      description: 'Listar PRs (state, sort, milestone, labels, page, limit)',
      inputSchema: z.object({ ...ownerRepo, state: z.enum(['open', 'closed', 'all']).optional(), sort: z.string().optional(), milestone: z.number().optional(), labels: z.string().optional(), ...pagination }),
      handler: async (args: any) => {
        const { owner, repo, ...params } = args;
        return safeResult(await svc.list(owner, repo, params));
      },
    },
    {
      name: 'pr_get',
      description: 'Obtener PR por número',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int() }),
      handler: async (args: any) => safeResult(await svc.get(args.owner, args.repo, args.index)),
    },
    {
      name: 'pr_create',
      description: 'Crear PR (title, head, base, body, assignees, labels, milestone, draft)',
      inputSchema: z.object({
        ...ownerRepo,
        title: z.string().min(1),
        head: z.string().describe('Branch origen'),
        base: z.string().describe('Branch destino'),
        body: z.string().optional(),
        assignees: z.array(z.string()).optional(),
        labels: z.array(z.number()).optional(),
        milestone: z.number().optional(),
        draft: z.boolean().optional(),
      }),
      handler: async (args: any) => {
        const { owner, repo, ...dto } = args;
        return safeResult(await svc.create(owner, repo, dto));
      },
    },
    {
      name: 'pr_update',
      description: 'Actualizar PR (title, body, state, assignees, labels, milestone)',
      inputSchema: z.object({
        ...ownerRepo,
        index: z.number().int(),
        title: z.string().optional(),
        body: z.string().optional(),
        state: z.enum(['open', 'closed']).optional(),
        assignees: z.array(z.string()).optional(),
        labels: z.array(z.number()).optional(),
        milestone: z.number().optional(),
      }),
      handler: async (args: any) => {
        const { owner, repo, index, ...dto } = args;
        return safeResult(await svc.update(owner, repo, index, dto));
      },
    },
    {
      name: 'pr_close',
      description: 'Cerrar PR',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int() }),
      handler: async (args: any) => safeResult(await svc.update(args.owner, args.repo, args.index, { state: 'closed' })),
    },
    {
      name: 'pr_reopen',
      description: 'Reabrir PR',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int() }),
      handler: async (args: any) => safeResult(await svc.update(args.owner, args.repo, args.index, { state: 'open' })),
    },
    {
      name: 'pr_merge',
      description: 'Mergear PR (Do, merge_message_field, style, delete_branch_after_merge, merge_when_checks_succeed)',
      inputSchema: z.object({
        ...ownerRepo,
        index: z.number().int(),
        Do: z.enum(['merge', 'rebase', 'rebase-merge', 'squash', 'fast-forward-only']),
        merge_message_field: z.string().optional(),
        delete_branch_after_merge: z.boolean().optional(),
        force_merge: z.boolean().optional(),
        head_commit_id: z.string().optional(),
        merge_when_checks_succeed: z.boolean().optional(),
      }),
      handler: async (args: any) => {
        const { owner, repo, index, ...dto } = args;
        return safeResult(await svc.merge(owner, repo, index, dto));
      },
    },
    {
      name: 'pr_cancel_merge',
      description: 'Cancelar merge pendiente',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int() }),
      handler: async (args: any) => { await svc.cancelMerge(args.owner, args.repo, args.index); return JSON.stringify({ success: true }); },
    },
    {
      name: 'pr_check_merge',
      description: 'Verificar si PR puede ser mergeado',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int() }),
      handler: async (args: any) => safeResult(await svc.checkMerge(args.owner, args.repo, args.index)),
    },
    {
      name: 'pr_get_diff',
      description: 'Obtener diff del PR (.diff o .patch)',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), diffType: z.enum(['diff', 'patch']).default('diff') }),
      handler: async (args: any) => safeResult(await svc.getDiff(args.owner, args.repo, args.index, args.diffType)),
    },
    {
      name: 'pr_get_commits',
      description: 'Listar commits del PR',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), ...pagination }),
      handler: async (args: any) => {
        const { owner, repo, index, ...params } = args;
        return safeResult(await svc.getCommits(owner, repo, index, params));
      },
    },
    {
      name: 'pr_get_files',
      description: 'Listar archivos cambiados en PR',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), ...pagination }),
      handler: async (args: any) => {
        const { owner, repo, index, ...params } = args;
        return safeResult(await svc.getFiles(owner, repo, index, params));
      },
    },
    {
      name: 'pr_requested_reviewers_add',
      description: 'Solicitar revisores para PR',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), reviewers: z.array(z.string()).optional(), team_reviewers: z.array(z.string()).optional() }),
      handler: async (args: any) => {
        const { owner, repo, index, ...dto } = args;
        return safeResult(await svc.addRequestedReviewers(owner, repo, index, dto));
      },
    },
    {
      name: 'pr_requested_reviewers_remove',
      description: 'Remover solicitud de revisores',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), reviewers: z.array(z.string()).optional(), team_reviewers: z.array(z.string()).optional() }),
      handler: async (args: any) => {
        const { owner, repo, index, ...dto } = args;
        return safeResult(await svc.removeRequestedReviewers(owner, repo, index, dto));
      },
    },
    // ─── Reviews ─────────────────────────────────────────────────────────────
    {
      name: 'review_list',
      description: 'Listar reviews del PR',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), ...pagination }),
      handler: async (args: any) => {
        const { owner, repo, index, ...params } = args;
        return safeResult(await svc.listReviews(owner, repo, index, params));
      },
    },
    {
      name: 'review_get',
      description: 'Obtener review por ID',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), id: z.number().int() }),
      handler: async (args: any) => safeResult(await svc.getReview(args.owner, args.repo, args.index, args.id)),
    },
    {
      name: 'review_create',
      description: 'Crear review (APPROVE, REQUEST_CHANGES, COMMENT, PENDING — con comentarios de línea)',
      inputSchema: z.object({
        ...ownerRepo,
        index: z.number().int(),
        event: z.enum(['APPROVE', 'REQUEST_CHANGES', 'COMMENT', 'PENDING']).optional(),
        body: z.string().optional(),
        commit_id: z.string().optional(),
        comments: z.array(z.object({ path: z.string(), body: z.string(), position: z.number().optional() })).optional(),
      }),
      handler: async (args: any) => {
        const { owner, repo, index, ...dto } = args;
        return safeResult(await svc.createReview(owner, repo, index, dto));
      },
    },
    {
      name: 'review_submit',
      description: 'Enviar review pendiente',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), id: z.number().int(), event: z.enum(['APPROVE', 'REQUEST_CHANGES', 'COMMENT']), body: z.string().optional() }),
      handler: async (args: any) => safeResult(await svc.submitReview(args.owner, args.repo, args.index, args.id, { event: args.event, body: args.body })),
    },
    {
      name: 'review_dismiss',
      description: 'Desestimar review',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), id: z.number().int(), message: z.string() }),
      handler: async (args: any) => safeResult(await svc.dismissReview(args.owner, args.repo, args.index, args.id, { message: args.message })),
    },
    {
      name: 'review_undismiss',
      description: 'Revertir desestimación de review',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), id: z.number().int() }),
      handler: async (args: any) => { await svc.undismissReview(args.owner, args.repo, args.index, args.id); return JSON.stringify({ success: true }); },
    },
    {
      name: 'review_comments_list',
      description: 'Listar comentarios de una review',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), id: z.number().int() }),
      handler: async (args: any) => safeResult(await svc.listReviewComments(args.owner, args.repo, args.index, args.id)),
    },
    {
      name: 'review_delete',
      description: 'Eliminar review pendiente',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), id: z.number().int() }),
      handler: async (args: any) => { await svc.deleteReview(args.owner, args.repo, args.index, args.id); return JSON.stringify({ success: true }); },
    },
  ];
}
