import { z } from 'zod';
import type { LaravelHttpClient } from '../../http/LaravelHttpClient.js';
import { isPaginatedResponse } from '../../dto/common/CommonDTO.js';
import { formatPaginationSummary } from '../../utils/pagination.js';
import type { CoreTool } from './discovery.tools.js';
import type { AppConfig } from '../../config/config.js';

// ──────────────────────────────────────────────────────────────────
// Pagination Tools: helpers para paginación automática
// ──────────────────────────────────────────────────────────────────

export function buildPaginationTools(client: LaravelHttpClient, config: AppConfig): CoreTool[] {
  return [
    // ─────────────────────────────────────────────
    // scramble_paginate_all
    // ─────────────────────────────────────────────
    {
      name: 'scramble_paginate_all',
      description: `Recupera TODAS las páginas de un endpoint paginado de Laravel.
ADVERTENCIA: puede generar muchas requests si hay muchos registros.
Soporta LengthAwarePaginator y CursorPaginator.
Respeta MAX_PAGE_SIZE de la configuración.`,
      inputSchema: z.object({
        url: z.string().describe('URL del endpoint paginado (ej: /api/users)'),
        params: z
          .record(z.unknown())
          .optional()
          .describe('Query params adicionales (filtros, etc.)'),
        max_pages: z
          .number()
          .int()
          .positive()
          .default(10)
          .optional()
          .describe('Máximo de páginas a recuperar (default: 10)'),
        per_page: z.number().int().positive().optional().describe('Items por página'),
      }),
      handler: async (input) => {
        const url = input['url'] as string;
        const baseParams = (input['params'] as Record<string, unknown>) ?? {};
        const maxPages = (input['max_pages'] as number) ?? 10;
        const perPage = (input['per_page'] as number) ?? config.defaultPageSize;

        const allData: unknown[] = [];
        let currentPage = 1;
        let hasMore = true;
        let cursor: string | null = null;

        while (hasMore && currentPage <= maxPages) {
          const params: Record<string, unknown> = {
            ...baseParams,
            per_page: perPage,
          };

          if (cursor) {
            params['cursor'] = cursor;
          } else {
            params['page'] = currentPage;
          }

          const response = await client.get<unknown>(url, { params });

          if (isPaginatedResponse<unknown>(response.data)) {
            allData.push(...response.data.data);

            // Detectar cursor o page-based pagination
            const meta = response.data.meta as Record<string, unknown>;
            if ('next_cursor' in meta) {
              cursor = meta['next_cursor'] as string | null;
              hasMore = !!cursor;
            } else if ('last_page' in meta) {
              hasMore = currentPage < (meta['last_page'] as number);
            } else {
              hasMore = !!response.data.links.next;
            }

            currentPage++;
          } else {
            // Respuesta no paginada: retornar directamente
            return { success: true, data: response.data, paginated: false };
          }
        }

        return {
          success: true,
          data: allData,
          total: allData.length,
          pages_fetched: currentPage - 1,
          truncated: currentPage > maxPages && hasMore,
          paginated: true,
        };
      },
    },

    // ─────────────────────────────────────────────
    // scramble_upload_file
    // ─────────────────────────────────────────────
    {
      name: 'scramble_upload_file',
      description: `Sube un archivo a un endpoint multipart/form-data de Laravel.
Detectado automáticamente desde reglas file/image en el OpenAPI.`,
      inputSchema: z.object({
        url: z.string().describe('URL del endpoint de upload'),
        file_base64: z.string().describe('Contenido del archivo en base64'),
        filename: z.string().describe('Nombre del archivo con extensión'),
        field_name: z.string().default('file').optional().describe('Nombre del campo en el form (default: file)'),
        extra_fields: z.record(z.string()).optional().describe('Campos adicionales del formulario'),
      }),
      handler: async (input) => {
        const FormData = (await import('form-data')).default;
        const form = new FormData();

        const buffer = Buffer.from(input['file_base64'] as string, 'base64');
        const fieldName = (input['field_name'] as string) ?? 'file';
        form.append(fieldName, buffer, { filename: input['filename'] as string });

        const extra = (input['extra_fields'] as Record<string, string>) ?? {};
        for (const [key, value] of Object.entries(extra)) {
          form.append(key, value);
        }

        const response = await client.post(input['url'] as string, form, {
          headers: form.getHeaders(),
        });

        return { success: true, data: response.data };
      },
    },
  ];
}
