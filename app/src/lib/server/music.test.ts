import { describe, it, expect } from "vitest";
import { searchOnlineMusic } from "./music";
import { FEATURED_PLAYLISTS, getFeaturedPlaylistById } from "$lib/featured-playlists";

describe("Online Music Streaming Service", () => {
	it("returns real tracks for a search query", async () => {
		const res = await searchOnlineMusic("Starboy", 5);
		console.log("TEST SEARCH TRACKS COUNT:", res.tracks.length);
		if (res.tracks.length > 0) {
			console.log("TEST FIRST TRACK:", res.tracks[0].title, res.tracks[0].duration, res.tracks[0].stream_url.slice(0, 50));
		}
		expect(res.tracks.length).toBeGreaterThan(0);
	}, 15000);

	it("handles obscure queries gracefully without crashing", async () => {
		const res = await searchOnlineMusic("xyz999obscuregibberish777", 5);
		expect(Array.isArray(res.tracks)).toBe(true);
		expect(res.tracks.length).toBeGreaterThan(0);
	}, 15000);

	it("has all featured playlists configured and resolvable", () => {
		expect(FEATURED_PLAYLISTS.length).toBeGreaterThanOrEqual(8);
		const topHits = getFeaturedPlaylistById("todays-top-hits");
		expect(topHits).toBeDefined();
		expect(topHits?.name).toBe("Today's Top Hits");
		expect(topHits?.query).toBeTruthy();
	});

	it("preserves genuine song and album titles while cleaning filler phrases", async () => {
		const { cleanSearchQuery } = await import("./music");
		expect(cleanSearchQuery("something")).toBe("something");
		expect(cleanSearchQuery("song 2")).toBe("song 2");
		expect(cleanSearchQuery("music")).toBe("music");
		expect(cleanSearchQuery("starboy feat. daft punk")).toBe("starboy daft punk");
		expect(cleanSearchQuery("victory lap official video")).toBe("victory lap");
	});
});

