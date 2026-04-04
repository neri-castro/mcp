import axios from 'axios';
import { logger } from '../utils/logger.js';
import { AuthenticationError, TokenRefreshError } from '../utils/errors.js';
import { TokenManager } from './TokenManager.js';
import type { AuthConfigDTO, CredentialsDTO } from './dto/AuthDTO.js';
import type { AppConfig } from '../config/config.js';

// ──────────────────────────────────────────────────────────────────
// AuthService: orquesta autenticación multi-esquema
// Principio: Service Layer — lógica de auth nunca en los tool handlers
// ──────────────────────────────────────────────────────────────────

export class AuthService {
  constructor(
    private readonly tokenManager: TokenManager,
    private readonly config: AppConfig,
  ) {}

  /**
   * Inicializa la autenticación según el authType configurado.
   * Tell Don't Ask: el servicio decide cómo autenticar según el config.
   */
  async initialize(authConfig?: AuthConfigDTO): Promise<void> {
    const type = authConfig?.type ?? this.config.authType;

    logger.info({ authType: type }, 'Initializing authentication');

    switch (type) {
      case 'bearer':
        await this.loginWithCredentials();
        break;
      case 'apiKey':
        this.setApiKey();
        break;
      case 'basic':
        this.setBasicAuth();
        break;
      case 'oauth2':
        await this.loginWithOAuth2ClientCredentials();
        break;
    }
  }

  /**
   * Login via endpoint Laravel (Sanctum, Passport, JWT, etc.)
   */
  async loginWithCredentials(credentials?: CredentialsDTO): Promise<string> {
    const username = credentials?.username ?? this.config.authUsername;
    const password = credentials?.password ?? this.config.authPassword;

    if (!username || !password) {
      throw new AuthenticationError({ message: 'Credentials not configured' });
    }

    try {
      const endpoint = `${this.config.laravelApiBaseUrl}${this.config.authLoginEndpoint}`;
      const body = {
        [this.config.authLoginUsernameField]: username,
        [this.config.authLoginPasswordField]: password,
      };

      const response = await axios.post<Record<string, unknown>>(endpoint, body, {
        timeout: this.config.httpTimeoutMs,
      });

      const data = response.data;
      const token = data[this.config.authTokenField] as string | undefined;
      const refreshToken = data[this.config.authRefreshTokenField] as string | undefined;

      if (!token) {
        throw new AuthenticationError({
          message: `Token field "${this.config.authTokenField}" not found in login response`,
        });
      }

      this.tokenManager.setToken(token, refreshToken);
      logger.info('Login successful');
      return token;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new AuthenticationError(error.response?.data);
      }
      throw error;
    }
  }

  /**
   * Refresca el access token usando el refresh token almacenado
   */
  async refreshToken(): Promise<string> {
    const refreshToken = this.tokenManager.getRefreshToken();

    if (!refreshToken) {
      throw new TokenRefreshError('No refresh token available');
    }

    try {
      const endpoint = `${this.config.laravelApiBaseUrl}/api/auth/refresh`;
      const response = await axios.post<Record<string, unknown>>(endpoint, {
        [this.config.authRefreshTokenField]: refreshToken,
      });

      const data = response.data;
      const newToken = data[this.config.authTokenField] as string | undefined;
      const newRefreshToken = data[this.config.authRefreshTokenField] as string | undefined;

      if (!newToken) {
        throw new TokenRefreshError('Token not found in refresh response');
      }

      this.tokenManager.setToken(newToken, newRefreshToken ?? refreshToken);
      logger.info('Token refreshed successfully');
      return newToken;
    } catch (error) {
      logger.warn('Token refresh failed, re-authenticating...');
      this.tokenManager.clearToken();
      // Fallback: re-autenticar desde cero
      return this.loginWithCredentials();
    }
  }

  /**
   * OAuth2 Client Credentials Flow
   */
  async loginWithOAuth2ClientCredentials(credentials?: CredentialsDTO): Promise<string> {
    const clientId = credentials?.clientId ?? this.config.oauthClientId;
    const clientSecret = credentials?.clientSecret ?? this.config.oauthClientSecret;
    const tokenUrl = this.config.oauthTokenUrl;

    if (!clientId || !clientSecret || !tokenUrl) {
      throw new AuthenticationError({ message: 'OAuth2 credentials not configured' });
    }

    try {
      const response = await axios.post<{ access_token: string; expires_in?: number }>(
        tokenUrl,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          scope: this.config.oauthScopes ?? '',
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      const { access_token, expires_in } = response.data;
      const expiresAt = expires_in
        ? new Date(Date.now() + expires_in * 1000 - 60000) // -1 min de margen
        : undefined;

      this.tokenManager.setToken(access_token, undefined, expiresAt);
      logger.info('OAuth2 token obtained successfully');
      return access_token;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new AuthenticationError(error.response?.data);
      }
      throw error;
    }
  }

  setManualToken(token: string, type = 'Bearer'): void {
    this.tokenManager.setToken(token);
    logger.info({ type }, 'Manual token set');
  }

  private setApiKey(): void {
    if (!this.config.authApiKey) {
      logger.warn('AUTH_API_KEY not configured');
      return;
    }
    // El ApiKey se almacena como accessToken para que el interceptor lo adjunte
    this.tokenManager.setToken(this.config.authApiKey);
  }

  private setBasicAuth(): void {
    const username = this.config.authUsername;
    const password = this.config.authPassword;

    if (!username || !password) {
      logger.warn('Basic auth credentials not configured');
      return;
    }

    const b64 = Buffer.from(`${username}:${password}`).toString('base64');
    this.tokenManager.setToken(b64);
  }
}
