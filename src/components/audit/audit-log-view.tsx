"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatAuditAction,
  formatAuditActorName,
  formatAuditTableName,
  formatAuditTimestamp,
} from "@/lib/audit-format";
import type { AuditEventsResult } from "@/lib/audit";

const ALL_USERS_VALUE = "all";
const PAGE_SIZE = 20;

interface AuditLogViewProps {
  initialData: AuditEventsResult;
  tableSlug?: string;
  showTableColumn?: boolean;
}

function buildAuditUrl(options: {
  tableSlug?: string;
  actorId?: string;
  offset: number;
}): string {
  const params = new URLSearchParams();
  if (options.tableSlug) params.set("tableSlug", options.tableSlug);
  if (options.actorId) params.set("actorId", options.actorId);
  params.set("limit", String(PAGE_SIZE));
  params.set("offset", String(options.offset));
  return `/api/audit?${params.toString()}`;
}

async function fetchAuditData(url: string): Promise<AuditEventsResult> {
  const response = await fetch(url, { cache: "no-store" });
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

function formatPageRange(offset: number, count: number, total: number): string {
  if (total === 0) return "No entries";
  const start = offset + 1;
  const end = offset + count;
  return `${start}–${end} of ${total}`;
}

export function AuditLogView({
  initialData,
  tableSlug,
  showTableColumn = true,
}: AuditLogViewProps) {
  const [actorId, setActorId] = useState<string>(ALL_USERS_VALUE);
  const [offset, setOffset] = useState(0);

  const swrKey = useMemo(
    () =>
      buildAuditUrl({
        tableSlug,
        actorId: actorId === ALL_USERS_VALUE ? undefined : actorId,
        offset,
      }),
    [actorId, offset, tableSlug],
  );

  const { data } = useSWR(swrKey, () => fetchAuditData(swrKey), {
    fallbackData: initialData,
    refreshInterval: 10_000,
    keepPreviousData: true,
  });

  const events = data?.events ?? [];
  const total = data?.total ?? 0;
  const actors = data?.actors ?? [];
  const hasPreviousPage = offset > 0;
  const hasNextPage = offset + PAGE_SIZE < total;

  function handleActorChange(value: string | null) {
    setActorId(value ?? ALL_USERS_VALUE);
    setOffset(0);
  }

  return (
    <div className="space-y-3">
      {actors.length > 1 ? (
        <div className="space-y-1.5">
          <Label htmlFor="audit-user-filter" className="text-xs text-muted-foreground">
            Filter by user
          </Label>
          <Select value={actorId} onValueChange={handleActorChange}>
            <SelectTrigger
              id="audit-user-filter"
              className="h-10 w-full text-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_USERS_VALUE}>All users</SelectItem>
              {actors.map((actor) => (
                <SelectItem key={actor.id} value={actor.id}>
                  {formatAuditActorName(actor.name, actor.email)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {!events.length ? (
        <div className="rounded-2xl border border-dashed bg-card/50 px-4 py-10 text-center">
          <p className="text-sm font-medium">
            {actorId === ALL_USERS_VALUE ? "No changes yet" : "No matching changes"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {actorId === ALL_USERS_VALUE
              ? "Edits from the last 7 days will show up here."
              : "Try another user or clear the filter."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card/50">
          <ul className="divide-y divide-border/70">
            {events.map((event) => {
              const actor = formatAuditActorName(
                event.actorName,
                event.actorEmail,
              );
              const tableLabel = formatAuditTableName(
                event.tableName,
                event.tableSlug,
              );

              return (
                <li key={event.id} className="px-3.5 py-3 sm:px-4">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-sm leading-snug">
                        <span className="font-medium">{actor}</span>
                        {showTableColumn ? (
                          <>
                            <span className="text-muted-foreground"> · </span>
                            <Link
                              href={`/t/${event.tableSlug}`}
                              className="font-medium text-primary hover:underline"
                              title={tableLabel}
                            >
                              {tableLabel}
                            </Link>
                          </>
                        ) : null}
                      </p>
                      <time
                        dateTime={event.timestamp}
                        className="shrink-0 text-xs text-muted-foreground"
                        title={new Date(event.timestamp).toLocaleString()}
                      >
                        {formatAuditTimestamp(event.timestamp)}
                      </time>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {formatAuditAction(event.action)}
                    </p>

                    <p className="text-sm leading-snug">
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
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {total > PAGE_SIZE ? (
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasPreviousPage}
            onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
          >
            Previous
          </Button>
          <p className="text-xs text-muted-foreground">
            {formatPageRange(offset, events.length, total)}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasNextPage}
            onClick={() => setOffset((current) => current + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      ) : total > 0 ? (
        <p className="text-center text-xs text-muted-foreground">
          {formatPageRange(offset, events.length, total)}
        </p>
      ) : null}
    </div>
  );
}
