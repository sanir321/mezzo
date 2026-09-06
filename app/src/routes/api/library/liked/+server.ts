import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createAuth } from "$lib/server/auth";
import { listLikedTracks, getLikedTrackIds } from "$lib/server/db";

export const GET: RequestHandler = async ({ request, url, platform }) => {
  if (!platform) throw error(500, "No platform bindings");
  const auth = createAuth(platform, url.origin);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw error(401, "Not authenticated");

  const tracks = await listLikedTracks(platform.env.DB, session.user.id);
  const likedIds = await getLikedTrackIds(platform.env.DB, session.user.id);
  return json({ tracks, likedIds });
};
