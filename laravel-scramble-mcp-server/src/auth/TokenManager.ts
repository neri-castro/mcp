import { logger } from '../utils/logger.js';
import { TokenRefreshError } from '../utils/errors.js';
import type { AuthStateDTO } from './dto/AuthDTO.js';

// ──────────────────────────────────────────────────────────────────
// TokenManager: ciclo de vida del token en memoria
// Principio: Single Responsibility — solo gestiona el estado del token
// ──────────────────────────────────────────────────────────────────

export class TokenManager {
  private state: AuthStateDTO | null = null;

  setToken(accessToken: string, refreshToken?: string, expiresAt?: Date): void {
    this.state = {
      accessToken,
      refreshToken,
      expiresAt,
      tokenType: 'Bearer',
    };
    logger.debug({ hasRefresh: !!refreshToken }, 'Token stored');
  }

  getAccessToken(): string | null {
    return this.state?.accessToken ?? null;
  }

  getRefreshToken(): string | null {
    return this.state?.refreshToken ?? null;
  }

  isExpired(): boolean {
    if (!this.state?.expiresAt) return false;
    return new Date() >= this.state.expiresAt;
  }

  hasToken(): boolean {
    return this.state !== null && !!this.state.accessToken;
  }

  clearToken(): void {
    this.state = null;
    logger.debug('Token cleared');
  }

  getAuthHeader(tokenType: string = 'Bearer'): string {
    if (!this.state?.accessToken) {
      throw new TokenRefreshError('No access token available');
    }
    return `${tokenType} ${this.state.accessToken}`;
  }

  getState(): Readonly<AuthStateDTO> | null {
    return this.state;
  }
}
