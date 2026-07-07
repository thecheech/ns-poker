import { Suspense } from "react";
import { NsLogo } from "@/components/branding/logo";
import { CreateTableButton } from "@/components/home/create-table-button";
import { RecentTablesList } from "@/components/home/recent-tables";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-5 pb-4 pt-[calc(1.25rem+env(safe-area-inset-top))]">
        <section className="space-y-3">
          <NsLogo size="md" />
          <p className="text-base leading-relaxed text-muted-foreground">
            Splitwise for poker nights. Create a table, drop the link in the
            WhatsApp group, and everyone adds buy-ins and settles up.
          </p>
        </section>

        <CreateTableButton />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Recent tables</h2>
          <Suspense
            fallback={
              <p className="rounded-2xl border border-dashed bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
                Loading tables...
              </p>
            }
          >
            <RecentTablesList />
          </Suspense>
        </section>
    </main>
  );
}
