import { Redis } from "@upstash/redis";
import { nanoid } from "nanoid";
import { DEFAULT_CHIPS_PER_USD } from "./constants";
import { formatDefaultTableName } from "./format";
import { normalizeTable } from "./payments";
import type { TableState } from "./types";

const RECENT_TABLES_KEY = "tables:recent";
const MAX_RECENT_TABLES = 50;

export interface RecentTableSummary {
  slug: string;
  name: string | null;
  date: string;
}

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

export async function indexRecentTable(slug: string): Promise<void> {
  const redis = getRedis();
  await redis.lrem(RECENT_TABLES_KEY, 0, slug);
  await redis.lpush(RECENT_TABLES_KEY, slug);
  await redis.ltrim(RECENT_TABLES_KEY, 0, MAX_RECENT_TABLES - 1);
}

export async function listRecentTables(
  limit = 20,
): Promise<RecentTableSummary[]> {
  const redis = getRedis();
  const slugs = await redis.lrange<string>(RECENT_TABLES_KEY, 0, limit - 1);
  if (slugs.length === 0) return [];

  const tables = await Promise.all(slugs.map((slug) => getTable(slug)));
  return tables
    .filter((table): table is TableState => table !== null)
    .map((table) => ({
      slug: table.slug,
      name: table.name,
      date: table.date,
    }));
}

function generateTableCode(): string {
  return nanoid(6);
}

export async function createTable(): Promise<TableState> {
  let slug = generateTableCode();
  while (await getTable(slug)) {
    slug = generateTableCode();
  }

  const now = new Date();
  const date = now.toISOString().slice(0, 10);

  const table: TableState = {
    slug,
    name: formatDefaultTableName(date),
    date,
    chipsPerUsd: DEFAULT_CHIPS_PER_USD,
    status: "OPEN",
    createdAt: now.toISOString(),
    players: [],
    transfers: [],
  };

  await saveTable(table);
  await indexRecentTable(slug);
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
