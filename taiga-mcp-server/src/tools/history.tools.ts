import { z } from 'zod';

const entityTypeSchema = z.enum(['userstory', 'task', 'issue', 'wiki', 'epic'])
  .describe('Tipo de entidad: userstory, task, issue, wiki o epic');

export const historyToolSchemas = {
  taiga_history_get: {
    description: 'Obtiene el historial de cambios y comentarios de una entidad (HU, tarea, issue, wiki, épica).',
    inputSchema: z.object({
      entity_type: entityTypeSchema,
      entity_id: z.number(),
      limit: z.number().int().positive().max(200).optional().default(50)
        .describe('Máximo de entradas a devolver (default 50, máximo 200)'),
    }),
  },

  taiga_comment_add: {
    description: 'Agrega un comentario a una entidad (HU, tarea, issue, wiki o épica). El comentario se registra en el historial.',
    inputSchema: z.object({
      entity_type: entityTypeSchema,
      entity_id: z.number(),
      comment: z.string().min(1).describe('Texto del comentario, soporta Markdown'),
      version: z.number().describe('Versión actual de la entidad (obtenida con el get correspondiente)'),
    }),
  },

  taiga_comment_edit: {
    description: 'Edita un comentario existente en el historial de una entidad.',
    inputSchema: z.object({
      entity_type: entityTypeSchema,
      entity_id: z.number(),
      comment_id: z.string().describe('ID del comentario (obtenido del historial)'),
      comment: z.string().min(1),
    }),
  },

  taiga_comment_delete: {
    description: 'Elimina (oculta) un comentario del historial. Puede restaurarse con taiga_comment_restore.',
    inputSchema: z.object({
      entity_type: entityTypeSchema,
      entity_id: z.number(),
      comment_id: z.string(),
    }),
  },

  taiga_comment_restore: {
    description: 'Restaura un comentario previamente eliminado.',
    inputSchema: z.object({
      entity_type: entityTypeSchema,
      entity_id: z.number(),
      comment_id: z.string(),
    }),
  },

  taiga_comment_versions: {
    description: 'Obtiene el historial de versiones de un comentario editado.',
    inputSchema: z.object({
      entity_type: entityTypeSchema,
      entity_id: z.number(),
      comment_id: z.string(),
    }),
  },
};
