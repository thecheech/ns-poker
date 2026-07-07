import type { AuditAction } from "@/lib/types";

const actionLabels: Record<AuditAction, string> = {
  "table.created": "Table created",
  "table.deleted": "Table deleted",
  "table.settings_updated": "Settings changed",
  "table.closed": "Table closed",
  "table.reopened": "Table reopened",
  "table.settled": "Table settled",
  "player.added": "Player added",
  "player.renamed": "Player renamed",
  "player.deleted": "Player removed",
  "buy_in.added": "Buy-in added",
  "buy_in.updated": "Buy-in changed",
  "buy_in.deleted": "Buy-in removed",
  "cash_out.set": "Cash-out set",
  "transfer.marked_paid": "Transfer paid",
  "transfer.unmarked_paid": "Transfer unpaid",
};

export function formatAuditAction(action: AuditAction): string {
  return actionLabels[action];
}

export function formatAuditTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatAuditActorName(
  name: string | null,
  email: string | null,
): string {
  if (name?.trim()) return name.trim();
  if (email) return email.split("@")[0] ?? email;
  return "Unknown user";
}

export function formatAuditTableName(
  tableName: string | null,
  tableSlug: string,
): string {
  return tableName?.trim() || tableSlug;
}
