"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DeleteTableButton } from "@/components/delete-table-button";
import { formatDate, formatUsd } from "@/lib/format";
import type { RecentTableSummary } from "@/lib/store";

interface RecentTableRowProps {
  table: RecentTableSummary;
}

export function RecentTableRow({ table }: RecentTableRowProps) {
  const playerLabel = table.playerCount === 1 ? "1 player" : `${table.playerCount} players`;

  return (
    <div className="flex items-center rounded-2xl border bg-card transition-colors hover:bg-accent/40">
      <Link
        href={`/t/${table.slug}`}
        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{table.name ?? "Poker table"}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{formatDate(table.date)}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {playerLabel} · {formatUsd(table.potUsd)} pot · {table.closedLabel} ·{" "}
            {table.paymentsLabel}
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
      </Link>
      <DeleteTableButton
        slug={table.slug}
        tableName={table.name}
        className="mr-3"
      />
    </div>
  );
}
