"use client";

import { Pencil } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { updateTableSettingsAction } from "@/app/actions/table";
import { CopyTableLinkIconButton } from "@/components/share-link-button";
import { Badge } from "@/components/ui/badge";
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
import { chipsToUsd, formatDate, formatUsd, totalBuyInChips } from "@/lib/format";
import type { TableState, TableStatus } from "@/lib/types";

const statusLabels: Record<TableStatus, string> = {
  OPEN: "Live",
  CASHING_OUT: "Chips",
  SETTLED: "Settled",
};

interface TableMetaProps {
  initialTable: TableState;
}

async function fetchTable(slug: string): Promise<TableState> {
  const response = await fetch(`/api/tables/${slug}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load table");
  return response.json();
}

export function TableMeta({ initialTable }: TableMetaProps) {
  const pathname = usePathname();
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [isPending, startTransition] = useTransition();

  const { data: table, mutate } = useSWR(
    `/api/tables/${initialTable.slug}`,
    () => fetchTable(initialTable.slug),
    {
      fallbackData: initialTable,
      refreshInterval: 5000,
    },
  );

  if (!table) return null;

  const isPlayersTab = pathname === `/t/${table.slug}`;
  const potChips = table.players.reduce(
    (sum, player) => sum + totalBuyInChips(player.buyIns),
    0,
  );
  const potUsd = chipsToUsd(potChips, table.chipsPerUsd);

  function handleOpenEdit() {
    setEditName(table.name ?? "");
    setEditDate(table.date);
    setEditOpen(true);
  }

  function handleSaveSettings() {
    if (!editName.trim()) {
      toast.error("Enter a table name");
      return;
    }

    if (!editDate) {
      toast.error("Enter a date");
      return;
    }

    startTransition(async () => {
      try {
        await updateTableSettingsAction({
          slug: table.slug,
          name: editName,
          date: editDate,
        });
        setEditOpen(false);
        toast.success("Table updated");
        mutate();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update table");
      }
    });
  }

  return (
    <>
      <div className="mx-auto max-w-lg px-4 pt-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-0.5">
            <h1 className="min-w-0 text-lg font-bold leading-snug tracking-tight">
              {table.name ?? "Poker table"}
            </h1>
            <CopyTableLinkIconButton slug={table.slug} tableName={table.name} />
            {isPlayersTab ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-5 shrink-0 text-muted-foreground/45 hover:text-muted-foreground"
                onClick={handleOpenEdit}
                aria-label="Edit table"
              >
                <Pencil className="size-3" />
              </Button>
            ) : null}
          </div>
          <Badge
            variant={table.status === "OPEN" ? "default" : "secondary"}
            className="mt-0.5 shrink-0"
          >
            {statusLabels[table.status]}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDate(table.date)} · {formatUsd(potUsd)} pot · {table.players.length}{" "}
          {table.players.length === 1 ? "player" : "players"}
        </p>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="table-name">Name</Label>
              <Input
                id="table-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="table-date">Date</Label>
              <Input
                id="table-date"
                type="date"
                value={editDate}
                onChange={(event) => setEditDate(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveSettings} disabled={isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
