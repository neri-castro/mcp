import {
  CustomAttributeRepository,
  CustomAttrEntityType,
  CreateCustomAttrDTO,
} from '../repositories/CustomAttributeRepository.js';

export class CustomAttributeService {
  constructor(private readonly repo: CustomAttributeRepository) {}

  async list(projectId: number, entityType: CustomAttrEntityType): Promise<unknown> {
    return this.repo.list(projectId, entityType);
  }

  async create(entityType: CustomAttrEntityType, dto: CreateCustomAttrDTO): Promise<unknown> {
    return this.repo.create(entityType, dto);
  }

  async edit(
    attrId: number,
    entityType: CustomAttrEntityType,
    dto: Partial<CreateCustomAttrDTO>
  ): Promise<unknown> {
    return this.repo.edit(attrId, entityType, dto);
  }

  async delete(attrId: number, entityType: CustomAttrEntityType): Promise<void> {
    return this.repo.delete(attrId, entityType);
  }

  async getValues(entityId: number, entityType: CustomAttrEntityType): Promise<unknown> {
    return this.repo.getValues(entityId, entityType);
  }

  async setValues(
    entityId: number,
    entityType: CustomAttrEntityType,
    attributesValues: Record<string, unknown>,
    version: number
  ): Promise<unknown> {
    return this.repo.setValues(entityId, entityType, attributesValues, version);
  }
}
