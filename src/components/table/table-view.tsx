"use client";

import useSWR from "swr";
import { useEffect } from "react";
import { AddPlayerForm } from "@/components/table/add-player-form";
import { PlayerRow } from "@/components/table/player-row";
import { useCanEdit } from "@/components/auth/auth-button";
import { addRecentTable } from "@/lib/recent-tables";
import type { TableState } from "@/lib/types";

interface TableViewProps {
  initialTable: TableState;
}

async function fetchTable(slug: string): Promise<TableState> {
  const response = await fetch(`/api/tables/${slug}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load table");
  }
  return response.json();
}

export function TableView({ initialTable }: TableViewProps) {
  const canEdit = useCanEdit();

  const { data: table, mutate } = useSWR(
    `/api/tables/${initialTable.slug}`,
    () => fetchTable(initialTable.slug),
    {
      fallbackData: initialTable,
      refreshInterval: 5000,
      revalidateOnFocus: true,
    },
  );

  useEffect(() => {
    addRecentTable({
      slug: initialTable.slug,
      name: initialTable.name,
      date: initialTable.date,
    });
  }, [initialTable.slug, initialTable.name, initialTable.date]);

  if (!table) return null;

  const sortedPlayers = [...table.players].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  function handlePlayerAdded() {
    mutate();
  }

  const isEditable = canEdit;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 pb-8 pt-4">
      {sortedPlayers.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="divide-y divide-border/60">
            {sortedPlayers.map((player) => (
              <PlayerRow
                key={player.id}
                slug={table.slug}
                table={table}
                player={player}
                editable={isEditable}
                onChange={() => mutate()}
              />
            ))}
          </div>
          {isEditable ? (
            <div className="border-t border-dashed border-border/60 px-3 py-2.5">
              <AddPlayerForm slug={table.slug} onAdded={handlePlayerAdded} />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-dashed bg-card/50 px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">No players yet.</p>
          {isEditable ? (
            <div className="mt-3">
              <AddPlayerForm slug={table.slug} onAdded={handlePlayerAdded} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
