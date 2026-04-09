import {
  CustomAttributeRepository,
  CustomAttrEntityType,
  CreateCustomAttrDTO,
} from '../repositories/CustomAttributeRepository.js';

interface CustomAttrDefinition {
  id: number;
  name: string;
  description: string;
  type: string;
  order: number;
  project: number;
}

interface CustomAttrValues {
  id: number;
  version: number;
  attributes_values: Record<string, unknown>;
}

export class CustomAttributeService {
  constructor(private readonly repo: CustomAttributeRepository) {}

  async list(projectId: number, entityType: CustomAttrEntityType): Promise<CustomAttrDefinition[]> {
    const raw = await this.repo.list(projectId, entityType) as Record<string, unknown>[];
    return raw.map((a) => ({
      id: a.id as number,
      name: a.name as string,
      description: a.description as string ?? '',
      type: a.type as string,
      order: a.order as number,
      project: a.project as number,
    }));
  }

  async create(entityType: CustomAttrEntityType, dto: CreateCustomAttrDTO): Promise<CustomAttrDefinition> {
    const raw = await this.repo.create(entityType, dto) as Record<string, unknown>;
    return {
      id: raw.id as number,
      name: raw.name as string,
      description: raw.description as string ?? '',
      type: raw.type as string,
      order: raw.order as number,
      project: raw.project as number,
    };
  }

  async edit(
    attrId: number,
    entityType: CustomAttrEntityType,
    dto: Partial<CreateCustomAttrDTO>
  ): Promise<CustomAttrDefinition> {
    const raw = await this.repo.edit(attrId, entityType, dto) as Record<string, unknown>;
    return {
      id: raw.id as number,
      name: raw.name as string,
      description: raw.description as string ?? '',
      type: raw.type as string,
      order: raw.order as number,
      project: raw.project as number,
    };
  }

  async delete(attrId: number, entityType: CustomAttrEntityType): Promise<void> {
    return this.repo.delete(attrId, entityType);
  }

  async getValues(entityId: number, entityType: CustomAttrEntityType): Promise<CustomAttrValues> {
    const raw = await this.repo.getValues(entityId, entityType) as Record<string, unknown>;
    return {
      id: raw.id as number,
      version: raw.version as number,
      attributes_values: (raw.attributes_values as Record<string, unknown>) ?? {},
    };
  }

  async setValues(
    entityId: number,
    entityType: CustomAttrEntityType,
    attributesValues: Record<string, unknown>,
    version: number
  ): Promise<CustomAttrValues> {
    const raw = await this.repo.setValues(entityId, entityType, attributesValues, version) as Record<string, unknown>;
    return {
      id: raw.id as number,
      version: raw.version as number,
      attributes_values: (raw.attributes_values as Record<string, unknown>) ?? {},
    };
  }
}
