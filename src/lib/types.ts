export type PaymentType = "CRYPTO" | "PAYPAL" | "WISE" | "REVOLUT" | "CASH";
export type CryptoChain = "POLYGON" | "SOLANA" | "BASE" | "OTHER";
export type CryptoToken = "USDC" | "USDT";
export type CashCurrency = "USD" | "SGD" | "MYR";
export type TableStatus = "OPEN" | "CASHING_OUT" | "SETTLED";

export interface PaymentMethod {
  type: PaymentType;
  value: string | null;
  chain?: CryptoChain | null;
  token?: CryptoToken | null;
  currency?: CashCurrency | null;
  link?: string | null;
}

export interface BuyIn {
  id: string;
  chips: number;
  createdAt: string;
}

export interface CashOut {
  chips: number;
  createdAt: string;
}

export interface Player {
  id: string;
  name: string;
  paymentMethods: PaymentMethod[];
  buyIns: BuyIn[];
  cashOut: CashOut | null;
}

export interface Transfer {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  amountUsd: number;
  paymentMethods: PaymentMethod[];
  status: "PENDING" | "PAID";
  paidAt: string | null;
}

export interface TableState {
  slug: string;
  name: string | null;
  date: string;
  chipsPerUsd: number;
  status: TableStatus;
  createdAt: string;
  players: Player[];
  transfers: Transfer[];
}

export type AuditAction =
  | "table.created"
  | "table.deleted"
  | "table.settings_updated"
  | "table.closed"
  | "table.reopened"
  | "table.settled"
  | "player.added"
  | "player.renamed"
  | "player.deleted"
  | "buy_in.added"
  | "buy_in.updated"
  | "buy_in.deleted"
  | "cash_out.set"
  | "transfer.marked_paid"
  | "transfer.unmarked_paid";

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: AuditAction;
  actorId: string;
  actorName: string | null;
  actorEmail: string | null;
  actorImage: string | null;
  tableSlug: string;
  tableName: string | null;
  summary: string;
  before: string | null;
  after: string | null;
  target: string | null;
}
