import { notFound } from "next/navigation";
import { CashOutView } from "@/components/table/cash-out-view";
import { getTable } from "@/lib/store";

interface CashOutPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CashOutPage({ params }: CashOutPageProps) {
  const { slug } = await params;
  const table = await getTable(slug);

  if (!table) {
    notFound();
  }

  return <CashOutView initialTable={table} />;
}
