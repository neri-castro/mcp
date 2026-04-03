import { TaigaHttpClient } from '../http/TaigaHttpClient.js';

export type CustomAttrEntityType = 'epic' | 'userstory' | 'task' | 'issue';

const CUSTOM_ATTR_PATHS: Record<CustomAttrEntityType, string> = {
  epic: '/epic-custom-attributes',
  userstory: '/userstory-custom-attributes',
  task: '/task-custom-attributes',
  issue: '/issue-custom-attributes',
};

const CUSTOM_VALUES_PATHS: Record<CustomAttrEntityType, string> = {
  epic: '/epics/custom-attributes-values',
  userstory: '/userstories/custom-attributes-values',
  task: '/tasks/custom-attributes-values',
  issue: '/issues/custom-attributes-values',
};

export interface CreateCustomAttrDTO {
  project: number;
  name: string;
  description?: string;
  type?: 'text' | 'multiline' | 'richtext' | 'date' | 'url' | 'email' | 'number' | 'checkbox' | 'list' | 'multiselect';
  order?: number;
}

export class CustomAttributeRepository {
  constructor(private readonly client: TaigaHttpClient) {}

  async list(projectId: number, entityType: CustomAttrEntityType): Promise<unknown> {
    const path = CUSTOM_ATTR_PATHS[entityType];
    const response = await this.client.get(path, { params: { project: projectId } });
    return response.data;
  }

  async create(entityType: CustomAttrEntityType, dto: CreateCustomAttrDTO): Promise<unknown> {
    const path = CUSTOM_ATTR_PATHS[entityType];
    const response = await this.client.post(path, dto);
    return response.data;
  }

  async edit(
    attrId: number,
    entityType: CustomAttrEntityType,
    dto: Partial<CreateCustomAttrDTO>
  ): Promise<unknown> {
    const path = CUSTOM_ATTR_PATHS[entityType];
    const response = await this.client.patch(`${path}/${attrId}`, dto);
    return response.data;
  }

  async delete(attrId: number, entityType: CustomAttrEntityType): Promise<void> {
    const path = CUSTOM_ATTR_PATHS[entityType];
    await this.client.delete(`${path}/${attrId}`);
  }

  async getValues(entityId: number, entityType: CustomAttrEntityType): Promise<unknown> {
    const path = CUSTOM_VALUES_PATHS[entityType];
    const response = await this.client.get(`${path}/${entityId}`);
    return response.data;
  }

  async setValues(
    entityId: number,
    entityType: CustomAttrEntityType,
    attributesValues: Record<string, unknown>,
    version: number
  ): Promise<unknown> {
    const path = CUSTOM_VALUES_PATHS[entityType];
    const response = await this.client.patch(`${path}/${entityId}`, {
      attributes_values: attributesValues,
      version,
    });
    return response.data;
  }
}
