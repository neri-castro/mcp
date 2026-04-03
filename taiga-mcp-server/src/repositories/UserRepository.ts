import { TaigaHttpClient } from '../http/TaigaHttpClient.js';

export interface CreateMembershipDTO {
  project: number;
  role: number;
  username?: string;
  email?: string;
}

export interface BulkInviteDTO {
  project: number;
  bulk_memberships: { role_id: number; username?: string; email?: string }[];
  invitation_extra_text?: string;
}

export interface CreateRoleDTO {
  project: number;
  name: string;
  permissions?: string[];
  order?: number;
  computable?: boolean;
}

export class UserRepository {
  constructor(private readonly client: TaigaHttpClient) {}

  async me(): Promise<unknown> {
    const response = await this.client.get('/users/me');
    return response.data;
  }

  async get(userId: number): Promise<unknown> {
    const response = await this.client.get(`/users/${userId}`);
    return response.data;
  }

  async list(projectId?: number): Promise<unknown> {
    const response = await this.client.get('/users', {
      params: projectId ? { project: projectId } : {},
    });
    return response.data;
  }

  async listMemberships(projectId: number): Promise<unknown> {
    const response = await this.client.get('/memberships', { params: { project: projectId } });
    return response.data;
  }

  async invite(dto: CreateMembershipDTO): Promise<unknown> {
    const response = await this.client.post('/memberships', dto);
    return response.data;
  }

  async bulkInvite(dto: BulkInviteDTO): Promise<unknown> {
    const response = await this.client.post('/memberships/bulk_create', dto);
    return response.data;
  }

  async changeRole(membershipId: number, roleId: number): Promise<unknown> {
    const response = await this.client.patch(`/memberships/${membershipId}`, { role: roleId });
    return response.data;
  }

  async removeMembership(membershipId: number): Promise<void> {
    await this.client.delete(`/memberships/${membershipId}`);
  }

  async listRoles(projectId: number): Promise<unknown> {
    const response = await this.client.get('/roles', { params: { project: projectId } });
    return response.data;
  }

  async createRole(dto: CreateRoleDTO): Promise<unknown> {
    const response = await this.client.post('/roles', dto);
    return response.data;
  }

  async editRole(roleId: number, dto: Partial<CreateRoleDTO>): Promise<unknown> {
    const response = await this.client.patch(`/roles/${roleId}`, dto);
    return response.data;
  }
}
