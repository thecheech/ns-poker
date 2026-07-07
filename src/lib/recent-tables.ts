"use client";

export interface RecentTable {
  slug: string;
  name: string | null;
  date: string;
}

const STORAGE_KEY = "ns-poker-recent-tables";

const EMPTY_TABLES: RecentTable[] = [];

let cachedRaw: string | null | undefined;
let cachedSnapshot: RecentTable[] = EMPTY_TABLES;

function invalidateRecentTablesCache(): void {
  cachedRaw = undefined;
}

export function getRecentTables(): RecentTable[] {
  if (typeof window === "undefined") return EMPTY_TABLES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedSnapshot;
    cachedRaw = raw;
    if (!raw) {
      cachedSnapshot = EMPTY_TABLES;
      return cachedSnapshot;
    }
    cachedSnapshot = JSON.parse(raw) as RecentTable[];
    return cachedSnapshot;
  } catch {
    cachedRaw = null;
    cachedSnapshot = EMPTY_TABLES;
    return cachedSnapshot;
  }
}

export function getRecentTablesServerSnapshot(): RecentTable[] {
  return EMPTY_TABLES;
}

export function addRecentTable(entry: RecentTable): void {
  const existing = getRecentTables().filter((table) => table.slug !== entry.slug);
  const next = [entry, ...existing].slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  invalidateRecentTablesCache();
  window.dispatchEvent(new Event("ns-poker-storage"));
}
