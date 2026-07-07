"use client";

import useSWR from "swr";
import { Check } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { markTransferPaidAction, undoTransferPaidAction } from "@/app/actions/table";
import { promptGoogleSignIn, useCanEdit } from "@/components/auth/auth-button";
import { PaymentMethodDisplay } from "@/components/table/payment-method-display";
import { PaymentMethodSheet } from "@/components/table/payment-method-sheet";
import { TableCallout } from "@/components/table/table-callout";
import { Button } from "@/components/ui/button";
import { formatChips, formatUsd } from "@/lib/format";
import { UNMATCHED_PLAYER_ID } from "@/lib/constants";
import { validateChipBalance } from "@/lib/settlement";
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
  const canEdit = useCanEdit();

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
          actionLabel="Go to Buy-ins"
          actionHref={`/t/${table.slug}`}
        />
      </div>
    );
  }

  const balance = validateChipBalance(table.players);
  const playerMap = new Map(table.players.map((player) => [player.id, player]));
  const pendingCount = table.transfers.filter((t) => t.status === "PENDING").length;
  const allPaid = pendingCount === 0 && table.transfers.length > 0;

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
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 pb-8 pt-4">
      {!balance.valid ? (
        <p className="rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-sm text-amber-100">
          Chip counts are off by {formatChips(Math.abs(balance.difference))}. Payments
          below may change as counts are updated on Cash-out.
        </p>
      ) : null}

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
            const recipient = playerMap.get(transfer.toPlayerId);

            return (
              <div
                key={transfer.id}
                className={cn(
                  "space-y-2.5 px-3 py-3",
                  isPaid && "opacity-60",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 font-medium leading-snug">
                    {fromName} → {toName}
                  </p>
                  <p className="shrink-0 text-sm font-medium text-primary tabular-nums">
                    {formatUsd(transfer.amountUsd)}
                  </p>
                </div>
                {transfer.toPlayerId !== UNMATCHED_PLAYER_ID ? (
                  <PaymentMethodDisplay
                    recipientName={toName}
                    amountUsd={transfer.amountUsd}
                    methods={transfer.paymentMethods}
                  />
                ) : null}
                <div className="flex flex-wrap items-center justify-end gap-1.5">
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
                        <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-emerald-500 px-3 text-xs font-medium text-emerald-950">
                          <Check className="size-3.5" />
                          Paid
                        </span>
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
                      </>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 shrink-0 rounded-full bg-destructive px-3 text-xs font-medium text-white hover:bg-destructive/90"
                        onClick={() => handleMarkPaid(transfer.id)}
                        disabled={isPending}
                      >
                        Not paid yet
                      </Button>
                    )
                  ) : isPaid ? (
                    <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-emerald-500 px-3 text-xs font-medium text-emerald-950">
                      <Check className="size-3.5" />
                      Paid
                    </span>
                  ) : (
                    <span className="inline-flex h-8 shrink-0 items-center rounded-full bg-destructive px-3 text-xs font-medium text-white">
                      Not paid yet
                    </span>
                  )}
                </div>
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
