import Link from "next/link";
import { NsLogo } from "@/components/branding/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-5 px-4 py-10 text-center">
      <NsLogo size="md" />
      <div className="space-y-2">
        <h1 className="text-xl font-bold">Table not found</h1>
        <p className="text-sm text-muted-foreground">
          This link may be wrong or the table no longer exists.
        </p>
      </div>
      <Link href="/" className={cn(buttonVariants(), "h-11 px-6")}>
        Create a new table
      </Link>
    </main>
  );
}
