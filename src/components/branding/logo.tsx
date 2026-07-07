import { cn } from "@/lib/utils";

interface NsLogoProps {
  className?: string;
  size?: "sm" | "md";
  showTagline?: boolean;
}

export function NsLogoMark({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground shadow-sm",
        size === "sm" ? "size-8 text-xs" : "size-10 text-sm",
        className,
      )}
      aria-hidden
    >
      NS
    </div>
  );
}

export function NsLogo({
  className,
  size = "md",
  showTagline = true,
}: NsLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <NsLogoMark size={size} />
      <div className="min-w-0">
        <p
          className={cn(
            "truncate font-semibold tracking-tight",
            size === "sm" ? "text-base" : "text-lg",
          )}
        >
          NS Poker
        </p>
        {showTagline ? (
          <p className="truncate text-xs text-muted-foreground max-sm:hidden">
            Network School nights
          </p>
        ) : null}
      </div>
    </div>
  );
}
