import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createAuth } from "$lib/server/auth";
import { listTracks } from "$lib/server/db";

export const GET: RequestHandler = async ({ request, url, platform }) => {
  if (!platform?.env?.DB) return json({ tracks: [] });
  try {
    const auth = createAuth(platform, url.origin);
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return json({ tracks: [] });
    const tracks = await listTracks(platform.env.DB, session.user.id);
    return json({ tracks: tracks || [] });
  } catch (err: any) {
    console.warn("[/api/tracks] Database error, fallback to empty array:", err?.message || err);
    return json({ tracks: [] });
  }
};
