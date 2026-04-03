import { z } from 'zod';

export const userstoryToolSchemas = {
  taiga_us_list: {
    description: 'Lista Historias de Usuario de un proyecto. Filtros: sprint, estado, asignado, épica, etiquetas.',
    inputSchema: z.object({
      project_id: z.number(),
      milestone: z.number().optional().describe('ID del sprint para filtrar HU de ese sprint'),
      status: z.number().optional(),
      assigned_to: z.number().optional(),
      epic: z.number().optional().describe('ID de épica para ver sus HU'),
      tags: z.array(z.string()).optional(),
      is_archived: z.boolean().optional(),
    }),
  },

  taiga_us_create: {
    description: `Crea una Historia de Usuario completa y documentada.
La descripción debe incluir en Markdown:
- ## Descripción: contexto y valor de negocio
- ## Criterios de Aceptación: lista - [ ] por cada criterio
- ## Notas Técnicas: detalles de implementación
- ## Definición de Terminado: checklist de completitud`,
    inputSchema: z.object({
      project_id: z.number(),
      subject: z.string().min(1).describe('Título en formato "Como [rol], quiero [objetivo] para [beneficio]"'),
      description: z.string().optional().describe('Descripción Markdown con criterios de aceptación y DoD'),
      status: z.number().optional(),
      milestone: z.number().optional().describe('ID del sprint al que pertenece'),
      points: z.array(z.object({ role: z.number(), points: z.number() })).optional(),
      assigned_to: z.number().optional(),
      assigned_users: z.array(z.number()).optional(),
      tags: z.array(z.string()).optional(),
      watchers: z.array(z.number()).optional(),
      is_blocked: z.boolean().optional(),
      blocked_note: z.string().optional(),
      client_requirement: z.boolean().optional(),
      team_requirement: z.boolean().optional(),
    }),
  },

  taiga_us_get: {
    description: 'Obtiene todos los detalles de una Historia de Usuario: descripción, tareas, estado, épicas, puntos.',
    inputSchema: z.object({
      us_id: z.number(),
    }),
  },

  taiga_us_get_by_ref: {
    description: 'Obtiene una Historia de Usuario por su número de referencia visible en la UI (ej: #15).',
    inputSchema: z.object({
      ref: z.number(),
      project_id: z.number(),
    }),
  },

  taiga_us_edit: {
    description: 'Edita campos de una Historia de Usuario. Requiere version para OCC.',
    inputSchema: z.object({
      us_id: z.number(),
      version: z.number(),
      subject: z.string().optional(),
      description: z.string().optional(),
      status: z.number().optional(),
      milestone: z.number().nullable().optional(),
      assigned_to: z.number().optional(),
      tags: z.array(z.string()).optional(),
      is_blocked: z.boolean().optional(),
      blocked_note: z.string().optional(),
      comment: z.string().optional().describe('Comentario opcional que se registra en el historial'),
    }),
  },

  taiga_us_delete: {
    description: 'Elimina permanentemente una Historia de Usuario y sus tareas asociadas.',
    inputSchema: z.object({
      us_id: z.number(),
    }),
  },

  taiga_us_bulk_create: {
    description: 'Crea múltiples Historias de Usuario en lote a partir de un array de títulos.',
    inputSchema: z.object({
      project_id: z.number(),
      subjects: z.array(z.string()).min(1),
      status_id: z.number().optional(),
    }),
  },

  taiga_us_change_status: {
    description: 'Cambia el estado de una HU. Gestiona automáticamente la versión OCC internamente.',
    inputSchema: z.object({
      us_id: z.number(),
      status_id: z.number(),
    }),
  },

  taiga_us_assign_to_sprint: {
    description: 'Asigna una Historia de Usuario a un sprint (milestone). Usa null para quitarla del sprint.',
    inputSchema: z.object({
      us_id: z.number(),
      milestone_id: z.number().nullable().describe('ID del sprint, o null para desasignar del sprint actual'),
    }),
  },

  taiga_us_move_to_kanban_column: {
    description: 'Mueve una o varias Historias de Usuario a una columna del tablero Kanban.',
    inputSchema: z.object({
      project_id: z.number(),
      us_ids: z.array(z.number()).min(1),
      status_id: z.number().describe('ID del estado/columna destino'),
    }),
  },

  taiga_us_bulk_update_order: {
    description: 'Reordena Historias de Usuario en el backlog, kanban o sprint.',
    inputSchema: z.object({
      project_id: z.number(),
      order_data: z.array(z.object({ us_id: z.number(), order: z.number() })),
      board: z.enum(['backlog', 'kanban', 'sprint']).describe('Tablero donde reordenar'),
      extra_id: z.number().optional().describe('status_id para kanban, milestone_id para sprint'),
    }),
  },

  taiga_us_bulk_assign_sprint: {
    description: 'Asigna múltiples Historias de Usuario a un sprint en una sola operación.',
    inputSchema: z.object({
      project_id: z.number(),
      milestone_id: z.number(),
      us_ids: z.array(z.number()).min(1),
    }),
  },

  taiga_us_add_attachment: {
    description: 'Adjunta un archivo a una Historia de Usuario.',
    inputSchema: z.object({
      us_id: z.number(),
      project_id: z.number(),
      file_path: z.string(),
      description: z.string().optional(),
    }),
  },

  taiga_us_list_attachments: {
    description: 'Lista todos los archivos adjuntos de una Historia de Usuario.',
    inputSchema: z.object({
      us_id: z.number(),
    }),
  },

  taiga_us_watch: {
    description: 'Suscribe al usuario autenticado a notificaciones de cambios en la HU.',
    inputSchema: z.object({
      us_id: z.number(),
    }),
  },

  taiga_us_vote: {
    description: 'Vota por una Historia de Usuario (upvote) para indicar importancia.',
    inputSchema: z.object({
      us_id: z.number(),
    }),
  },
};
