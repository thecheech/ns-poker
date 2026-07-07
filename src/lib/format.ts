import type { PaymentMethod, PaymentType } from "./types";
import {
  CASH_CURRENCY_LABELS,
  CRYPTO_CHAIN_LABELS,
  CRYPTO_TOKEN_LABELS,
  PAYMENT_TYPE_LABELS,
} from "./constants";
import { paymentMethodHasDetails } from "./payments";

export function chipsToUsd(chips: number, chipsPerUsd: number): number {
  return chips / chipsPerUsd;
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatChips(chips: number): string {
  return new Intl.NumberFormat("en-US").format(chips);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDefaultTableName(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "UTC",
  }).format(date);
  const monthDay = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);

  return `${weekday} Night (${monthDay})`;
}

export function formatPaymentMethod(method: PaymentMethod): string {
  if (method.type === "CASH") {
    return method.currency
      ? `Cash (${CASH_CURRENCY_LABELS[method.currency]})`
      : "Cash";
  }

  const parts = [PAYMENT_TYPE_LABELS[method.type]];

  if (method.type === "CRYPTO") {
    const cryptoParts = [
      method.token ? CRYPTO_TOKEN_LABELS[method.token] : null,
      method.chain ? CRYPTO_CHAIN_LABELS[method.chain] : null,
      method.value,
    ].filter(Boolean);
    if (cryptoParts.length) parts.push(cryptoParts.join(" · "));
  } else if (method.value) {
    parts.push(method.value);
  }

  if (method.link) {
    parts.push(method.link);
  }

  return parts.join(" · ");
}

export function formatPaymentMethodShort(method: PaymentMethod): string | null {
  if (!paymentMethodHasDetails(method)) return null;
  return formatPaymentMethod(method);
}

export function formatPaymentMethods(methods: PaymentMethod[]): string {
  const method = methods[0];
  return method ? formatPaymentMethod(method) : "None";
}

export function formatPaymentMethodCopyText(
  recipientName: string,
  amountUsd: number,
  method: PaymentMethod | null,
): string {
  const lines = [`Pay ${recipientName} ${formatUsd(amountUsd)}`];
  if (method) {
    lines.push(formatPaymentMethod(method));
  }
  return lines.join("\n");
}

export function formatPaymentMethodsCopyText(
  recipientName: string,
  amountUsd: number,
  methods: PaymentMethod[],
): string {
  return formatPaymentMethodCopyText(recipientName, amountUsd, methods[0] ?? null);
}

export function totalBuyInChips(buyIns: { chips: number }[]): number {
  return buyIns.reduce((sum, buyIn) => sum + buyIn.chips, 0);
}

export function formatBuyInSummary(buyIns: { chips: number }[]): string {
  const totalChips = totalBuyInChips(buyIns);
  const count = buyIns.length;
  const label = count === 1 ? "buy-in" : "buy-ins";
  return `${formatChips(totalChips)} (${count} ${label})`;
}
