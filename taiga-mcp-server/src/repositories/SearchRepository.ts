import { TaigaHttpClient } from '../http/TaigaHttpClient.js';

export class SearchRepository {
  constructor(private readonly client: TaigaHttpClient) {}

  async search(projectId: number, text: string): Promise<unknown> {
    const response = await this.client.get('/search', {
      params: { project: projectId, text },
    });
    return response.data;
  }
}
