import Link from "next/link";
import { ChevronLeft, ScrollText } from "lucide-react";
import { AuthButton } from "@/components/auth/auth-button";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-lg items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="inline-flex items-center gap-0.5 -ml-1 rounded-lg px-1 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground active:opacity-80"
        >
          <ChevronLeft className="size-4" />
          Home
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/audit"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground active:opacity-80"
            title="Audit Log"
          >
            <ScrollText className="size-4" />
            Log
          </Link>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
