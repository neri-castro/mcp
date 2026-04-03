import { WebhookRepository, CreateWebhookDTO, EditWebhookDTO } from '../repositories/WebhookRepository.js';
import { logger } from '../utils/logger.js';

export class WebhookService {
  constructor(private readonly repo: WebhookRepository) {}

  async list(projectId: number): Promise<unknown> {
    return this.repo.list({ project: projectId });
  }

  async get(webhookId: number): Promise<unknown> {
    return this.repo.get(webhookId);
  }

  async create(dto: CreateWebhookDTO): Promise<unknown> {
    logger.info({ projectId: dto.project, name: dto.name }, 'Creando webhook');
    return this.repo.create(dto);
  }

  async edit(webhookId: number, dto: EditWebhookDTO): Promise<unknown> {
    return this.repo.edit(webhookId, dto);
  }

  async delete(webhookId: number): Promise<void> {
    return this.repo.delete(webhookId);
  }

  async test(webhookId: number): Promise<unknown> {
    logger.info({ webhookId }, 'Probando webhook');
    return this.repo.test(webhookId);
  }

  async getLogs(webhookId: number): Promise<unknown> {
    return this.repo.getLogs(webhookId);
  }

  async resendLog(logId: number): Promise<unknown> {
    return this.repo.resendLog(logId);
  }
}
