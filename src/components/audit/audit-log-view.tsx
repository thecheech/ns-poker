"use client";

import Link from "next/link";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import {
  formatAuditAction,
  formatAuditActorName,
  formatAuditTableName,
  formatAuditTimestamp,
} from "@/lib/audit-format";
import type { AuditEvent } from "@/lib/types";

interface AuditLogViewProps {
  initialEvents: AuditEvent[];
  tableSlug?: string;
  showTableColumn?: boolean;
}

async function fetchAuditEvents(tableSlug?: string): Promise<AuditEvent[]> {
  const params = new URLSearchParams();
  if (tableSlug) params.set("tableSlug", tableSlug);
  params.set("limit", "100");

  const response = await fetch(`/api/audit?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to load audit log");
  return response.json();
}

function ChangeValue({
  before,
  after,
}: {
  before: string | null;
  after: string | null;
}) {
  if (!before && !after) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (!before) {
    return (
      <span className="font-medium text-emerald-700 dark:text-emerald-400">
        {after}
      </span>
    );
  }

  if (!after) {
    return (
      <span className="text-muted-foreground line-through">{before}</span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="text-muted-foreground line-through">{before}</span>
      <span aria-hidden="true" className="text-muted-foreground">
        →
      </span>
      <span className="font-medium text-emerald-700 dark:text-emerald-400">
        {after}
      </span>
    </span>
  );
}

export function AuditLogView({
  initialEvents,
  tableSlug,
  showTableColumn = true,
}: AuditLogViewProps) {
  const swrKey = tableSlug ? `/api/audit?tableSlug=${tableSlug}` : "/api/audit";

  const { data: events } = useSWR(swrKey, () => fetchAuditEvents(tableSlug), {
    fallbackData: initialEvents,
    refreshInterval: 10_000,
  });

  if (!events?.length) {
    return (
      <div className="rounded-2xl border border-dashed bg-card/50 px-4 py-10 text-center">
        <p className="text-sm font-medium">No changes yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Edits from the last 7 days will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card/50">
      <ul className="divide-y divide-border/70">
        {events.map((event) => {
          const actor = formatAuditActorName(event.actorName, event.actorEmail);
          const tableLabel = formatAuditTableName(event.tableName, event.tableSlug);

          return (
            <li key={event.id} className="px-4 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="max-w-[12rem] truncate bg-amber-100 text-amber-950 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-100"
                      title={actor}
                    >
                      {actor}
                    </Badge>
                    {showTableColumn ? (
                      <Link
                        href={`/t/${event.tableSlug}`}
                        className="truncate font-medium text-primary hover:underline"
                        title={tableLabel}
                      >
                        {tableLabel}
                      </Link>
                    ) : null}
                    <span className="text-sm text-muted-foreground">
                      {formatAuditAction(event.action)}
                    </span>
                  </div>

                  <p className="text-sm">
                    {event.target ? (
                      <>
                        <span className="text-muted-foreground">Target: </span>
                        <span className="font-medium">{event.target}</span>
                        <span className="text-muted-foreground"> · </span>
                      </>
                    ) : null}
                    <ChangeValue before={event.before} after={event.after} />
                  </p>
                </div>

                <time
                  dateTime={event.timestamp}
                  className="shrink-0 text-xs text-muted-foreground"
                  title={new Date(event.timestamp).toLocaleString()}
                >
                  {formatAuditTimestamp(event.timestamp)}
                </time>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
