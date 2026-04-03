import { TokenState } from './dto/AuthDTOs.js';
import { logger } from '../utils/logger.js';

export class TokenManager {
  private state: TokenState | null = null;

  set(state: TokenState): void {
    this.state = state;
    logger.debug({ username: state.username }, 'Token almacenado en memoria');
  }

  getAccessToken(): string {
    if (!this.state) {
      throw new Error('No hay token disponible. Ejecuta taiga_auth_login primero.');
    }
    return this.state.accessToken;
  }

  getRefreshToken(): string {
    if (!this.state) {
      throw new Error('No hay refresh token disponible.');
    }
    return this.state.refreshToken;
  }

  updateAccessToken(newToken: string): void {
    if (!this.state) {
      throw new Error('Estado de token no inicializado.');
    }
    this.state = { ...this.state, accessToken: newToken };
    logger.debug('Access token actualizado por refresh');
  }

  isAuthenticated(): boolean {
    return this.state !== null;
  }

  clear(): void {
    this.state = null;
    logger.debug('Token eliminado de memoria');
  }

  getState(): TokenState | null {
    return this.state;
  }
}

// Singleton
export const tokenManager = new TokenManager();
