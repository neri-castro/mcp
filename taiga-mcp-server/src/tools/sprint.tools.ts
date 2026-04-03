import { z } from 'zod';

export const sprintToolSchemas = {
  taiga_sprint_list: {
    description: 'Lista todos los sprints (milestones) de un proyecto. Filtra por abiertos o cerrados.',
    inputSchema: z.object({
      project_id: z.number(),
      closed: z.boolean().optional().describe('true para ver sprints cerrados, false para activos'),
    }),
  },

  taiga_sprint_create: {
    description: 'Crea un nuevo sprint con fechas de inicio y fin.',
    inputSchema: z.object({
      project_id: z.number(),
      name: z.string().min(1).describe('Nombre del sprint, ej: "Sprint 3 — Autenticación"'),
      estimated_start: z.string().describe('Fecha de inicio YYYY-MM-DD'),
      estimated_finish: z.string().describe('Fecha de fin YYYY-MM-DD'),
      disponibility: z.number().optional().describe('Horas disponibles del equipo'),
      order: z.number().optional(),
    }),
  },

  taiga_sprint_get: {
    description: 'Obtiene todos los detalles de un sprint incluyendo HU asignadas.',
    inputSchema: z.object({
      sprint_id: z.number(),
    }),
  },

  taiga_sprint_edit: {
    description: 'Edita los datos de un sprint (nombre, fechas, disponibilidad).',
    inputSchema: z.object({
      sprint_id: z.number(),
      name: z.string().optional(),
      estimated_start: z.string().optional(),
      estimated_finish: z.string().optional(),
      disponibility: z.number().optional(),
    }),
  },

  taiga_sprint_delete: {
    description: 'Elimina un sprint. Las HU asignadas vuelven al backlog.',
    inputSchema: z.object({
      sprint_id: z.number(),
    }),
  },

  taiga_sprint_stats: {
    description: 'Obtiene estadísticas y datos del burndown chart del sprint.',
    inputSchema: z.object({
      sprint_id: z.number(),
    }),
  },

  taiga_sprint_add_userstory: {
    description: 'Agrega una Historia de Usuario a un sprint.',
    inputSchema: z.object({
      sprint_id: z.number(),
      us_id: z.number(),
    }),
  },

  taiga_sprint_remove_userstory: {
    description: 'Quita una Historia de Usuario del sprint y la devuelve al backlog.',
    inputSchema: z.object({
      us_id: z.number(),
    }),
  },

  taiga_sprint_bulk_add_userstories: {
    description: 'Agrega múltiples Historias de Usuario a un sprint en una sola operación.',
    inputSchema: z.object({
      sprint_id: z.number(),
      us_ids: z.array(z.number()).min(1),
    }),
  },

  taiga_sprint_watch: {
    description: 'Suscribe al usuario autenticado a notificaciones del sprint.',
    inputSchema: z.object({
      sprint_id: z.number(),
    }),
  },
};
