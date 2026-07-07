import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TableCalloutProps {
  message: string;
  actionLabel: string;
  actionHref: string;
  variant?: "default" | "muted";
}

export function TableCallout({
  message,
  actionLabel,
  actionHref,
  variant = "muted",
}: TableCalloutProps) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-4 text-center",
        variant === "default" ? "border-primary/30 bg-primary/5" : "bg-muted/20",
      )}
    >
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link
        href={actionHref}
        className={cn(
          buttonVariants({ variant: variant === "default" ? "default" : "outline" }),
          "mt-3 h-10 gap-1.5",
        )}
      >
        {actionLabel}
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
