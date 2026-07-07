"use client";

import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addBuyInAction,
  deleteBuyInAction,
  deletePlayerAction,
  updateBuyInAction,
  updatePlayerAction,
} from "@/app/actions/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STANDARD_BUY_IN_CHIPS } from "@/lib/constants";
import { formatChips } from "@/lib/format";
import type { BuyIn, Player, TableState } from "@/lib/types";

function parseChipsDraft(draft: string): number | null {
  if (draft.trim() === "") return null;
  const chips = Number(draft);
  if (!Number.isFinite(chips) || chips <= 0) return null;
  return chips;
}

interface BuyInEditRowProps {
  buyIn: BuyIn;
  index: number;
  isPending: boolean;
  onSave: (buyInId: string, chips: number) => void;
  onDelete: (buyInId: string) => void;
}

function BuyInEditRow({ buyIn, index, isPending, onSave, onDelete }: BuyInEditRowProps) {
  const [draft, setDraft] = useState(() => String(buyIn.chips));

  useEffect(() => {
    setDraft(String(buyIn.chips));
  }, [buyIn.chips]);

  const parsed = parseChipsDraft(draft);
  const isValid = draft.trim() === "" || parsed !== null;
  const isDirty = parsed !== null && parsed !== buyIn.chips;

  function handleConfirm() {
    if (parsed === null) return;
    onSave(buyIn.id, parsed);
  }

  function handleDiscard() {
    setDraft(String(buyIn.chips));
  }

  return (
    <div className="flex items-center gap-2">
      <p className="min-w-0 flex-1 text-sm text-muted-foreground">Buy-in {index + 1}</p>
      <div className="flex shrink-0 items-center gap-1">
        {isDirty ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-primary"
              aria-label={`Save buy-in ${index + 1}`}
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
              aria-label={`Discard buy-in ${index + 1} changes`}
              disabled={isPending}
              onClick={handleDiscard}
            >
              <X />
            </Button>
          </>
        ) : null}
        <Input
          inputMode="numeric"
          value={draft}
          aria-label={`Buy-in ${index + 1} chips`}
          aria-invalid={!isValid}
          className="h-9 w-[5.5rem] shrink-0 px-2 text-center text-sm tabular-nums"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (!isDirty) return;
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
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-destructive"
          aria-label={`Remove buy-in ${index + 1}`}
          disabled={isPending}
          onClick={() => onDelete(buyIn.id)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

interface PlayerRowProps {
  slug: string;
  table: TableState;
  player: Player;
  editable?: boolean;
  onChange?: () => void;
}

export function PlayerRow({
  slug,
  table,
  player,
  editable = true,
  onChange,
}: PlayerRowProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [buyInsOpen, setBuyInsOpen] = useState(false);
  const [editName, setEditName] = useState(player.name);
  const [customBuyIn, setCustomBuyIn] = useState("");
  const [isPending, startTransition] = useTransition();

  const buyInCount = player.buyIns.length;
  const buyInTotal = player.buyIns.reduce((sum, buyIn) => sum + buyIn.chips, 0);
  const buyInLabel = buyInCount === 1 ? "buy-in" : "buy-ins";
  const sortedBuyIns = [...player.buyIns].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  function handleAddBuyIn(chips = STANDARD_BUY_IN_CHIPS) {
    startTransition(async () => {
      try {
        await addBuyInAction({ slug, playerId: player.id, chips });
        toast.success(`Added buy-in for ${player.name}`);
        onChange?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not add buy-in");
      }
    });
  }

  function handleAddStandardBuyIn() {
    handleAddBuyIn(STANDARD_BUY_IN_CHIPS);
  }

  function handleAddCustomBuyIn() {
    const chips = parseChipsDraft(customBuyIn);
    if (chips === null) {
      toast.error("Enter a valid chip amount");
      return;
    }

    startTransition(async () => {
      try {
        await addBuyInAction({ slug, playerId: player.id, chips });
        setCustomBuyIn("");
        toast.success(`Added buy-in for ${player.name}`);
        onChange?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not add buy-in");
      }
    });
  }

  function handleUpdateBuyIn(buyInId: string, chips: number) {
    startTransition(async () => {
      try {
        await updateBuyInAction({ slug, playerId: player.id, buyInId, chips });
        toast.success("Buy-in updated");
        onChange?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update buy-in");
      }
    });
  }

  function handleDeleteBuyIn(buyInId: string) {
    startTransition(async () => {
      try {
        await deleteBuyInAction({ slug, playerId: player.id, buyInId });
        toast.success("Buy-in removed");
        onChange?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not remove buy-in");
      }
    });
  }

  function handleSavePlayerEdit() {
    if (!editName.trim()) {
      toast.error("Enter a name");
      return;
    }

    startTransition(async () => {
      try {
        await updatePlayerAction({
          slug,
          playerId: player.id,
          name: editName,
        });
        setEditOpen(false);
        toast.success("Player updated");
        onChange?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update player");
      }
    });
  }

  function handleDeletePlayer() {
    startTransition(async () => {
      try {
        await deletePlayerAction({ slug, playerId: player.id });
        setEditOpen(false);
        toast.success(`${player.name} removed`);
        onChange?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not remove player");
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-0.5">
            <p className="truncate font-medium">{player.name}</p>
            {editable ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-5 shrink-0 text-muted-foreground/45 hover:text-muted-foreground"
                onClick={() => {
                  setEditName(player.name);
                  setEditOpen(true);
                }}
                aria-label={`Edit ${player.name}`}
              >
                <Pencil className="size-3" />
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {buyInCount} {buyInLabel}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <p className="text-sm font-semibold tabular-nums text-primary">
            {formatChips(buyInTotal)}
          </p>
          {editable ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="size-5 shrink-0 text-muted-foreground/45 hover:text-muted-foreground"
              onClick={() => setBuyInsOpen(true)}
              aria-label={`Edit buy-ins for ${player.name}`}
            >
              <Pencil className="size-3" />
            </Button>
          ) : null}
        </div>
        {editable ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 shrink-0 gap-1 px-2.5 text-xs"
            onClick={handleAddStandardBuyIn}
            disabled={isPending}
            aria-label={`Add ${formatChips(STANDARD_BUY_IN_CHIPS)} buy-in for ${player.name}`}
          >
            <Plus className="size-3.5" />
            {formatChips(STANDARD_BUY_IN_CHIPS)}
          </Button>
        ) : null}
      </div>

      <Dialog open={buyInsOpen} onOpenChange={setBuyInsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit buy-ins</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{player.name}</p>
          <div className="space-y-3">
            {sortedBuyIns.map((buyIn, index) => (
              <BuyInEditRow
                key={buyIn.id}
                buyIn={buyIn}
                index={index}
                isPending={isPending}
                onSave={handleUpdateBuyIn}
                onDelete={handleDeleteBuyIn}
              />
            ))}
          </div>
          <div className="space-y-2 border-t border-border/60 pt-3">
            <Label htmlFor={`custom-buyin-${player.id}`}>Add buy-in</Label>
            <div className="flex items-center gap-2">
              <Input
                id={`custom-buyin-${player.id}`}
                inputMode="numeric"
                placeholder={String(STANDARD_BUY_IN_CHIPS)}
                value={customBuyIn}
                className="tabular-nums"
                onChange={(event) => setCustomBuyIn(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddCustomBuyIn();
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0"
                disabled={isPending}
                onClick={handleAddCustomBuyIn}
              >
                Add
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-1"
              disabled={isPending}
              onClick={handleAddStandardBuyIn}
            >
              <Plus className="size-3.5" />
              Add {formatChips(STANDARD_BUY_IN_CHIPS)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit player</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={handleDeletePlayer}
              disabled={isPending}
            >
              <Trash2 className="size-4" />
              Delete player
            </Button>
            <Button onClick={handleSavePlayerEdit} disabled={isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
