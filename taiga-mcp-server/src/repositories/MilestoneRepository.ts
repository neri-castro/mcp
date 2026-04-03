import { BaseRepository } from './base/BaseRepository.js';
import { TaigaHttpClient } from '../http/TaigaHttpClient.js';

export interface CreateMilestoneDTO {
  project: number;
  name: string;
  estimated_start: string;
  estimated_finish: string;
  slug?: string;
  disponibility?: number;
  order?: number;
}

export interface EditMilestoneDTO extends Partial<CreateMilestoneDTO> {
  version?: number;
}

export class MilestoneRepository extends BaseRepository<unknown, CreateMilestoneDTO, EditMilestoneDTO> {
  constructor(client: TaigaHttpClient) {
    super(client, '/milestones');
  }

  async getStats(milestoneId: number): Promise<unknown> {
    const response = await this.client.get(`/milestones/${milestoneId}/stats`);
    return response.data;
  }

  async watch(milestoneId: number): Promise<void> {
    await this.client.post(`/milestones/${milestoneId}/watch`);
  }

  async listWatchers(milestoneId: number): Promise<unknown> {
    const response = await this.client.get(`/milestones/${milestoneId}/watchers`);
    return response.data;
  }
}
