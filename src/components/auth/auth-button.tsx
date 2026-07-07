"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function useCanEdit(): boolean {
  const { status } = useSession();
  return status === "authenticated";
}

export function promptGoogleSignIn(): void {
  void signIn("google", { callbackUrl: window.location.href });
}

interface AuthButtonProps {
  className?: string;
}

export function AuthButton({ className }: AuthButtonProps = {}) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span className={cn("text-xs text-muted-foreground", className)} aria-hidden>
        …
      </span>
    );
  }

  if (session?.user) {
    return (
      <div className={cn("flex max-w-[9.5rem] items-center gap-1.5 sm:max-w-[11rem] sm:gap-2", className)}>
        {session.user.image ? (
          <img
            src={session.user.image}
            alt=""
            className="size-6 shrink-0 rounded-full object-cover sm:size-7"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.6875rem] font-medium leading-tight sm:text-xs">
            {session.user.name ?? "Signed in"}
          </p>
          <button
            type="button"
            className="-my-0.5 py-0.5 text-[0.6875rem] text-muted-foreground transition-colors hover:text-foreground sm:text-xs"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("h-8 shrink-0 px-2.5 text-[0.6875rem] sm:text-xs", className)}
      onClick={() => promptGoogleSignIn()}
    >
      Sign in with Google
    </Button>
  );
}
