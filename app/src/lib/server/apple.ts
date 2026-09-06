// Apple Music Catalog Integration for Mezzo (Inspired by Monochrome)
import type { Track } from "$lib/stores/player.svelte";
import type { SearchArtist, SearchAlbum } from "./music";

const TOKEN_MINT_URL = "https://am-mint.binimum.org/token";
const APPLE_API_BASE = "https://api.music.apple.com/v1";

interface TokenCache {
	token: string;
	expiresAt: number;
}

let tokenCache: TokenCache | null = null;

/**
 * Retrieves an active Apple Music developer token with in-memory caching.
 */
export async function getAppleMusicToken(): Promise<string | null> {
	const now = Date.now();
	if (tokenCache && tokenCache.expiresAt > now + 60000) {
		return tokenCache.token;
	}

	try {
		const res = await fetch(TOKEN_MINT_URL, {
			headers: { "User-Agent": "Mezzo/1.0" },
			signal: AbortSignal.timeout(4000),
		});
		if (!res.ok) return null;

		const data = (await res.json()) as { token?: string; developerToken?: string };
		const token = data.token || data.developerToken;
		if (!token) return null;

		tokenCache = {
			token,
			// Cache for 2 hours (tokens typically last 24h+)
			expiresAt: now + 2 * 60 * 60 * 1000,
		};
		return token;
	} catch (err) {
		console.warn("Failed to fetch Apple Music developer token:", err);
		return null;
	}
}

/**
 * Fetches real-time search suggestion terms from Apple Music.
 */
export async function getAppleMusicSuggestions(
	term: string,
	storefront = "in"
): Promise<string[]> {
	const trimmed = term.trim();
	if (!trimmed) return [];

	try {
		const token = await getAppleMusicToken();
		if (!token) return [];

		const url = new URL(`${APPLE_API_BASE}/catalog/${storefront}/search/suggestions`);
		url.searchParams.set("term", trimmed);
		url.searchParams.set("kinds", "terms");
		url.searchParams.set("l", "en-US");
		url.searchParams.set("limit[results:terms]", "8");

		const res = await fetch(url.toString(), {
			headers: {
				Authorization: `Bearer ${token}`,
				"User-Agent": "Mezzo/1.0",
			},
			signal: AbortSignal.timeout(3000),
		});

		if (!res.ok) return [];

		const data = (await res.json()) as {
			results?: {
				suggestions?: Array<{
					kind?: string;
					searchTerm?: string;
					displayTerm?: string;
				}>;
			};
		};

		const suggestions: string[] = [];
		for (const item of data.results?.suggestions || []) {
			const term = item.searchTerm || item.displayTerm;
			if (term && !suggestions.includes(term)) {
				suggestions.push(term);
			}
		}

		return suggestions;
	} catch (err) {
		console.warn("Apple Music suggestions error:", err);
		return [];
	}
}

/**
 * Searches Apple Music catalog for tracks, artists, and albums.
 */
export async function searchAppleMusicCatalog(
	query: string,
	storefront = "in",
	limit = 20
): Promise<{
	tracks: Track[];
	artists: SearchArtist[];
	albums: SearchAlbum[];
}> {
	const trimmed = query.trim();
	if (!trimmed) return { tracks: [], artists: [], albums: [] };

	try {
		const token = await getAppleMusicToken();
		if (!token) return { tracks: [], artists: [], albums: [] };

		const url = new URL(`${APPLE_API_BASE}/catalog/${storefront}/search`);
		url.searchParams.set("term", trimmed);
		url.searchParams.set("types", "songs,artists,albums");
		url.searchParams.set("limit", String(limit));

		const res = await fetch(url.toString(), {
			headers: {
				Authorization: `Bearer ${token}`,
				"User-Agent": "Mezzo/1.0",
			},
			signal: AbortSignal.timeout(4500),
		});

		if (!res.ok) return { tracks: [], artists: [], albums: [] };

		const data = (await res.json()) as any;
		const songsData = data.results?.songs?.data || [];
		const artistsData = data.results?.artists?.data || [];
		const albumsData = data.results?.albums?.data || [];

		const tracks: Track[] = songsData.map((s: any, idx: number) => {
			const attr = s.attributes || {};
			const artwork = (attr.artwork?.url || "")
				.replace("{w}", "600")
				.replace("{h}", "600");
			const durMs = attr.durationInMillis || 180000;

			return {
				id: `am_${s.id}`,
				title: attr.name || "Unknown Track",
				artist: attr.artistName || "Unknown Artist",
				album: attr.albumName || "Unknown Album",
				genre: attr.genreNames?.[0] || "Music",
				year: attr.releaseDate ? parseInt(attr.releaseDate.split("-")[0], 10) : new Date().getFullYear(),
				track_number: attr.trackNumber || idx + 1,
				duration: Math.round(durMs / 1000),
				format: "Lossless FLAC",
				size: Math.round((durMs / 1000) * 120000),
				date_added: Date.now(),
				play_count: 50000 - idx * 500,
				stream_url: "", // Resolved dynamically on play via ISRC / Tidal / Saavn
				cover_url: artwork || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
			};
		});

		const artists: SearchArtist[] = artistsData.map((a: any) => {
			const attr = a.attributes || {};
			const artwork = (attr.artwork?.url || "")
				.replace("{w}", "500")
				.replace("{h}", "500");

			return {
				id: `am_art_${a.id}`,
				name: attr.name || "Artist",
				image: artwork || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
				role: "Artist",
				trackCount: 20,
			};
		});

		const albums: SearchAlbum[] = albumsData.map((alb: any) => {
			const attr = alb.attributes || {};
			const artwork = (attr.artwork?.url || "")
				.replace("{w}", "600")
				.replace("{h}", "600");

			return {
				id: `am_alb_${alb.id}`,
				album: attr.name || "Album",
				artist: attr.artistName || "Artist",
				coverUrl: artwork || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
				trackCount: attr.trackCount || 10,
				year: attr.releaseDate ? parseInt(attr.releaseDate.split("-")[0], 10) : undefined,
			};
		});

		return { tracks, artists, albums };
	} catch (err) {
		console.warn("Apple Music catalog search error:", err);
		return { tracks: [], artists: [], albums: [] };
	}
}
