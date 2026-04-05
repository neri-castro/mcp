// repositories/base.repository.ts
import { PostgresClient, dbClient } from '../db/client.js';

export abstract class BaseRepository<T> {
  protected readonly client: PostgresClient;

  constructor() {
    this.client = dbClient;
  }

  protected async query<R = T>(sql: string, params?: unknown[]): Promise<R[]> {
    return this.client.query<R>(sql, params);
  }

  protected async queryOne<R = T>(sql: string, params?: unknown[]): Promise<R | null> {
    return this.client.queryOne<R>(sql, params);
  }

  protected async execute(sql: string, params?: unknown[]): Promise<void> {
    return this.client.execute(sql, params);
  }

  protected get isPg17Plus(): boolean { return this.client.isPg17Plus; }
  protected get isPg18Plus(): boolean { return this.client.isPg18Plus; }
  protected get pgVersion(): number { return this.client.version; }
}
