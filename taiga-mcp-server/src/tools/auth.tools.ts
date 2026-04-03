import { z } from 'zod';

export const authToolSchemas = {
  taiga_auth_login: {
    description: `Autentica en Taiga con usuario y contraseña (modo normal o LDAP corporativo).
Guarda el token JWT en memoria para las siguientes operaciones.
Usa type="ldap" si el servidor Taiga tiene el plugin LDAP configurado.`,
    inputSchema: z.object({
      username: z.string().optional().describe('Usuario (por defecto usa TAIGA_USERNAME del entorno)'),
      password: z.string().optional().describe('Contraseña (por defecto usa TAIGA_PASSWORD del entorno)'),
      type: z.enum(['normal', 'ldap']).optional().describe('Tipo de autenticación: "normal" o "ldap". Por defecto usa TAIGA_AUTH_TYPE del entorno'),
    }),
  },

  taiga_auth_refresh: {
    description: 'Renueva el access token usando el refresh token almacenado. Se ejecuta automáticamente en los interceptors, pero puede llamarse manualmente.',
    inputSchema: z.object({}),
  },

  taiga_auth_me: {
    description: 'Obtiene el perfil completo del usuario actualmente autenticado (id, username, email, foto, bio).',
    inputSchema: z.object({}),
  },
};
