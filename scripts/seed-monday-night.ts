import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { nanoid } from "nanoid";
import { DEFAULT_CHIPS_PER_USD, STANDARD_BUY_IN_CHIPS } from "../src/lib/constants";
import { indexRecentTable, saveTable } from "../src/lib/store";
import type { Player, TableState } from "../src/lib/types";

function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), ".env.local");
  const contents = readFileSync(envPath, "utf8");
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function buyIns(count: number, createdAt: string) {
  return Array.from({ length: count }, () => ({
    id: nanoid(),
    chips: STANDARD_BUY_IN_CHIPS,
    createdAt,
  }));
}

function player(
  name: string,
  buyInCount: number,
  cashOutChips: number,
  createdAt: string,
): Player {
  return {
    id: nanoid(),
    name,
    paymentMethods: [{ type: "CRYPTO", value: null, chain: null, token: null, currency: null, link: null }],
    buyIns: buyIns(buyInCount, createdAt),
    cashOut: { chips: cashOutChips, createdAt },
  };
}

async function main() {
  loadEnvLocal();

  const slug = "monday-jul6-2026";
  const createdAt = "2026-07-06T20:00:00.000Z";
  const cashOutAt = "2026-07-07T00:00:00.000Z";

  const players: Player[] = [
    player("Thomas", 10, 43_200, cashOutAt),
    player("Karlyle", 6, 28_250, cashOutAt),
    player("V", 5, 16_600, cashOutAt),
    player("Debby", 4, 0, cashOutAt),
    player("Adi", 4, 23_000, cashOutAt),
    player("Kutay", 4, 18_500, cashOutAt),
    player("Koby", 3, 61_025, cashOutAt),
    player("Piyush", 3, 7_900, cashOutAt),
    player("Calin", 1, 22_000, cashOutAt),
    player("Ashish", 1, 0, cashOutAt),
    player("Lulu", 1, 4_500, cashOutAt),
    player("Nova", 1, 0, cashOutAt),
    player("Emily", 1, 10_000, cashOutAt),
    player("Blurry", 1, 0, cashOutAt),
  ];

  const table: TableState = {
    slug,
    name: "Monday Night (Jul 6 → Jul 7)",
    date: "2026-07-06",
    chipsPerUsd: DEFAULT_CHIPS_PER_USD,
    status: "CASHING_OUT",
    createdAt,
    players,
    transfers: [],
  };

  await saveTable(table);
  await indexRecentTable(slug);

  const buyInTotal = players.reduce(
    (sum, entry) =>
      sum + entry.buyIns.reduce((playerSum, buyIn) => playerSum + buyIn.chips, 0),
    0,
  );
  const cashOutTotal = players.reduce(
    (sum, entry) => sum + (entry.cashOut?.chips ?? 0),
    0,
  );

  console.log(`Saved table: ${slug}`);
  console.log(`Status: CASHING_OUT · ${players.length} players · 45 buy-ins ($2,250)`);
  console.log(`Chips: ${buyInTotal} in · ${cashOutTotal} out · off by ${buyInTotal - cashOutTotal}`);
  console.log(`Local:   http://localhost:3000/t/${slug}/cash-out`);
  console.log(`Production: https://ns-poker.vercel.app/t/${slug}/cash-out`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
