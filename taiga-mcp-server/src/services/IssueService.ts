import { IssueRepository, CreateIssueDTO, EditIssueDTO } from '../repositories/IssueRepository.js';
import { withCurrentVersion } from '../utils/occ.js';
import { logger } from '../utils/logger.js';

export class IssueService {
  constructor(private readonly repo: IssueRepository) {}

  async list(projectId: number, filters?: Record<string, unknown>): Promise<unknown> {
    return this.repo.list({ project: projectId, ...filters });
  }

  async get(id: number): Promise<unknown> {
    return this.repo.get(id);
  }

  async create(dto: CreateIssueDTO): Promise<unknown> {
    logger.info({ projectId: dto.project, subject: dto.subject }, 'Creando issue');
    return this.repo.create(dto);
  }

  async edit(id: number, dto: EditIssueDTO): Promise<unknown> {
    return this.repo.edit(id, dto);
  }

  async delete(id: number): Promise<void> {
    return this.repo.delete(id);
  }

  async changeStatus(issueId: number, statusId: number): Promise<unknown> {
    return withCurrentVersion(
      () => this.repo.get(issueId),
      (version) => this.repo.edit(issueId, { status: statusId, version, type: undefined as unknown as number, priority: undefined as unknown as number, severity: undefined as unknown as number })
    );
  }

  async changePriority(issueId: number, priorityId: number): Promise<unknown> {
    return withCurrentVersion(
      () => this.repo.get(issueId),
      (version) => this.repo.edit(issueId, { priority: priorityId, version, type: undefined as unknown as number, severity: undefined as unknown as number })
    );
  }

  async changeSeverity(issueId: number, severityId: number): Promise<unknown> {
    return withCurrentVersion(
      () => this.repo.get(issueId),
      (version) => this.repo.edit(issueId, { severity: severityId, version, type: undefined as unknown as number, priority: undefined as unknown as number })
    );
  }

  async assign(issueId: number, userId: number): Promise<unknown> {
    return withCurrentVersion(
      () => this.repo.get(issueId),
      (version) => this.repo.edit(issueId, { assigned_to: userId, version, type: undefined as unknown as number, priority: undefined as unknown as number, severity: undefined as unknown as number })
    );
  }

  async promoteToUserStory(issueId: number, projectId: number): Promise<unknown> {
    return this.repo.promoteToUserStory(issueId, projectId);
  }

  async listTypes(projectId: number): Promise<unknown> {
    return this.repo.listTypes(projectId);
  }

  async listPriorities(projectId: number): Promise<unknown> {
    return this.repo.listPriorities(projectId);
  }

  async listSeverities(projectId: number): Promise<unknown> {
    return this.repo.listSeverities(projectId);
  }

  async vote(issueId: number): Promise<void> {
    return this.repo.upvote(issueId);
  }

  async watch(issueId: number): Promise<void> {
    return this.repo.watch(issueId);
  }

  async listAttachments(issueId: number): Promise<unknown> {
    return this.repo.listAttachments(issueId);
  }

  async getFiltersData(projectId: number): Promise<unknown> {
    return this.repo.getFiltersData(projectId);
  }
}
