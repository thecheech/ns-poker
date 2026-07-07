import { Redis } from "@upstash/redis";
import { nanoid } from "nanoid";
import { DEFAULT_CHIPS_PER_USD } from "./constants";
import { normalizeTable } from "./payments";
import type { TableState } from "./types";

function tableKey(slug: string): string {
  return `table:${slug}`;
}

function getRedis(): Redis {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Missing Redis credentials. Set UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN.",
    );
  }

  return new Redis({ url, token });
}

export async function getTable(slug: string): Promise<TableState | null> {
  const redis = getRedis();
  const table = await redis.get<TableState>(tableKey(slug));
  return table ? normalizeTable(table) : null;
}

export async function saveTable(state: TableState): Promise<void> {
  const redis = getRedis();
  await redis.set(tableKey(state.slug), state);
}

export async function createTable(): Promise<TableState> {
  const slug = nanoid(12);
  const now = new Date();
  const date = now.toISOString().slice(0, 10);

  const table: TableState = {
    slug,
    name: `Poker Night · ${new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(now)}`,
    date,
    chipsPerUsd: DEFAULT_CHIPS_PER_USD,
    status: "OPEN",
    createdAt: now.toISOString(),
    players: [],
    transfers: [],
  };

  await saveTable(table);
  return table;
}

export async function updateTable(
  slug: string,
  updater: (table: TableState) => TableState,
): Promise<TableState> {
  const table = await getTable(slug);
  if (!table) {
    throw new Error("Table not found");
  }

  const updated = updater(table);
  await saveTable(updated);
  return updated;
}
