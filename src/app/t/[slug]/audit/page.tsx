import { AuditLogView } from "@/components/audit/audit-log-view";
import { getAuditEvents } from "@/lib/audit";

interface TableAuditPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TableAuditPage({ params }: TableAuditPageProps) {
  const { slug } = await params;
  const events = await getAuditEvents({ tableSlug: slug, limit: 100 });

  return (
    <div className="mx-auto max-w-lg px-4 pb-8 pt-4">
      <section className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold">Audit Log</h2>
        <p className="text-sm text-muted-foreground">
          Changes on this table from the last 7 days.
        </p>
      </section>

      <AuditLogView
        initialEvents={events}
        tableSlug={slug}
        showTableColumn={false}
      />
    </div>
  );
}
