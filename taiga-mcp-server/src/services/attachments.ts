export interface AttachmentSummary {
  id: number;
  name: string;
  size: number | null;
  url: string;
  created_date: string;
  owner_id: number | null;
  owner_name: string | null;
  is_deprecated: boolean;
  description: string;
}

export function toAttachmentSummary(a: Record<string, unknown>): AttachmentSummary {
  const owner = a.owner as { id?: number; full_name_display?: string } | null;
  return {
    id: a.id as number,
    name: a.name as string ?? '',
    size: a.size as number | null ?? null,
    url: a.url as string ?? '',
    created_date: a.created_date as string,
    owner_id: owner?.id ?? null,
    owner_name: owner?.full_name_display ?? null,
    is_deprecated: a.is_deprecated as boolean ?? false,
    description: a.description as string ?? '',
  };
}
