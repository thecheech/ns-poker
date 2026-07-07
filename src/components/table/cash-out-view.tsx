"use client";

import Link from "next/link";
import useSWR from "swr";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  reopenTableAction,
  setCashOutAction,
  settleTableAction,
} from "@/app/actions/table";
import { promptGoogleSignIn, useCanEdit } from "@/components/auth/auth-button";
import { TableCallout } from "@/components/table/table-callout";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBuyInSummary, formatChips } from "@/lib/format";
import { validateChipBalance } from "@/lib/settlement";
import { cn } from "@/lib/utils";
import type { TableState } from "@/lib/types";

interface CashOutViewProps {
  initialTable: TableState;
}

async function fetchTable(slug: string): Promise<TableState> {
  const response = await fetch(`/api/tables/${slug}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load table");
  return response.json();
}

export function CashOutView({ initialTable }: CashOutViewProps) {
  const router = useRouter();
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
          message="Close the table on Buy-ins before entering chip counts."
          actionLabel="Go to Buy-ins"
          actionHref={`/t/${table.slug}`}
        />
      </div>
    );
  }

  const isSettled = table.status === "SETTLED";
  const balance = validateChipBalance(table.players);

  function handleCashOut(playerId: string, chips: number) {
    if (!canEdit) {
      promptGoogleSignIn();
      return;
    }

    startTransition(async () => {
      try {
        await setCashOutAction({ slug: table.slug, playerId, chips });
        mutate();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save cash-out");
      }
    });
  }

  function handleSettle() {
    if (!canEdit) {
      promptGoogleSignIn();
      return;
    }

    startTransition(async () => {
      try {
        await settleTableAction(table.slug);
        toast.success("Settlement ready!");
        router.push(`/t/${table.slug}/settlement`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not settle");
      }
    });
  }

  function handleReopen() {
    if (!canEdit) {
      promptGoogleSignIn();
      return;
    }

    startTransition(async () => {
      try {
        await reopenTableAction(table.slug);
        toast.success("Table reopened");
        router.push(`/t/${table.slug}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not reopen");
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 pb-8 pt-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">How many chips at the end of the night?</p>
        <p className="text-xs text-muted-foreground">
          Buy-ins {formatChips(balance.buyInTotal)} · Cash-outs {formatChips(balance.cashOutTotal)}
          {!balance.valid ? (
            <>
              {" "}
              ·{" "}
              <span className="text-destructive">
                Off by {formatChips(Math.abs(balance.difference))}
              </span>
            </>
          ) : (
            <> · Balanced</>
          )}
        </p>
      </div>

      <div className="divide-y divide-border/60 overflow-hidden rounded-xl border bg-card">
        {table.players.map((player) => (
          <div key={player.id} data-player-row className="flex items-center gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{player.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {formatBuyInSummary(player.buyIns)}
              </p>
            </div>
            <Input
              id={`cashout-${player.id}`}
              inputMode="numeric"
              defaultValue={player.cashOut?.chips ?? ""}
              placeholder="0"
              readOnly={!canEdit}
              aria-label={`Final chips for ${player.name}`}
              className="h-9 w-[4.5rem] shrink-0 px-2 text-center text-sm tabular-nums"
              onBlur={(event) => {
                if (!canEdit) return;
                const chips = Number(event.target.value);
                if (!Number.isFinite(chips) || chips < 0) return;
                if (player.cashOut?.chips === chips) return;
                handleCashOut(player.id, chips);
              }}
            />
          </div>
        ))}
      </div>

      {isSettled ? (
        <Link
          href={`/t/${table.slug}/settlement`}
          className={cn(buttonVariants(), "h-11 w-full gap-1.5")}
        >
          Go to Pay up
          <ArrowRight className="size-4" />
        </Link>
      ) : canEdit ? (
        <>
          <Button
            type="button"
            className="h-11 w-full"
            onClick={handleSettle}
            disabled={isPending}
          >
            Compute settlement
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full"
            onClick={handleReopen}
            disabled={isPending}
          >
            Reopen table
          </Button>
        </>
      ) : null}
    </div>
  );
}
