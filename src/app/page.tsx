import { NsLogo } from "@/components/branding/logo";
import { CreateTableButton } from "@/components/home/create-table-button";
import { RecentTablesList } from "@/components/home/recent-tables";
import { GITHUB_REPO_URL } from "@/lib/constants";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-5 pb-10 pt-[calc(1.25rem+env(safe-area-inset-top))]">
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
          <RecentTablesList />
        </section>

        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
        View on GitHub
      </a>
    </main>
  );
}
