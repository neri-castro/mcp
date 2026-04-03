import { StatusRepository, EntityType, CreateStatusDTO, EditStatusDTO } from '../repositories/StatusRepository.js';

export class KanbanService {
  constructor(private readonly repo: StatusRepository) {}

  async listStatuses(projectId: number, entityType: EntityType): Promise<unknown> {
    return this.repo.list(projectId, entityType);
  }

  async createStatus(entityType: EntityType, dto: CreateStatusDTO): Promise<unknown> {
    return this.repo.create(entityType, dto);
  }

  async editStatus(statusId: number, entityType: EntityType, dto: EditStatusDTO): Promise<unknown> {
    return this.repo.edit(statusId, entityType, dto);
  }

  async deleteStatus(statusId: number, entityType: EntityType): Promise<void> {
    return this.repo.delete(statusId, entityType);
  }

  async reorderStatuses(
    projectId: number,
    entityType: EntityType,
    statusesOrder: { status_id: number; order: number }[]
  ): Promise<void> {
    return this.repo.reorder(projectId, entityType, statusesOrder);
  }

  async moveCard(projectId: number, usId: number, newStatusId: number, order?: number): Promise<void> {
    return this.repo.moveKanbanCard(projectId, usId, newStatusId, order);
  }

  async bulkMoveCards(
    projectId: number,
    statusId: number,
    cards: { us_id: number; order: number }[]
  ): Promise<void> {
    return this.repo.bulkMoveKanban(projectId, statusId, cards);
  }
}
