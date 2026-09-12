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

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.iOS =
    checkUserAgent(event.request.headers.get("User-Agent")) === "iOS";
  event.locals.Android =
    checkUserAgent(event.request.headers.get("User-Agent")) === "Android";

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
  return response;
};

export const handleError: HandleServerError = ({ error }) => {
  if (dev) console.error(error);
  return { message: "An unexpected error occurred." };
};
