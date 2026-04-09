import { IssueRepository, CreateIssueDTO, EditIssueDTO } from '../repositories/IssueRepository.js';
import { withCurrentVersion } from '../utils/occ.js';
import { logger } from '../utils/logger.js';

interface IssueSummary {
  id: number;
  ref: number;
  subject: string;
  status: number | null;
  status_extra_info: { name: string; color: string; is_closed: boolean } | null;
  type: number | null;
  type_extra_info: { name: string; color: string } | null;
  priority: number | null;
  priority_extra_info: { name: string; color: string } | null;
  severity: number | null;
  severity_extra_info: { name: string; color: string } | null;
  project: number;
  assigned_to: number | null;
  assigned_to_extra_info: { full_name_display: string } | null;
  is_closed: boolean;
  tags: unknown[];
  due_date: string | null;
  created_date: string;
  modified_date: string;
}

export class IssueService {
  constructor(private readonly repo: IssueRepository) {}

  async list(projectId: number, filters?: Record<string, unknown>): Promise<IssueSummary[]> {
    const issues = await this.repo.list({ project: projectId, ...filters }) as Record<string, unknown>[];
    return issues.map((i) => ({
      id: i.id as number,
      ref: i.ref as number,
      subject: i.subject as string,
      status: i.status as number | null,
      status_extra_info: i.status_extra_info as IssueSummary['status_extra_info'],
      type: i.type as number | null,
      type_extra_info: i.type_extra_info as IssueSummary['type_extra_info'],
      priority: i.priority as number | null,
      priority_extra_info: i.priority_extra_info as IssueSummary['priority_extra_info'],
      severity: i.severity as number | null,
      severity_extra_info: i.severity_extra_info as IssueSummary['severity_extra_info'],
      project: i.project as number,
      assigned_to: i.assigned_to as number | null,
      assigned_to_extra_info: i.assigned_to_extra_info as IssueSummary['assigned_to_extra_info'],
      is_closed: i.is_closed as boolean,
      tags: i.tags as unknown[],
      due_date: i.due_date as string | null,
      created_date: i.created_date as string,
      modified_date: i.modified_date as string,
    }));
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
