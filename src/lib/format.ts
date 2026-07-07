import type { PaymentMethod, PaymentType } from "./types";
import { PAYMENT_TYPE_LABELS } from "./constants";

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

export function formatPaymentMethod(
  type: PaymentType,
  value: string | null,
): string {
  if (type === "CASH") return "Cash";
  const label = PAYMENT_TYPE_LABELS[type];
  return value ? `${label}: ${value}` : label;
}

export function formatPaymentMethods(methods: PaymentMethod[]): string {
  return methods
    .map(
      (method, index) =>
        `${index + 1}. ${formatPaymentMethod(method.type, method.value)}`,
    )
    .join(" · ");
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
