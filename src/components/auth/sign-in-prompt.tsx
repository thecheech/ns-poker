"use client";

import { promptGoogleSignIn } from "@/components/auth/auth-button";

interface SignInPromptProps {
  message?: string;
  className?: string;
}

export function SignInPrompt({
  message = "Sign in with Google to make changes.",
  className,
}: SignInPromptProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => promptGoogleSignIn()}
    >
      {message}
    </button>
  );
}
