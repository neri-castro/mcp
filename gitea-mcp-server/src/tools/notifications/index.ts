// src/tools/notifications/index.ts

import { z } from 'zod';
import type { ToolDefinition } from '../types.js';
import { safeResult } from '../types.js';
import type { NotificationService } from '../../services/NotificationService.js';

const pagination = { page: z.number().optional(), limit: z.number().optional() };

export function buildNotificationTools(svc: NotificationService): ToolDefinition[] {
  return [
    { name: 'notification_list', description: 'Listar notificaciones del usuario (all, since, before, subject_type, page, limit)', inputSchema: z.object({ all: z.boolean().optional(), since: z.string().optional(), before: z.string().optional(), subject_type: z.string().optional(), ...pagination }), handler: async (args) => safeResult(await svc.list(args as any)) },
    { name: 'notification_mark_all_read', description: 'Marcar todas las notificaciones como leídas', inputSchema: z.object({ last_read_at: z.string().optional() }), handler: async (args) => safeResult(await svc.markAllRead(args as any)) },
    { name: 'notification_list_repo', description: 'Listar notificaciones de un repositorio específico', inputSchema: z.object({ owner: z.string(), repo: z.string(), all: z.boolean().optional(), ...pagination }), handler: async (args: any) => safeResult(await svc.listRepo(args.owner, args.repo, args)) },
    { name: 'notification_mark_repo_read', description: 'Marcar todas las notificaciones del repo como leídas', inputSchema: z.object({ owner: z.string(), repo: z.string() }), handler: async (args: any) => safeResult(await svc.markRepoRead(args.owner, args.repo)) },
    { name: 'notification_get', description: 'Obtener detalles de hilo de notificación', inputSchema: z.object({ id: z.number().int() }), handler: async (args: any) => safeResult(await svc.get(args.id)) },
    { name: 'notification_mark_read', description: 'Marcar notificación individual como leída', inputSchema: z.object({ id: z.number().int() }), handler: async (args: any) => safeResult(await svc.markRead(args.id)) },
    { name: 'notification_check_new', description: 'Verificar si hay notificaciones no leídas', inputSchema: z.object({}), handler: async () => safeResult(await svc.checkNew()) },
  ];
}
