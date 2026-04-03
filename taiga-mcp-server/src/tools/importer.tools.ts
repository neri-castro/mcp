import { z } from 'zod';

export const importerToolSchemas = {
  taiga_export_project: {
    description: 'Exporta un proyecto completo como un dump JSON (HU, tareas, issues, wiki, sprints, etc.).',
    inputSchema: z.object({
      project_id: z.number(),
    }),
  },

  taiga_import_project: {
    description: 'Importa un proyecto desde un dump JSON previamente exportado con taiga_export_project.',
    inputSchema: z.object({
      dump: z.record(z.string(), z.unknown()).describe('Objeto JSON del dump del proyecto'),
    }),
  },

  taiga_import_from_trello: {
    description: 'Importa un board de Trello a Taiga. Requiere autorización previa con Trello OAuth.',
    inputSchema: z.object({
      token: z.string().describe('Token OAuth de Trello'),
      board_id: z.string().describe('ID del board de Trello a importar'),
      project_name: z.string().optional(),
      users_bindings: z.record(z.string(), z.number()).optional().describe(
        'Mapa de usuario Trello ID → Taiga user ID'
      ),
    }),
  },

  taiga_import_from_github: {
    description: 'Importa issues y milestones de un repositorio de GitHub a Taiga.',
    inputSchema: z.object({
      token: z.string().describe('Personal Access Token de GitHub'),
      repo: z.string().describe('Repositorio en formato "owner/repo"'),
      project_name: z.string().optional(),
      users_bindings: z.record(z.string(), z.number()).optional().describe(
        'Mapa de username GitHub → Taiga user ID'
      ),
    }),
  },

  taiga_import_from_jira: {
    description: 'Importa proyectos, épicas, historias y tareas desde Jira a Taiga.',
    inputSchema: z.object({
      token: z.string().describe('Token de autenticación de Jira'),
      url: z.string().url().describe('URL base del servidor Jira'),
      project_id: z.string().describe('ID o clave del proyecto en Jira'),
      project_name: z.string().optional(),
      users_bindings: z.record(z.string(), z.number()).optional().describe(
        'Mapa de username Jira → Taiga user ID'
      ),
    }),
  },
};
