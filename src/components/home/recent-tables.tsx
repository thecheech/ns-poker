import { listRecentTables } from "@/lib/store";
import { RecentTableRow } from "@/components/home/recent-table-row";

export async function RecentTablesList() {
  const tables = await listRecentTables();

  if (tables.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
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
