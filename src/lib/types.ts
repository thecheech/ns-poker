export type PaymentType = "CRYPTO" | "PAYPAL" | "WISE" | "REVOLUT" | "CASH";
export type TableStatus = "OPEN" | "CASHING_OUT" | "SETTLED";

export interface PaymentMethod {
  type: PaymentType;
  value: string | null;
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
