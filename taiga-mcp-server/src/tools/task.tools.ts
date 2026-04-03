import { z } from 'zod';

export const taskToolSchemas = {
  taiga_task_list: {
    description: 'Lista tareas de un proyecto. Filtros: HU padre, sprint, estado, asignado, etiquetas.',
    inputSchema: z.object({
      project_id: z.number(),
      us_id: z.number().optional().describe('ID de la Historia de Usuario padre'),
      milestone: z.number().optional().describe('ID del sprint'),
      status: z.number().optional(),
      assigned_to: z.number().optional(),
      tags: z.array(z.string()).optional(),
    }),
  },

  taiga_task_create: {
    description: `Crea una tarea técnica detallada vinculada a una Historia de Usuario.
La descripción debe incluir en Markdown:
- ## Descripción Técnica: qué implementar y cómo
- ## Pasos de Implementación: lista numerada de pasos
- ## Dependencias: otras tareas o recursos necesarios
- ## Criterios de Aceptación Técnicos: checklist - [ ]`,
    inputSchema: z.object({
      project_id: z.number(),
      subject: z.string().min(1).describe('Título de la tarea, breve y descriptivo'),
      description: z.string().optional().describe('Descripción Markdown con pasos técnicos y criterios'),
      us_id: z.number().optional().describe('ID de la Historia de Usuario padre'),
      milestone: z.number().optional(),
      status: z.number().optional(),
      assigned_to: z.number().optional(),
      tags: z.array(z.string()).optional(),
      watchers: z.array(z.number()).optional(),
      is_iocaine: z.boolean().optional().describe('Marcar como tarea de alta complejidad/riesgo'),
      due_date: z.string().optional().describe('Fecha límite en formato YYYY-MM-DD'),
    }),
  },

  taiga_task_get: {
    description: 'Obtiene todos los detalles de una tarea por su ID.',
    inputSchema: z.object({
      task_id: z.number(),
    }),
  },

  taiga_task_get_by_ref: {
    description: 'Obtiene una tarea por su número de referencia (#N) visible en la UI.',
    inputSchema: z.object({
      ref: z.number(),
      project_id: z.number(),
    }),
  },

  taiga_task_edit: {
    description: 'Edita campos de una tarea. Requiere version para control de concurrencia (OCC).',
    inputSchema: z.object({
      task_id: z.number(),
      version: z.number(),
      subject: z.string().optional(),
      description: z.string().optional(),
      status: z.number().optional(),
      assigned_to: z.number().optional(),
      milestone: z.number().optional(),
      tags: z.array(z.string()).optional(),
      due_date: z.string().optional(),
      comment: z.string().optional(),
    }),
  },

  taiga_task_delete: {
    description: 'Elimina permanentemente una tarea.',
    inputSchema: z.object({
      task_id: z.number(),
    }),
  },

  taiga_task_bulk_create: {
    description: 'Crea múltiples tareas en lote bajo una Historia de Usuario.',
    inputSchema: z.object({
      project_id: z.number(),
      subjects: z.array(z.string()).min(1).describe('Array de títulos de tareas a crear'),
      us_id: z.number().optional().describe('ID de la HU a la que pertenecen'),
      milestone_id: z.number().optional(),
      status_id: z.number().optional(),
    }),
  },

  taiga_task_change_status: {
    description: 'Cambia el estado de una tarea. Gestiona OCC automáticamente.',
    inputSchema: z.object({
      task_id: z.number(),
      status_id: z.number(),
    }),
  },

  taiga_task_assign: {
    description: 'Asigna una tarea a un usuario. Gestiona OCC automáticamente.',
    inputSchema: z.object({
      task_id: z.number(),
      user_id: z.number(),
    }),
  },

  taiga_task_add_attachment: {
    description: 'Adjunta un archivo a una tarea.',
    inputSchema: z.object({
      task_id: z.number(),
      project_id: z.number(),
      file_path: z.string(),
      description: z.string().optional(),
    }),
  },

  taiga_task_watch: {
    description: 'Suscribe al usuario autenticado a notificaciones de la tarea.',
    inputSchema: z.object({
      task_id: z.number(),
    }),
  },

  taiga_task_vote: {
    description: 'Vota por una tarea (upvote).',
    inputSchema: z.object({
      task_id: z.number(),
    }),
  },

  taiga_task_filters_data: {
    description: 'Obtiene datos disponibles para construir filtros de tareas (estados, usuarios, etiquetas).',
    inputSchema: z.object({
      project_id: z.number(),
    }),
  },
};
