import axios from 'axios';
import { config } from '../config/config.js';
import { TokenResponseDTO } from './dto/index.js';
import { TokenRefreshError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

interface StoredToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  refreshExpiresAt: number;
}

export class TokenManager {
  private tokens: Map<string, StoredToken> = new Map();

  private tokenKey(realm: string): string {
    return realm;
  }

  async getValidToken(realm: string = config.kcAuthRealm): Promise<string> {
    const stored = this.tokens.get(this.tokenKey(realm));
    const now = Date.now();

    if (stored && stored.expiresAt > now + 10_000) {
      return stored.accessToken;
    }

    if (stored && stored.refreshExpiresAt > now + 10_000) {
      return this.refresh(realm, stored.refreshToken);
    }

    return this.obtain(realm);
  }

  async obtain(realm: string = config.kcAuthRealm): Promise<string> {
    logger.debug({ realm }, 'Obtaining new token');

    const params = new URLSearchParams();
    params.set('client_id', config.kcClientId);

    if (config.kcGrantType === 'client_credentials') {
      params.set('grant_type', 'client_credentials');
      params.set('client_secret', config.kcClientSecret ?? '');
    } else {
      params.set('grant_type', 'password');
      params.set('username', config.kcAdminUsername ?? '');
      params.set('password', config.kcAdminPassword ?? '');
    }

    const url = `${config.kcHost}/realms/${realm}/protocol/openid-connect/token`;
    const response = await axios.post<TokenResponseDTO>(url, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: config.kcRequestTimeoutMs,
    });

    this.storeToken(realm, response.data);
    return response.data.access_token;
  }

  async refresh(realm: string, refreshToken: string): Promise<string> {
    logger.debug({ realm }, 'Refreshing token');

    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: config.kcClientId,
        refresh_token: refreshToken,
        ...(config.kcClientSecret ? { client_secret: config.kcClientSecret } : {}),
      });

      const url = `${config.kcHost}/realms/${realm}/protocol/openid-connect/token`;
      const response = await axios.post<TokenResponseDTO>(url, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: config.kcRequestTimeoutMs,
      });

      this.storeToken(realm, response.data);
      return response.data.access_token;
    } catch {
      logger.warn({ realm }, 'Token refresh failed, re-obtaining');
      this.tokens.delete(realm);
      return this.obtain(realm);
    }
  }

  private storeToken(realm: string, tokenData: TokenResponseDTO): void {
    const now = Date.now();
    this.tokens.set(realm, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: now + tokenData.expires_in * 1000,
      refreshExpiresAt: now + tokenData.refresh_expires_in * 1000,
    });
  }

  invalidate(realm: string): void {
    this.tokens.delete(realm);
  }
}

export const tokenManager = new TokenManager();
