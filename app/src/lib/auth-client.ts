import { createAuthClient } from "better-auth/svelte";
import { API_BASE, apiUrl } from "$lib/config";
import { getAuthToken, setAuthToken, clearAuthToken } from "$lib/auth-token";
import { nativeLog } from "$lib/native-debug";

// Web (same-origin): use the current origin so OAuth redirects always go to
// the right host (localhost in dev, the deployed URL in production).
// Capacitor (static bundle hosted in the WebView): point at the hosted API and
// authenticate with a persisted `Authorization: Bearer` token instead of cookies.
const baseURL = API_BASE
  ? apiUrl("/api/auth")
  : typeof window !== "undefined"
    ? window.location.origin
    : (import.meta.env.BETTER_AUTH_URL ?? "http://localhost:5173");

if (typeof window !== "undefined") {
  nativeLog("boot", "origin=" + window.location.origin, "API_BASE=" + API_BASE, "baseURL=" + baseURL);
}

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    onRequest: ({ headers, method, url }) => {
      const token = getAuthToken();
      if (token && headers) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      if (typeof window !== "undefined") {
        nativeLog("req", method, String(url).replace(/^https?:\/\/[^/]+/, ""), "bearer=" + (token ? "yes" : "no"));
      }
    },
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;

export { clearAuthToken, getAuthToken, setAuthToken };

// Persists the session token returned by email/password sign-in or sign-up so
// the Capacitor build can authenticate with `Authorization: Bearer` instead of
// cookies. On the web this is a harmless no-op (cookies stay authoritative).
export function persistAuthToken(response: { data?: { token?: string | null } }): void {
  setAuthToken(response?.data?.token);
}