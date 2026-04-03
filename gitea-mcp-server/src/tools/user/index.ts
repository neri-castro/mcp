// src/tools/user/index.ts

import { z } from 'zod';
import type { ToolDefinition } from '../types.js';
import { safeResult } from '../types.js';
import type { UserService } from '../../services/UserService.js';

const pagination = { page: z.number().optional(), limit: z.number().optional() };

export function buildUserTools(svc: UserService): ToolDefinition[] {
  return [
    { name: 'user_get_authenticated', description: 'Obtener perfil del usuario autenticado actual', inputSchema: z.object({}), handler: async () => safeResult(await svc.getAuthenticated()) },
    { name: 'user_update', description: 'Actualizar configuración del usuario autenticado', inputSchema: z.object({ description: z.string().optional(), full_name: z.string().optional(), hide_email: z.boolean().optional(), website: z.string().optional() }), handler: async (args) => safeResult(await svc.updateSettings(args as any)) },
    { name: 'user_get', description: 'Obtener perfil público de usuario', inputSchema: z.object({ username: z.string() }), handler: async (args: any) => safeResult(await svc.getUser(args.username)) },
    { name: 'user_search', description: 'Buscar usuarios por palabra clave (q, limit, page)', inputSchema: z.object({ q: z.string().optional(), ...pagination }), handler: async (args) => safeResult(await svc.search(args as any)) },
    { name: 'user_list_followers', description: 'Listar seguidores de usuario', inputSchema: z.object({ username: z.string(), ...pagination }), handler: async (args: any) => safeResult(await svc.listFollowers(args.username, args)) },
    { name: 'user_list_following', description: 'Listar usuarios que sigue', inputSchema: z.object({ username: z.string(), ...pagination }), handler: async (args: any) => safeResult(await svc.listFollowing(args.username, args)) },
    { name: 'user_follow', description: 'Seguir un usuario', inputSchema: z.object({ username: z.string() }), handler: async (args: any) => safeResult(await svc.follow(args.username)) },
    { name: 'user_unfollow', description: 'Dejar de seguir usuario', inputSchema: z.object({ username: z.string() }), handler: async (args: any) => { await svc.unfollow(args.username); return JSON.stringify({ success: true }); } },
    { name: 'user_check_following', description: 'Verificar si sigues a un usuario', inputSchema: z.object({ username: z.string() }), handler: async (args: any) => safeResult(await svc.checkFollowing(args.username)) },
    { name: 'user_list_repos', description: 'Listar repositorios de un usuario', inputSchema: z.object({ username: z.string(), ...pagination }), handler: async (args: any) => safeResult(await svc.listRepos(args.username, args)) },
    { name: 'user_list_starred', description: 'Listar repositorios con estrella de usuario', inputSchema: z.object({ username: z.string(), ...pagination }), handler: async (args: any) => safeResult(await svc.listStarred(args.username, args)) },
    { name: 'user_star_repo', description: 'Dar estrella a repositorio', inputSchema: z.object({ owner: z.string(), repo: z.string() }), handler: async (args: any) => safeResult(await svc.starRepo(args.owner, args.repo)) },
    { name: 'user_unstar_repo', description: 'Quitar estrella de repositorio', inputSchema: z.object({ owner: z.string(), repo: z.string() }), handler: async (args: any) => { await svc.unstarRepo(args.owner, args.repo); return JSON.stringify({ success: true }); } },
    { name: 'user_check_starred', description: 'Verificar si repositorio tiene estrella', inputSchema: z.object({ owner: z.string(), repo: z.string() }), handler: async (args: any) => safeResult(await svc.checkStarred(args.owner, args.repo)) },
    { name: 'user_list_watched', description: 'Listar repos que está observando', inputSchema: z.object({ username: z.string(), ...pagination }), handler: async (args: any) => safeResult(await svc.listWatched(args.username, args)) },
    { name: 'user_watch_repo', description: 'Suscribirse a notificaciones de repo', inputSchema: z.object({ owner: z.string(), repo: z.string() }), handler: async (args: any) => safeResult(await svc.watchRepo(args.owner, args.repo)) },
    { name: 'user_unwatch_repo', description: 'Desuscribirse de repo', inputSchema: z.object({ owner: z.string(), repo: z.string() }), handler: async (args: any) => { await svc.unwatchRepo(args.owner, args.repo); return JSON.stringify({ success: true }); } },
    { name: 'user_list_gpg_keys', description: 'Listar claves GPG del usuario autenticado', inputSchema: z.object({ ...pagination }), handler: async (args) => safeResult(await svc.listGpgKeys(args as any)) },
    { name: 'user_add_gpg_key', description: 'Agregar clave GPG (armored_public_key)', inputSchema: z.object({ armored_public_key: z.string() }), handler: async (args: any) => safeResult(await svc.addGpgKey({ armored_public_key: args.armored_public_key })) },
    { name: 'user_delete_gpg_key', description: 'Eliminar clave GPG', inputSchema: z.object({ id: z.number().int() }), handler: async (args: any) => { await svc.deleteGpgKey(args.id); return JSON.stringify({ success: true }); } },
    { name: 'user_list_ssh_keys', description: 'Listar claves SSH del usuario autenticado', inputSchema: z.object({ ...pagination }), handler: async (args) => safeResult(await svc.listSshKeys(args as any)) },
    { name: 'user_add_ssh_key', description: 'Agregar clave SSH (key, title, read_only)', inputSchema: z.object({ key: z.string(), title: z.string(), read_only: z.boolean().optional() }), handler: async (args: any) => safeResult(await svc.addSshKey(args)) },
    { name: 'user_delete_ssh_key', description: 'Eliminar clave SSH', inputSchema: z.object({ id: z.number().int() }), handler: async (args: any) => { await svc.deleteSshKey(args.id); return JSON.stringify({ success: true }); } },
    { name: 'user_list_oauth2_apps', description: 'Listar aplicaciones OAuth2 del usuario', inputSchema: z.object({ ...pagination }), handler: async (args) => safeResult(await svc.listOAuth2Apps(args as any)) },
    { name: 'user_create_oauth2_app', description: 'Crear aplicación OAuth2', inputSchema: z.object({ name: z.string(), redirect_uris: z.array(z.string()), confidential_client: z.boolean().optional() }), handler: async (args: any) => safeResult(await svc.createOAuth2App(args)) },
    { name: 'user_get_oauth2_app', description: 'Obtener aplicación OAuth2', inputSchema: z.object({ id: z.number().int() }), handler: async (args: any) => safeResult(await svc.getOAuth2App(args.id)) },
    { name: 'user_update_oauth2_app', description: 'Actualizar aplicación OAuth2', inputSchema: z.object({ id: z.number().int(), name: z.string(), redirect_uris: z.array(z.string()) }), handler: async (args: any) => safeResult(await svc.updateOAuth2App(args.id, args)) },
    { name: 'user_delete_oauth2_app', description: 'Eliminar aplicación OAuth2', inputSchema: z.object({ id: z.number().int() }), handler: async (args: any) => { await svc.deleteOAuth2App(args.id); return JSON.stringify({ success: true }); } },
    { name: 'user_list_tokens', description: 'Listar tokens de acceso (requiere BasicAuth)', inputSchema: z.object({ username: z.string(), ...pagination }), handler: async (args: any) => safeResult(await svc.listTokens(args.username, args)) },
    { name: 'user_create_token', description: 'Crear token de acceso con scopes', inputSchema: z.object({ username: z.string(), name: z.string(), scopes: z.array(z.string()).optional() }), handler: async (args: any) => safeResult(await svc.createToken(args.username, { name: args.name, scopes: args.scopes })) },
    { name: 'user_delete_token', description: 'Eliminar token de acceso', inputSchema: z.object({ username: z.string(), token: z.string() }), handler: async (args: any) => { await svc.deleteToken(args.username, args.token); return JSON.stringify({ success: true }); } },
    { name: 'user_get_heatmap', description: 'Obtener heatmap de actividad del usuario', inputSchema: z.object({ username: z.string() }), handler: async (args: any) => safeResult(await svc.getHeatmap(args.username)) },
  ];
}
