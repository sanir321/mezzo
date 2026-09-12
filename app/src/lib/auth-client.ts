import { createAuthClient } from "better-auth/svelte";

// In the browser, use the current origin so OAuth redirects always go to the
// right host (localhost in dev, the deployed URL in production).
// On the server (SSR), fall back to the env var.
const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : (import.meta.env.BETTER_AUTH_URL ?? "http://localhost:5173");

export const authClient = createAuthClient({ baseURL });

export const { signIn, signUp, signOut, useSession } = authClient;
