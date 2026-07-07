"use client";

import useSWR from "swr";
import { Check, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { setCashOutAction } from "@/app/actions/table";
import { promptGoogleSignIn, useCanEdit } from "@/components/auth/auth-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBuyInSummary, formatChips } from "@/lib/format";
import { validateChipBalance } from "@/lib/settlement";
import type { Player, TableState } from "@/lib/types";

const UNENTERED_CASH_OUT = "?";

function savedChips(player: Player): number | null {
  return player.cashOut?.chips ?? null;
}

function chipsToDraft(chips: number | null): string {
  return chips === null ? UNENTERED_CASH_OUT : String(chips);
}

function parseDraft(draft: string): number | null {
  const trimmed = draft.trim();
  if (trimmed === "" || trimmed === UNENTERED_CASH_OUT) return null;
  const chips = Number(trimmed);
  if (!Number.isFinite(chips) || chips < 0) return null;
  return chips;
}

interface CashOutPlayerRowProps {
  player: Player;
  canEdit: boolean;
  isPending: boolean;
  onSave: (playerId: string, chips: number) => void;
}

function CashOutPlayerRow({ player, canEdit, isPending, onSave }: CashOutPlayerRowProps) {
  const saved = savedChips(player);
  const [draft, setDraft] = useState(() => chipsToDraft(saved));

  useEffect(() => {
    setDraft(chipsToDraft(savedChips(player)));
  }, [player.cashOut?.chips]);

  const parsed = parseDraft(draft);
  const isUnentered = saved === null && draft === UNENTERED_CASH_OUT;
  const isValid =
    draft.trim() === "" ||
    draft.trim() === UNENTERED_CASH_OUT ||
    parsed !== null;
  const isDirty = saved === null ? parsed !== null : parsed !== saved;

  function handleConfirm() {
    if (parsed === null) return;
    onSave(player.id, parsed);
  }

  function handleDiscard() {
    setDraft(chipsToDraft(saved));
  }

  function handleFocus() {
    if (draft === UNENTERED_CASH_OUT) {
      setDraft("");
    }
  }

  function handleBlur() {
    if (saved === null && draft.trim() === "") {
      setDraft(UNENTERED_CASH_OUT);
    }
  }

  return (
    <div data-player-row className="flex items-center gap-3 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{player.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {formatBuyInSummary(player.buyIns)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {canEdit && isDirty ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-primary"
              aria-label={`Save chips for ${player.name}`}
              disabled={isPending || !isValid}
              onClick={handleConfirm}
            >
              <Check />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-destructive"
              aria-label={`Discard changes for ${player.name}`}
              disabled={isPending}
              onClick={handleDiscard}
            >
              <X />
            </Button>
          </>
        ) : null}
        <Input
          id={`cashout-${player.id}`}
          inputMode="numeric"
          value={draft}
          placeholder={UNENTERED_CASH_OUT}
          readOnly={!canEdit}
          aria-label={`Final chips for ${player.name}`}
          aria-invalid={!isValid}
          className={
            isUnentered
              ? "h-9 w-[4.5rem] shrink-0 px-2 text-center text-sm text-muted-foreground"
              : "h-9 w-[4.5rem] shrink-0 px-2 text-center text-sm tabular-nums"
          }
          onChange={(event) => setDraft(event.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={(event) => {
            if (!canEdit || !isDirty) return;
            if (event.key === "Enter") {
              event.preventDefault();
              handleConfirm();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              handleDiscard();
            }
          }}
        />
      </div>
    </div>
  );
}

interface CashOutViewProps {
  initialTable: TableState;
}

async function fetchTable(slug: string): Promise<TableState> {
  const response = await fetch(`/api/tables/${slug}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load table");
  return response.json();
}

export function CashOutView({ initialTable }: CashOutViewProps) {
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
          <CashOutPlayerRow
            key={player.id}
            player={player}
            canEdit={canEdit}
            isPending={isPending}
            onSave={handleCashOut}
          />
        ))}
      </div>
    </div>
  );
}
