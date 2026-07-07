import { PAYMENT_TYPE_LABELS } from "./constants";
import type { PaymentMethod, PaymentType, Player, TableState, Transfer } from "./types";

export function createEmptyPaymentMethod(type: PaymentType = "CRYPTO"): PaymentMethod {
  return { type, value: null };
}

export function defaultPaymentMethods(): PaymentMethod[] {
  return [{ type: "CASH", value: null }];
}

export function normalizePaymentMethods(methods: PaymentMethod[]): PaymentMethod[] {
  return methods.map((method) => ({
    type: method.type,
    value: method.type === "CASH" ? null : method.value?.trim() || null,
  }));
}

export function validatePaymentMethods(methods: PaymentMethod[]): string | null {
  if (methods.length === 0) {
    return "Add at least one way to pay or get paid";
  }

  for (const method of methods) {
    if (method.type !== "CASH" && !method.value?.trim()) {
      return `Enter details for ${PAYMENT_TYPE_LABELS[method.type]}`;
    }
  }

  const types = methods.map((method) => method.type);
  if (new Set(types).size !== types.length) {
    return "Each payment method can only appear once";
  }

  return null;
}

type LegacyPlayer = Player & {
  paymentType?: PaymentType;
  paymentValue?: string | null;
};

type LegacyTransfer = Transfer & {
  methodType?: PaymentType;
  methodValue?: string | null;
};

export function normalizePlayerPaymentMethods(player: LegacyPlayer): Player {
  if (player.paymentMethods?.length) {
    return {
      ...player,
      paymentMethods: normalizePaymentMethods(player.paymentMethods),
    };
  }

  if (player.paymentType) {
    return {
      ...player,
      paymentMethods: normalizePaymentMethods([
        { type: player.paymentType, value: player.paymentValue ?? null },
      ]),
    };
  }

  return {
    ...player,
    paymentMethods: [createEmptyPaymentMethod()],
  };
}

export function normalizeTransferPaymentMethods(transfer: LegacyTransfer): Transfer {
  if (transfer.paymentMethods?.length) {
    return {
      ...transfer,
      paymentMethods: normalizePaymentMethods(transfer.paymentMethods),
    };
  }

  if (transfer.methodType) {
    return {
      ...transfer,
      paymentMethods: normalizePaymentMethods([
        { type: transfer.methodType, value: transfer.methodValue ?? null },
      ]),
    };
  }

  return {
    ...transfer,
    paymentMethods: [createEmptyPaymentMethod("CASH")],
  };
}

export function normalizeTable(table: TableState): TableState {
  return {
    ...table,
    players: table.players.map((player) => normalizePlayerPaymentMethods(player)),
    transfers: table.transfers.map((transfer) =>
      normalizeTransferPaymentMethods(transfer),
    ),
  };
}
