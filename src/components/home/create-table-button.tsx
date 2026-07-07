"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { createTableAction } from "@/app/actions/table";
import { promptGoogleSignIn, useCanEdit } from "@/components/auth/auth-button";
import { Button } from "@/components/ui/button";
import { addRecentTable } from "@/lib/recent-tables";

export function CreateTableButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canEdit = useCanEdit();

  function handleCreate() {
    if (!canEdit) {
      promptGoogleSignIn();
      return;
    }

    startTransition(async () => {
      try {
        const { slug, name } = await createTableAction();
        addRecentTable({
          slug,
          name,
          date: new Date().toISOString().slice(0, 10),
        });
        router.push(`/t/${slug}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not create table");
      }
    });
  }

  return (
    <Button
      type="button"
      className="glitch-button h-14 w-full text-base font-semibold shadow-[0_0_24px_oklch(0.72_0.17_155_/_18%)]"
      onClick={handleCreate}
      disabled={isPending}
    >
      <Plus className="size-5" />
      {isPending ? "Creating..." : "Create table"}
    </Button>
  );
}
