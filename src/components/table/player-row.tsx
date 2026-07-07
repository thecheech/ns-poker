"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addStandardBuyInAction,
  deletePlayerAction,
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
import type { Player, TableState } from "@/lib/types";

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
  const [editName, setEditName] = useState(player.name);
  const [isPending, startTransition] = useTransition();

  const buyInCount = player.buyIns.length;
  const buyInTotal = player.buyIns.reduce((sum, buyIn) => sum + buyIn.chips, 0);
  const buyInLabel = buyInCount === 1 ? "buy-in" : "buy-ins";

  function handleAddBuyIn() {
    startTransition(async () => {
      try {
        await addStandardBuyInAction({ slug, playerId: player.id });
        toast.success(`Added buy-in for ${player.name}`);
        onChange?.();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not add buy-in");
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
        <p className="shrink-0 text-sm font-semibold tabular-nums text-primary">
          {formatChips(buyInTotal)}
        </p>
        {editable ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 shrink-0 gap-1 px-2.5 text-xs"
            onClick={handleAddBuyIn}
            disabled={isPending}
            aria-label={`Add ${formatChips(STANDARD_BUY_IN_CHIPS)} buy-in for ${player.name}`}
          >
            <Plus className="size-3.5" />
            {formatChips(STANDARD_BUY_IN_CHIPS)}
          </Button>
        ) : null}
      </div>

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
