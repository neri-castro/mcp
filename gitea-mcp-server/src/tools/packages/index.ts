// src/tools/packages/index.ts

import { z } from 'zod';
import type { ToolDefinition } from '../types.js';
import { safeResult } from '../types.js';
import type { PackageService } from '../../services/PackageService.js';

const PACKAGE_TYPES = ['cargo', 'chef', 'composer', 'conan', 'conda', 'container', 'debian', 'generic', 'go', 'helm', 'maven', 'npm', 'nuget', 'pub', 'pypi', 'rpm', 'rubygems', 'swift', 'vagrant'] as const;
const pagination = { page: z.number().optional(), limit: z.number().optional() };

export function buildPackageTools(svc: PackageService): ToolDefinition[] {
  return [
    { name: 'package_list_user', description: 'Listar paquetes de usuario/organización (type, q, page, limit)', inputSchema: z.object({ username: z.string(), type: z.enum(PACKAGE_TYPES).optional(), q: z.string().optional(), ...pagination }), handler: async (args: any) => safeResult(await svc.listForUser(args.username, args)) },
    { name: 'package_get', description: 'Obtener detalles de paquete específico', inputSchema: z.object({ username: z.string(), type: z.enum(PACKAGE_TYPES), name: z.string(), version: z.string() }), handler: async (args: any) => safeResult(await svc.get(args.username, args.type, args.name, args.version)) },
    { name: 'package_delete', description: 'Eliminar versión de paquete', inputSchema: z.object({ username: z.string(), type: z.enum(PACKAGE_TYPES), name: z.string(), version: z.string() }), handler: async (args: any) => { await svc.delete(args.username, args.type, args.name, args.version); return JSON.stringify({ success: true }); } },
    { name: 'package_list_files', description: 'Listar archivos de un paquete', inputSchema: z.object({ username: z.string(), type: z.enum(PACKAGE_TYPES), name: z.string(), version: z.string() }), handler: async (args: any) => safeResult(await svc.listFiles(args.username, args.type, args.name, args.version)) },
  ];
}
