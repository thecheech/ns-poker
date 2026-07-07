import type { PaymentType } from "./types";

export const DEFAULT_CHIPS_PER_USD = 100;
export const STANDARD_BUY_IN_CHIPS = 5000;
export const UNMATCHED_PLAYER_ID = "?";
export const GITHUB_REPO_URL = "https://github.com/thecheech/ns-poker";

export const PAYMENT_TYPES: PaymentType[] = [
  "CRYPTO",
  "PAYPAL",
  "WISE",
  "REVOLUT",
  "CASH",
];

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  CRYPTO: "USDC (Polygon)",
  PAYPAL: "PayPal",
  WISE: "Wise",
  REVOLUT: "Revolut",
  CASH: "Cash",
};

export const PAYMENT_TYPE_HINTS: Record<PaymentType, string> = {
  CRYPTO: "Wallet address (0x…)",
  PAYPAL: "PayPal.me handle or email",
  WISE: "Wise email or link",
  REVOLUT: "Revolut @username or link",
  CASH: "Settle in cash at the table",
};

export const FEE_NOTE_TYPES: PaymentType[] = ["PAYPAL", "WISE", "REVOLUT"];
