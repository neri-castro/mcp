import { IssueRepository, CreateIssueDTO, EditIssueDTO } from '../repositories/IssueRepository.js';
import { withCurrentVersion } from '../utils/occ.js';
import { logger } from '../utils/logger.js';
import { FiltersDataSummary, toFiltersDataSummary } from './filtersData.js';

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

interface IssueDetail extends IssueSummary {
  description: string;
  finish_date: string | null;
  is_blocked: boolean;
  blocked_note: string;
  total_comments: number;
  total_attachments: number;
  total_watchers: number;
  total_voters: number;
  version: number;
  neighbors: { previous: { id: number; ref: number; subject: string } | null; next: { id: number; ref: number; subject: string } | null };
}

export class IssueService {
  constructor(private readonly repo: IssueRepository) {}

  async list(projectId: number, filters?: Record<string, unknown>): Promise<IssueSummary[]> {
    const issues = await this.repo.list({ project: projectId, ...filters }) as Record<string, unknown>[];
    return issues.map((i) => this.toSummary(i));
  }

  private toSummary(i: Record<string, unknown>): IssueSummary {
    const assignedInfo = i.assigned_to_extra_info as { full_name_display?: string } | null;
    return {
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
      assigned_to_extra_info: assignedInfo ? { full_name_display: assignedInfo.full_name_display ?? '' } : null,
      is_closed: i.is_closed as boolean,
      tags: i.tags as unknown[],
      due_date: i.due_date as string | null,
      created_date: i.created_date as string,
      modified_date: i.modified_date as string,
    };
  }

  async get(id: number): Promise<IssueDetail> {
    const raw = await this.repo.get(id) as Record<string, unknown>;
    return this.toDetail(raw);
  }

  private toDetail(r: Record<string, unknown>): IssueDetail {
    const statusInfo = r.status_extra_info as IssueSummary['status_extra_info'];
    const assignedInfo = r.assigned_to_extra_info as { full_name_display?: string } | null;
    const neighbors = r.neighbors as { previous?: Record<string, unknown> | null; next?: Record<string, unknown> | null } | null;
    return {
      id: r.id as number,
      ref: r.ref as number,
      subject: r.subject as string,
      status: r.status as number | null,
      status_extra_info: statusInfo,
      type: r.type as number | null,
      type_extra_info: r.type_extra_info as IssueSummary['type_extra_info'],
      priority: r.priority as number | null,
      priority_extra_info: r.priority_extra_info as IssueSummary['priority_extra_info'],
      severity: r.severity as number | null,
      severity_extra_info: r.severity_extra_info as IssueSummary['severity_extra_info'],
      project: r.project as number,
      assigned_to: r.assigned_to as number | null,
      assigned_to_extra_info: assignedInfo ? { full_name_display: assignedInfo.full_name_display ?? '' } : null,
      is_closed: r.is_closed as boolean,
      tags: r.tags as unknown[],
      due_date: r.due_date as string | null,
      created_date: r.created_date as string,
      modified_date: r.modified_date as string,
      description: r.description as string ?? '',
      finish_date: r.finish_date as string | null,
      is_blocked: r.is_blocked as boolean,
      blocked_note: r.blocked_note as string ?? '',
      total_comments: r.total_comments as number ?? 0,
      total_attachments: r.total_attachments as number ?? 0,
      total_watchers: r.total_watchers as number ?? 0,
      total_voters: r.total_voters as number ?? 0,
      version: r.version as number,
      neighbors: {
        previous: neighbors?.previous ? { id: neighbors.previous.id as number, ref: neighbors.previous.ref as number, subject: neighbors.previous.subject as string } : null,
        next: neighbors?.next ? { id: neighbors.next.id as number, ref: neighbors.next.ref as number, subject: neighbors.next.subject as string } : null,
      },
    };
  }

  async create(dto: CreateIssueDTO): Promise<IssueSummary> {
    logger.info({ projectId: dto.project, subject: dto.subject }, 'Creando issue');
    const raw = await this.repo.create(dto) as Record<string, unknown>;
    return this.toSummary(raw);
  }

  async edit(id: number, dto: EditIssueDTO): Promise<IssueSummary> {
    const raw = await this.repo.edit(id, dto) as Record<string, unknown>;
    return this.toSummary(raw);
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

  async getFiltersData(projectId: number): Promise<FiltersDataSummary> {
    const raw = await this.repo.getFiltersData(projectId) as Record<string, unknown>;
    return toFiltersDataSummary(raw);
  }
}
