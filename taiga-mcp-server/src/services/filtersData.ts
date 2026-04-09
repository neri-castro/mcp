export interface FiltersDataSummary {
  statuses: { id: number; name: string; color: string; is_closed?: boolean }[];
  assigned_to: { id: number; username: string; full_name_display: string }[];
  tags: string[][];
  types?: { id: number; name: string; color: string }[];
  priorities?: { id: number; name: string; color: string }[];
  severities?: { id: number; name: string; color: string }[];
  milestones?: { id: number; name: string }[];
  roles?: { id: number; name: string }[];
}

function mapLookup(arr: unknown[] | undefined): { id: number; name: string; color: string }[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => {
    const i = item as Record<string, unknown>;
    return { id: i.id as number, name: i.name as string, color: i.color as string ?? '' };
  });
}

export function toFiltersDataSummary(raw: Record<string, unknown>): FiltersDataSummary {
  const statuses = raw.statuses as Record<string, unknown>[] | undefined;
  const assignedTo = raw.assigned_to as Record<string, unknown>[] | undefined;
  const tags = raw.tags as string[][] | undefined;
  const types = raw.types as unknown[] | undefined;
  const priorities = raw.priorities as unknown[] | undefined;
  const severities = raw.severities as unknown[] | undefined;
  const milestones = raw.milestones as Record<string, unknown>[] | undefined;
  const roles = raw.roles as Record<string, unknown>[] | undefined;

  const result: FiltersDataSummary = {
    statuses: Array.isArray(statuses)
      ? statuses.map((s) => ({ id: s.id as number, name: s.name as string, color: s.color as string, is_closed: s.is_closed as boolean | undefined }))
      : [],
    assigned_to: Array.isArray(assignedTo)
      ? assignedTo.map((u) => ({ id: u.id as number, username: u.username as string ?? '', full_name_display: u.full_name_display as string ?? '' }))
      : [],
    tags: Array.isArray(tags) ? tags : [],
  };

  if (types) result.types = mapLookup(types);
  if (priorities) result.priorities = mapLookup(priorities);
  if (severities) result.severities = mapLookup(severities);
  if (milestones) result.milestones = milestones.map((m) => ({ id: m.id as number, name: m.name as string }));
  if (roles) result.roles = roles.map((r) => ({ id: r.id as number, name: r.name as string }));

  return result;
}
