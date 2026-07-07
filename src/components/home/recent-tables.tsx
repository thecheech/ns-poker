import { listRecentTables } from "@/lib/store";
import { RecentTableRow } from "@/components/home/recent-table-row";

export async function RecentTablesList() {
  const tables = await listRecentTables();

  if (tables.length === 0) {
    return (
      <p className="rounded-xl border border-dashed bg-card/50 px-4 py-5 text-center text-[0.8125rem] text-muted-foreground sm:rounded-2xl sm:py-6 sm:text-sm">
        Tables you create will show up here.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {tables.map((table) => (
        <RecentTableRow key={table.slug} table={table} />
      ))}
    </div>
  );
}
