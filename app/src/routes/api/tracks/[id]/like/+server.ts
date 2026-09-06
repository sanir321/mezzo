import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createAuth } from "$lib/server/auth";
import { toggleLikeTrack, getLikedTrackIds } from "$lib/server/db";
import { getTidalTrack, getTidalImageUrl, resolveTidalTrackStream } from "$lib/server/tidal";

export const POST: RequestHandler = async ({
  request,
  params,
  url,
  platform,
}) => {
  if (!platform) throw error(500, "No platform bindings");
  const auth = createAuth(platform, url.origin);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw error(401, "Not authenticated");

  let bodyTrack: any = null;
  try {
    const body = await request.json().catch(() => ({}));
    bodyTrack = body?.track;
  } catch {}

  // Auto-fill track details if client didn't provide it
  if (!bodyTrack && params.id) {
    if (params.id.startsWith("tidal_")) {
      try {
        const tidalData = await getTidalTrack(params.id);
        if (tidalData) {
          const directUrl = await resolveTidalTrackStream(params.id);
          bodyTrack = {
            id: params.id,
            title: tidalData.title,
            artist:
              tidalData.artist?.name ||
              tidalData.artists?.map((a: any) => a.name).join(", ") ||
              "Unknown Artist",
            album: tidalData.album?.title || "Single",
            duration: tidalData.duration || 0,
            cover_url: getTidalImageUrl(tidalData.album?.cover, "1280x1280"),
            stream_url: directUrl || `/api/tracks/${params.id}/stream`,
            format: "Lossless HiFi",
          };
        }
      } catch {}
    }
  }

  // Ensure bodyTrack has direct stream URL if it only had relative stream endpoint
  if (bodyTrack && (!bodyTrack.stream_url || !bodyTrack.stream_url.startsWith("http"))) {
    if (params.id.startsWith("tidal_")) {
      try {
        const directUrl = await resolveTidalTrackStream(params.id);
        if (directUrl) {
          bodyTrack.stream_url = directUrl;
        }
      } catch {}
    }
  }

  const res = await toggleLikeTrack(
    platform.env.DB,
    session.user.id,
    params.id,
    bodyTrack
  );
  return json(res);
};

export const GET: RequestHandler = async ({
  request,
  params,
  url,
  platform,
}) => {
  if (!platform) throw error(500, "No platform bindings");
  const auth = createAuth(platform, url.origin);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw error(401, "Not authenticated");

  const likedIds = await getLikedTrackIds(platform.env.DB, session.user.id);
  return json({ liked: likedIds.includes(params.id) });
};
