import { z } from 'zod';

export const wikiToolSchemas = {
  taiga_wiki_list: {
    description: 'Lista todas las páginas wiki del proyecto.',
    inputSchema: z.object({ project_id: z.number() }),
  },

  taiga_wiki_create: {
    description: 'Crea una nueva página wiki. El contenido soporta Markdown completo.',
    inputSchema: z.object({
      project_id: z.number(),
      slug: z.string().describe('Identificador URL de la página, ej: "guia-autenticacion-ldap"'),
      content: z.string().describe('Contenido de la página en Markdown'),
      watchers: z.array(z.number()).optional(),
    }),
  },

  taiga_wiki_get: {
    description: 'Obtiene el contenido completo de una página wiki por ID.',
    inputSchema: z.object({ wiki_id: z.number() }),
  },

  taiga_wiki_get_by_slug: {
    description: 'Obtiene una página wiki por su slug.',
    inputSchema: z.object({
      slug: z.string(),
      project_id: z.number(),
    }),
  },

  taiga_wiki_edit: {
    description: 'Edita el contenido de una página wiki. Requiere version para OCC.',
    inputSchema: z.object({
      wiki_id: z.number(),
      version: z.number(),
      content: z.string(),
      watchers: z.array(z.number()).optional(),
    }),
  },

  taiga_wiki_delete: {
    description: 'Elimina permanentemente una página wiki.',
    inputSchema: z.object({ wiki_id: z.number() }),
  },

  taiga_wiki_link_create: {
    description: 'Crea un enlace en la barra lateral de la wiki del proyecto.',
    inputSchema: z.object({
      project_id: z.number(),
      title: z.string(),
      href: z.string().describe('URL o slug de la página destino'),
      order: z.number().optional(),
    }),
  },

  taiga_wiki_link_delete: {
    description: 'Elimina un enlace de la barra lateral de la wiki.',
    inputSchema: z.object({ link_id: z.number() }),
  },

  taiga_wiki_watch: {
    description: 'Suscribe al usuario a notificaciones de cambios en la página wiki.',
    inputSchema: z.object({ wiki_id: z.number() }),
  },
};
