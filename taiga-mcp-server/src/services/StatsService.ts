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

  async getProjectStats(projectId: number): Promise<unknown> {
    return this.repo.getProjectStats(projectId);
  }

  async getIssueStats(projectId: number): Promise<unknown> {
    return this.repo.getIssueStats(projectId);
  }

  async getSprintStats(sprintId: number): Promise<unknown> {
    return this.repo.getSprintStats(sprintId);
  }
}
