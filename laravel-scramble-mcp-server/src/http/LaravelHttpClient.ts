import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { logger } from '../utils/logger.js';
import {
  LaravelApiError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
} from '../utils/errors.js';
import type { TokenManager } from '../auth/TokenManager.js';
import type { AuthService } from '../auth/AuthService.js';
import type { AppConfig } from '../config/config.js';
import type { ErrorResponseDTO } from '../dto/common/CommonDTO.js';

// ──────────────────────────────────────────────────────────────────
// LaravelHttpClient: cliente HTTP centralizado con interceptors
// Principios: DRY (un único cliente), SOLID (interceptors separados)
// ──────────────────────────────────────────────────────────────────

interface RetryConfig extends InternalAxiosRequestConfig {
  _isRetry?: boolean;
  _retryCount?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class LaravelHttpClient {
  private readonly instance: AxiosInstance;

  constructor(
    private readonly config: AppConfig,
    private readonly tokenManager: TokenManager,
    private readonly authService: AuthService,
  ) {
    this.instance = axios.create({
      baseURL: config.laravelApiBaseUrl,
      timeout: config.httpTimeoutMs,
      httpsAgent: config.httpTlsVerify ? undefined : new (require('https').Agent)({ rejectUnauthorized: false }),
    });

    this.registerAuthInterceptor();
    this.registerResponseInterceptor();
  }

  /**
   * AuthInterceptor: adjunta el token al header de cada request saliente
   */
  private registerAuthInterceptor(): void {
    this.instance.interceptors.request.use((reqConfig: InternalAxiosRequestConfig) => {
      const token = this.tokenManager.getAccessToken();

      if (!token) return reqConfig;

      const authType = this.config.authType;

      if (authType === 'apiKey') {
        reqConfig.headers.set(this.config.authApiKeyHeader, token);
      } else if (authType === 'basic') {
        reqConfig.headers.set('Authorization', `Basic ${token}`);
      } else {
        // bearer, oauth2
        reqConfig.headers.set('Authorization', `Bearer ${token}`);
      }

      return reqConfig;
    });
  }

  /**
   * ResponseInterceptor: maneja errores HTTP y retry logic
   * Tell Don't Ask: el interceptor decide la estrategia sin consultar estado externo
   */
  private registerResponseInterceptor(): void {
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: unknown) => {
        if (!axios.isAxiosError(error)) throw error;

        const status = error.response?.status;
        const config = error.config as RetryConfig | undefined;
        const errorData = error.response?.data as ErrorResponseDTO | undefined;

        logger.debug({ status, url: config?.url }, 'HTTP error received');

        // 401: Token expirado → auto-refresh + retry (una sola vez)
        if (status === 401 && config && !config._isRetry) {
          config._isRetry = true;
          try {
            await this.authService.refreshToken();
            return this.instance(config);
          } catch {
            throw new AuthenticationError(errorData);
          }
        }

        // 403: Sin permisos
        if (status === 403) {
          throw new AuthorizationError(errorData);
        }

        // 404: Recurso no encontrado
        if (status === 404) {
          throw new NotFoundError(errorData);
        }

        // 409: Conflict (OCC)
        if (status === 409) {
          throw new ConflictError(errorData);
        }

        // 422: Validation error
        if (status === 422 && errorData) {
          throw new ValidationError(errorData);
        }

        // 429: Rate limit → backoff exponencial
        if (status === 429 && config) {
          const retryAfter = Number(error.response?.headers?.['retry-after'] ?? 5);
          const retryCount = (config._retryCount ?? 0) + 1;

          if (retryCount <= this.config.httpMaxRetryAttempts) {
            config._retryCount = retryCount;
            const delay = retryAfter * 1000 * Math.pow(2, retryCount - 1);
            logger.info({ delay, retryCount }, 'Rate limited, waiting before retry');
            await sleep(delay);
            return this.instance(config);
          }

          throw new RateLimitError(retryAfter, errorData);
        }

        // 500+: Server error
        throw new LaravelApiError(errorData, status ?? 0);
      },
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config);
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config);
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data, config);
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, config);
  }

  async request<T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.request<T>(config);
  }
}
