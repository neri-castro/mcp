import { z } from 'zod';

const entityTypeSchema = z.enum(['epic', 'userstory', 'task', 'issue'])
  .describe('Tipo de entidad: epic, userstory, task o issue');

const attrTypeSchema = z.enum([
  'text', 'multiline', 'richtext', 'date', 'url',
  'email', 'number', 'checkbox', 'list', 'multiselect',
]).describe('Tipo del atributo personalizado');

export const customAttrToolSchemas = {
  taiga_custom_attr_list: {
    description: 'Lista los atributos personalizados definidos para un tipo de entidad en el proyecto.',
    inputSchema: z.object({
      project_id: z.number(),
      entity_type: entityTypeSchema,
    }),
  },

  taiga_custom_attr_create: {
    description: 'Crea un nuevo atributo personalizado para épicas, HU, tareas o issues.',
    inputSchema: z.object({
      project_id: z.number(),
      entity_type: entityTypeSchema,
      name: z.string().min(1).describe('Nombre del atributo, ej: "Business Value"'),
      description: z.string().optional(),
      type: attrTypeSchema.optional().default('text'),
      order: z.number().optional(),
    }),
  },

  taiga_custom_attr_edit: {
    description: 'Edita un atributo personalizado existente.',
    inputSchema: z.object({
      attr_id: z.number(),
      entity_type: entityTypeSchema,
      name: z.string().optional(),
      description: z.string().optional(),
      type: attrTypeSchema.optional(),
      order: z.number().optional(),
    }),
  },

  taiga_custom_attr_delete: {
    description: 'Elimina un atributo personalizado. Los valores existentes se pierden.',
    inputSchema: z.object({
      attr_id: z.number(),
      entity_type: entityTypeSchema,
    }),
  },

  taiga_custom_attr_get_values: {
    description: 'Obtiene los valores de atributos personalizados de una entidad específica.',
    inputSchema: z.object({
      entity_id: z.number().describe('ID de la épica, HU, tarea o issue'),
      entity_type: entityTypeSchema,
    }),
  },

  taiga_custom_attr_set_values: {
    description: 'Establece los valores de atributos personalizados en una entidad. Requiere version para OCC.',
    inputSchema: z.object({
      entity_id: z.number(),
      entity_type: entityTypeSchema,
      attributes_values: z.record(z.string(), z.unknown()).describe(
        'Objeto con atributo_id como clave y el valor como valor, ej: {"1": "alta", "2": 5000}'
      ),
      version: z.number().describe('Versión actual de la entidad'),
    }),
  },
};
