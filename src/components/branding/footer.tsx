import { GITHUB_REPO_URL, KOBY_PROFILE_URL } from "@/lib/constants";

export function AppFooter() {
  return (
    <footer className="mx-auto w-full max-w-lg px-4 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <p className="text-center text-sm text-muted-foreground">
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
    </footer>
  );
}
