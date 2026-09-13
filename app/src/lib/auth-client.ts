import { createAuthClient } from "better-auth/svelte";
import { API_BASE, apiUrl } from "$lib/config";
import { getAuthToken, setAuthToken, clearAuthToken } from "$lib/auth-token";

// Web (same-origin): use the current origin so OAuth redirects always go to
// the right host (localhost in dev, the deployed URL in production).
// Capacitor (static bundle hosted in the WebView): point at the hosted API and
// authenticate with a persisted `Authorization: Bearer` token instead of cookies.
const baseURL = API_BASE
  ? apiUrl("/api/auth")
  : typeof window !== "undefined"
    ? window.location.origin
    : (import.meta.env.BETTER_AUTH_URL ?? "http://localhost:5173");

// better-auth's $fetch calls `new URL(path, baseURL)` for every request.
// When `path` starts with `/` (e.g. `/sign-in/social`), the absolute
// path **replaces** the entire baseURL pathname, so `baseURL + /sign-in`
// becomes `https://mezzo-music.pages.dev/sign-in` instead of the
// intended `https://mezzo-music.pages.dev/api/auth/sign-in`.
// We work around this by providing a customFetchImpl that rewrites the URL.
const customFetchImpl: typeof fetch = (url, init) => {
    const u = url instanceof URL ? url.href : url instanceof Request ? url.url : url;
    if (typeof u === "string" && u.startsWith(`${API_BASE}/`) && !u.includes("/api/auth/")) {
        const fixed = u.replace(`${API_BASE}/`, `${API_BASE}/api/auth/`);
        return fetch(fixed, init);
    }
    return fetch(url, init);
};

export const authClient = createAuthClient({
    baseURL,
    fetchOptions: {
        customFetchImpl,
        onRequest: ({ headers, method, url }) => {
            const token = getAuthToken();
            if (token && headers) {
                headers.set("Authorization", `Bearer ${token}`);
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