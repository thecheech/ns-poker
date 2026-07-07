"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface TableTabsProps {
  slug: string;
}

const tabs = [
  { id: "players", label: "Players", href: (slug: string) => `/t/${slug}` },
  { id: "chips", label: "Chips", href: (slug: string) => `/t/${slug}/cash-out` },
  { id: "settle", label: "Settle", href: (slug: string) => `/t/${slug}/settlement` },
] as const;

function activeTab(pathname: string, slug: string): string {
  if (pathname === `/t/${slug}/settlement`) return "settle";
  if (pathname === `/t/${slug}/cash-out`) return "chips";
  return "players";
}

export function TableTabs({ slug }: TableTabsProps) {
  const pathname = usePathname();
  const current = activeTab(pathname, slug);

  return (
    <nav
      className="grid grid-cols-3 gap-1 rounded-xl border bg-muted/40 p-1"
      aria-label="Table views"
    >
      {tabs.map((tab) => {
        const isActive = current === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href(slug)}
            className={cn(
              "rounded-lg py-2.5 text-center text-sm font-medium transition-colors",
              isActive
                ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
