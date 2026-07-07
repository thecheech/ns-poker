"use client";

import useSWR from "swr";
import { Check } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { markTransferPaidAction, undoTransferPaidAction } from "@/app/actions/table";
import { TableCallout } from "@/components/table/table-callout";
import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/format";
import { UNMATCHED_PLAYER_ID } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TableState } from "@/lib/types";

function transferPartyName(
  playerId: string,
  playerMap: Map<string, TableState["players"][number]>,
): string {
  if (playerId === UNMATCHED_PLAYER_ID) return "?";
  return playerMap.get(playerId)?.name ?? "Someone";
}

interface SettlementViewProps {
  initialTable: TableState;
}

async function fetchTable(slug: string): Promise<TableState> {
  const response = await fetch(`/api/tables/${slug}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load table");
  return response.json();
}

export function SettlementView({ initialTable }: SettlementViewProps) {
  const [isPending, startTransition] = useTransition();

  const { data: table, mutate } = useSWR(
    `/api/tables/${initialTable.slug}`,
    () => fetchTable(initialTable.slug),
    {
      fallbackData: initialTable,
      refreshInterval: 5000,
    },
  );

  if (!table) return null;

  if (table.status === "OPEN") {
    return (
      <div className="mx-auto max-w-lg px-4 pb-8 pt-4">
        <TableCallout
          message="Close the table and enter chip counts first."
          actionLabel="Go to Players"
          actionHref={`/t/${table.slug}`}
        />
      </div>
    );
  }

  if (table.status === "CASHING_OUT") {
    return (
      <div className="mx-auto max-w-lg px-4 pb-8 pt-4">
        <TableCallout
          message="Enter all chip counts, then compute settlement."
          actionLabel="Go to Chips"
          actionHref={`/t/${table.slug}/cash-out`}
          variant="default"
        />
      </div>
    );
  }

  const playerMap = new Map(table.players.map((player) => [player.id, player]));
  const pendingCount = table.transfers.filter((t) => t.status === "PENDING").length;
  const allPaid = pendingCount === 0 && table.transfers.length > 0;

  function handleMarkPaid(transferId: string) {
    startTransition(async () => {
      try {
        await markTransferPaidAction({ slug: table.slug, transferId });
        toast.success("Marked as paid");
        mutate();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update");
      }
    });
  }

  function handleUndoPaid(transferId: string) {
    startTransition(async () => {
      try {
        await undoTransferPaidAction({ slug: table.slug, transferId });
        toast.success("Marked as pending");
        mutate();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update");
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 pb-8 pt-4">
      <p className="text-sm text-muted-foreground">
        {table.transfers.length > 0
          ? allPaid
            ? "All paid."
            : `${pendingCount} pending — pay outside the app, then mark paid.`
          : "Everyone broke even."}
      </p>

      {table.transfers.length > 0 ? (
        <div className="divide-y divide-border/60 overflow-hidden rounded-xl border bg-card">
          {table.transfers.map((transfer) => {
            const isPaid = transfer.status === "PAID";
            const fromName = transferPartyName(transfer.fromPlayerId, playerMap);
            const toName = transferPartyName(transfer.toPlayerId, playerMap);

            return (
              <div
                key={transfer.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5",
                  isPaid && "opacity-60",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {fromName} → {toName}
                  </p>
                  <p className="text-xs text-primary tabular-nums">{formatUsd(transfer.amountUsd)}</p>
                </div>
                {isPaid ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 px-3 text-xs"
                    onClick={() => handleUndoPaid(transfer.id)}
                    disabled={isPending}
                  >
                    Undo
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 shrink-0 px-3 text-xs"
                    onClick={() => handleMarkPaid(transfer.id)}
                    disabled={isPending}
                  >
                    <Check className="size-3.5" />
                    Paid
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-card/50 px-4 py-8 text-center text-sm text-muted-foreground">
          No payments needed.
        </div>
      )}
    </div>
  );
}
