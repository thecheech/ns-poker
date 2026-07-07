"use client";

import useSWR from "swr";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { toast } from "sonner";
import { reopenTableAction, startCashOutAction } from "@/app/actions/table";
import { AddPlayerForm } from "@/components/table/add-player-form";
import { PlayerRow } from "@/components/table/player-row";
import { TableCallout } from "@/components/table/table-callout";
import { Button } from "@/components/ui/button";
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

  const isOpen = table.status === "OPEN";
  const sortedPlayers = [...table.players].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  function handlePlayerAdded() {
    mutate();
  }

  function handleCloseTable() {
    startTransition(async () => {
      try {
        await startCashOutAction(table.slug);
        router.push(`/t/${table.slug}/cash-out`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not close table");
      }
    });
  }

  function handleReopenTable() {
    startTransition(async () => {
      try {
        await reopenTableAction(table.slug);
        toast.success("Table reopened");
        mutate();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not reopen table");
      }
    });
  }

  function reopenTableButton() {
    return (
      <Button
        type="button"
        variant="outline"
        className="h-10 flex-1"
        onClick={handleReopenTable}
        disabled={isPending}
      >
        Reopen table
      </Button>
    );
  }

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
                editable={isOpen}
                onChange={() => mutate()}
              />
            ))}
          </div>
          {isOpen ? (
            <div className="border-t border-dashed border-border/60 px-3 py-2.5">
              <AddPlayerForm slug={table.slug} onAdded={handlePlayerAdded} />
            </div>
          ) : null}
        </div>
      ) : isOpen ? (
        <div className="overflow-hidden rounded-xl border border-dashed bg-card/50 px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">No players yet.</p>
          <div className="mt-3">
            <AddPlayerForm slug={table.slug} onAdded={handlePlayerAdded} />
          </div>
        </div>
      ) : (
        <TableCallout
          message="Table closed. Enter end-of-night chip counts next."
          actionLabel="Go to Chips"
          actionHref={`/t/${table.slug}/cash-out`}
          secondaryAction={reopenTableButton()}
        />
      )}

      {isOpen && table.players.length > 0 ? (
        <Button
          type="button"
          variant="secondary"
          className="h-11 w-full text-base"
          onClick={handleCloseTable}
          disabled={isPending}
        >
          Close table
          <ArrowRight className="size-4" />
        </Button>
      ) : sortedPlayers.length > 0 ? (
        <TableCallout
          message="Table closed. Enter end-of-night chip counts next."
          actionLabel="Go to Chips"
          actionHref={`/t/${table.slug}/cash-out`}
          variant="default"
          secondaryAction={reopenTableButton()}
        />
      ) : null}
    </div>
  );
}
