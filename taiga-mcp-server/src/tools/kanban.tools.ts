import { z } from 'zod';

export const kanbanToolSchemas = {
  taiga_status_list_epic: {
    description: 'Lista los estados disponibles para épicas en el proyecto.',
    inputSchema: z.object({ project_id: z.number() }),
  },

  taiga_status_list_us: {
    description: 'Lista los estados disponibles para Historias de Usuario (columnas del Kanban/Backlog).',
    inputSchema: z.object({ project_id: z.number() }),
  },

  taiga_status_list_task: {
    description: 'Lista los estados disponibles para tareas.',
    inputSchema: z.object({ project_id: z.number() }),
  },

  taiga_status_list_issue: {
    description: 'Lista los estados disponibles para issues.',
    inputSchema: z.object({ project_id: z.number() }),
  },

  taiga_status_create: {
    description: 'Crea un nuevo estado personalizado para épicas, HU, tareas o issues.',
    inputSchema: z.object({
      project_id: z.number(),
      entity_type: z.enum(['epic', 'userstory', 'task', 'issue']),
      name: z.string().min(1).describe('Nombre del estado, ej: "In Review"'),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().describe('Color hex'),
      order: z.number().optional(),
      is_closed: z.boolean().optional().default(false),
      wip_limit: z.number().nullable().optional().describe('Límite WIP para Kanban'),
    }),
  },

  taiga_status_edit: {
    description: 'Edita un estado existente (nombre, color, orden, WIP limit).',
    inputSchema: z.object({
      status_id: z.number(),
      entity_type: z.enum(['epic', 'userstory', 'task', 'issue']),
      name: z.string().optional(),
      color: z.string().optional(),
      order: z.number().optional(),
      is_closed: z.boolean().optional(),
      wip_limit: z.number().nullable().optional(),
    }),
  },

  taiga_status_delete: {
    description: 'Elimina un estado. Los ítems con ese estado quedarán sin estado.',
    inputSchema: z.object({
      status_id: z.number(),
      entity_type: z.enum(['epic', 'userstory', 'task', 'issue']),
    }),
  },

  taiga_status_reorder: {
    description: 'Reordena las columnas del tablero Kanban para un tipo de entidad.',
    inputSchema: z.object({
      project_id: z.number(),
      entity_type: z.enum(['epic', 'userstory', 'task', 'issue']),
      statuses_order: z.array(z.object({
        status_id: z.number(),
        order: z.number(),
      })).min(1),
    }),
  },

  taiga_kanban_move_card: {
    description: 'Mueve una tarjeta (HU) a una columna diferente del tablero Kanban.',
    inputSchema: z.object({
      project_id: z.number(),
      us_id: z.number(),
      new_status_id: z.number().describe('ID del estado destino (columna)'),
      order: z.number().optional().describe('Posición dentro de la columna'),
    }),
  },

  taiga_kanban_bulk_move: {
    description: 'Mueve múltiples tarjetas a una columna del Kanban y define su orden.',
    inputSchema: z.object({
      project_id: z.number(),
      status_id: z.number().describe('ID del estado destino'),
      cards: z.array(z.object({
        us_id: z.number(),
        order: z.number(),
      })).min(1),
    }),
  },
};
