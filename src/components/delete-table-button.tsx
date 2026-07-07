"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteTableAction } from "@/app/actions/table";
import { promptGoogleSignIn, useCanEdit } from "@/components/auth/auth-button";
import { Button } from "@/components/ui/button";
import { removeRecentTable } from "@/lib/recent-tables";
import { cn } from "@/lib/utils";

interface DeleteTableButtonProps {
  slug: string;
  tableName?: string | null;
  redirectTo?: string;
  variant?: "icon" | "text";
  className?: string;
}

export function DeleteTableButton({
  slug,
  tableName,
  redirectTo,
  variant = "icon",
  className,
}: DeleteTableButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canEdit = useCanEdit();

  function handleDelete() {
    if (!canEdit) {
      promptGoogleSignIn();
      return;
    }

    const label = tableName?.trim() || "this game";
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;

    startTransition(async () => {
      try {
        await deleteTableAction(slug);
        removeRecentTable(slug);
        toast.success("Game deleted");
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

  if (variant === "text") {
    return (
      <Button
        type="button"
        variant="ghost"
        className={cn("text-destructive hover:text-destructive", className)}
        onClick={handleDelete}
        disabled={isPending}
      >
        <Trash2 className="size-4" />
        Delete game
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className={cn(
        "size-5 shrink-0 text-muted-foreground/45 hover:text-destructive",
        className,
      )}
      onClick={handleDelete}
      disabled={isPending}
      aria-label="Delete game"
    >
      <Trash2 className="size-3" />
    </Button>
  );
}
