import type {
  CashCurrency,
  CryptoChain,
  CryptoToken,
  PaymentType,
} from "./types";

export const DEFAULT_CHIPS_PER_USD = 100;
export const STANDARD_BUY_IN_CHIPS = 5000;
export const UNMATCHED_PLAYER_ID = "?";
export const GITHUB_REPO_URL = "https://github.com/thecheech/ns-poker";
export const KOBY_PROFILE_URL = "https://ns.com/kobykarp";

export const PAYMENT_TYPES: PaymentType[] = [
  "CRYPTO",
  "CASH",
  "PAYPAL",
  "WISE",
  "REVOLUT",
];

export const CRYPTO_CHAINS: CryptoChain[] = [
  "POLYGON",
  "SOLANA",
  "BASE",
  "OTHER",
];

export const CRYPTO_TOKENS: CryptoToken[] = ["USDC", "USDT"];

export const CASH_CURRENCIES: CashCurrency[] = ["USD", "SGD", "MYR"];

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  CRYPTO: "Crypto",
  PAYPAL: "PayPal",
  WISE: "Wise",
  REVOLUT: "Revolut",
  CASH: "Cash",
};

export const CRYPTO_CHAIN_LABELS: Record<CryptoChain, string> = {
  POLYGON: "Polygon",
  SOLANA: "Solana",
  BASE: "Base",
  OTHER: "Other",
};

export const CRYPTO_TOKEN_LABELS: Record<CryptoToken, string> = {
  USDC: "USDC",
  USDT: "USDT",
};

export const CASH_CURRENCY_LABELS: Record<CashCurrency, string> = {
  USD: "USD",
  SGD: "SGD",
  MYR: "MYR",
};

export const PAYMENT_TYPE_HINTS: Record<PaymentType, string> = {
  CRYPTO: "Wallet address",
  PAYPAL: "PayPal.me handle or email",
  WISE: "Wise email or @username",
  REVOLUT: "Revolut @username",
  CASH: "Settle in cash at the table",
};

export const FEE_NOTE_TYPES: PaymentType[] = ["PAYPAL", "WISE", "REVOLUT"];
