import { GITHUB_REPO_URL, KOBY_PROFILE_URL } from "@/lib/constants";

export function AppFooter() {
  return (
    <footer className="relative z-10 mt-8 shrink-0 border-t border-border/60 bg-background/95 backdrop-blur-md sm:mt-10">
      <div className="mx-auto w-full max-w-lg px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:py-4 sm:pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <p className="text-center text-[0.8125rem] text-muted-foreground sm:text-sm">
        Built by{" "}
        <a
          href={KOBY_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground/80 transition-colors hover:text-foreground"
        >
          Koby
        </a>
        {" · "}
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-foreground"
        >
          View on GitHub
        </a>
        </p>
      </div>
    </footer>
  );
}
