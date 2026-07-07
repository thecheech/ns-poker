import { nanoid } from "nanoid";
import { UNMATCHED_PLAYER_ID } from "./constants";
import { chipsToUsd } from "./format";
import { defaultPaymentMethods } from "./payments";
import type { Player, Transfer } from "./types";

interface BalanceEntry {
  playerId: string;
  amountUsd: number;
}

function transferMatchKey(
  transfer: Pick<Transfer, "fromPlayerId" | "toPlayerId" | "amountUsd">,
): string {
  return `${transfer.fromPlayerId}|${transfer.toPlayerId}|${transfer.amountUsd}`;
}

function preserveTransferState(
  computed: Transfer[],
  existingTransfers: Transfer[],
): Transfer[] {
  const existingByKey = new Map(
    existingTransfers.map((transfer) => [transferMatchKey(transfer), transfer]),
  );

  return computed.map((transfer) => {
    const previous = existingByKey.get(transferMatchKey(transfer));
    if (!previous) return transfer;

    return {
      ...transfer,
      id: previous.id,
      status: previous.status,
      paidAt: previous.paidAt,
    };
  });
}

export function computeTransfers(
  players: Player[],
  chipsPerUsd: number,
  existingTransfers: Transfer[] = [],
): Transfer[] {
  const balances: BalanceEntry[] = players
    .map((player) => {
      const buyInTotal = player.buyIns.reduce((sum, b) => sum + b.chips, 0);
      const cashOutChips = player.cashOut?.chips ?? 0;
      const netChips = cashOutChips - buyInTotal;
      const amountUsd = chipsToUsd(netChips, chipsPerUsd);

      return {
        playerId: player.id,
        amountUsd: Math.round(amountUsd * 100) / 100,
      };
    })
    .filter((entry) => Math.abs(entry.amountUsd) >= 0.01);

  const creditors = balances
    .filter((entry) => entry.amountUsd > 0)
    .map((entry) => ({ ...entry }))
    .sort((a, b) => b.amountUsd - a.amountUsd);

  const debtors = balances
    .filter((entry) => entry.amountUsd < 0)
    .map((entry) => ({ ...entry, amountUsd: Math.abs(entry.amountUsd) }))
    .sort((a, b) => b.amountUsd - a.amountUsd);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const amountUsd =
      Math.round(Math.min(creditor.amountUsd, debtor.amountUsd) * 100) / 100;

    if (amountUsd < 0.01) {
      if (creditor.amountUsd <= debtor.amountUsd) i += 1;
      else j += 1;
      continue;
    }

    const recipient = players.find((player) => player.id === creditor.playerId);
    if (!recipient) {
      i += 1;
      continue;
    }

    transfers.push({
      id: nanoid(),
      fromPlayerId: debtor.playerId,
      toPlayerId: creditor.playerId,
      amountUsd,
      paymentMethods: recipient.paymentMethods,
      status: "PENDING",
      paidAt: null,
    });

    creditor.amountUsd = Math.round((creditor.amountUsd - amountUsd) * 100) / 100;
    debtor.amountUsd = Math.round((debtor.amountUsd - amountUsd) * 100) / 100;

    if (creditor.amountUsd < 0.01) i += 1;
    if (debtor.amountUsd < 0.01) j += 1;
  }

  while (i < creditors.length) {
    const creditor = creditors[i];
    if (creditor.amountUsd >= 0.01) {
      const recipient = players.find((player) => player.id === creditor.playerId);
      transfers.push({
        id: nanoid(),
        fromPlayerId: UNMATCHED_PLAYER_ID,
        toPlayerId: creditor.playerId,
        amountUsd: creditor.amountUsd,
        paymentMethods: recipient?.paymentMethods ?? defaultPaymentMethods(),
        status: "PENDING",
        paidAt: null,
      });
    }
    i += 1;
  }

  while (j < debtors.length) {
    const debtor = debtors[j];
    if (debtor.amountUsd >= 0.01) {
      transfers.push({
        id: nanoid(),
        fromPlayerId: debtor.playerId,
        toPlayerId: UNMATCHED_PLAYER_ID,
        amountUsd: debtor.amountUsd,
        paymentMethods: defaultPaymentMethods(),
        status: "PENDING",
        paidAt: null,
      });
    }
    j += 1;
  }

  return preserveTransferState(transfers, existingTransfers);
}

export function validateChipBalance(players: Player[]): {
  valid: boolean;
  buyInTotal: number;
  cashOutTotal: number;
  difference: number;
} {
  const buyInTotal = players.reduce(
    (sum, player) =>
      sum + player.buyIns.reduce((playerSum, buyIn) => playerSum + buyIn.chips, 0),
    0,
  );
  const cashOutTotal = players.reduce(
    (sum, player) => sum + (player.cashOut?.chips ?? 0),
    0,
  );

  return {
    valid: buyInTotal === cashOutTotal,
    buyInTotal,
    cashOutTotal,
    difference: buyInTotal - cashOutTotal,
  };
}
