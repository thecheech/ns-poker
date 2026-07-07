import { auth } from "@/auth";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Sign in with Google to make changes.");
  }

  return session;
}
