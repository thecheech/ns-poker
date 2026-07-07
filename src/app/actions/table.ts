"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { STANDARD_BUY_IN_CHIPS } from "@/lib/constants";
import { computeTransfers, validateChipBalance } from "@/lib/settlement";
import { createTable, getTable, updateTable } from "@/lib/store";
import type { PaymentMethod, TableState } from "@/lib/types";
import { normalizePaymentMethods, defaultPaymentMethods } from "@/lib/payments";

function revalidateTable(slug: string) {
  revalidatePath(`/t/${slug}`);
  revalidatePath(`/t/${slug}/cash-out`);
  revalidatePath(`/t/${slug}/settlement`);
}

export async function createTableAction(): Promise<{ slug: string }> {
  const table = await createTable();
  return { slug: table.slug };
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

    const allHaveCashOut = table.players.every((player) => player.cashOut !== null);
    if (!allHaveCashOut) {
      throw new Error("Every player needs a cash-out amount");
    }

    const balance = validateChipBalance(table.players);
    if (!balance.valid) {
      throw new Error(
        `Chip totals do not balance. Buy-ins: ${balance.buyInTotal}, cash-outs: ${balance.cashOutTotal}`,
      );
    }

    return {
      ...table,
      status: "SETTLED",
      transfers: computeTransfers(table.players, table.chipsPerUsd),
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

export async function updateTableSettingsAction(input: {
  slug: string;
  name?: string;
  chipsPerUsd?: number;
}): Promise<void> {
  await updateTable(input.slug, (table) => {
    if (table.status !== "OPEN") {
      throw new Error("Settings can only be changed while table is open");
    }

    return {
      ...table,
      name: input.name?.trim() || table.name,
      chipsPerUsd: input.chipsPerUsd ?? table.chipsPerUsd,
    };
  });

  revalidateTable(input.slug);
}
