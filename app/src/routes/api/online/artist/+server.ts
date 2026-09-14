import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getArtistOnlineDetails } from "$lib/server/music";

export const GET: RequestHandler = async ({ url }) => {
  const name = url.searchParams.get("name") || "";
  if (!name.trim()) {
    return json({
      artist: null,
      tracks: [],
      error: "Missing artist name",
    });
  }

  try {
    const result = await getArtistOnlineDetails(name);
    return json({
      artist: result.artist,
      tracks: result.tracks,
      bio: result.bio,
      followers: result.followers,
    });
  } catch (e: any) {
    console.warn("Artist endpoint error:", e);
    return json({
      artist: null,
      tracks: [],
      error: e.message,
    });
  }
};
