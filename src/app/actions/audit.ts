import { getAuditEvents, type AuditEventsResult } from "@/lib/audit";

export async function getAuditLogAction(options?: {
  tableSlug?: string;
  actorId?: string;
  offset?: number;
  limit?: number;
}): Promise<AuditEventsResult> {
  return getAuditEvents(options);
}
