import { notFound } from "next/navigation";
import { TableView } from "@/components/table/table-view";
import { getTable } from "@/lib/store";

interface TablePageProps {
  params: Promise<{ slug: string }>;
}

export default async function TablePage({ params }: TablePageProps) {
  const { slug } = await params;
  const table = await getTable(slug);

  if (!table) {
    notFound();
  }

  return <TableView initialTable={table} />;
}
