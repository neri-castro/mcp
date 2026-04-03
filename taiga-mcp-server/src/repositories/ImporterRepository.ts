import { TaigaHttpClient } from '../http/TaigaHttpClient.js';

export type ImporterSource = 'trello' | 'github' | 'jira';

export class ImporterRepository {
  constructor(private readonly client: TaigaHttpClient) {}

  async exportProject(projectId: number): Promise<unknown> {
    const response = await this.client.get(`/exporter/${projectId}`);
    return response.data;
  }

  async importProject(dump: unknown): Promise<unknown> {
    const response = await this.client.post('/importer/load_dump_in_background', dump);
    return response.data;
  }

  async getAuthUrl(source: ImporterSource): Promise<unknown> {
    const response = await this.client.post(`/importers/${source}/auth_url`);
    return response.data;
  }

  async authorize(source: ImporterSource, code: string): Promise<unknown> {
    const response = await this.client.post(`/importers/${source}/authorize`, { code });
    return response.data;
  }

  async listProjects(source: ImporterSource, token: string): Promise<unknown> {
    const response = await this.client.get(`/importers/${source}/list_projects`, {
      params: { token },
    });
    return response.data;
  }

  async importFromSource(source: ImporterSource, dto: unknown): Promise<unknown> {
    const response = await this.client.post(`/importers/${source}/import`, dto);
    return response.data;
  }
}
