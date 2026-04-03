import {
  UserRepository,
  CreateMembershipDTO,
  BulkInviteDTO,
  CreateRoleDTO,
} from '../repositories/UserRepository.js';
import { logger } from '../utils/logger.js';

export class UserService {
  constructor(private readonly repo: UserRepository) {}

  async me(): Promise<unknown> {
    return this.repo.me();
  }

  async get(userId: number): Promise<unknown> {
    return this.repo.get(userId);
  }

  async list(projectId?: number): Promise<unknown> {
    return this.repo.list(projectId);
  }

  async listMemberships(projectId: number): Promise<unknown> {
    return this.repo.listMemberships(projectId);
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
