"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useSyncExternalStore } from "react";
import { formatDate } from "@/lib/format";
import {
  getRecentTables,
  getRecentTablesServerSnapshot,
} from "@/lib/recent-tables";

function subscribeToRecentTables(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener("ns-poker-storage", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("ns-poker-storage", handler);
  };
}

export function RecentTablesList() {
  const tables = useSyncExternalStore(
    subscribeToRecentTables,
    getRecentTables,
    getRecentTablesServerSnapshot,
  );

  if (tables.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
        Tables you create or join will show up here on this device.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {tables.map((table) => (
        <Link
          key={table.slug}
          href={`/t/${table.slug}`}
          className="flex items-center justify-between rounded-2xl border bg-card px-4 py-4 transition-colors hover:bg-accent/40"
        >
          <div>
            <p className="font-medium">{table.name ?? "Poker table"}</p>
            <p className="text-sm text-muted-foreground">{formatDate(table.date)}</p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}
