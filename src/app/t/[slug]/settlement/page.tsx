import { notFound } from "next/navigation";
import { SettlementView } from "@/components/table/settlement-view";
import { getTable, syncSettlementTransfers } from "@/lib/store";

interface SettlementPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SettlementPage({ params }: SettlementPageProps) {
  const { slug } = await params;
  const syncedTable = await syncSettlementTransfers(slug);
  const table = syncedTable ?? (await getTable(slug));

  if (!table) {
    notFound();
  }

  return <SettlementView initialTable={table} />;
}
