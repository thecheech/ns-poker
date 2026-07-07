"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DeleteTableButton } from "@/components/delete-table-button";
import { formatDate, formatUsd } from "@/lib/format";
import type { RecentTableSummary } from "@/lib/store";

interface RecentTableRowProps {
  table: RecentTableSummary;
}

function SettlementLine({ table }: { table: RecentTableSummary }) {
  const { settlementPhase } = table;

  if (settlementPhase === "not_started") {
    return null;
  }

  if (settlementPhase === "entering_counts") {
    return <p className="mt-1 text-xs text-muted-foreground">Entering counts</p>;
  }

  if (settlementPhase === "all_even") {
    return <p className="mt-1 text-xs text-muted-foreground">All even</p>;
  }

  if (settlementPhase === "complete") {
    return (
      <p className="mt-1 text-xs text-muted-foreground">
        {formatUsd(table.settledUsd)} settled · All paid
      </p>
    );
  }

  return (
    <div className="mt-1.5 space-y-1">
      <div
        className="h-1 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={table.settledPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-emerald-500/80"
          style={{ width: `${table.settledPercent}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {formatUsd(table.settledUsd)} settled · {formatUsd(table.unsettledUsd)} unpaid ·{" "}
        {table.settledPercent}%
      </p>
    </div>
  );
}

export function RecentTableRow({ table }: RecentTableRowProps) {
  const playerLabel = table.playerCount === 1 ? "1 player" : `${table.playerCount} players`;

  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border bg-card transition-colors hover:bg-accent/40 sm:rounded-2xl">
      <Link
        href={`/t/${table.slug}`}
        className="flex min-w-0 flex-1 items-center gap-2 px-3.5 py-3 active:bg-accent/30 sm:gap-3 sm:px-4 sm:py-3.5"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.9375rem] font-medium sm:text-base">
            {table.name ?? "Poker table"}
          </p>
          <p className="mt-0.5 text-[0.8125rem] text-muted-foreground sm:text-sm">
            {formatDate(table.date)}
          </p>
          <p className="mt-1.5 text-[0.8125rem] leading-snug text-muted-foreground sm:mt-1 sm:text-xs">
            {playerLabel} · {formatUsd(table.potUsd)} pot · {table.closedLabel}
          </p>
          <SettlementLine table={table} />
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground/70 sm:size-5" />
      </Link>
      <div className="flex shrink-0 items-center border-l border-border/50 px-1 sm:px-1.5">
        <DeleteTableButton slug={table.slug} tableName={table.name} />
      </div>
    </div>
  );
}
