import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-lg items-center px-4">
        <Link
          href="/"
          className="inline-flex items-center gap-0.5 -ml-1 rounded-lg px-1 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground active:opacity-80"
        >
          <ChevronLeft className="size-4" />
          Home
        </Link>
      </div>
    </header>
  );
}
