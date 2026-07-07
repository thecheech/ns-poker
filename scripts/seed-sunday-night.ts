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
  cashOutChips: number | null,
  createdAt: string,
): Player {
  return {
    id: nanoid(),
    name,
    paymentMethods: [{ type: "CASH", value: null }],
    buyIns: buyIns(buyInCount, createdAt),
    cashOut:
      cashOutChips === null
        ? null
        : { chips: cashOutChips, createdAt },
  };
}

async function main() {
  loadEnvLocal();

  const slug = "sunday-jul5-2026";
  const createdAt = "2026-07-05T22:00:00.000Z";
  const cashOutAt = "2026-07-06T01:00:00.000Z";

  const players: Player[] = [
    player("Thomas", 6, 18_450, cashOutAt),
    player("Karlyle", 3, 11_325, cashOutAt),
    player("Bailey", 2, 0, cashOutAt),
    player("Egor", 2, null, cashOutAt),
    player("Vihan", 2, null, cashOutAt),
    player("Kutay", 2, 13_350, cashOutAt),
    player("Koby", 1, 21_450, cashOutAt),
    player("Adi", 1, 10_400, cashOutAt),
    player("Blurry", 1, 0, cashOutAt),
    player("Evgenii", 1, 23_850, cashOutAt),
    player("V", 1, 11_375, cashOutAt),
  ];

  const table: TableState = {
    slug,
    name: "Sunday Night (Jul 5 → Jul 6)",
    date: "2026-07-05",
    chipsPerUsd: DEFAULT_CHIPS_PER_USD,
    status: "CASHING_OUT",
    createdAt,
    players,
    transfers: [],
  };

  await saveTable(table);
  await indexRecentTable(slug);

  const reported = players.filter((entry) => entry.cashOut !== null).length;

  console.log(`Saved table: ${slug}`);
  console.log(`Status: CASHING_OUT (${reported}/${players.length} chip counts entered)`);
  console.log(`Local:   http://localhost:3000/t/${slug}/cash-out`);
  console.log(`Production: https://ns-poker.vercel.app/t/${slug}/cash-out`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
