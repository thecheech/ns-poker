"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { createTableAction } from "@/app/actions/table";
import { Button } from "@/components/ui/button";
import { addRecentTable } from "@/lib/recent-tables";

export function CreateTableButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    startTransition(async () => {
      try {
        const { slug } = await createTableAction();
        addRecentTable({
          slug,
          name: null,
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
      className="h-14 w-full text-base font-semibold"
      onClick={handleCreate}
      disabled={isPending}
    >
      <Plus className="size-5" />
      {isPending ? "Creating..." : "Create table"}
    </Button>
  );
}
