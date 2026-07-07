"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { STANDARD_BUY_IN_CHIPS } from "@/lib/constants";
import { computeTransfers } from "@/lib/settlement";
import { createTable, getTable, updateTable } from "@/lib/store";
import type { PaymentMethod, TableState } from "@/lib/types";
import { normalizePaymentMethods, defaultPaymentMethods } from "@/lib/payments";

function revalidateTable(slug: string) {
  revalidatePath(`/t/${slug}`);
  revalidatePath(`/t/${slug}/cash-out`);
  revalidatePath(`/t/${slug}/settlement`);
}

export async function createTableAction(): Promise<{ slug: string; name: string }> {
  const table = await createTable();
  return { slug: table.slug, name: table.name ?? table.slug };
}

export async function getTableAction(slug: string): Promise<TableState | null> {
  return getTable(slug);
}

export async function addPlayerAction(input: {
  slug: string;
  name: string;
  paymentMethods?: PaymentMethod[];
}): Promise<{ playerId: string }> {
  const paymentMethods = normalizePaymentMethods(
    input.paymentMethods?.length ? input.paymentMethods : defaultPaymentMethods(),
  );

  const playerId = nanoid();
  const now = new Date().toISOString();

  await updateTable(input.slug, (table) => {
    if (table.status !== "OPEN") {
      throw new Error("Table is closed");
    }

    return {
      ...table,
      players: [
        ...table.players,
        {
          id: playerId,
          name: input.name.trim(),
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

  revalidateTable(input.slug);
  return { playerId };
}

export async function updatePlayerAction(input: {
  slug: string;
  playerId: string;
  name: string;
}): Promise<void> {
  await updateTable(input.slug, (table) => {
    if (table.status !== "OPEN") {
      throw new Error("Table is closed");
    }

    return {
      ...table,
      players: table.players.map((player) =>
        player.id === input.playerId
          ? {
              ...player,
              name: input.name.trim(),
            }
          : player,
      ),
    };
  });

  revalidateTable(input.slug);
}

export async function deletePlayerAction(input: {
  slug: string;
  playerId: string;
}): Promise<void> {
  await updateTable(input.slug, (table) => {
    if (table.status !== "OPEN") {
      throw new Error("Table is closed");
    }

    return {
      ...table,
      players: table.players.filter((player) => player.id !== input.playerId),
    };
  });

  revalidateTable(input.slug);
}

export async function addBuyInAction(input: {
  slug: string;
  playerId: string;
  chips: number;
}): Promise<void> {
  if (input.chips <= 0) {
    throw new Error("Buy-in must be greater than zero");
  }

  await updateTable(input.slug, (table) => {
    if (table.status !== "OPEN") {
      throw new Error("Table is closed");
    }

    return {
      ...table,
      players: table.players.map((player) =>
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
  if (input.chips <= 0) {
    throw new Error("Buy-in must be greater than zero");
  }

  await updateTable(input.slug, (table) => {
    if (table.status !== "OPEN") {
      throw new Error("Table is closed");
    }

    return {
      ...table,
      players: table.players.map((player) =>
        player.id === input.playerId
          ? {
              ...player,
              buyIns: player.buyIns.map((buyIn) =>
                buyIn.id === input.buyInId
                  ? { ...buyIn, chips: input.chips }
                  : buyIn,
              ),
            }
          : player,
      ),
    };
  });

  revalidateTable(input.slug);
}

export async function deleteBuyInAction(input: {
  slug: string;
  playerId: string;
  buyInId: string;
}): Promise<void> {
  await updateTable(input.slug, (table) => {
    if (table.status !== "OPEN") {
      throw new Error("Table is closed");
    }

    return {
      ...table,
      players: table.players.map((player) =>
        player.id === input.playerId
          ? {
              ...player,
              buyIns: player.buyIns.filter((buyIn) => buyIn.id !== input.buyInId),
            }
          : player,
      ),
    };
  });

  revalidateTable(input.slug);
}

export async function startCashOutAction(slug: string): Promise<void> {
  await updateTable(slug, (table) => ({
    ...table,
    status: "CASHING_OUT",
  }));
  revalidateTable(slug);
}

export async function reopenTableAction(slug: string): Promise<void> {
  await updateTable(slug, (table) => ({
    ...table,
    status: "OPEN",
    transfers: [],
    players: table.players.map((player) => ({ ...player, cashOut: null })),
  }));
  revalidateTable(slug);
}

export async function setCashOutAction(input: {
  slug: string;
  playerId: string;
  chips: number;
}): Promise<void> {
  if (input.chips < 0) {
    throw new Error("Cash-out cannot be negative");
  }

  await updateTable(input.slug, (table) => {
    if (table.status !== "CASHING_OUT" && table.status !== "SETTLED") {
      throw new Error("Table is not in cash-out mode");
    }

    const revertingFromSettlement = table.status === "SETTLED";

    return {
      ...table,
      status: "CASHING_OUT",
      transfers: revertingFromSettlement ? [] : table.transfers,
      players: table.players.map((player) =>
        player.id === input.playerId
          ? {
              ...player,
              cashOut: {
                chips: input.chips,
                createdAt: new Date().toISOString(),
              },
            }
          : player,
      ),
    };
  });

  revalidateTable(input.slug);
}

export async function settleTableAction(slug: string): Promise<void> {
  await updateTable(slug, (table) => {
    if (table.status !== "CASHING_OUT") {
      throw new Error("Table is not in cash-out mode");
    }

    const settledAt = new Date().toISOString();
    const players = table.players.map((player) => ({
      ...player,
      cashOut: player.cashOut ?? { chips: 0, createdAt: settledAt },
    }));

    return {
      ...table,
      status: "SETTLED",
      players,
      transfers: computeTransfers(players, table.chipsPerUsd),
    };
  });

  revalidateTable(slug);
}

export async function markTransferPaidAction(input: {
  slug: string;
  transferId: string;
}): Promise<void> {
  await updateTable(input.slug, (table) => ({
    ...table,
    transfers: table.transfers.map((transfer) =>
      transfer.id === input.transferId
        ? {
            ...transfer,
            status: "PAID",
            paidAt: new Date().toISOString(),
          }
        : transfer,
    ),
  }));

  revalidateTable(input.slug);
}

export async function undoTransferPaidAction(input: {
  slug: string;
  transferId: string;
}): Promise<void> {
  await updateTable(input.slug, (table) => ({
    ...table,
    transfers: table.transfers.map((transfer) =>
      transfer.id === input.transferId
        ? {
            ...transfer,
            status: "PENDING",
            paidAt: null,
          }
        : transfer,
    ),
  }));

  revalidateTable(input.slug);
}

export async function updateTableSettingsAction(input: {
  slug: string;
  name?: string;
  date?: string;
  chipsPerUsd?: number;
}): Promise<void> {
  if (input.date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new Error("Enter a valid date");
  }

  await updateTable(input.slug, (table) => {
    if (input.chipsPerUsd !== undefined && table.status !== "OPEN") {
      throw new Error("Settings can only be changed while table is open");
    }

    if (input.date !== undefined) {
      const parsed = new Date(`${input.date}T00:00:00.000Z`);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error("Enter a valid date");
      }
    }

    return {
      ...table,
      name: input.name !== undefined ? input.name.trim() || table.name : table.name,
      date: input.date ?? table.date,
      chipsPerUsd: input.chipsPerUsd ?? table.chipsPerUsd,
    };
  });

  revalidateTable(input.slug);
  revalidatePath("/");
}
