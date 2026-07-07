"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { recordAuditEvent } from "@/lib/audit";
import { requireAuth } from "@/lib/auth";
import { STANDARD_BUY_IN_CHIPS } from "@/lib/constants";
import { formatChips, formatDate, formatUsd } from "@/lib/format";
import {
  defaultPaymentMethods,
  formatPaymentMethodsAuditSummary,
  normalizePaymentMethods,
  validatePaymentMethods,
} from "@/lib/payments";
import { computeTransfers } from "@/lib/settlement";
import { createTable, deleteTable, getTable, updateTable } from "@/lib/store";
import type { PaymentMethod, TableState } from "@/lib/types";

function revalidateTable(slug: string) {
  revalidatePath(`/t/${slug}`);
  revalidatePath(`/t/${slug}/cash-out`);
  revalidatePath(`/t/${slug}/settlement`);
  revalidatePath(`/t/${slug}/audit`);
  revalidatePath("/audit");
}

function playerName(table: TableState, playerId: string): string {
  return table.players.find((player) => player.id === playerId)?.name ?? "Unknown";
}

function transferSummary(
  table: TableState,
  transferId: string,
): { from: string; to: string; amount: string } | null {
  const transfer = table.transfers.find((item) => item.id === transferId);
  if (!transfer) return null;

  const from = playerName(table, transfer.fromPlayerId);
  const to = playerName(table, transfer.toPlayerId);
  const amount = formatUsd(transfer.amountUsd);
  return { from, to, amount };
}

export async function createTableAction(): Promise<{ slug: string; name: string }> {
  const actor = await requireAuth();
  const table = await createTable();

  await recordAuditEvent({
    action: "table.created",
    actor,
    tableSlug: table.slug,
    tableName: table.name,
    summary: "Created table",
    after: table.name,
  });

  revalidatePath("/audit");
  return { slug: table.slug, name: table.name ?? table.slug };
}

export async function getTableAction(slug: string): Promise<TableState | null> {
  return getTable(slug);
}

export async function deleteTableAction(slug: string): Promise<void> {
  const actor = await requireAuth();
  const table = await getTable(slug);
  if (!table) {
    throw new Error("Table not found");
  }

  await recordAuditEvent({
    action: "table.deleted",
    actor,
    tableSlug: slug,
    tableName: table.name,
    summary: "Deleted table",
    before: table.name,
    after: null,
  });

  await deleteTable(slug);
  revalidatePath("/");
  revalidateTable(slug);
}

export async function addPlayerAction(input: {
  slug: string;
  name: string;
  paymentMethods?: PaymentMethod[];
}): Promise<{ playerId: string }> {
  const actor = await requireAuth();
  const table = await getTable(input.slug);
  if (!table) {
    throw new Error("Table not found");
  }

  const paymentMethods = normalizePaymentMethods(
    input.paymentMethods?.length ? input.paymentMethods : defaultPaymentMethods(),
  );

  const playerId = nanoid();
  const now = new Date().toISOString();
  const playerNameValue = input.name.trim();

  await updateTable(input.slug, (current) => {
    return {
      ...current,
      players: [
        ...current.players,
        {
          id: playerId,
          name: playerNameValue,
          paymentMethods,
          buyIns: [
            {
              id: nanoid(),
              chips: STANDARD_BUY_IN_CHIPS,
              createdAt: now,
            },
          ],
          cashOut: null,
        },
      ],
    };
  });

  await recordAuditEvent({
    action: "player.added",
    actor,
    tableSlug: input.slug,
    tableName: table.name,
    summary: "Added player",
    before: null,
    after: `${playerNameValue} (${formatChips(STANDARD_BUY_IN_CHIPS)} chips)`,
    target: playerNameValue,
  });

  revalidateTable(input.slug);
  return { playerId };
}

export async function updatePlayerAction(input: {
  slug: string;
  playerId: string;
  name: string;
}): Promise<void> {
  const actor = await requireAuth();
  const table = await getTable(input.slug);
  if (!table) {
    throw new Error("Table not found");
  }

  const existing = table.players.find((player) => player.id === input.playerId);
  if (!existing) {
    throw new Error("Player not found");
  }

  const nextName = input.name.trim();

  await updateTable(input.slug, (current) => {
    return {
      ...current,
      players: current.players.map((player) =>
        player.id === input.playerId
          ? {
              ...player,
              name: nextName,
            }
          : player,
      ),
    };
  });

  await recordAuditEvent({
    action: "player.renamed",
    actor,
    tableSlug: input.slug,
    tableName: table.name,
    summary: "Renamed player",
    before: existing.name,
    after: nextName,
    target: existing.name,
  });

  revalidateTable(input.slug);
}

export async function updatePlayerPaymentMethodsAction(input: {
  slug: string;
  playerId: string;
  paymentMethods: PaymentMethod[];
}): Promise<void> {
  const actor = await requireAuth();
  const table = await getTable(input.slug);
  if (!table) {
    throw new Error("Table not found");
  }

  const existing = table.players.find((player) => player.id === input.playerId);
  if (!existing) {
    throw new Error("Player not found");
  }

  const paymentMethods = normalizePaymentMethods(input.paymentMethods);
  const validationError = validatePaymentMethods(paymentMethods);
  if (validationError) {
    throw new Error(validationError);
  }

  await updateTable(input.slug, (current) => {
    const players = current.players.map((player) =>
      player.id === input.playerId ? { ...player, paymentMethods } : player,
    );

    const transfers = current.transfers.map((transfer) =>
      transfer.toPlayerId === input.playerId
        ? { ...transfer, paymentMethods }
        : transfer,
    );

    return {
      ...current,
      players,
      transfers,
    };
  });

  await recordAuditEvent({
    action: "table.settings_updated",
    actor,
    tableSlug: input.slug,
    tableName: table.name,
    summary: "Updated payment methods",
    before: formatPaymentMethodsAuditSummary(existing.paymentMethods),
    after: formatPaymentMethodsAuditSummary(paymentMethods),
    target: existing.name,
  });

  revalidateTable(input.slug);
}

export async function deletePlayerAction(input: {
  slug: string;
  playerId: string;
}): Promise<void> {
  const actor = await requireAuth();
  const table = await getTable(input.slug);
  if (!table) {
    throw new Error("Table not found");
  }

  const existing = table.players.find((player) => player.id === input.playerId);
  if (!existing) {
    throw new Error("Player not found");
  }

  await updateTable(input.slug, (current) => {
    return {
      ...current,
      players: current.players.filter((player) => player.id !== input.playerId),
    };
  });

  await recordAuditEvent({
    action: "player.deleted",
    actor,
    tableSlug: input.slug,
    tableName: table.name,
    summary: "Removed player",
    before: existing.name,
    after: null,
    target: existing.name,
  });

  revalidateTable(input.slug);
}

export async function addBuyInAction(input: {
  slug: string;
  playerId: string;
  chips: number;
}): Promise<void> {
  const actor = await requireAuth();
  if (input.chips <= 0) {
    throw new Error("Buy-in must be greater than zero");
  }

  const table = await getTable(input.slug);
  if (!table) {
    throw new Error("Table not found");
  }

  const name = playerName(table, input.playerId);

  await updateTable(input.slug, (current) => {
    return {
      ...current,
      players: current.players.map((player) =>
        player.id === input.playerId
          ? {
              ...player,
              buyIns: [
                ...player.buyIns,
                {
                  id: nanoid(),
                  chips: input.chips,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : player,
      ),
    };
  });

  await recordAuditEvent({
    action: "buy_in.added",
    actor,
    tableSlug: input.slug,
    tableName: table.name,
    summary: "Added buy-in",
    before: null,
    after: formatChips(input.chips),
    target: name,
  });

  revalidateTable(input.slug);
}

export async function addStandardBuyInAction(input: {
  slug: string;
  playerId: string;
}): Promise<void> {
  return addBuyInAction({
    slug: input.slug,
    playerId: input.playerId,
    chips: STANDARD_BUY_IN_CHIPS,
  });
}

export async function updateBuyInAction(input: {
  slug: string;
  playerId: string;
  buyInId: string;
  chips: number;
}): Promise<void> {
  const actor = await requireAuth();
  if (input.chips <= 0) {
    throw new Error("Buy-in must be greater than zero");
  }

  const table = await getTable(input.slug);
  if (!table) {
    throw new Error("Table not found");
  }

  const player = table.players.find((item) => item.id === input.playerId);
  const buyIn = player?.buyIns.find((item) => item.id === input.buyInId);
  if (!player || !buyIn) {
    throw new Error("Buy-in not found");
  }

  await updateTable(input.slug, (current) => {
    return {
      ...current,
      players: current.players.map((item) =>
        item.id === input.playerId
          ? {
              ...item,
              buyIns: item.buyIns.map((entry) =>
                entry.id === input.buyInId
                  ? { ...entry, chips: input.chips }
                  : entry,
              ),
            }
          : item,
      ),
    };
  });

  await recordAuditEvent({
    action: "buy_in.updated",
    actor,
    tableSlug: input.slug,
    tableName: table.name,
    summary: "Changed buy-in",
    before: formatChips(buyIn.chips),
    after: formatChips(input.chips),
    target: player.name,
  });

  revalidateTable(input.slug);
}

export async function deleteBuyInAction(input: {
  slug: string;
  playerId: string;
  buyInId: string;
}): Promise<void> {
  const actor = await requireAuth();
  const table = await getTable(input.slug);
  if (!table) {
    throw new Error("Table not found");
  }

  const player = table.players.find((item) => item.id === input.playerId);
  const buyIn = player?.buyIns.find((item) => item.id === input.buyInId);
  if (!player || !buyIn) {
    throw new Error("Buy-in not found");
  }

  await updateTable(input.slug, (current) => {
    return {
      ...current,
      players: current.players.map((item) =>
        item.id === input.playerId
          ? {
              ...item,
              buyIns: item.buyIns.filter((entry) => entry.id !== input.buyInId),
            }
          : item,
      ),
    };
  });

  await recordAuditEvent({
    action: "buy_in.deleted",
    actor,
    tableSlug: input.slug,
    tableName: table.name,
    summary: "Removed buy-in",
    before: formatChips(buyIn.chips),
    after: null,
    target: player.name,
  });

  revalidateTable(input.slug);
}

export async function setCashOutAction(input: {
  slug: string;
  playerId: string;
  chips: number;
}): Promise<void> {
  const actor = await requireAuth();
  if (input.chips < 0) {
    throw new Error("Cash-out cannot be negative");
  }

  const table = await getTable(input.slug);
  if (!table) {
    throw new Error("Table not found");
  }

  const name = playerName(table, input.playerId);
  const previous = table.players.find((player) => player.id === input.playerId)?.cashOut;

  await updateTable(input.slug, (current) => {
    const players = current.players.map((player) =>
      player.id === input.playerId
        ? {
            ...player,
            cashOut: {
              chips: input.chips,
              createdAt: new Date().toISOString(),
            },
          }
        : player,
    );

    return {
      ...current,
      players,
      transfers: computeTransfers(players, current.chipsPerUsd, current.transfers),
    };
  });

  await recordAuditEvent({
    action: "cash_out.set",
    actor,
    tableSlug: input.slug,
    tableName: table.name,
    summary: "Set cash-out",
    before: previous ? formatChips(previous.chips) : null,
    after: formatChips(input.chips),
    target: name,
  });

  revalidateTable(input.slug);
}

export async function markTransferPaidAction(input: {
  slug: string;
  transferId: string;
}): Promise<void> {
  const actor = await requireAuth();
  const table = await getTable(input.slug);
  if (!table) {
    throw new Error("Table not found");
  }

  const transfer = transferSummary(table, input.transferId);
  if (!transfer) {
    throw new Error("Transfer not found");
  }

  await updateTable(input.slug, (current) => ({
    ...current,
    transfers: current.transfers.map((item) =>
      item.id === input.transferId
        ? {
            ...item,
            status: "PAID",
            paidAt: new Date().toISOString(),
          }
        : item,
    ),
  }));

  await recordAuditEvent({
    action: "transfer.marked_paid",
    actor,
    tableSlug: input.slug,
    tableName: table.name,
    summary: "Marked transfer paid",
    before: "Pending",
    after: "Paid",
    target: `${transfer.from} → ${transfer.to} (${transfer.amount})`,
  });

  revalidateTable(input.slug);
}

export async function undoTransferPaidAction(input: {
  slug: string;
  transferId: string;
}): Promise<void> {
  const actor = await requireAuth();
  const table = await getTable(input.slug);
  if (!table) {
    throw new Error("Table not found");
  }

  const transfer = transferSummary(table, input.transferId);
  if (!transfer) {
    throw new Error("Transfer not found");
  }

  await updateTable(input.slug, (current) => ({
    ...current,
    transfers: current.transfers.map((item) =>
      item.id === input.transferId
        ? {
            ...item,
            status: "PENDING",
            paidAt: null,
          }
        : item,
    ),
  }));

  await recordAuditEvent({
    action: "transfer.unmarked_paid",
    actor,
    tableSlug: input.slug,
    tableName: table.name,
    summary: "Undid paid transfer",
    before: "Paid",
    after: "Pending",
    target: `${transfer.from} → ${transfer.to} (${transfer.amount})`,
  });

  revalidateTable(input.slug);
}

export async function updateTableSettingsAction(input: {
  slug: string;
  name?: string;
  date?: string;
  chipsPerUsd?: number;
}): Promise<void> {
  const actor = await requireAuth();
  if (input.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new Error("Enter a valid date");
  }

  const table = await getTable(input.slug);
  if (!table) {
    throw new Error("Table not found");
  }

  const nextName =
    input.name !== undefined ? input.name.trim() || table.name : table.name;
  const nextDate = input.date ?? table.date;
  const nextChipsPerUsd = input.chipsPerUsd ?? table.chipsPerUsd;

  await updateTable(input.slug, (current) => {
    if (input.chipsPerUsd !== undefined && current.status !== "OPEN") {
      throw new Error("Settings can only be changed while table is open");
    }

    if (input.date !== undefined) {
      const parsed = new Date(`${input.date}T00:00:00.000Z`);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error("Enter a valid date");
      }
    }

    return {
      ...current,
      name: nextName,
      date: nextDate,
      chipsPerUsd: nextChipsPerUsd,
    };
  });

  if (input.name !== undefined && nextName !== table.name) {
    await recordAuditEvent({
      action: "table.settings_updated",
      actor,
      tableSlug: input.slug,
      tableName: nextName,
      summary: "Changed table name",
      before: table.name,
      after: nextName,
    });
  }

  if (input.date !== undefined && nextDate !== table.date) {
    await recordAuditEvent({
      action: "table.settings_updated",
      actor,
      tableSlug: input.slug,
      tableName: nextName,
      summary: "Changed table date",
      before: formatDate(table.date),
      after: formatDate(nextDate),
    });
  }

  if (input.chipsPerUsd !== undefined && nextChipsPerUsd !== table.chipsPerUsd) {
    await recordAuditEvent({
      action: "table.settings_updated",
      actor,
      tableSlug: input.slug,
      tableName: nextName,
      summary: "Changed chips per dollar",
      before: String(table.chipsPerUsd),
      after: String(nextChipsPerUsd),
    });
  }

  revalidateTable(input.slug);
  revalidatePath("/");
}
