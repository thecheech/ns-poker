"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteTableAction } from "@/app/actions/table";
import { promptGoogleSignIn, useCanEdit } from "@/components/auth/auth-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { removeRecentTable } from "@/lib/recent-tables";
import { cn } from "@/lib/utils";

interface DeleteTableButtonProps {
  slug: string;
  tableName?: string | null;
  redirectTo?: string;
  variant?: "icon" | "text";
  className?: string;
}

function getConfirmTableName(tableName?: string | null): string {
  return tableName?.trim() || "Poker table";
}

export function DeleteTableButton({
  slug,
  tableName,
  redirectTo,
  variant = "icon",
  className,
}: DeleteTableButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();
  const canEdit = useCanEdit();
  const confirmName = getConfirmTableName(tableName);
  const canConfirm = confirmText === confirmName;

  function handleOpen() {
    if (!canEdit) {
      promptGoogleSignIn();
      return;
    }

    setConfirmText("");
    setOpen(true);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setConfirmText("");
  }

  function handleDelete() {
    if (!canConfirm) return;

    startTransition(async () => {
      try {
        await deleteTableAction(slug);
        removeRecentTable(slug);
        toast.success("Game deleted");
        setOpen(false);
        if (redirectTo) router.push(redirectTo);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not delete game");
      }
    });
  }

  if (!canEdit) {
    return null;
  }

  const trigger =
    variant === "text" ? (
      <Button
        type="button"
        variant="ghost"
        className={cn("text-destructive hover:text-destructive", className)}
        onClick={handleOpen}
        disabled={isPending}
      >
        <Trash2 className="size-4" />
        Delete game
      </Button>
    ) : (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          "size-9 shrink-0 text-muted-foreground/50 hover:text-destructive sm:size-8",
          className,
        )}
        onClick={handleOpen}
        disabled={isPending}
        aria-label="Delete game"
      >
        <Trash2 className="size-3.5 sm:size-3" />
      </Button>
    );

  return (
    <>
      {trigger}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This permanently deletes the game and cannot be undone. Type{" "}
              <span className="font-medium text-foreground">{confirmName}</span> to
              confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={`delete-table-${slug}`}>Table name</Label>
            <Input
              id={`delete-table-${slug}`}
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder={confirmName}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              onKeyDown={(event) => {
                if (event.key === "Enter" && canConfirm && !isPending) {
                  event.preventDefault();
                  handleDelete();
                }
              }}
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={!canConfirm || isPending}
            >
              Delete game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
