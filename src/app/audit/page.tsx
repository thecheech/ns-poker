import { AppHeader } from "@/components/branding/header";
import { AuditLogView } from "@/components/audit/audit-log-view";
import { getAuditEvents } from "@/lib/audit";

export default async function AuditPage() {
  const events = await getAuditEvents({ limit: 100 });

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-5 pb-8">
        <section className="space-y-1">
          <h1 className="text-xl font-semibold">Audit Log</h1>
          <p className="text-sm text-muted-foreground">
            Every change across all tables, kept for 7 days.
          </p>
        </section>

        <AuditLogView initialEvents={events} showTableColumn />
      </main>
    </div>
  );
}
