import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getTrendingOnlineTracks } from "$lib/server/music";

export const GET: RequestHandler = async ({ url }) => {
	const limit = Number(url.searchParams.get("limit") || "25");
	try {
		const tracks = await getTrendingOnlineTracks(limit);
		return json({ tracks });
	} catch (e: any) {
		return json({ tracks: [], error: e.message }, { status: 500 });
	}
};
