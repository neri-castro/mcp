// src/tools/repo/commits.ts

import { z } from 'zod';
import type { ToolDefinition } from '../types.js';
import { safeResult } from '../types.js';
import type { CommitService } from '../../services/CommitService.js';

const ownerRepo = { owner: z.string(), repo: z.string() };

export function buildCommitTools(svc: CommitService): ToolDefinition[] {
  return [
    {
      name: 'commit_list',
      description: 'Listar commits (sha, path, stat, verification, files, limit, page)',
      inputSchema: z.object({ ...ownerRepo, sha: z.string().optional(), path: z.string().optional(), stat: z.boolean().optional(), limit: z.number().optional(), page: z.number().optional() }),
      handler: async (args: any) => {
        const { owner, repo, ...params } = args;
        return safeResult(await svc.listCommits(owner, repo, params));
      },
    },
    {
      name: 'commit_get',
      description: 'Obtener detalles de commit por SHA',
      inputSchema: z.object({ ...ownerRepo, sha: z.string() }),
      handler: async (args: any) => safeResult(await svc.getCommit(args.owner, args.repo, args.sha)),
    },
    {
      name: 'commit_get_statuses',
      description: 'Obtener CI statuses de un commit',
      inputSchema: z.object({ ...ownerRepo, sha: z.string(), limit: z.number().optional(), page: z.number().optional() }),
      handler: async (args: any) => {
        const { owner, repo, sha, ...params } = args;
        return safeResult(await svc.getStatuses(owner, repo, sha, params));
      },
    },
    {
      name: 'commit_create_status',
      description: 'Crear/actualizar CI status en commit',
      inputSchema: z.object({
        ...ownerRepo,
        sha: z.string(),
        state: z.enum(['pending', 'success', 'error', 'failure', 'warning']),
        context: z.string().optional(),
        description: z.string().optional(),
        target_url: z.string().optional(),
      }),
      handler: async (args: any) => {
        const { owner, repo, sha, ...dto } = args;
        return safeResult(await svc.createStatus(owner, repo, sha, dto));
      },
    },
    {
      name: 'commit_get_combined_status',
      description: 'Obtener estado combinado de commit',
      inputSchema: z.object({ ...ownerRepo, ref: z.string() }),
      handler: async (args: any) => safeResult(await svc.getCombinedStatus(args.owner, args.repo, args.ref)),
    },
    {
      name: 'commit_compare',
      description: 'Comparar dos refs (commits, branches, tags)',
      inputSchema: z.object({ ...ownerRepo, base: z.string(), head: z.string() }),
      handler: async (args: any) => safeResult(await svc.compare(args.owner, args.repo, args.base, args.head)),
    },
    {
      name: 'commit_get_diff',
      description: 'Obtener diff de commit (.diff o .patch)',
      inputSchema: z.object({ ...ownerRepo, sha: z.string(), diffType: z.enum(['diff', 'patch']).default('diff') }),
      handler: async (args: any) => safeResult(await svc.getDiff(args.owner, args.repo, args.sha, args.diffType)),
    },
    {
      name: 'commit_get_pull_requests',
      description: 'Obtener PR asociado a commit',
      inputSchema: z.object({ ...ownerRepo, sha: z.string() }),
      handler: async (args: any) => safeResult(await svc.getPullRequests(args.owner, args.repo, args.sha)),
    },
    {
      name: 'commit_list_checks',
      description: 'Listar checks de Actions en un commit/ref',
      inputSchema: z.object({ ...ownerRepo, ref: z.string(), limit: z.number().optional(), page: z.number().optional() }),
      handler: async (args: any) => {
        const { owner, repo, ref, ...params } = args;
        return safeResult(await svc.listChecks(owner, repo, ref, params));
      },
    },
  ];
}
