import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getTidalTrack, getTidalImageUrl } from "$lib/server/tidal";

export const GET: RequestHandler = async ({ params, platform }) => {
  const trackId = params.id;
  if (!trackId) throw error(400, "Missing track ID");

  // 1. Check D1 cache first
  if (platform?.env?.DB) {
    try {
      const row = await platform.env.DB.prepare(
        "SELECT cover_key FROM tracks WHERE id = ?1 LIMIT 1",
      )
        .bind(trackId)
        .first<{ cover_key: string | null }>();

      if (row?.cover_key && row.cover_key.startsWith("http")) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: row.cover_key,
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    } catch {}
  }

  // 2. Fetch Tidal cover if tidal ID
  if (trackId.startsWith("tidal_")) {
    try {
      const tidalData = await getTidalTrack(trackId);
      const cover = getTidalImageUrl(
        tidalData?.album?.cover || tidalData?.artist?.picture,
        "750x750",
      );
      if (cover) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: cover,
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    } catch {}
  }

  // Fallback default music cover image
  return new Response(null, {
    status: 302,
    headers: {
      Location:
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
