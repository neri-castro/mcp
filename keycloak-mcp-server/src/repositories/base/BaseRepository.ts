import { KeycloakHttpClient } from '../../http/KeycloakHttpClient.js';
import { PaginationParamsDTO } from '../../dto/common/index.js';
import { buildPaginationParams } from '../../utils/pagination.js';

export abstract class BaseRepository<TItem, TCreateDTO = Partial<TItem>, TUpdateDTO = Partial<TItem>> {
  constructor(
    protected readonly client: KeycloakHttpClient,
    protected readonly realm: string,
    protected readonly resourcePath: string
  ) {}

  async list(params?: PaginationParamsDTO): Promise<TItem[]> {
    return this.client.get<TItem[]>(
      `/admin/realms/${this.realm}/${this.resourcePath}`,
      buildPaginationParams(params),
      this.realm
    );
  }

  async get(id: string): Promise<TItem> {
    return this.client.get<TItem>(
      `/admin/realms/${this.realm}/${this.resourcePath}/${id}`,
      undefined,
      this.realm
    );
  }

  async create(dto: TCreateDTO): Promise<void> {
    await this.client.post(
      `/admin/realms/${this.realm}/${this.resourcePath}`,
      dto,
      this.realm
    );
  }

  async update(id: string, dto: TUpdateDTO): Promise<void> {
    await this.client.put(
      `/admin/realms/${this.realm}/${this.resourcePath}/${id}`,
      dto,
      this.realm
    );
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(
      `/admin/realms/${this.realm}/${this.resourcePath}/${id}`,
      undefined,
      this.realm
    );
  }
}
