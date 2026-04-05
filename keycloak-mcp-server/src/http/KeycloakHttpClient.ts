import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { config } from '../config/config.js';
import { tokenManager } from '../auth/TokenManager.js';
import { KeycloakAPIError } from '../utils/errors.js';
import { KeycloakErrorDTO } from '../dto/common/index.js';
import { sleep } from '../utils/pagination.js';
import { logger } from '../utils/logger.js';

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
  _realm?: string;
}

export class KeycloakHttpClient {
  private readonly axiosInstance: AxiosInstance;

  constructor(private readonly realm: string = config.kcAuthRealm) {
    this.axiosInstance = axios.create({
      baseURL: config.kcAdminBaseUrl,
      timeout: config.kcRequestTimeoutMs,
      headers: { 'Content-Type': 'application/json' },
    });

    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  private setupRequestInterceptor(): void {
    this.axiosInstance.interceptors.request.use(async (requestConfig: RetryConfig) => {
      const realm = requestConfig._realm ?? this.realm;
      const token = await tokenManager.getValidToken(realm);
      requestConfig.headers['Authorization'] = `Bearer ${token}`;
      return requestConfig;
    });
  }

  private setupResponseInterceptor(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const reqConfig = error.config as RetryConfig | undefined;
        const status = error.response?.status;

        // 401: try token refresh once
        if (status === 401 && reqConfig && !reqConfig._retry) {
          reqConfig._retry = true;
          const realm = reqConfig._realm ?? this.realm;
          tokenManager.invalidate(realm);
          const newToken = await tokenManager.obtain(realm);
          reqConfig.headers['Authorization'] = `Bearer ${newToken}`;
          return this.axiosInstance(reqConfig);
        }

        // 429: exponential backoff
        if (status === 429 && reqConfig) {
          const retryCount = (reqConfig._retryCount ?? 0) + 1;
          if (retryCount <= config.kcMaxRetryAttempts) {
            reqConfig._retryCount = retryCount;
            const retryAfter =
              Number(error.response?.headers['retry-after'] ?? retryCount * 2);
            logger.warn({ retryCount, retryAfter }, 'Rate limited, retrying');
            await sleep(retryAfter * 1000);
            return this.axiosInstance(reqConfig);
          }
        }

        const kcError = error.response?.data as KeycloakErrorDTO | undefined;
        const message =
          kcError?.errorMessage ??
          kcError?.error_description ??
          kcError?.error ??
          error.message ??
          'Unknown error';

        logger.error({ status, message, kcError }, 'Keycloak API error');
        throw new KeycloakAPIError(message, status ?? 0, kcError);
      }
    );
  }

  async get<T>(url: string, params?: Record<string, unknown>, realm?: string): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, {
      params,
      ...(realm ? { _realm: realm } as RetryConfig : {}),
    } as RetryConfig);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, realm?: string): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, {
      ...(realm ? { _realm: realm } as RetryConfig : {}),
    } as RetryConfig);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, realm?: string): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, {
      ...(realm ? { _realm: realm } as RetryConfig : {}),
    } as RetryConfig);
    return response.data;
  }

  async delete<T = void>(url: string, data?: unknown, realm?: string): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, {
      data,
      ...(realm ? { _realm: realm } as RetryConfig : {}),
    } as RetryConfig);
    return response.data;
  }
}

export const httpClient = new KeycloakHttpClient();
