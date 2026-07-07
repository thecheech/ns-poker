import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TableCalloutProps {
  message: string;
  actionLabel: string;
  actionHref: string;
  variant?: "default" | "muted";
  secondaryAction?: ReactNode;
}

export function TableCallout({
  message,
  actionLabel,
  actionHref,
  variant = "muted",
  secondaryAction,
}: TableCalloutProps) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-4 text-center",
        variant === "default" ? "border-primary/30 bg-primary/5" : "bg-muted/20",
      )}
    >
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className={cn("mt-3 flex gap-2", !secondaryAction && "justify-center")}>
        <Link
          href={actionHref}
          className={cn(
            buttonVariants({ variant: variant === "default" ? "default" : "outline" }),
            "h-10 gap-1.5",
            secondaryAction && "flex-1",
          )}
        >
          {actionLabel}
          <ArrowRight className="size-4" />
        </Link>
        {secondaryAction}
      </div>
    </div>
  );
}
