// src/http/GiteaHttpClient.ts

import type { IAuthProvider } from '../auth/interfaces/IAuthProvider.js';
import type { HttpClientOptions } from './PaginatedResponse.js';
import { GiteaApiError } from '../errors/GiteaApiError.js';

export class GiteaHttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly auth: IAuthProvider,
    private readonly opts: HttpClientOptions = {}
  ) {}

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>('GET', path, undefined, params);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  async delete(path: string): Promise<void> {
    await this.request<void>('DELETE', path);
  }

  /**
   * Paginación automática — retorna todos los elementos iterando páginas.
   * Usar con precaución en colecciones muy grandes.
   */
  async getAll<T>(path: string, params?: Record<string, unknown>): Promise<T[]> {
    const results: T[] = [];
    let page = 1;
    const limit = 50;

    while (true) {
      const items = await this.get<T[]>(path, { ...params, page, limit });
      if (!Array.isArray(items) || items.length === 0) break;
      results.push(...items);
      if (items.length < limit) break;
      page++;
    }

    return results;
  }

  /**
   * Request con sudo para impersonación de admin.
   * Requiere que el usuario autenticado sea site admin.
   */
  async withSudo<T>(targetUser: string, fn: () => Promise<T>): Promise<T> {
    const prevSudo = this.opts.sudoUser;
    this.opts.sudoUser = targetUser;
    try {
      return await fn();
    } finally {
      this.opts.sudoUser = prevSudo;
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, unknown>
  ): Promise<T> {
    const url = new URL(`/api/v1${path}`, this.baseUrl);

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          url.searchParams.set(k, String(v));
        }
      });
    }

    const authHeaders = await this.auth.getAuthHeaders();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeaders,
    };

    // Sudo/impersonación para operaciones admin
    if (this.opts.sudoUser) {
      headers['Sudo'] = this.opts.sudoUser;
    }

    // Retry loop con backoff exponencial
    const maxRetries = this.opts.maxRetries ?? 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      let res: Response;

      try {
        res = await fetch(url.toString(), {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(this.opts.timeout ?? 30_000),
        });
      } catch (err) {
        if (attempt === maxRetries) {
          throw new GiteaApiError(0, `Network error: ${String(err)}`, path);
        }
        await this.sleep(500 * 2 ** attempt);
        continue;
      }

      if (res.ok) {
        if (res.status === 204) return undefined as T;
        return res.json() as Promise<T>;
      }

      // No reintentar errores de cliente (4xx)
      if (res.status < 500 || attempt === maxRetries) {
        const text = await res.text();
        throw new GiteaApiError(res.status, text, path);
      }

      await this.sleep(500 * 2 ** attempt);
    }

    throw new GiteaApiError(0, 'Max retries exceeded', path);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
