import { notFound } from "next/navigation";
import { SettlementView } from "@/components/table/settlement-view";
import { getTable } from "@/lib/store";

interface SettlementPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SettlementPage({ params }: SettlementPageProps) {
  const { slug } = await params;
  const table = await getTable(slug);

  if (!table) {
    notFound();
  }

  return <SettlementView initialTable={table} />;
}
