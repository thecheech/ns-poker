import Link from "next/link";
import { NsLogo } from "./logo";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-lg items-center px-4">
        <Link href="/" className="min-w-0 -ml-1 rounded-lg p-1 active:opacity-80">
          <NsLogo size="sm" showTagline={false} />
        </Link>
      </div>
    </header>
  );
}
