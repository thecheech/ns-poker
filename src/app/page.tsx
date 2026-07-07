import { Suspense } from "react";
import { AuthButton } from "@/components/auth/auth-button";
import { NsLogo } from "@/components/branding/logo";
import { CreateTableButton } from "@/components/home/create-table-button";
import { RecentTablesList } from "@/components/home/recent-tables";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 pb-6 pt-[calc(1rem+env(safe-area-inset-top))] sm:gap-6 sm:pb-8 sm:pt-[calc(1.25rem+env(safe-area-inset-top))]">
        <section className="space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between gap-3">
            <NsLogo size="md" className="min-w-0 flex-1" />
            <AuthButton className="shrink-0" />
          </div>
          <p className="text-[0.9375rem] leading-snug text-muted-foreground sm:text-base sm:leading-relaxed">
            Splitwise for poker nights. Create a table, drop the link in the
            WhatsApp group, and everyone adds buy-ins and settles up.
          </p>
        </section>

        <CreateTableButton />

        <section className="space-y-2.5 sm:space-y-3">
          <h2 className="text-base font-semibold sm:text-lg">Recent tables</h2>
          <Suspense
            fallback={
              <p className="rounded-xl border border-dashed bg-card/50 px-4 py-5 text-center text-[0.8125rem] text-muted-foreground sm:rounded-2xl sm:py-6 sm:text-sm">
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
