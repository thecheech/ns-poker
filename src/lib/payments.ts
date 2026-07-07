import { PAYMENT_TYPE_LABELS } from "./constants";
import type { PaymentMethod, PaymentType, Player, TableState, Transfer } from "./types";

export function createEmptyPaymentMethod(type: PaymentType = "CRYPTO"): PaymentMethod {
  return {
    type,
    value: null,
    chain: null,
    token: null,
    currency: null,
    link: null,
  };
}

export function defaultPaymentMethods(): PaymentMethod[] {
  return [createEmptyPaymentMethod("CRYPTO")];
}

export function normalizePaymentMethods(methods: PaymentMethod[]): PaymentMethod[] {
  return methods.map((method) => ({
    type: method.type,
    value: method.type === "CASH" ? null : method.value?.trim() || null,
    chain: method.type === "CRYPTO" ? method.chain ?? null : null,
    token: method.type === "CRYPTO" ? method.token ?? null : null,
    currency: method.type === "CASH" ? method.currency ?? null : null,
    link: method.link?.trim() || null,
  }));
}

export function validatePaymentMethods(methods: PaymentMethod[]): string | null {
  if (methods.length === 0) {
    return "Add at least one payment method";
  }

  const types = methods.map((method) => method.type);
  if (new Set(types).size !== types.length) {
    return "Each payment method can only appear once";
  }

  return null;
}

export function paymentMethodHasDetails(method: PaymentMethod): boolean {
  if (method.type === "CRYPTO") {
    return Boolean(method.value || method.chain || method.token || method.link);
  }
  if (method.type === "CASH") {
    return Boolean(method.currency);
  }
  return Boolean(method.value || method.link);
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
    paymentMethods: defaultPaymentMethods(),
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
    paymentMethods: defaultPaymentMethods(),
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

export function formatPaymentMethodsAuditSummary(methods: PaymentMethod[]): string {
  return methods
    .map((method) => PAYMENT_TYPE_LABELS[method.type])
    .join(", ");
}
