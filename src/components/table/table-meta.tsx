"use client";

import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { chipsToUsd, formatDate, formatUsd, totalBuyInChips } from "@/lib/format";
import type { TableState, TableStatus } from "@/lib/types";

const statusLabels: Record<TableStatus, string> = {
  OPEN: "Live",
  CASHING_OUT: "Chips",
  SETTLED: "Settled",
};

interface TableMetaProps {
  initialTable: TableState;
}

async function fetchTable(slug: string): Promise<TableState> {
  const response = await fetch(`/api/tables/${slug}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load table");
  return response.json();
}

export function TableMeta({ initialTable }: TableMetaProps) {
  const { data: table } = useSWR(
    `/api/tables/${initialTable.slug}`,
    () => fetchTable(initialTable.slug),
    {
      fallbackData: initialTable,
      refreshInterval: 5000,
    },
  );

  if (!table) return null;

  const potChips = table.players.reduce(
    (sum, player) => sum + totalBuyInChips(player.buyIns),
    0,
  );
  const potUsd = chipsToUsd(potChips, table.chipsPerUsd);

  return (
    <div className="mx-auto max-w-lg px-4 pt-2">
      <div className="flex items-start justify-between gap-3">
        <h1 className="min-w-0 text-lg font-bold leading-snug tracking-tight">
          {table.name ?? "Poker table"}
        </h1>
        <Badge
          variant={table.status === "OPEN" ? "default" : "secondary"}
          className="mt-0.5 shrink-0"
        >
          {statusLabels[table.status]}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatDate(table.date)} · {formatUsd(potUsd)} pot · {table.players.length}{" "}
        {table.players.length === 1 ? "player" : "players"}
      </p>
    </div>
  );
}
