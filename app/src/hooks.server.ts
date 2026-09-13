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
// fetches to this host must be CORS-enabled.
// The better-auth client sends `credentials: "include"`, so cross-origin
// requests are credentialed and the CORS spec requires
// `Access-Control-Allow-Credentials: true` (with an exact reflected origin,
// never `*`) or the browser blocks them with "Failed to fetch".
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
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, Cache-Control, Pragma, Range",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Credentials": "true",
};

function corsOrigin(request: Request): string | null {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  if (
    ALLOWED_CORS_ORIGINS.has(origin) ||
    origin === "null" ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("https://localhost") ||
    origin.startsWith("capacitor://") ||
    origin.startsWith("ionic://") ||
    origin.startsWith("app://") ||
    origin.endsWith(".pages.dev") ||
    origin.endsWith(".workers.dev")
  ) {
    return origin;
  }
  return null;
}

function withCors(response: Response, origin: string | null, request?: Request): Response {
  if (!origin) return response;
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Vary", "Origin");
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }
  const reqHeaders = request?.headers.get("Access-Control-Request-Headers");
  if (reqHeaders) {
    headers.set("Access-Control-Allow-Headers", reqHeaders);
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

  // CORS preflight for cross-origin (Capacitor WebView) fetches
  if (event.request.method === "OPTIONS") {
    if (!origin) return new Response(null, { status: 204 });
    const reqHeaders = event.request.headers.get("Access-Control-Request-Headers");
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        Vary: "Origin",
        ...CORS_HEADERS,
        ...(reqHeaders ? { "Access-Control-Allow-Headers": reqHeaders } : {}),
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
  return withCors(response, origin, event.request);
};

export const handleError: HandleServerError = ({ error }) => {
  if (dev) console.error(error);
  return { message: "An unexpected error occurred." };
};
