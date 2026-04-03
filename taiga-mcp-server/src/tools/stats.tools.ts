import { z } from 'zod';

export const statsToolSchemas = {
  taiga_timeline_project: {
    description: 'Obtiene el timeline de actividad del proyecto: creaciones, cambios de estado, comentarios, etc.',
    inputSchema: z.object({
      project_id: z.number(),
      page: z.number().optional().default(1).describe('Página de resultados (paginación)'),
    }),
  },

  taiga_timeline_user: {
    description: 'Obtiene el timeline personal de actividad de un usuario en todos sus proyectos.',
    inputSchema: z.object({
      user_id: z.number(),
      page: z.number().optional().default(1),
    }),
  },

  taiga_stats_project: {
    description: 'Obtiene estadísticas generales del proyecto: total HU, tareas, issues, puntos asignados y completados.',
    inputSchema: z.object({
      project_id: z.number(),
    }),
  },

  taiga_stats_issues: {
    description: 'Obtiene estadísticas detalladas de issues del proyecto: por tipo, prioridad, severidad, estado y asignado.',
    inputSchema: z.object({
      project_id: z.number(),
    }),
  },

  taiga_stats_sprint: {
    description: 'Obtiene estadísticas del sprint: burndown chart, puntos completados por día, velocidad del equipo.',
    inputSchema: z.object({
      sprint_id: z.number(),
    }),
  },
};
