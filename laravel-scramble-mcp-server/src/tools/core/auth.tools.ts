import { z } from 'zod';
import type { AuthService } from '../../auth/AuthService.js';
import type { TokenManager } from '../../auth/TokenManager.js';
import type { LaravelHttpClient } from '../../http/LaravelHttpClient.js';
import type { CoreTool } from './discovery.tools.js';

// ──────────────────────────────────────────────────────────────────
// Auth Tools: tools de autenticación siempre disponibles
// Tell Don't Ask: los tools delegan completamente al AuthService
// ──────────────────────────────────────────────────────────────────

export function buildAuthTools(
  authService: AuthService,
  tokenManager: TokenManager,
  client: LaravelHttpClient,
): CoreTool[] {
  return [
    // ─────────────────────────────────────────────
    // scramble_auth_set_token
    // ─────────────────────────────────────────────
    {
      name: 'scramble_auth_set_token',
      description: `Establece manualmente el token de acceso para las siguientes requests.
Útil cuando ya tienes un token válido y no necesitas hacer login.
Tipo soportados: Bearer (JWT), API Key`,
      inputSchema: z.object({
        token: z.string().describe('Token de acceso a establecer'),
        type: z.enum(['Bearer', 'Basic', 'ApiKey']).optional().describe('Tipo de token (default: Bearer)'),
      }),
      handler: async (input) => {
        authService.setManualToken(input['token'] as string, (input['type'] as string) ?? 'Bearer');
        return { success: true, message: 'Token establecido correctamente' };
      },
    },

    // ─────────────────────────────────────────────
    // scramble_auth_login
    // ─────────────────────────────────────────────
    {
      name: 'scramble_auth_login',
      description: `Login via endpoint de autenticación Laravel (Sanctum, Passport, JWT Auth).
Almacena el token automáticamente para todas las siguientes requests.
Retorna el token obtenido.`,
      inputSchema: z.object({
        username: z.string().describe('Email o username del usuario'),
        password: z.string().describe('Contraseña del usuario'),
        endpoint: z.string().optional().describe('Endpoint de login (default: /api/login)'),
      }),
      handler: async (input) => {
        try {
          const token = await authService.loginWithCredentials({
            username: input['username'] as string,
            password: input['password'] as string,
          });
          return {
            success: true,
            message: 'Login exitoso. Token almacenado para futuras requests.',
            token_preview: `${token.substring(0, 20)}...`,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Login failed',
          };
        }
      },
    },

    // ─────────────────────────────────────────────
    // scramble_auth_refresh
    // ─────────────────────────────────────────────
    {
      name: 'scramble_auth_refresh',
      description: `Renueva el access token usando el refresh token almacenado.
Se ejecuta automáticamente en respuestas 401, pero puede invocarse manualmente.`,
      inputSchema: z.object({
        refresh_token: z.string().optional().describe('Refresh token (usa el almacenado si no se provee)'),
      }),
      handler: async () => {
        try {
          const token = await authService.refreshToken();
          return {
            success: true,
            message: 'Token renovado correctamente',
            token_preview: `${token.substring(0, 20)}...`,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Refresh failed',
            hint: 'Usa scramble_auth_login para obtener un nuevo token desde cero',
          };
        }
      },
    },

    // ─────────────────────────────────────────────
    // scramble_auth_me
    // ─────────────────────────────────────────────
    {
      name: 'scramble_auth_me',
      description: `Obtiene los datos del usuario autenticado actual.
Requiere que exista un token válido (usa scramble_auth_login si no tienes uno).
Busca el endpoint /api/user o /api/me automáticamente.`,
      inputSchema: z.object({
        endpoint: z.string().optional().describe('Endpoint del perfil (default: /api/user)'),
      }),
      handler: async (input) => {
        const endpoint = (input['endpoint'] as string) ?? '/api/user';
        try {
          const response = await client.get(endpoint);
          return { success: true, user: response.data };
        } catch {
          // Intentar /api/me como fallback
          try {
            const response = await client.get('/api/me');
            return { success: true, user: response.data };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Failed to get user',
              hint: 'Verifica que estás autenticado con scramble_auth_login',
            };
          }
        }
      },
    },

    // ─────────────────────────────────────────────
    // scramble_auth_oauth_token
    // ─────────────────────────────────────────────
    {
      name: 'scramble_auth_oauth_token',
      description: `Obtiene un token OAuth2 usando el flujo Client Credentials.
Ideal para integraciones machine-to-machine con Laravel Passport.`,
      inputSchema: z.object({
        client_id: z.string().describe('OAuth2 Client ID'),
        client_secret: z.string().describe('OAuth2 Client Secret'),
        grant_type: z.enum(['client_credentials']).describe('Tipo de grant OAuth2'),
        scopes: z.string().optional().describe('Scopes separados por espacio'),
      }),
      handler: async (input) => {
        try {
          const token = await authService.loginWithOAuth2ClientCredentials({
            clientId: input['client_id'] as string,
            clientSecret: input['client_secret'] as string,
          });
          return {
            success: true,
            message: 'Token OAuth2 obtenido y almacenado',
            token_preview: `${token.substring(0, 20)}...`,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'OAuth2 failed',
          };
        }
      },
    },
  ];
}
