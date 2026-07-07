import { auth } from "@/auth";
import type { AuditActor } from "@/lib/audit";

export async function requireAuth(): Promise<AuditActor> {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Sign in with Google to make changes.");
  }

  return {
    id: session.user.id ?? session.user.email ?? "unknown",
    name: session.user.name ?? null,
    email: session.user.email ?? null,
  };
}
