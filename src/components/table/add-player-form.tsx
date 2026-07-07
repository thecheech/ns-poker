"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addPlayerAction } from "@/app/actions/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddPlayerFormProps {
  slug: string;
  onAdded: () => void;
}

export function AddPlayerForm({ slug, onAdded }: AddPlayerFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("Enter a name");
      return;
    }

    startTransition(async () => {
      try {
        await addPlayerAction({ slug, name });
        toast.success("Player added");
        setName("");
        setOpen(false);
        onAdded();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not add player");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        className="w-full text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        + Add player
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        id="add-player-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Name"
        className="h-10 flex-1 text-base"
        autoComplete="off"
        autoFocus
      />
      <Button type="submit" size="sm" className="h-10 px-4" disabled={isPending}>
        {isPending ? "..." : "Add"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-10 px-2 text-muted-foreground"
        onClick={() => {
          setOpen(false);
          setName("");
        }}
      >
        Cancel
      </Button>
    </form>
  );
}
