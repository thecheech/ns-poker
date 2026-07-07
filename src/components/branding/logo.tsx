import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/network-school-logo.jpg";

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
  const dimension = size === "sm" ? 32 : 40;

  return (
    <Image
      src={LOGO_SRC}
      alt=""
      width={dimension}
      height={dimension}
      className={cn(
        "shrink-0 rounded-full object-cover",
        size === "sm" ? "size-8" : "size-10",
        className,
      )}
      aria-hidden
    />
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
            "glitch-text glitch-title truncate font-semibold tracking-tight",
            size === "sm" ? "text-base" : "text-lg",
          )}
          data-text="NS Poker"
        >
          NS Poker
        </p>
        {showTagline ? (
          <p className="truncate text-xs text-muted-foreground max-sm:hidden">
            Network School poker nights
          </p>
        ) : null}
      </div>
    </div>
  );
}
