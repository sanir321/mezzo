import { dev, building } from "$app/environment";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { createAuth, getBaseUrl } from "$lib/server/auth";
import type { Handle, HandleServerError } from "@sveltejs/kit";

const securityHeaders = {
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": `accelerometer=(), autoplay="*", camera=(), encrypted-media=(), fullscreen=(), gyroscope=(), interest-cohort=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), sync-xhr=(), usb=(), xr-spatial-tracking=(), geolocation=()`,
  "X-Content-Type-Options": "nosniff",
};

const checkUserAgent = (userAgent: string | null) =>
  /i(Phone|Pad|Pod)/i.test(userAgent ?? "")
    ? "iOS"
    : /Android/i.test(userAgent ?? "")
      ? "Android"
      : "Other";

// Origins allowed to call the hosted API cross-origin. The Capacitor Android
// WebView runs the static bundle from https://localhost (androidScheme), so its
// fetches to this host must be CORS-enabled. Bearer-token auth means no
// credentials/cookies are involved cross-origin.
const ALLOWED_CORS_ORIGINS = new Set([
  "http://localhost",
  "http://localhost:5173",
  "https://localhost",
  "app://localhost",
  "capacitor://localhost",
  "https://mezzo-music.pages.dev",
  "https://mezzo-61d.pages.dev",
  "https://mezzo.zenosayz05.workers.dev",
]);

const CORS_HEADERS = {
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function corsOrigin(request: Request): string | null {
  const origin = request.headers.get("Origin");
  return origin && ALLOWED_CORS_ORIGINS.has(origin) ? origin : null;
}

function withCors(response: Response, origin: string | null): Response {
  if (!origin) return response;
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Vary", "Origin");
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.iOS =
    checkUserAgent(event.request.headers.get("User-Agent")) === "iOS";
  event.locals.Android =
    checkUserAgent(event.request.headers.get("User-Agent")) === "Android";

  const origin = corsOrigin(event.request);

  // CORS preflight for cross-origin (Capacitor WebView) fetches that use the
  // Authorization header or exclusive methods.
  if (event.request.method === "OPTIONS") {
    if (!origin) return new Response(null, { status: 204 });
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        Vary: "Origin",
        ...CORS_HEADERS,
      },
    });
  }

  const auth = createAuth(
    event.platform as never,
    getBaseUrl(event.url.origin),
  );

  const response = await svelteKitHandler({
    auth,
    event,
    resolve,
    building,
  });

  for (const key in securityHeaders) {
    response.headers.set(key, (securityHeaders as Record<string, string>)[key]);
  }
  return withCors(response, origin);
};

export const handleError: HandleServerError = ({ error }) => {
  if (dev) console.error(error);
  return { message: "An unexpected error occurred." };
};
