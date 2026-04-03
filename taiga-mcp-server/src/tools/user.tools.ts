import { z } from 'zod';

export const userToolSchemas = {
  taiga_user_me: {
    description: 'Obtiene el perfil completo del usuario autenticado actualmente.',
    inputSchema: z.object({}),
  },

  taiga_user_get: {
    description: 'Obtiene el perfil público de un usuario por su ID.',
    inputSchema: z.object({
      user_id: z.number(),
    }),
  },

  taiga_user_list: {
    description: 'Lista todos los usuarios de un proyecto.',
    inputSchema: z.object({
      project_id: z.number().optional().describe('ID del proyecto para filtrar usuarios miembros'),
    }),
  },

  taiga_membership_list: {
    description: 'Lista todas las membresías de un proyecto (usuarios, roles, fecha de unión).',
    inputSchema: z.object({
      project_id: z.number(),
    }),
  },

  taiga_membership_invite: {
    description: 'Invita a un usuario al proyecto asignándole un rol.',
    inputSchema: z.object({
      project_id: z.number(),
      role_id: z.number().describe('ID del rol a asignar (obtener con taiga_role_list)'),
      username: z.string().optional().describe('Username de Taiga del usuario a invitar'),
      email: z.string().email().optional().describe('Email del usuario (si aún no tiene cuenta)'),
    }),
  },

  taiga_membership_bulk_invite: {
    description: 'Invita múltiples usuarios al proyecto en una sola operación.',
    inputSchema: z.object({
      project_id: z.number(),
      invitations: z.array(z.object({
        role_id: z.number(),
        username: z.string().optional(),
        email: z.string().email().optional(),
      })).min(1),
      invitation_extra_text: z.string().optional().describe('Texto personalizado del email de invitación'),
    }),
  },

  taiga_membership_change_role: {
    description: 'Cambia el rol de un miembro en el proyecto.',
    inputSchema: z.object({
      membership_id: z.number(),
      role_id: z.number(),
    }),
  },

  taiga_membership_remove: {
    description: 'Elimina a un usuario del proyecto revocando su membresía.',
    inputSchema: z.object({
      membership_id: z.number(),
    }),
  },

  taiga_role_list: {
    description: 'Lista todos los roles definidos en el proyecto con sus permisos.',
    inputSchema: z.object({
      project_id: z.number(),
    }),
  },

  taiga_role_create: {
    description: 'Crea un nuevo rol personalizado en el proyecto con permisos específicos.',
    inputSchema: z.object({
      project_id: z.number(),
      name: z.string().min(1).describe('Nombre del rol, ej: "Tech Lead"'),
      permissions: z.array(z.string()).optional().describe(
        'Permisos del rol, ej: ["view_project","add_userstory","modify_userstory"]'
      ),
      order: z.number().optional(),
      computable: z.boolean().optional().describe('Si el rol se cuenta en la estimación de puntos'),
    }),
  },

  taiga_role_edit: {
    description: 'Edita el nombre o los permisos de un rol existente.',
    inputSchema: z.object({
      role_id: z.number(),
      name: z.string().optional(),
      permissions: z.array(z.string()).optional(),
      order: z.number().optional(),
      computable: z.boolean().optional(),
    }),
  },
};
