import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { searchOnlineMusic } from "$lib/server/music";

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get("q") || "";
	const limit = Number(url.searchParams.get("limit") || "30");
	try {
		const result = await searchOnlineMusic(query, limit);
		return json({
			tracks: result.tracks,
			artists: result.artists,
			playlists: result.playlists,
			albums: result.albums,
			isFallback: result.isFallback ?? false,
		});
	} catch (e: any) {
		console.warn("Search endpoint error:", e);
		return json({
			tracks: [],
			artists: [],
			playlists: [],
			albums: [],
			isFallback: false,
			error: e.message,
		});
	}
};
