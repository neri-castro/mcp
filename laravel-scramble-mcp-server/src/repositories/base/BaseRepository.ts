import type { LaravelHttpClient } from '../http/LaravelHttpClient.js';
import type {
  PaginatedResponseDTO,
} from '../dto/common/CommonDTO.js';
import { isPaginatedResponse } from '../dto/common/CommonDTO.js';

// ──────────────────────────────────────────────────────────────────
// BaseRepository<T>: CRUD genérico reutilizable
// Principios: DRY, Repository Pattern, SOLID (SRP)
// ──────────────────────────────────────────────────────────────────

// ISP: Interfaces segregadas por responsabilidad
export interface IResourceReader<T, TFilters = Record<string, unknown>> {
  list(filters?: TFilters): Promise<T[]>;
  listPaginated(filters?: TFilters): Promise<PaginatedResponseDTO<T>>;
  get(id: number | string): Promise<T>;
}

export interface IResourceWriter<T, TCreate, TEdit> {
  create(dto: TCreate): Promise<T>;
  edit(id: number | string, dto: TEdit): Promise<T>;
  delete(id: number | string): Promise<void>;
}

export interface IFileUploader<TAttachment> {
  upload(entityId: number | string, file: Buffer, filename: string, description?: string): Promise<TAttachment>;
  listAttachments(entityId: number | string): Promise<TAttachment[]>;
  deleteAttachment(entityId: number | string, attachmentId: number | string): Promise<void>;
}

// ──────────────────────────────────────────────────────────────────

export abstract class BaseRepository<TItem, TCreateDTO = Partial<TItem>, TEditDTO = Partial<TItem>> {
  constructor(
    protected readonly client: LaravelHttpClient,
    protected readonly basePath: string,
  ) {}

  async list(params?: Record<string, unknown>): Promise<TItem[]> {
    const response = await this.client.get<unknown>(this.basePath, { params });

    // Manejo automático de respuesta paginada vs array plano
    if (isPaginatedResponse<TItem>(response.data)) {
      return response.data.data;
    }

    return response.data as TItem[];
  }

  async listPaginated(params?: Record<string, unknown>): Promise<PaginatedResponseDTO<TItem>> {
    const response = await this.client.get<PaginatedResponseDTO<TItem>>(this.basePath, { params });
    return response.data;
  }

  async get(id: number | string): Promise<TItem> {
    const response = await this.client.get<TItem>(`${this.basePath}/${id}`);
    return response.data;
  }

  async create(dto: TCreateDTO): Promise<TItem> {
    const response = await this.client.post<TItem>(this.basePath, dto);
    return response.data;
  }

  async edit(id: number | string, dto: TEditDTO): Promise<TItem> {
    const response = await this.client.patch<TItem>(`${this.basePath}/${id}`, dto);
    return response.data;
  }

  async delete(id: number | string): Promise<void> {
    await this.client.delete(`${this.basePath}/${id}`);
  }

  /**
   * Ejecuta una sub-ruta relativa al basePath
   * Útil para rutas como: /posts/{id}/publish, /users/{id}/avatar
   */
  protected async executeSubRoute<T>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    subPath: string,
    data?: unknown,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const response = await this.client.request<T>({
      method,
      url: subPath,
      data,
      params,
    });
    return response.data;
  }
}
