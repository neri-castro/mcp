import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { config } from '../config/config.js';
import { tokenManager } from '../auth/TokenManager.js';
import { logger } from '../utils/logger.js';

export class TaigaAPIError extends Error {
  constructor(
    public readonly data: unknown,
    public readonly statusCode: number
  ) {
    super(`Taiga API Error ${statusCode}: ${JSON.stringify(data)}`);
    this.name = 'TaigaAPIError';
  }
}

export class OCCConflictError extends Error {
  constructor(public readonly data: unknown) {
    super('OCC Conflict: la versión del recurso no coincide.');
    this.name = 'OCCConflictError';
  }
}

export class TaigaHttpClient {
  private readonly instance: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.instance = axios.create({
      baseURL: config.taigaApiBaseUrl,
      timeout: config.requestTimeoutMs,
      headers: { 'Content-Type': 'application/json' },
    });

    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  private setupRequestInterceptor(): void {
    this.instance.interceptors.request.use((reqConfig) => {
      if (tokenManager.isAuthenticated()) {
        reqConfig.headers['Authorization'] = `Bearer ${tokenManager.getAccessToken()}`;
      }
      logger.debug({ method: reqConfig.method?.toUpperCase(), url: reqConfig.url }, 'HTTP Request');
      return reqConfig;
    });
  }

  private setupResponseInterceptor(): void {
    this.instance.interceptors.response.use(
      (response) => {
        logger.debug(
          { status: response.status, url: response.config.url },
          'HTTP Response'
        );
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                resolve(this.instance(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();
            tokenManager.updateAccessToken(newToken);
            this.refreshSubscribers.forEach((cb) => cb(newToken));
            this.refreshSubscribers = [];
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return this.instance(originalRequest);
          } catch {
            logger.warn('Refresh token falló, se requiere re-autenticación');
            tokenManager.clear();
            throw new TaigaAPIError({ message: 'Sesión expirada. Usa taiga_auth_login.' }, 401);
          } finally {
            this.isRefreshing = false;
          }
        }

        if (error.response?.status === 409) {
          throw new OCCConflictError(error.response.data);
        }

        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] ?? '5', 10);
          logger.warn({ retryAfter }, 'Rate limit alcanzado, esperando...');
          await sleep(retryAfter * 1000);
          return this.instance(originalRequest);
        }

        const status = error.response?.status ?? 0;
        const data = error.response?.data ?? { message: error.message };
        logger.error({ status, data, url: originalRequest?.url }, 'HTTP Error');
        throw new TaigaAPIError(data, status);
      }
    );
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = tokenManager.getRefreshToken();
    const response = await this.instance.post<{ auth_token: string }>('/auth/refresh', {
      refresh: refreshToken,
    });
    return response.data.auth_token;
  }

  async get<T = unknown>(url: string, reqConfig?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, reqConfig);
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    reqConfig?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, reqConfig);
  }

  async patch<T = unknown>(
    url: string,
    data?: unknown,
    reqConfig?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data, reqConfig);
  }

  async delete<T = unknown>(
    url: string,
    reqConfig?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, reqConfig);
  }

  // Acceso a la instancia raw para casos especiales (multipart, etc.)
  getRawInstance(): AxiosInstance {
    return this.instance;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Singleton
export const taigaHttpClient = new TaigaHttpClient();
