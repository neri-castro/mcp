// src/tools/org/index.ts

import { z } from 'zod';
import type { ToolDefinition } from '../types.js';
import { safeResult } from '../types.js';
import type { OrgService } from '../../services/OrgService.js';

const pagination = { page: z.number().optional(), limit: z.number().optional() };

export function buildOrgTools(svc: OrgService): ToolDefinition[] {
  return [
    // ─── Organizaciones ──────────────────────────────────────────────────────
    { name: 'org_list', description: 'Listar todas las organizaciones públicas', inputSchema: z.object({ ...pagination }), handler: async (args) => safeResult(await svc.listAll(args as any)) },
    { name: 'org_list_for_user', description: 'Listar organizaciones del usuario autenticado', inputSchema: z.object({ ...pagination }), handler: async (args) => safeResult(await svc.listForUser(args as any)) },
    { name: 'org_get', description: 'Obtener detalles de organización', inputSchema: z.object({ org: z.string() }), handler: async (args: any) => safeResult(await svc.get(args.org)) },
    {
      name: 'org_create',
      description: 'Crear organización (username, visibility, description, etc.)',
      inputSchema: z.object({ username: z.string(), visibility: z.enum(['public', 'limited', 'private']).optional(), description: z.string().optional(), full_name: z.string().optional(), website: z.string().optional() }),
      handler: async (args: any) => safeResult(await svc.create(args)),
    },
    {
      name: 'org_update',
      description: 'Actualizar organización',
      inputSchema: z.object({ org: z.string(), description: z.string().optional(), full_name: z.string().optional(), visibility: z.enum(['public', 'limited', 'private']).optional(), website: z.string().optional() }),
      handler: async (args: any) => { const { org, ...dto } = args; return safeResult(await svc.update(org, dto)); },
    },
    { name: 'org_delete', description: 'Eliminar organización (solo owner)', inputSchema: z.object({ org: z.string() }), handler: async (args: any) => { await svc.delete(args.org); return JSON.stringify({ success: true }); } },
    { name: 'org_list_members', description: 'Listar miembros de organización', inputSchema: z.object({ org: z.string(), ...pagination }), handler: async (args: any) => safeResult(await svc.listMembers(args.org, args)) },
    { name: 'org_check_member', description: 'Verificar si usuario es miembro', inputSchema: z.object({ org: z.string(), username: z.string() }), handler: async (args: any) => safeResult(await svc.checkMember(args.org, args.username)) },
    { name: 'org_remove_member', description: 'Remover miembro de organización', inputSchema: z.object({ org: z.string(), username: z.string() }), handler: async (args: any) => { await svc.removeMember(args.org, args.username); return JSON.stringify({ success: true }); } },
    { name: 'org_list_public_members', description: 'Listar miembros públicos', inputSchema: z.object({ org: z.string(), ...pagination }), handler: async (args: any) => safeResult(await svc.listPublicMembers(args.org, args)) },
    { name: 'org_publicize_member', description: 'Hacer pública la membresía propia', inputSchema: z.object({ org: z.string(), username: z.string() }), handler: async (args: any) => safeResult(await svc.publicizeMember(args.org, args.username)) },
    { name: 'org_conceal_member', description: 'Ocultar membresía propia', inputSchema: z.object({ org: z.string(), username: z.string() }), handler: async (args: any) => { await svc.concealMember(args.org, args.username); return JSON.stringify({ success: true }); } },
    { name: 'org_list_repos', description: 'Listar repositorios de la organización', inputSchema: z.object({ org: z.string(), ...pagination }), handler: async (args: any) => safeResult(await svc.listRepos(args.org, args)) },
    { name: 'org_hook_list', description: 'Listar webhooks de la organización', inputSchema: z.object({ org: z.string() }), handler: async (args: any) => safeResult(await svc.listHooks(args.org)) },
    { name: 'org_hook_create', description: 'Crear webhook en la organización', inputSchema: z.object({ org: z.string(), type: z.string(), config: z.record(z.string()), events: z.array(z.string()).optional(), active: z.boolean().optional() }), handler: async (args: any) => { const { org, ...dto } = args; return safeResult(await svc.createHook(org, dto)); } },
    { name: 'org_hook_get', description: 'Obtener webhook de organización', inputSchema: z.object({ org: z.string(), id: z.number().int() }), handler: async (args: any) => safeResult(await svc.getHook(args.org, args.id)) },
    { name: 'org_hook_update', description: 'Actualizar webhook de organización', inputSchema: z.object({ org: z.string(), id: z.number().int(), config: z.record(z.string()).optional(), events: z.array(z.string()).optional(), active: z.boolean().optional() }), handler: async (args: any) => { const { org, id, ...dto } = args; return safeResult(await svc.updateHook(org, id, dto)); } },
    { name: 'org_hook_delete', description: 'Eliminar webhook de organización', inputSchema: z.object({ org: z.string(), id: z.number().int() }), handler: async (args: any) => { await svc.deleteHook(args.org, args.id); return JSON.stringify({ success: true }); } },

    // ─── Teams ───────────────────────────────────────────────────────────────
    { name: 'team_list', description: 'Listar equipos de organización', inputSchema: z.object({ org: z.string(), ...pagination }), handler: async (args: any) => safeResult(await svc.listTeams(args.org, args)) },
    { name: 'team_get', description: 'Obtener detalles de equipo', inputSchema: z.object({ id: z.number().int() }), handler: async (args: any) => safeResult(await svc.getTeam(args.id)) },
    {
      name: 'team_create',
      description: 'Crear equipo (name, permission, units, includes_all_repositories)',
      inputSchema: z.object({ org: z.string(), name: z.string(), description: z.string().optional(), permission: z.enum(['none', 'read', 'write', 'admin', 'owner']).optional(), includes_all_repositories: z.boolean().optional(), units: z.array(z.string()).optional() }),
      handler: async (args: any) => { const { org, ...dto } = args; return safeResult(await svc.createTeam(org, dto)); },
    },
    {
      name: 'team_update',
      description: 'Actualizar equipo',
      inputSchema: z.object({ id: z.number().int(), name: z.string(), description: z.string().optional(), permission: z.enum(['none', 'read', 'write', 'admin', 'owner']).optional(), includes_all_repositories: z.boolean().optional() }),
      handler: async (args: any) => { const { id, ...dto } = args; return safeResult(await svc.updateTeam(id, dto)); },
    },
    { name: 'team_delete', description: 'Eliminar equipo', inputSchema: z.object({ id: z.number().int() }), handler: async (args: any) => { await svc.deleteTeam(args.id); return JSON.stringify({ success: true }); } },
    { name: 'team_list_members', description: 'Listar miembros del equipo', inputSchema: z.object({ id: z.number().int(), ...pagination }), handler: async (args: any) => safeResult(await svc.listTeamMembers(args.id, args)) },
    { name: 'team_check_member', description: 'Verificar si usuario está en equipo', inputSchema: z.object({ id: z.number().int(), username: z.string() }), handler: async (args: any) => safeResult(await svc.checkTeamMember(args.id, args.username)) },
    { name: 'team_add_member', description: 'Agregar miembro al equipo', inputSchema: z.object({ id: z.number().int(), username: z.string() }), handler: async (args: any) => safeResult(await svc.addTeamMember(args.id, args.username)) },
    { name: 'team_remove_member', description: 'Remover miembro del equipo', inputSchema: z.object({ id: z.number().int(), username: z.string() }), handler: async (args: any) => { await svc.removeTeamMember(args.id, args.username); return JSON.stringify({ success: true }); } },
    { name: 'team_list_repos', description: 'Listar repositorios del equipo', inputSchema: z.object({ id: z.number().int(), ...pagination }), handler: async (args: any) => safeResult(await svc.listTeamRepos(args.id, args)) },
    { name: 'team_check_repo', description: 'Verificar si repo está en equipo', inputSchema: z.object({ id: z.number().int(), org: z.string(), repo: z.string() }), handler: async (args: any) => safeResult(await svc.checkTeamRepo(args.id, args.org, args.repo)) },
    { name: 'team_add_repo', description: 'Agregar repositorio al equipo', inputSchema: z.object({ id: z.number().int(), org: z.string(), repo: z.string() }), handler: async (args: any) => safeResult(await svc.addTeamRepo(args.id, args.org, args.repo)) },
    { name: 'team_remove_repo', description: 'Remover repositorio del equipo', inputSchema: z.object({ id: z.number().int(), org: z.string(), repo: z.string() }), handler: async (args: any) => { await svc.removeTeamRepo(args.id, args.org, args.repo); return JSON.stringify({ success: true }); } },
    { name: 'user_list_teams', description: 'Listar equipos del usuario autenticado', inputSchema: z.object({ ...pagination }), handler: async (args) => safeResult(await svc.listUserTeams(args as any)) },
    { name: 'org_list_teams', description: 'Buscar equipos en una organización', inputSchema: z.object({ org: z.string(), q: z.string().optional(), ...pagination }), handler: async (args: any) => safeResult(await svc.searchTeams(args.org, args)) },
  ];
}
