import { z } from 'zod';

export const projectToolSchemas = {
  taiga_project_list: {
    description: 'Lista todos los proyectos del usuario autenticado. Soporta filtros por módulos activos.',
    inputSchema: z.object({
      member: z.number().optional().describe('Filtrar por ID de miembro'),
      is_backlog_activated: z.boolean().optional().describe('Solo proyectos con backlog activo'),
      is_kanban_activated: z.boolean().optional().describe('Solo proyectos con kanban activo'),
      is_wiki_activated: z.boolean().optional(),
      is_issues_activated: z.boolean().optional(),
    }),
  },

  taiga_project_create: {
    description: 'Crea un nuevo proyecto en Taiga con los módulos deseados (backlog, kanban, wiki, issues).',
    inputSchema: z.object({
      name: z.string().min(1).describe('Nombre del proyecto'),
      description: z.string().optional().describe('Descripción del proyecto'),
      is_private: z.boolean().optional().default(false),
      is_backlog_activated: z.boolean().optional().default(true),
      is_kanban_activated: z.boolean().optional().default(false),
      is_wiki_activated: z.boolean().optional().default(true),
      is_issues_activated: z.boolean().optional().default(true),
      tags: z.array(z.string()).optional(),
      total_milestones: z.number().optional().describe('Número de sprints planeados'),
      total_story_points: z.number().optional(),
    }),
  },

  taiga_project_get: {
    description: 'Obtiene todos los detalles de un proyecto por su ID numérico.',
    inputSchema: z.object({
      project_id: z.number().describe('ID numérico del proyecto'),
    }),
  },

  taiga_project_get_by_slug: {
    description: 'Obtiene un proyecto por su slug (ej: "mi-proyecto-agil"). Útil cuando no se conoce el ID.',
    inputSchema: z.object({
      slug: z.string().describe('Slug del proyecto, ej: "mi-proyecto-agil"'),
    }),
  },

  taiga_project_edit: {
    description: 'Edita los campos de un proyecto existente (nombre, descripción, módulos habilitados, etc.).',
    inputSchema: z.object({
      project_id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      is_private: z.boolean().optional(),
      is_backlog_activated: z.boolean().optional(),
      is_kanban_activated: z.boolean().optional(),
      is_wiki_activated: z.boolean().optional(),
      is_issues_activated: z.boolean().optional(),
    }),
  },

  taiga_project_delete: {
    description: 'Elimina permanentemente un proyecto y todos sus contenidos. Acción irreversible.',
    inputSchema: z.object({
      project_id: z.number(),
    }),
  },

  taiga_project_stats: {
    description: 'Obtiene estadísticas del proyecto: total HU, tareas, issues, puntos asignados vs completados.',
    inputSchema: z.object({
      project_id: z.number(),
    }),
  },

  taiga_project_modules: {
    description: 'Obtiene la configuración de módulos habilitados (backlog, kanban, wiki, issues, epics).',
    inputSchema: z.object({
      project_id: z.number(),
    }),
  },

  taiga_project_create_tag: {
    description: 'Crea una nueva etiqueta con color en el proyecto para categorizar épicas, HU, tareas e issues.',
    inputSchema: z.object({
      project_id: z.number(),
      tag: z.string().describe('Nombre de la etiqueta, ej: "backend"'),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).describe('Color hex, ej: "#FF5733"'),
    }),
  },

  taiga_project_duplicate: {
    description: 'Duplica un proyecto existente con un nuevo nombre. Opcionalmente incluye usuarios.',
    inputSchema: z.object({
      project_id: z.number(),
      name: z.string().describe('Nombre para el proyecto duplicado'),
      users: z.array(z.number()).optional().describe('IDs de usuarios a incluir en el nuevo proyecto'),
    }),
  },
};
