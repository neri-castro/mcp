import { TaigaHttpClient } from '../http/TaigaHttpClient.js';
import { TokenManager } from './TokenManager.js';
import {
  AuthRequestDTO,
  AuthResponseDTO,
  TokenRefreshResponseDTO,
} from './dto/AuthDTOs.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

export class AuthService {
  constructor(
    private readonly client: TaigaHttpClient,
    private readonly tokenManager: TokenManager
  ) {}

  async login(username?: string, password?: string, type?: 'normal' | 'ldap'): Promise<AuthResponseDTO> {
    const dto: AuthRequestDTO = {
      type: type ?? config.authType,
      username: username ?? config.username,
      password: password ?? config.password,
    };

    logger.info({ username: dto.username, type: dto.type }, 'Iniciando autenticación');

    const response = await this.client.post<AuthResponseDTO>('/auth', dto);
    const authData = response.data;

    this.tokenManager.set({
      accessToken: authData.auth_token,
      refreshToken: authData.refresh,
      userId: authData.id,
      username: authData.username,
    });

    logger.info({ username: authData.username, userId: authData.id }, 'Autenticación exitosa');
    return authData;
  }

  async refresh(): Promise<string> {
    const refreshToken = this.tokenManager.getRefreshToken();
    const response = await this.client.post<TokenRefreshResponseDTO>('/auth/refresh', {
      refresh: refreshToken,
    });
    const newToken = response.data.auth_token;
    this.tokenManager.updateAccessToken(newToken);
    logger.info('Token refrescado exitosamente');
    return newToken;
  }

  async me(): Promise<AuthResponseDTO> {
    const response = await this.client.get<AuthResponseDTO>('/users/me');
    return response.data;
  }

  /**
   * Inicializa la autenticación usando las credenciales de configuración.
   * Se llama al arrancar el MCP server.
   */
  async initialize(): Promise<void> {
    try {
      await this.login();
    } catch (error) {
      logger.error({ error }, 'Error al inicializar autenticación con Taiga');
      throw error;
    }
  }
}
