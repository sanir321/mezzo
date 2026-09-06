import { toSvelteKitHandler } from "better-auth/svelte-kit";
import { createAuth, getBaseUrl } from "$lib/server/auth";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = ({ request, url, platform }) => {
  const auth = createAuth(platform, getBaseUrl(url.origin, platform));
  return toSvelteKitHandler(auth)({ request });
};

export const POST: RequestHandler = ({ request, url, platform }) => {
  const auth = createAuth(platform, getBaseUrl(url.origin, platform));
  return toSvelteKitHandler(auth)({ request });
};
