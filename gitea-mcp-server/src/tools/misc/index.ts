// src/tools/misc/index.ts

import { z } from 'zod';
import type { ToolDefinition } from '../types.js';
import { safeResult } from '../types.js';
import type { MiscService } from '../../services/MiscService.js';

const pagination = { page: z.number().optional(), limit: z.number().optional() };

export function buildMiscTools(svc: MiscService): ToolDefinition[] {
  return [
    { name: 'gitea_version', description: 'Obtener versión de la instancia Gitea', inputSchema: z.object({}), handler: async () => safeResult(await svc.getVersion()) },
    { name: 'gitea_nodeinfo', description: 'Obtener información del nodo (protocolo ActivityPub)', inputSchema: z.object({}), handler: async () => safeResult(await svc.getNodeInfo()) },
    {
      name: 'render_markdown',
      description: 'Renderizar texto Markdown a HTML',
      inputSchema: z.object({
        text: z.string(),
        context: z.string().optional().describe('Contexto del repositorio (owner/repo) para enlaces relativos'),
        mode: z.enum(['markdown', 'gfm', 'comment']).optional(),
        wiki: z.boolean().optional(),
      }),
      handler: async (args: any) => safeResult(await svc.renderMarkdown(args)),
    },
    { name: 'render_markdown_raw', description: 'Renderizar Markdown crudo (sin contexto de repo)', inputSchema: z.object({ text: z.string() }), handler: async (args: any) => safeResult(await svc.renderMarkdownRaw(args.text)) },
    { name: 'gitignore_list', description: 'Listar templates .gitignore disponibles', inputSchema: z.object({}), handler: async () => safeResult(await svc.listGitignoreTemplates()) },
    { name: 'gitignore_get', description: 'Obtener contenido de template .gitignore', inputSchema: z.object({ name: z.string().describe('Nombre del template ej: Node, Python, Go') }), handler: async (args: any) => safeResult(await svc.getGitignoreTemplate(args.name)) },
    { name: 'license_list', description: 'Listar licencias disponibles', inputSchema: z.object({}), handler: async () => safeResult(await svc.listLicenses()) },
    { name: 'license_get', description: 'Obtener texto de licencia', inputSchema: z.object({ name: z.string().describe('Nombre de la licencia ej: MIT, Apache-2.0') }), handler: async (args: any) => safeResult(await svc.getLicense(args.name)) },
    { name: 'topics_search', description: 'Buscar tópicos globalmente (q, page, limit)', inputSchema: z.object({ q: z.string().optional(), ...pagination }), handler: async (args) => safeResult(await svc.searchTopics(args as any)) },
    { name: 'settings_get', description: 'Obtener configuración de la API', inputSchema: z.object({}), handler: async () => safeResult(await svc.getSettings()) },
    { name: 'activitypub_actor', description: 'Obtener Actor ActivityPub de usuario', inputSchema: z.object({ user_id: z.number().int() }), handler: async (args: any) => safeResult(await svc.getActivityPubActor(args.user_id)) },
    { name: 'activitypub_inbox', description: 'Enviar actividad al inbox ActivityPub', inputSchema: z.object({ user_id: z.number().int(), activity: z.record(z.unknown()) }), handler: async (args: any) => safeResult(await svc.sendActivityPubInbox(args.user_id, args.activity)) },
  ];
}
