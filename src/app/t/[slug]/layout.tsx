import { notFound } from "next/navigation";
import { AppHeader } from "@/components/branding/header";
import { TableMeta } from "@/components/table/table-meta";
import { TableTabs } from "@/components/table/table-tabs";
import { getTable } from "@/lib/store";

interface TableLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function TableLayout({ children, params }: TableLayoutProps) {
  const { slug } = await params;
  const table = await getTable(slug);

  if (!table) {
    notFound();
  }

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader />
      <div className="border-b border-border/60 bg-card/30 pb-3">
        <TableMeta initialTable={table} />
        <div className="mx-auto max-w-lg px-4 pt-3">
          <TableTabs slug={slug} />
        </div>
      </div>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
