import {
  UserRepository,
  CreateMembershipDTO,
  BulkInviteDTO,
  CreateRoleDTO,
} from '../repositories/UserRepository.js';
import { logger } from '../utils/logger.js';

interface UserSummary {
  id: number;
  username: string;
  full_name_display: string;
  photo: string | null;
  is_active: boolean;
}

interface MembershipSummary {
  id: number;
  project: number;
  role: number;
  role_name: string;
  user: number;
  user_email: string;
  full_name: string;
  photo: string | null;
  is_active: boolean;
}

export class UserService {
  constructor(private readonly repo: UserRepository) {}

  async me(): Promise<unknown> {
    return this.repo.me();
  }

  async get(userId: number): Promise<unknown> {
    return this.repo.get(userId);
  }

  async list(projectId?: number): Promise<UserSummary[]> {
    const users = await this.repo.list(projectId) as Record<string, unknown>[];
    return users.map((u) => ({
      id: u.id as number,
      username: u.username as string,
      full_name_display: u.full_name_display as string,
      photo: u.photo as string | null,
      is_active: u.is_active as boolean,
    }));
  }

  async listMemberships(projectId: number): Promise<MembershipSummary[]> {
    const memberships = await this.repo.listMemberships(projectId) as Record<string, unknown>[];
    return memberships.map((m) => ({
      id: m.id as number,
      project: m.project as number,
      role: m.role as number,
      role_name: m.role_name as string,
      user: m.user as number,
      user_email: m.user_email as string,
      full_name: m.full_name as string,
      photo: m.photo as string | null,
      is_active: m.is_active as boolean,
    }));
  }

  async invite(dto: CreateMembershipDTO): Promise<unknown> {
    logger.info({ projectId: dto.project }, 'Invitando usuario al proyecto');
    return this.repo.invite(dto);
  }

  async bulkInvite(dto: BulkInviteDTO): Promise<unknown> {
    return this.repo.bulkInvite(dto);
  }

  async changeRole(membershipId: number, roleId: number): Promise<unknown> {
    return this.repo.changeRole(membershipId, roleId);
  }

  async removeMembership(membershipId: number): Promise<void> {
    return this.repo.removeMembership(membershipId);
  }

  async listRoles(projectId: number): Promise<unknown> {
    return this.repo.listRoles(projectId);
  }

  async createRole(dto: CreateRoleDTO): Promise<unknown> {
    return this.repo.createRole(dto);
  }

  async editRole(roleId: number, dto: Partial<CreateRoleDTO>): Promise<unknown> {
    return this.repo.editRole(roleId, dto);
  }
}
