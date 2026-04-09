import { TimelineRepository } from '../repositories/TimelineRepository.js';

interface TimelineEvent {
  id: string;
  created: string;
  event_type: string;
  user_id: number | null;
  user_name: string | null;
  resource_type: string;
  resource_id: number | null;
  resource_title: string | null;
  comment: string | null;
}

function mapTimelineEvent(e: Record<string, unknown>): TimelineEvent {
  const data = e.data as Record<string, unknown> | null ?? {};
  const user = data.user as { id?: number; name?: string } | null;

  // event_type looks like "userstories.userstory.create" or "tasks.task.change"
  const eventType = e.event_type as string ?? '';
  const parts = eventType.split('.');
  const resourceType = parts[1] ?? parts[0] ?? 'unknown';

  // Taiga puts the resource under a key matching its type
  const resourceKeys: Record<string, string> = {
    userstory: 'userstory',
    task: 'task',
    issue: 'issue',
    epic: 'epic',
    milestone: 'milestone',
    wikipage: 'wiki_page',
    wiki_page: 'wiki_page',
  };
  const resourceKey = resourceKeys[resourceType] ?? resourceType;
  const resource = data[resourceKey] as Record<string, unknown> | null;

  const comment = data.comment as string | null;

  return {
    id: e.id as string,
    created: e.created as string,
    event_type: eventType,
    user_id: user?.id ?? null,
    user_name: user?.name ?? null,
    resource_type: resourceType,
    resource_id: (resource?.id as number) ?? null,
    resource_title: (resource?.subject ?? resource?.name ?? resource?.slug) as string | null ?? null,
    comment: comment && comment.trim().length > 0 ? comment : null,
  };
}

interface ProjectStatsSummary {
  total_milestones: number;
  total_userstories: number;
  total_tasks: number;
  total_issues: number;
  defined_points: number;
  assigned_points: number;
  closed_points: number;
}

interface IssueStatsSummary {
  total_issues: number;
  issues_per_type: { name: string; count: number; color: string }[];
  issues_per_priority: { name: string; count: number; color: string }[];
  issues_per_severity: { name: string; count: number; color: string }[];
  issues_per_status: { name: string; count: number; color: string }[];
}

interface SprintStatsSummary {
  total_points: number;
  completed_points: number;
  total_userstories: number;
  completed_userstories: number;
  total_tasks: number;
  completed_tasks: number;
}

function sumPointsObject(obj: unknown): number {
  if (!obj || typeof obj !== 'object') return 0;
  return Object.values(obj as Record<string, unknown>)
    .reduce<number>((acc, v) => acc + (typeof v === 'number' ? v : 0), 0);
}

function mapIssueBreakdown(arr: unknown[]): { name: string; count: number; color: string }[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => {
    const i = item as Record<string, unknown>;
    return { name: i.name as string ?? '', count: i.count as number ?? 0, color: i.color as string ?? '' };
  });
}

export class StatsService {
  constructor(private readonly repo: TimelineRepository) {}

  async getProjectTimeline(projectId: number, page?: number): Promise<TimelineEvent[]> {
    const raw = await this.repo.getProjectTimeline(projectId, page);
    const entries = Array.isArray(raw) ? raw : (raw as Record<string, unknown>).data as Record<string, unknown>[] ?? [];
    return entries.map(mapTimelineEvent);
  }

  async getUserTimeline(userId: number, page?: number): Promise<TimelineEvent[]> {
    const raw = await this.repo.getUserTimeline(userId, page);
    const entries = Array.isArray(raw) ? raw : (raw as Record<string, unknown>).data as Record<string, unknown>[] ?? [];
    return entries.map(mapTimelineEvent);
  }

  async getProjectStats(projectId: number): Promise<ProjectStatsSummary> {
    const raw = await this.repo.getProjectStats(projectId) as Record<string, unknown>;
    return {
      total_milestones: raw.total_milestones as number ?? 0,
      total_userstories: raw.total_userstories as number ?? 0,
      total_tasks: raw.total_tasks as number ?? 0,
      total_issues: raw.total_issues as number ?? 0,
      defined_points: sumPointsObject(raw.defined_points),
      assigned_points: sumPointsObject(raw.assigned_points),
      closed_points: sumPointsObject(raw.closed_points),
    };
  }

  async getIssueStats(projectId: number): Promise<IssueStatsSummary> {
    const raw = await this.repo.getIssueStats(projectId) as Record<string, unknown>;
    const perType = raw.issues_per_type as unknown[] ?? [];
    const perPriority = raw.issues_per_priority as unknown[] ?? [];
    const perSeverity = raw.issues_per_severity as unknown[] ?? [];
    const perStatus = raw.issues_per_status as unknown[] ?? [];
    return {
      total_issues: (perStatus as Record<string, unknown>[]).reduce((acc, s) => acc + ((s.count as number) ?? 0), 0),
      issues_per_type: mapIssueBreakdown(perType),
      issues_per_priority: mapIssueBreakdown(perPriority),
      issues_per_severity: mapIssueBreakdown(perSeverity),
      issues_per_status: mapIssueBreakdown(perStatus),
    };
  }

  async getSprintStats(sprintId: number): Promise<SprintStatsSummary> {
    const raw = await this.repo.getSprintStats(sprintId) as Record<string, unknown>;
    const completedUS = raw.completed_userstories as unknown[] ?? [];
    const incompleteUS = raw.incomplete_userstories as unknown[] ?? [];
    const completedTasks = raw.completed_tasks as unknown[] ?? [];
    const incompleteTasks = raw.incomplete_tasks as unknown[] ?? [];
    return {
      total_points: (raw.total_points as number) ?? 0,
      completed_points: (raw.completed_points as number) ?? 0,
      total_userstories: completedUS.length + incompleteUS.length,
      completed_userstories: completedUS.length,
      total_tasks: completedTasks.length + incompleteTasks.length,
      completed_tasks: completedTasks.length,
    };
  }
}
