import { TaigaHttpClient } from '../../http/TaigaHttpClient.js';

export abstract class BaseRepository<TItem, TCreateDTO, TEditDTO> {
  constructor(
    protected readonly client: TaigaHttpClient,
    protected readonly basePath: string
  ) {}

  async list(params?: Record<string, unknown>): Promise<TItem[]> {
    const response = await this.client.get<TItem[]>(this.basePath, { params });
    return response.data;
  }

  async get(id: number): Promise<TItem> {
    const response = await this.client.get<TItem>(`${this.basePath}/${id}`);
    return response.data;
  }

  async create(dto: TCreateDTO): Promise<TItem> {
    const response = await this.client.post<TItem>(this.basePath, dto);
    return response.data;
  }

  async edit(id: number, dto: TEditDTO): Promise<TItem> {
    const response = await this.client.patch<TItem>(`${this.basePath}/${id}`, dto);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await this.client.delete(`${this.basePath}/${id}`);
  }
}
