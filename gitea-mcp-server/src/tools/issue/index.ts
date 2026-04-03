// src/tools/issue/index.ts

import { z } from 'zod';
import type { ToolDefinition } from '../types.js';
import { safeResult } from '../types.js';
import type { IssueService } from '../../services/IssueService.js';

const ownerRepo = { owner: z.string(), repo: z.string() };
const pagination = { page: z.number().optional(), limit: z.number().optional() };

export function buildIssueTools(svc: IssueService): ToolDefinition[] {
  return [
    // ─── Issues CRUD ─────────────────────────────────────────────────────────
    {
      name: 'issue_list',
      description: 'Listar issues (state, type, labels, milestone, since, page, limit)',
      inputSchema: z.object({ ...ownerRepo, state: z.enum(['open', 'closed', 'all']).optional(), type: z.enum(['issues', 'pulls']).optional(), labels: z.string().optional(), milestone: z.number().optional(), ...pagination }),
      handler: async (args: any) => {
        const { owner, repo, ...params } = args;
        return safeResult(await svc.list(owner, repo, params));
      },
    },
    {
      name: 'issue_list_for_user',
      description: 'Listar issues del usuario autenticado con filtros',
      inputSchema: z.object({ state: z.enum(['open', 'closed', 'all']).optional(), type: z.enum(['issues', 'pulls']).optional(), ...pagination }),
      handler: async (args) => safeResult(await svc.listForUser(args as Record<string, unknown>)),
    },
    {
      name: 'issue_get',
      description: 'Obtener issue por número',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int() }),
      handler: async (args: any) => safeResult(await svc.get(args.owner, args.repo, args.index)),
    },
    {
      name: 'issue_create',
      description: 'Crear issue (title, body, assignees, labels, milestone, due_date)',
      inputSchema: z.object({
        ...ownerRepo,
        title: z.string().min(1),
        body: z.string().optional(),
        assignees: z.array(z.string()).optional(),
        labels: z.array(z.number()).optional(),
        milestone: z.number().optional(),
        due_date: z.string().optional().describe('ISO 8601'),
      }),
      handler: async (args: any) => {
        const { owner, repo, ...dto } = args;
        return safeResult(await svc.create(owner, repo, dto));
      },
    },
    {
      name: 'issue_update',
      description: 'Actualizar issue (title, body, state, assignees, milestone)',
      inputSchema: z.object({
        ...ownerRepo,
        index: z.number().int(),
        title: z.string().optional(),
        body: z.string().optional(),
        state: z.enum(['open', 'closed']).optional(),
        assignees: z.array(z.string()).optional(),
        milestone: z.number().optional(),
      }),
      handler: async (args: any) => {
        const { owner, repo, index, ...dto } = args;
        return safeResult(await svc.update(owner, repo, index, dto));
      },
    },
    {
      name: 'issue_delete',
      description: 'Eliminar issue (requiere permisos admin)',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int() }),
      handler: async (args: any) => { await svc.delete(args.owner, args.repo, args.index); return JSON.stringify({ success: true }); },
    },
    {
      name: 'issue_lock',
      description: 'Bloquear issue (reason: off-topic, too-heated, resolved, spam)',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), reason: z.enum(['off-topic', 'too-heated', 'resolved', 'spam']).optional() }),
      handler: async (args: any) => safeResult(await svc.lock(args.owner, args.repo, args.index, { reason: args.reason })),
    },
    {
      name: 'issue_unlock',
      description: 'Desbloquear issue',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int() }),
      handler: async (args: any) => { await svc.unlock(args.owner, args.repo, args.index); return JSON.stringify({ success: true }); },
    },
    {
      name: 'issue_subscribe',
      description: 'Suscribir usuario a issue',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), user: z.string() }),
      handler: async (args: any) => safeResult(await svc.subscribe(args.owner, args.repo, args.index, args.user)),
    },
    {
      name: 'issue_unsubscribe',
      description: 'Desuscribir usuario de issue',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), user: z.string() }),
      handler: async (args: any) => { await svc.unsubscribe(args.owner, args.repo, args.index, args.user); return JSON.stringify({ success: true }); },
    },

    // ─── Comentarios ─────────────────────────────────────────────────────────
    {
      name: 'comment_list',
      description: 'Listar comentarios de un issue',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), ...pagination }),
      handler: async (args: any) => {
        const { owner, repo, index, ...params } = args;
        return safeResult(await svc.listComments(owner, repo, index, params));
      },
    },
    {
      name: 'comment_list_all',
      description: 'Listar todos los comentarios del repositorio',
      inputSchema: z.object({ ...ownerRepo, ...pagination }),
      handler: async (args: any) => {
        const { owner, repo, ...params } = args;
        return safeResult(await svc.listAllComments(owner, repo, params));
      },
    },
    {
      name: 'comment_get',
      description: 'Obtener comentario por ID',
      inputSchema: z.object({ ...ownerRepo, id: z.number().int() }),
      handler: async (args: any) => safeResult(await svc.getComment(args.owner, args.repo, args.id)),
    },
    {
      name: 'comment_create',
      description: 'Crear comentario en issue',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), body: z.string().min(1) }),
      handler: async (args: any) => safeResult(await svc.createComment(args.owner, args.repo, args.index, { body: args.body })),
    },
    {
      name: 'comment_update',
      description: 'Actualizar comentario',
      inputSchema: z.object({ ...ownerRepo, id: z.number().int(), body: z.string().min(1) }),
      handler: async (args: any) => safeResult(await svc.updateComment(args.owner, args.repo, args.id, { body: args.body })),
    },
    {
      name: 'comment_delete',
      description: 'Eliminar comentario',
      inputSchema: z.object({ ...ownerRepo, id: z.number().int() }),
      handler: async (args: any) => { await svc.deleteComment(args.owner, args.repo, args.id); return JSON.stringify({ success: true }); },
    },

    // ─── Labels ──────────────────────────────────────────────────────────────
    {
      name: 'label_list',
      description: 'Listar labels del repositorio',
      inputSchema: z.object({ ...ownerRepo, ...pagination }),
      handler: async (args: any) => safeResult(await svc.listLabels(args.owner, args.repo)),
    },
    {
      name: 'label_create',
      description: 'Crear label (name, color, description)',
      inputSchema: z.object({ ...ownerRepo, name: z.string(), color: z.string().describe('Hex color ej: #ee0701'), description: z.string().optional() }),
      handler: async (args: any) => {
        const { owner, repo, ...dto } = args;
        return safeResult(await svc.createLabel(owner, repo, dto));
      },
    },
    {
      name: 'label_get',
      description: 'Obtener label por ID',
      inputSchema: z.object({ ...ownerRepo, id: z.number().int() }),
      handler: async (args: any) => safeResult(await svc.getLabel(args.owner, args.repo, args.id)),
    },
    {
      name: 'label_update',
      description: 'Actualizar label',
      inputSchema: z.object({ ...ownerRepo, id: z.number().int(), name: z.string().optional(), color: z.string().optional(), description: z.string().optional() }),
      handler: async (args: any) => {
        const { owner, repo, id, ...dto } = args;
        return safeResult(await svc.updateLabel(owner, repo, id, dto));
      },
    },
    {
      name: 'label_delete',
      description: 'Eliminar label',
      inputSchema: z.object({ ...ownerRepo, id: z.number().int() }),
      handler: async (args: any) => { await svc.deleteLabel(args.owner, args.repo, args.id); return JSON.stringify({ success: true }); },
    },
    {
      name: 'issue_labels_add',
      description: 'Agregar labels a issue',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), labels: z.array(z.number()) }),
      handler: async (args: any) => safeResult(await svc.addLabels(args.owner, args.repo, args.index, { labels: args.labels })),
    },
    {
      name: 'issue_labels_replace',
      description: 'Reemplazar todos los labels del issue',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), labels: z.array(z.number()) }),
      handler: async (args: any) => safeResult(await svc.replaceLabels(args.owner, args.repo, args.index, { labels: args.labels })),
    },
    {
      name: 'issue_labels_remove_all',
      description: 'Quitar todos los labels del issue',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int() }),
      handler: async (args: any) => { await svc.removeAllLabels(args.owner, args.repo, args.index); return JSON.stringify({ success: true }); },
    },

    // ─── Milestones ──────────────────────────────────────────────────────────
    {
      name: 'milestone_list',
      description: 'Listar milestones',
      inputSchema: z.object({ ...ownerRepo, state: z.enum(['open', 'closed', 'all']).optional(), ...pagination }),
      handler: async (args: any) => {
        const { owner, repo, ...params } = args;
        return safeResult(await svc.listMilestones(owner, repo, params));
      },
    },
    {
      name: 'milestone_create',
      description: 'Crear milestone (title, description, due_on, state)',
      inputSchema: z.object({ ...ownerRepo, title: z.string(), description: z.string().optional(), due_on: z.string().optional(), state: z.enum(['open', 'closed']).optional() }),
      handler: async (args: any) => {
        const { owner, repo, ...dto } = args;
        return safeResult(await svc.createMilestone(owner, repo, dto));
      },
    },
    {
      name: 'milestone_get',
      description: 'Obtener milestone',
      inputSchema: z.object({ ...ownerRepo, id: z.number().int() }),
      handler: async (args: any) => safeResult(await svc.getMilestone(args.owner, args.repo, args.id)),
    },
    {
      name: 'milestone_update',
      description: 'Actualizar milestone',
      inputSchema: z.object({ ...ownerRepo, id: z.number().int(), title: z.string().optional(), description: z.string().optional(), due_on: z.string().optional(), state: z.enum(['open', 'closed']).optional() }),
      handler: async (args: any) => {
        const { owner, repo, id, ...dto } = args;
        return safeResult(await svc.updateMilestone(owner, repo, id, dto));
      },
    },
    {
      name: 'milestone_delete',
      description: 'Eliminar milestone',
      inputSchema: z.object({ ...ownerRepo, id: z.number().int() }),
      handler: async (args: any) => { await svc.deleteMilestone(args.owner, args.repo, args.id); return JSON.stringify({ success: true }); },
    },

    // ─── Reactions ───────────────────────────────────────────────────────────
    {
      name: 'issue_reaction_list',
      description: 'Listar reactions de un issue',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int() }),
      handler: async (args: any) => safeResult(await svc.listIssueReactions(args.owner, args.repo, args.index)),
    },
    {
      name: 'issue_reaction_add',
      description: 'Agregar reaction (+1, -1, laugh, confused, heart, hooray, rocket, eyes)',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), content: z.enum(['+1', '-1', 'laugh', 'confused', 'heart', 'hooray', 'rocket', 'eyes']) }),
      handler: async (args: any) => safeResult(await svc.addIssueReaction(args.owner, args.repo, args.index, { content: args.content })),
    },
    {
      name: 'comment_reaction_list',
      description: 'Listar reactions de comentario',
      inputSchema: z.object({ ...ownerRepo, id: z.number().int() }),
      handler: async (args: any) => safeResult(await svc.listCommentReactions(args.owner, args.repo, args.id)),
    },
    {
      name: 'comment_reaction_add',
      description: 'Agregar reaction a comentario',
      inputSchema: z.object({ ...ownerRepo, id: z.number().int(), content: z.enum(['+1', '-1', 'laugh', 'confused', 'heart', 'hooray', 'rocket', 'eyes']) }),
      handler: async (args: any) => safeResult(await svc.addCommentReaction(args.owner, args.repo, args.id, { content: args.content })),
    },

    // ─── Time Tracking ───────────────────────────────────────────────────────
    {
      name: 'time_list',
      description: 'Listar tiempo registrado en issue',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int() }),
      handler: async (args: any) => safeResult(await svc.listTimes(args.owner, args.repo, args.index)),
    },
    {
      name: 'time_add',
      description: 'Registrar tiempo (time en segundos, created)',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), time: z.number().int().describe('Tiempo en segundos'), created: z.string().optional() }),
      handler: async (args: any) => safeResult(await svc.addTime(args.owner, args.repo, args.index, { time: args.time, created: args.created })),
    },
    {
      name: 'time_delete',
      description: 'Eliminar registro de tiempo',
      inputSchema: z.object({ ...ownerRepo, index: z.number().int(), id: z.number().int() }),
      handler: async (args: any) => { await svc.deleteTime(args.owner, args.repo, args.index, args.id); return JSON.stringify({ success: true }); },
    },
    {
      name: 'time_list_user',
      description: 'Listar todo el tiempo registrado en el repositorio',
      inputSchema: z.object(ownerRepo),
      handler: async (args: any) => safeResult(await svc.listAllTimes(args.owner, args.repo)),
    },
  ];
}
