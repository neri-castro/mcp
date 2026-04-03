import { z } from 'zod';

export const searchToolSchemas = {
  taiga_search: {
    description: 'Búsqueda global en un proyecto. Busca simultáneamente en HU, tareas, issues y páginas wiki.',
    inputSchema: z.object({
      project_id: z.number(),
      query: z.string().min(1).describe('Texto a buscar'),
    }),
  },
};
