import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createAuth } from "$lib/server/auth";
import { listTracks, listTracksByArtist, listPlaylists } from "$lib/server/db";

export const GET: RequestHandler = async ({ request, url, platform }) => {
  if (!platform) throw error(500, "No platform bindings");
  const auth = createAuth(platform, url.origin);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw error(401, "Not authenticated");

  const db = platform.env.DB;
  const [tracks, sorted, playlists] = await Promise.all([
    listTracks(db, session.user.id),
    listTracksByArtist(db, session.user.id),
    listPlaylists(db, session.user.id),
  ]);

  return json({ tracks, sorted, playlists });
};
