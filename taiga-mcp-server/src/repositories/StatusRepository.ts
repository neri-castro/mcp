import { TaigaHttpClient } from '../http/TaigaHttpClient.js';

export type EntityType = 'epic' | 'userstory' | 'task' | 'issue';

const STATUS_PATHS: Record<EntityType, string> = {
  epic: '/epic-statuses',
  userstory: '/userstory-statuses',
  task: '/task-statuses',
  issue: '/issue-statuses',
};

export interface CreateStatusDTO {
  project: number;
  name: string;
  color?: string;
  order?: number;
  is_closed?: boolean;
  is_archived?: boolean;
  wip_limit?: number | null;
}

export interface EditStatusDTO extends Partial<CreateStatusDTO> {}

export class StatusRepository {
  constructor(private readonly client: TaigaHttpClient) {}

  async list(projectId: number, entityType: EntityType): Promise<unknown> {
    const path = STATUS_PATHS[entityType];
    const response = await this.client.get(path, { params: { project: projectId } });
    return response.data;
  }

  async create(entityType: EntityType, dto: CreateStatusDTO): Promise<unknown> {
    const path = STATUS_PATHS[entityType];
    const response = await this.client.post(path, dto);
    return response.data;
  }

  async edit(statusId: number, entityType: EntityType, dto: EditStatusDTO): Promise<unknown> {
    const path = STATUS_PATHS[entityType];
    const response = await this.client.patch(`${path}/${statusId}`, dto);
    return response.data;
  }

  async delete(statusId: number, entityType: EntityType): Promise<void> {
    const path = STATUS_PATHS[entityType];
    await this.client.delete(`${path}/${statusId}`);
  }

  async reorder(
    projectId: number,
    entityType: EntityType,
    statusesOrder: { status_id: number; order: number }[]
  ): Promise<void> {
    const path = STATUS_PATHS[entityType];
    await this.client.post(`${path}/bulk_update_order`, {
      project: projectId,
      bulk_statuses: statusesOrder,
    });
  }

  async moveKanbanCard(
    projectId: number,
    usId: number,
    newStatusId: number,
    order?: number
  ): Promise<void> {
    await this.client.post('/userstories/bulk_update_kanban_order', {
      project_id: projectId,
      status_id: newStatusId,
      bulk_stories: [{ us_id: usId, order: order ?? 1 }],
    });
  }

  async bulkMoveKanban(
    projectId: number,
    statusId: number,
    cards: { us_id: number; order: number }[]
  ): Promise<void> {
    await this.client.post('/userstories/bulk_update_kanban_order', {
      project_id: projectId,
      status_id: statusId,
      bulk_stories: cards,
    });
  }
}
