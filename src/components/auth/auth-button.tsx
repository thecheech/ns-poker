"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function useCanEdit(): boolean {
  const { status } = useSession();
  return status === "authenticated";
}

export function promptGoogleSignIn(): void {
  void signIn("google", { callbackUrl: window.location.href });
}

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span className="text-xs text-muted-foreground" aria-hidden>
        …
      </span>
    );
  }

  if (session?.user) {
    return (
      <div className="flex max-w-[11rem] items-center gap-2">
        {session.user.image ? (
          <img
            src={session.user.image}
            alt=""
            className="size-7 shrink-0 rounded-full object-cover"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{session.user.name ?? "Signed in"}</p>
          <button
            type="button"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
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
      className="h-8 shrink-0 px-2.5 text-xs"
      onClick={() => promptGoogleSignIn()}
    >
      Sign in with Google
    </Button>
  );
}
