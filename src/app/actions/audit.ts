import { getAuditEvents } from "@/lib/audit";
import type { AuditEvent } from "@/lib/types";

export async function getAuditLogAction(options?: {
  tableSlug?: string;
  limit?: number;
}): Promise<AuditEvent[]> {
  return getAuditEvents(options);
}
