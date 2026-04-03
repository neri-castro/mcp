import { z } from 'zod';

export const epicToolSchemas = {
  taiga_epic_list: {
    description: 'Lista todas las épicas de un proyecto. Soporta filtros por estado, asignado, etiquetas.',
    inputSchema: z.object({
      project_id: z.number(),
      status: z.number().optional().describe('ID del estado para filtrar'),
      assigned_to: z.number().optional().describe('ID del usuario asignado'),
      tags: z.array(z.string()).optional(),
    }),
  },

  taiga_epic_create: {
    description: `Crea una épica detallada en Taiga asociada al proyecto.
Úsala para definir grandes áreas de trabajo o iniciativas estratégicas.
La descripción soporta Markdown: ## para secciones, - [ ] para criterios de aceptación, **negrita** para términos clave.`,
    inputSchema: z.object({
      project_id: z.number(),
      subject: z.string().min(1).describe('Título descriptivo de la épica'),
      description: z.string().optional().describe('Descripción en Markdown. Incluir: objetivo, alcance, criterios de éxito'),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().describe('Color hex, ej: "#F2C94C"'),
      status_id: z.number().optional(),
      assigned_to: z.number().optional(),
      tags: z.array(z.string()).optional(),
      watchers: z.array(z.number()).optional(),
      order: z.number().optional(),
    }),
  },

  taiga_epic_get: {
    description: 'Obtiene todos los detalles de una épica por su ID, incluyendo HU relacionadas y estadísticas.',
    inputSchema: z.object({
      epic_id: z.number(),
    }),
  },

  taiga_epic_get_by_ref: {
    description: 'Obtiene una épica por su número de referencia visible en la UI (ej: #5).',
    inputSchema: z.object({
      ref: z.number().describe('Número de referencia de la épica (el #N visible en la UI)'),
      project_id: z.number(),
    }),
  },

  taiga_epic_edit: {
    description: 'Edita los campos de una épica. Requiere el campo version para control de concurrencia (OCC).',
    inputSchema: z.object({
      epic_id: z.number(),
      version: z.number().describe('Versión actual de la épica (obtenida con taiga_epic_get)'),
      subject: z.string().optional(),
      description: z.string().optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      status: z.number().optional(),
      assigned_to: z.number().optional(),
      tags: z.array(z.string()).optional(),
      watchers: z.array(z.number()).optional(),
    }),
  },

  taiga_epic_delete: {
    description: 'Elimina permanentemente una épica. Las HU vinculadas NO se eliminan.',
    inputSchema: z.object({
      epic_id: z.number(),
    }),
  },

  taiga_epic_bulk_create: {
    description: 'Crea múltiples épicas en lote con un array de títulos.',
    inputSchema: z.object({
      project_id: z.number(),
      subjects: z.array(z.string()).min(1).describe('Array de títulos para crear una épica por cada uno'),
      status_id: z.number().optional(),
    }),
  },

  taiga_epic_link_userstory: {
    description: 'Vincula una Historia de Usuario existente a una épica. La HU aparece en "Related User Stories".',
    inputSchema: z.object({
      epic_id: z.number(),
      userstory_id: z.number(),
    }),
  },

  taiga_epic_unlink_userstory: {
    description: 'Desvincula una Historia de Usuario de una épica. La HU NO se elimina.',
    inputSchema: z.object({
      epic_id: z.number(),
      userstory_id: z.number(),
    }),
  },

  taiga_epic_bulk_link_userstories: {
    description: 'Vincula múltiples Historias de Usuario a una épica en una sola operación.',
    inputSchema: z.object({
      epic_id: z.number(),
      userstory_ids: z.array(z.number()).min(1),
    }),
  },

  taiga_epic_list_related_userstories: {
    description: 'Lista todas las Historias de Usuario vinculadas a una épica.',
    inputSchema: z.object({
      epic_id: z.number(),
    }),
  },

  taiga_epic_change_status: {
    description: 'Cambia el estado de una épica. Obtiene automáticamente la versión actual (OCC).',
    inputSchema: z.object({
      epic_id: z.number(),
      status_id: z.number().describe('ID del nuevo estado (obtener con taiga_status_list_epic)'),
    }),
  },

  taiga_epic_add_attachment: {
    description: 'Adjunta un archivo a una épica. El archivo debe existir en el sistema de archivos del servidor MCP.',
    inputSchema: z.object({
      epic_id: z.number(),
      project_id: z.number(),
      file_path: z.string().describe('Ruta absoluta al archivo a adjuntar'),
      description: z.string().optional(),
    }),
  },

  taiga_epic_list_attachments: {
    description: 'Lista todos los archivos adjuntos de una épica.',
    inputSchema: z.object({
      epic_id: z.number(),
    }),
  },

  taiga_epic_watch: {
    description: 'Suscribe al usuario autenticado a las notificaciones de cambios en la épica.',
    inputSchema: z.object({
      epic_id: z.number(),
    }),
  },

  taiga_epic_filters_data: {
    description: 'Obtiene los datos disponibles para construir filtros de épicas (estados, usuarios, etiquetas).',
    inputSchema: z.object({
      project_id: z.number(),
    }),
  },
};
