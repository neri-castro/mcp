import { z } from 'zod';

export const issueToolSchemas = {
  taiga_issue_list: {
    description: 'Lista issues de un proyecto. Filtros: estado, tipo (Bug/Question/Enhancement), prioridad, severidad, asignado, sprint.',
    inputSchema: z.object({
      project_id: z.number(),
      status: z.number().optional(),
      type: z.number().optional().describe('ID del tipo: Bug, Question, Enhancement'),
      priority: z.number().optional(),
      severity: z.number().optional(),
      assigned_to: z.number().optional(),
      tags: z.array(z.string()).optional(),
      milestone: z.number().optional(),
    }),
  },

  taiga_issue_create: {
    description: `Crea un issue detallado (Bug, Question o Enhancement).
Para bugs incluir en la descripción:
- ## Descripción del Bug
- ## Pasos para Reproducir: lista numerada
- ## Comportamiento Esperado vs Actual
- ## Entorno: versiones y configuración
- ## Logs Relevantes
- ## Solución Sugerida`,
    inputSchema: z.object({
      project_id: z.number(),
      subject: z.string().min(1),
      description: z.string().optional().describe('Descripción Markdown detallada del issue'),
      type: z.number().describe('ID del tipo de issue (obtener con taiga_issue_list_types)'),
      status: z.number().optional(),
      priority: z.number().describe('ID de prioridad (obtener con taiga_issue_list_priorities)'),
      severity: z.number().describe('ID de severidad (obtener con taiga_issue_list_severities)'),
      milestone: z.number().optional(),
      assigned_to: z.number().optional(),
      tags: z.array(z.string()).optional(),
      watchers: z.array(z.number()).optional(),
      due_date: z.string().optional().describe('Fecha límite YYYY-MM-DD'),
    }),
  },

  taiga_issue_get: {
    description: 'Obtiene todos los detalles de un issue por su ID.',
    inputSchema: z.object({
      issue_id: z.number(),
    }),
  },

  taiga_issue_edit: {
    description: 'Edita campos de un issue. Requiere version para OCC.',
    inputSchema: z.object({
      issue_id: z.number(),
      version: z.number(),
      subject: z.string().optional(),
      description: z.string().optional(),
      status: z.number().optional(),
      type: z.number().optional(),
      priority: z.number().optional(),
      severity: z.number().optional(),
      assigned_to: z.number().optional(),
      tags: z.array(z.string()).optional(),
      comment: z.string().optional(),
    }),
  },

  taiga_issue_delete: {
    description: 'Elimina permanentemente un issue.',
    inputSchema: z.object({
      issue_id: z.number(),
    }),
  },

  taiga_issue_change_status: {
    description: 'Cambia el estado de un issue. Gestiona OCC automáticamente.',
    inputSchema: z.object({
      issue_id: z.number(),
      status_id: z.number(),
    }),
  },

  taiga_issue_change_priority: {
    description: 'Cambia la prioridad de un issue (Low=1, Normal=2, High=3, Critical=4).',
    inputSchema: z.object({
      issue_id: z.number(),
      priority_id: z.number(),
    }),
  },

  taiga_issue_change_severity: {
    description: 'Cambia la severidad de un issue (Wishlist=1, Minor=2, Normal=3, Important=4, Critical=5).',
    inputSchema: z.object({
      issue_id: z.number(),
      severity_id: z.number(),
    }),
  },

  taiga_issue_assign: {
    description: 'Asigna un issue a un usuario. Gestiona OCC automáticamente.',
    inputSchema: z.object({
      issue_id: z.number(),
      user_id: z.number(),
    }),
  },

  taiga_issue_promote_to_us: {
    description: 'Promueve un issue a Historia de Usuario. El issue original permanece.',
    inputSchema: z.object({
      issue_id: z.number(),
      project_id: z.number(),
    }),
  },

  taiga_issue_add_attachment: {
    description: 'Adjunta un archivo a un issue.',
    inputSchema: z.object({
      issue_id: z.number(),
      project_id: z.number(),
      file_path: z.string(),
      description: z.string().optional(),
    }),
  },

  taiga_issue_watch: {
    description: 'Suscribe al usuario autenticado a notificaciones del issue.',
    inputSchema: z.object({
      issue_id: z.number(),
    }),
  },

  taiga_issue_vote: {
    description: 'Vota por un issue (upvote) para indicar relevancia.',
    inputSchema: z.object({
      issue_id: z.number(),
    }),
  },

  taiga_issue_list_types: {
    description: 'Lista los tipos de issue disponibles en el proyecto (Bug, Question, Enhancement, etc.).',
    inputSchema: z.object({
      project_id: z.number(),
    }),
  },

  taiga_issue_list_priorities: {
    description: 'Lista las prioridades disponibles en el proyecto con sus IDs.',
    inputSchema: z.object({
      project_id: z.number(),
    }),
  },

  taiga_issue_list_severities: {
    description: 'Lista las severidades disponibles en el proyecto con sus IDs.',
    inputSchema: z.object({
      project_id: z.number(),
    }),
  },

  taiga_issue_filters_data: {
    description: 'Obtiene datos para filtros de issues: tipos, prioridades, severidades, estados, usuarios.',
    inputSchema: z.object({
      project_id: z.number(),
    }),
  },
};
