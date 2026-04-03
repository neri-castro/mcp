// src/tools/admin/index.ts

import { z } from 'zod';
import type { ToolDefinition } from '../types.js';
import { safeResult } from '../types.js';
import type { AdminService } from '../../services/AdminService.js';

const pagination = { page: z.number().optional(), limit: z.number().optional() };

export function buildAdminTools(svc: AdminService): ToolDefinition[] {
  return [
    // ─── Usuarios ────────────────────────────────────────────────────────────
    { name: 'admin_user_list', description: 'Listar usuarios (q, login_name, page, limit)', inputSchema: z.object({ q: z.string().optional(), login_name: z.string().optional(), ...pagination }), handler: async (args) => safeResult(await svc.listUsers(args as any)) },
    {
      name: 'admin_user_create',
      description: 'Crear usuario (login_name, password, email, full_name, must_change_password, restricted, visibility, source_id)',
      inputSchema: z.object({
        login_name: z.string(),
        email: z.string().email(),
        password: z.string().optional(),
        full_name: z.string().optional(),
        must_change_password: z.boolean().optional(),
        send_notify: z.boolean().optional(),
        source_id: z.number().optional(),
        visibility: z.enum(['public', 'limited', 'private']).optional(),
        restricted: z.boolean().optional(),
      }),
      handler: async (args: any) => safeResult(await svc.createUser(args)),
    },
    {
      name: 'admin_user_update',
      description: 'Editar usuario (email, password, admin, active, restricted, max_repo_creation, allow_git_hook)',
      inputSchema: z.object({
        username: z.string(),
        email: z.string().optional(),
        full_name: z.string().optional(),
        password: z.string().optional(),
        admin: z.boolean().optional(),
        active: z.boolean().optional(),
        restricted: z.boolean().optional(),
        max_repo_creation: z.number().optional().describe('-1 = ilimitado'),
        allow_git_hook: z.boolean().optional(),
        allow_import_local: z.boolean().optional(),
        must_change_password: z.boolean().optional(),
        prohibit_login: z.boolean().optional(),
        visibility: z.enum(['public', 'limited', 'private']).optional(),
      }),
      handler: async (args: any) => { const { username, ...dto } = args; return safeResult(await svc.updateUser(username, dto)); },
    },
    { name: 'admin_user_delete', description: 'Eliminar usuario permanentemente', inputSchema: z.object({ username: z.string() }), handler: async (args: any) => { await svc.deleteUser(args.username); return JSON.stringify({ success: true }); } },
    { name: 'admin_user_rename', description: 'Renombrar usuario', inputSchema: z.object({ username: z.string(), new_name: z.string() }), handler: async (args: any) => safeResult(await svc.renameUser(args.username, args.new_name)) },
    { name: 'admin_user_create_repo', description: 'Crear repositorio para otro usuario', inputSchema: z.object({ username: z.string(), name: z.string(), description: z.string().optional(), private: z.boolean().optional(), auto_init: z.boolean().optional() }), handler: async (args: any) => { const { username, ...dto } = args; return safeResult(await svc.createRepoForUser(username, dto)); } },
    { name: 'admin_user_create_org', description: 'Crear organización para usuario', inputSchema: z.object({ username: z.string(), org_name: z.string(), visibility: z.enum(['public', 'limited', 'private']).optional() }), handler: async (args: any) => safeResult(await svc.createOrgForUser(args.username, { username: args.org_name, visibility: args.visibility })) },
    { name: 'admin_user_add_key', description: 'Agregar clave SSH a usuario', inputSchema: z.object({ username: z.string(), key: z.string(), title: z.string(), read_only: z.boolean().optional() }), handler: async (args: any) => { const { username, ...dto } = args; return safeResult(await svc.addKeyToUser(username, dto)); } },
    { name: 'admin_user_delete_key', description: 'Eliminar clave SSH de usuario', inputSchema: z.object({ username: z.string(), id: z.number().int() }), handler: async (args: any) => { await svc.deleteKeyFromUser(args.username, args.id); return JSON.stringify({ success: true }); } },

    // ─── Cron ────────────────────────────────────────────────────────────────
    { name: 'admin_cron_list', description: 'Listar todas las tareas cron del sistema', inputSchema: z.object({}), handler: async () => safeResult(await svc.listCron()) },
    { name: 'admin_cron_run', description: 'Ejecutar tarea cron manualmente', inputSchema: z.object({ task: z.string() }), handler: async (args: any) => safeResult(await svc.runCron(args.task)) },

    // ─── Emails ──────────────────────────────────────────────────────────────
    { name: 'admin_email_list', description: 'Listar todos los emails registrados', inputSchema: z.object({ ...pagination }), handler: async (args) => safeResult(await svc.listEmails(args as any)) },
    { name: 'admin_email_search', description: 'Buscar emails (q, limit, page)', inputSchema: z.object({ q: z.string().optional(), ...pagination }), handler: async (args) => safeResult(await svc.searchEmails(args as any)) },

    // ─── Orgs ────────────────────────────────────────────────────────────────
    { name: 'admin_orgs_list', description: 'Listar todas las organizaciones del sistema', inputSchema: z.object({ ...pagination }), handler: async (args) => safeResult(await svc.listOrgs(args as any)) },

    // ─── Hooks globales ──────────────────────────────────────────────────────
    { name: 'admin_hook_list', description: 'Listar webhooks globales del sistema', inputSchema: z.object({ ...pagination }), handler: async () => safeResult(await svc.listHooks()) },
    { name: 'admin_hook_create', description: 'Crear webhook global', inputSchema: z.object({ type: z.string(), config: z.record(z.string()), events: z.array(z.string()).optional(), active: z.boolean().optional() }), handler: async (args) => safeResult(await svc.createHook(args)) },
    { name: 'admin_hook_get', description: 'Obtener webhook global por ID', inputSchema: z.object({ id: z.number().int() }), handler: async (args: any) => safeResult(await svc.getHook(args.id)) },
    { name: 'admin_hook_update', description: 'Actualizar webhook global', inputSchema: z.object({ id: z.number().int(), config: z.record(z.string()).optional(), events: z.array(z.string()).optional(), active: z.boolean().optional() }), handler: async (args: any) => { const { id, ...dto } = args; return safeResult(await svc.updateHook(id, dto)); } },
    { name: 'admin_hook_delete', description: 'Eliminar webhook global', inputSchema: z.object({ id: z.number().int() }), handler: async (args: any) => { await svc.deleteHook(args.id); return JSON.stringify({ success: true }); } },

    // ─── Repositorios huérfanos ──────────────────────────────────────────────
    { name: 'admin_unadopted_list', description: 'Listar repositorios git sin adoptar en el servidor', inputSchema: z.object({ q: z.string().optional(), ...pagination }), handler: async (args) => safeResult(await svc.listUnadopted(args as any)) },
    { name: 'admin_unadopted_adopt', description: 'Adoptar repositorio huérfano', inputSchema: z.object({ owner: z.string(), repo: z.string() }), handler: async (args: any) => safeResult(await svc.adoptRepo(args.owner, args.repo)) },
    { name: 'admin_unadopted_delete', description: 'Eliminar archivos de repositorio huérfano', inputSchema: z.object({ owner: z.string(), repo: z.string() }), handler: async (args: any) => { await svc.deleteUnadopted(args.owner, args.repo); return JSON.stringify({ success: true }); } },
  ];
}
