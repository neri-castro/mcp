import { BaseRepository } from './base/BaseRepository.js';
import { TaigaHttpClient } from '../http/TaigaHttpClient.js';

export interface CreateWebhookDTO {
  project: number;
  name: string;
  url: string;
  key: string;
  enabled?: boolean;
}

export interface EditWebhookDTO extends Partial<CreateWebhookDTO> {}

export class WebhookRepository extends BaseRepository<unknown, CreateWebhookDTO, EditWebhookDTO> {
  constructor(client: TaigaHttpClient) {
    super(client, '/webhooks');
  }

  async test(webhookId: number): Promise<unknown> {
    const response = await this.client.post(`/webhooks/${webhookId}/test`);
    return response.data;
  }

  async getLogs(webhookId: number): Promise<unknown> {
    const response = await this.client.get('/webhooklogs', { params: { webhook: webhookId } });
    return response.data;
  }

  async resendLog(logId: number): Promise<unknown> {
    const response = await this.client.post(`/webhooklogs/${logId}/resend`);
    return response.data;
  }
}
