"use client";

import useSWR from "swr";
import { Check } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { markTransferPaidAction, undoTransferPaidAction } from "@/app/actions/table";
import { promptGoogleSignIn, useCanEdit } from "@/components/auth/auth-button";
import { PaymentMethodDisplay } from "@/components/table/payment-method-display";
import { PaymentMethodSheet } from "@/components/table/payment-method-sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatChips, formatUsd } from "@/lib/format";
import { UNMATCHED_PLAYER_ID } from "@/lib/constants";
import { validateChipBalance } from "@/lib/settlement";
import { primaryPaymentMethod } from "@/lib/payments";
import { cn } from "@/lib/utils";
import type { TableState } from "@/lib/types";

const ALL_PLAYERS_VALUE = "all";

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
  const [playerFilter, setPlayerFilter] = useState(ALL_PLAYERS_VALUE);
  const [isPending, startTransition] = useTransition();
  const canEdit = useCanEdit();

  const { data: table, mutate } = useSWR(
    `/api/tables/${initialTable.slug}`,
    () => fetchTable(initialTable.slug),
    {
      fallbackData: initialTable,
      refreshInterval: 5000,
    },
  );

  const playerMap = useMemo(
    () => new Map((table?.players ?? []).map((player) => [player.id, player])),
    [table?.players],
  );

  const filterPlayers = useMemo(() => {
    if (!table) return [];

    const ids = new Set<string>();
    for (const transfer of table.transfers) {
      if (transfer.fromPlayerId !== UNMATCHED_PLAYER_ID) {
        ids.add(transfer.fromPlayerId);
      }
      if (transfer.toPlayerId !== UNMATCHED_PLAYER_ID) {
        ids.add(transfer.toPlayerId);
      }
    }

    return [...ids]
      .map((id) => ({
        id,
        name: playerMap.get(id)?.name ?? "Someone",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [table, playerMap]);

  const filteredTransfers = useMemo(() => {
    if (!table) return [];
    if (playerFilter === ALL_PLAYERS_VALUE) return table.transfers;
    return table.transfers.filter(
      (transfer) =>
        transfer.fromPlayerId === playerFilter ||
        transfer.toPlayerId === playerFilter,
    );
  }, [table, playerFilter]);

  const playerTotals = useMemo(() => {
    if (playerFilter === ALL_PLAYERS_VALUE) return null;

    let receive = 0;
    let pay = 0;
    for (const transfer of filteredTransfers) {
      if (transfer.toPlayerId === playerFilter) receive += transfer.amountUsd;
      if (transfer.fromPlayerId === playerFilter) pay += transfer.amountUsd;
    }

    return { receive, pay };
  }, [filteredTransfers, playerFilter]);

  const selectedPlayerName =
    playerFilter === ALL_PLAYERS_VALUE
      ? "All players"
      : (filterPlayers.find((player) => player.id === playerFilter)?.name ??
        transferPartyName(playerFilter, playerMap));

  if (!table) return null;

  const balance = validateChipBalance(table.players);
  const pendingCount = filteredTransfers.filter((t) => t.status === "PENDING").length;
  const allPaid = pendingCount === 0 && filteredTransfers.length > 0;

  function handleMarkPaid(transferId: string) {
    if (!canEdit) {
      promptGoogleSignIn();
      return;
    }

    startTransition(async () => {
      const paidAt = new Date().toISOString();
      const optimisticTable: TableState = {
        ...table,
        transfers: table.transfers.map((item) =>
          item.id === transferId
            ? { ...item, status: "PAID", paidAt }
            : item,
        ),
      };

      try {
        await mutate(optimisticTable, { revalidate: false });
        await markTransferPaidAction({ slug: table.slug, transferId });
        toast.success("Marked as paid");
        await mutate();
      } catch (error) {
        await mutate();
        toast.error(error instanceof Error ? error.message : "Could not update");
      }
    });
  }

  function handleUndoPaid(transferId: string) {
    if (!canEdit) {
      promptGoogleSignIn();
      return;
    }

    startTransition(async () => {
      const optimisticTable: TableState = {
        ...table,
        transfers: table.transfers.map((item) =>
          item.id === transferId
            ? { ...item, status: "PENDING", paidAt: null }
            : item,
        ),
      };

      try {
        await mutate(optimisticTable, { revalidate: false });
        await undoTransferPaidAction({ slug: table.slug, transferId });
        toast.success("Marked as pending");
        await mutate();
      } catch (error) {
        await mutate();
        toast.error(error instanceof Error ? error.message : "Could not update");
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3 px-4 pb-8 pt-4">
      {!balance.valid ? (
        <p className="rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-sm text-amber-100">
          Chip counts are off by {formatChips(Math.abs(balance.difference))}. Payments
          below may change as counts are updated on Cash-out.
        </p>
      ) : null}

      <p className="text-sm text-muted-foreground">
        {table.transfers.length > 0
          ? filteredTransfers.length > 0
            ? allPaid
              ? playerFilter === ALL_PLAYERS_VALUE
                ? "All paid."
                : "All filtered payments paid."
              : `${pendingCount} pending — pay outside the app, then mark paid.`
            : "No matching payments."
          : "Everyone broke even."}
      </p>

      {table.transfers.length > 0 && filterPlayers.length > 1 ? (
        <div className="space-y-1.5">
          <Label htmlFor="settlement-player-filter" className="text-xs text-muted-foreground">
            Filter by player
          </Label>
          <Select value={playerFilter} onValueChange={(value) => setPlayerFilter(value ?? ALL_PLAYERS_VALUE)}>
            <SelectTrigger id="settlement-player-filter" className="h-9 w-full text-sm">
              <SelectValue placeholder="All players">
                {() => selectedPlayerName}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PLAYERS_VALUE}>All players</SelectItem>
              {filterPlayers.map((player) => (
                <SelectItem key={player.id} value={player.id}>
                  {player.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {playerTotals ? (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-emerald-400">
            Receive {formatUsd(playerTotals.receive)}
          </span>
          <span className="text-destructive">
            Pay {formatUsd(playerTotals.pay)}
          </span>
        </div>
      ) : null}

      {filteredTransfers.length > 0 ? (
        <div className="divide-y divide-border/60 overflow-hidden rounded-xl border bg-card">
          {filteredTransfers.map((transfer) => {
            const isPaid = transfer.status === "PAID";
            const fromName = transferPartyName(transfer.fromPlayerId, playerMap);
            const toName = transferPartyName(transfer.toPlayerId, playerMap);
            const recipient = playerMap.get(transfer.toPlayerId);

            return (
              <div
                key={transfer.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2",
                  isPaid && "opacity-60",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {fromName} → {toName}
                  </p>
                  {transfer.toPlayerId !== UNMATCHED_PLAYER_ID ? (
                    <PaymentMethodDisplay
                      compact
                      recipientName={toName}
                      amountUsd={transfer.amountUsd}
                      method={primaryPaymentMethod(transfer.paymentMethods)}
                    />
                  ) : null}
                </div>
                <p className="shrink-0 text-sm font-medium text-primary tabular-nums">
                  {formatUsd(transfer.amountUsd)}
                </p>
                <div className="flex shrink-0 items-center gap-1">
                  {recipient ? (
                    <PaymentMethodSheet
                      slug={table.slug}
                      player={recipient}
                      onSaved={() => mutate()}
                    />
                  ) : null}
                  {canEdit ? (
                    isPaid ? (
                      <>
                        <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-emerald-500 px-2.5 text-xs font-medium text-emerald-950">
                          <Check className="size-3" />
                          Paid
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 shrink-0 px-2.5 text-xs"
                          onClick={() => handleUndoPaid(transfer.id)}
                          disabled={isPending}
                        >
                          Undo
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 shrink-0 rounded-full bg-destructive px-2.5 text-xs font-medium text-white hover:bg-destructive/90"
                        onClick={() => handleMarkPaid(transfer.id)}
                        disabled={isPending}
                      >
                        Pending
                      </Button>
                    )
                  ) : isPaid ? (
                    <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-emerald-500 px-2.5 text-xs font-medium text-emerald-950">
                      <Check className="size-3" />
                      Paid
                    </span>
                  ) : (
                    <span className="inline-flex h-7 shrink-0 items-center rounded-full bg-destructive px-2.5 text-xs font-medium text-white">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : table.transfers.length > 0 ? (
        <div className="rounded-xl border border-dashed bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
          No payments for this player.
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
          No payments needed.
        </div>
      )}
    </div>
  );
}
