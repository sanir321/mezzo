import type { Track } from "$lib/stores/player.svelte";
import * as CryptoJSModule from "crypto-js";
const CryptoJS = (CryptoJSModule as any).default || CryptoJSModule;

const BROWSER_USER_AGENT =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export const SAAVN_HEADERS: Record<string, string> = {
	"User-Agent": BROWSER_USER_AGENT,
	Accept: "application/json",
	"X-Forwarded-For": "49.36.0.1",
	"CF-IPCountry": "IN",
	Cookie: "geo=IN; L=english%2Chindi",
};

// Cloudflare Worker-safe fetch with timeout
async function safeFetch(url: string, options: RequestInit = {}, timeoutMs = 5500): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(url, {
			...options,
			signal: controller.signal,
		});
	} finally {
		clearTimeout(timer);
	}
}

function decodeHtmlEntities(str: string): string {
	if (!str) return "";
	return str
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, "&")
		.replace(/&#039;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&apos;/g, "'");
}

function decryptSaavnMediaUrl(encryptedMediaUrl: string): string {
	if (!encryptedMediaUrl) return "";
	try {
		const key = CryptoJS.enc.Utf8.parse("38346591");
		const decrypted = CryptoJS.DES.decrypt(
			encryptedMediaUrl,
			key,
			{ mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
		);
		const raw = decrypted.toString(CryptoJS.enc.Utf8);
		if (!raw || !raw.startsWith("http")) return "";
		// Saavn default URL is usually 96kbps (_96.mp4). Upgrade to 320kbps full stream
		return raw.replace(/_96\.mp4$/, "_320.mp4");
	} catch {
		return "";
	}
}

export interface SearchArtist {
	id: string;
	name: string;
	image: string;
	role?: string;
	trackCount?: number;
	tracks?: Track[];
}

export interface SearchPlaylist {
	id: string;
	name: string;
	description: string;
	coverUrl: string;
	trackCount?: number;
	isOnline?: boolean;
	query?: string;
}

export interface SearchAlbum {
	id: string;
	album: string;
	artist: string;
	coverUrl: string;
	trackCount: number;
	year?: number;
	tracks?: Track[];
}

export interface OnlineSearchResult {
	tracks: Track[];
	artists: SearchArtist[];
	playlists: SearchPlaylist[];
	albums: SearchAlbum[];
	isFallback?: boolean;
}

// Clean and normalize conversational filler phrases while preserving actual artist and title words
export function cleanSearchQuery(q: string): string {
	const trimmed = q.trim();
	const words = trimmed.split(/\s+/);
	if (words.length <= 2) {
		return trimmed.replace(/[^\w\s\.\-]/gi, " ").replace(/\s+/g, " ").trim();
	}

	const cleaned = trimmed
		.replace(/\b(official video|official audio|full video|music video|lyric video|lyrics|video song|audio song)\b/gi, " ")
		.replace(/\b(feat|featuring|ft)\b\.?/gi, " ")
		.replace(/[^\w\s\.\-]/gi, " ")
		.replace(/\s+/g, " ")
		.trim();

	return cleaned || trimmed;
}

function rankTracks(tracks: Track[], query: string): Track[] {
	const qLower = query.toLowerCase().trim();
	const tokens = qLower.split(/\s+/).filter((t) => t.length > 1);

	return [...tracks].sort((a, b) => {
		let scoreA = 0;
		let scoreB = 0;

		const aTitle = a.title.toLowerCase();
		const aArtist = (a.artist || "").toLowerCase();
		const bTitle = b.title.toLowerCase();
		const bArtist = (b.artist || "").toLowerCase();

		// Exact match on title
		if (aTitle === qLower) scoreA += 100;
		if (bTitle === qLower) scoreB += 100;

		// Title starts with query
		if (aTitle.startsWith(qLower)) scoreA += 50;
		if (bTitle.startsWith(qLower)) scoreB += 50;

		// Combined title & artist contains all query tokens
		const aBoth = `${aTitle} ${aArtist}`;
		const bBoth = `${bTitle} ${bArtist}`;

		const aMatchTokens = tokens.filter((t) => aBoth.includes(t)).length;
		const bMatchTokens = tokens.filter((t) => bBoth.includes(t)).length;
		scoreA += aMatchTokens * 25;
		scoreB += bMatchTokens * 25;

		// Bonus if title contains query keywords
		if (tokens.every((t) => aTitle.includes(t))) scoreA += 30;
		if (tokens.every((t) => bTitle.includes(t))) scoreB += 30;

		// Bonus for popularity / play count
		scoreA += Math.min(10, (a.play_count || 0) / 10000);
		scoreB += Math.min(10, (b.play_count || 0) / 10000);

		return scoreB - scoreA;
	});
}

// 1. Search JioSaavn catalog (Provides full 320kbps complete tracks with full 3-5m duration)
export async function searchJioSaavnMusic(query: string, limit = 25): Promise<Track[]> {
	try {
		const raw = query.trim();
		const cleaned = cleanSearchQuery(raw);

		async function fetchSaavnPids(searchTerm: string): Promise<string[]> {
			const searchUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=${limit}&p=1&q=${encodeURIComponent(searchTerm)}`;
			const res = await safeFetch(searchUrl, {
				headers: SAAVN_HEADERS,
			}, 4500);

			if (!res.ok) return [];
			const rawText = await res.text();
			let clean = rawText.trim();
			if (clean.startsWith("/**/") || clean.startsWith("//")) {
				clean = clean.substring(clean.indexOf("{"));
			}
			const searchJson = JSON.parse(clean);
			let pids: string[] = (searchJson.results || []).map((r: any) => r.id).filter(Boolean);

			// If search.getResults returned no pids, fallback to autocomplete.get
			if (pids.length === 0) {
				const autoUrl = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&ctx=web6dot0&query=${encodeURIComponent(searchTerm)}`;
				const autoRes = await safeFetch(autoUrl, { headers: SAAVN_HEADERS }, 3500);
				if (autoRes.ok) {
					const autoData = await autoRes.json() as any;
					const autoSongs = autoData.songs?.data || [];
					pids = autoSongs.map((s: any) => s.id).filter(Boolean);
				}
			}
			return pids;
		}

		// Try cleaned query first if cleaner has stripped stopwords, else try raw
		let pids = await fetchSaavnPids(cleaned || raw);
		if (pids.length === 0 && cleaned !== raw) {
			pids = await fetchSaavnPids(raw);
		}

		if (pids.length === 0) return [];

		// Batch fetch full details with encrypted_media_url for all pids in 1 call
		const detUrl = `https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${pids.slice(0, limit).join(",")}&_format=json&_marker=0&ctx=web6dot0`;
		const detRes = await safeFetch(detUrl, {
			headers: SAAVN_HEADERS,
		}, 5000);

		if (!detRes.ok) return [];
		const detData = await detRes.json() as any;
		const songs = detData.songs || [];

		const tracks: Track[] = [];
		for (let i = 0; i < songs.length; i++) {
			const s = songs[i];
			const streamUrl = decryptSaavnMediaUrl(s.encrypted_media_url || s.encrypted_drm_media_url || "");
			if (!streamUrl) continue;

			const dur = parseInt(s.duration, 10) || 180;
			const artwork = (s.image || "")
				.replace("150x150", "500x500")
				.replace("50x50", "500x500")
				.replace("http://", "https://");

			tracks.push({
				id: `saavn_${s.id}`,
				title: decodeHtmlEntities(s.song || "Unknown Title"),
				artist: decodeHtmlEntities(s.primary_artists || s.singers || "Unknown Artist"),
				album: decodeHtmlEntities(s.album || "Single"),
				genre: s.language || "Music",
				year: s.year ? parseInt(s.year, 10) : new Date().getFullYear(),
				track_number: i + 1,
				duration: dur,
				format: "AAC 320kbps",
				size: Math.round(dur * 40000), // ~320kbps byte estimate
				date_added: Date.now(),
				play_count: s.play_count ? parseInt(s.play_count, 10) : 50000 - i * 1000,
				stream_url: streamUrl,
				cover_url: artwork,
			});
		}

		// Rank tracks so exact title / artist matches appear at index 0
		return rankTracks(tracks, cleaned || raw);
	} catch (err) {
		console.warn("JioSaavn search failed:", err);
		return [];
	}
}

// Resolve dynamic 320kbps MP4 stream URL for any JioSaavn song ID on the fly
export async function resolveSaavnTrackStream(trackId: string): Promise<string | null> {
	try {
		const pid = trackId.replace(/^saavn_/, "");
		const url = `https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${encodeURIComponent(pid)}&_format=json&_marker=0&ctx=web6dot0`;
		const res = await safeFetch(url, { headers: SAAVN_HEADERS }, 5000);
		if (!res.ok) return null;
		const data = await res.json() as any;
		const song = data.songs?.[0];
		if (!song) return null;
		const enc = song.encrypted_media_url || song.encrypted_drm_media_url || "";
		const decrypted = decryptSaavnMediaUrl(enc);
		return decrypted || null;
	} catch {
		return null;
	}
}

// Search JioSaavn Artists
export async function searchJioSaavnArtists(query: string, limit = 10): Promise<SearchArtist[]> {
	try {
		const q = cleanSearchQuery(query) || query.trim();
		const url = `https://www.jiosaavn.com/api.php?__call=search.getArtistResults&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=${limit}&p=1&q=${encodeURIComponent(q)}`;
		const res = await safeFetch(url, { headers: SAAVN_HEADERS }, 4500);
		if (!res.ok) return [];

		const json = await res.json() as any;
		const results = json.results || [];
		return results.map((r: any): SearchArtist => {
			const img = (r.image || "")
				.replace("50x50", "500x500")
				.replace("150x150", "500x500")
				.replace("http://", "https://");
			return {
				id: `saavn_art_${r.id}`,
				name: decodeHtmlEntities(r.name || "Unknown Artist"),
				image: !img || img.includes("artist-default-music")
					? "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80"
					: img,
				role: r.role || "Artist",
				trackCount: r.ctr ? parseInt(r.ctr, 10) : undefined,
			};
		});
	} catch (err) {
		console.warn("JioSaavn artist search failed:", err);
		return [];
	}
}

// Search JioSaavn Playlists
export async function searchJioSaavnPlaylists(query: string, limit = 10): Promise<SearchPlaylist[]> {
	try {
		const q = cleanSearchQuery(query) || query.trim();
		const url = `https://www.jiosaavn.com/api.php?__call=search.getPlaylistResults&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=${limit}&p=1&q=${encodeURIComponent(q)}`;
		const res = await safeFetch(url, { headers: SAAVN_HEADERS }, 4500);
		if (!res.ok) return [];

		const json = await res.json() as any;
		const results = json.results || [];
		return results.map((r: any): SearchPlaylist => {
			const img = (r.image || "")
				.replace("150x150", "500x500")
				.replace("50x50", "500x500")
				.replace("http://", "https://");
			return {
				id: `saavn_pl_${r.id}`,
				name: decodeHtmlEntities(r.title || "Playlist"),
				description: decodeHtmlEntities(r.subtitle || "Online Playlist"),
				coverUrl: img || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
				trackCount: parseInt(r.subtitle || "25", 10) || 25,
				isOnline: true,
			};
		});
	} catch (err) {
		console.warn("JioSaavn playlist search failed:", err);
		return [];
	}
}

// Search JioSaavn Albums
export async function searchJioSaavnAlbums(query: string, limit = 10): Promise<SearchAlbum[]> {
	try {
		const q = cleanSearchQuery(query) || query.trim();
		const url = `https://www.jiosaavn.com/api.php?__call=search.getAlbumResults&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=${limit}&p=1&q=${encodeURIComponent(q)}`;
		const res = await safeFetch(url, { headers: SAAVN_HEADERS }, 4500);
		if (!res.ok) return [];

		const json = await res.json() as any;
		const results = json.results || [];
		return results.map((r: any): SearchAlbum => {
			const img = (r.image || "")
				.replace("150x150", "500x500")
				.replace("50x50", "500x500")
				.replace("http://", "https://");
			return {
				id: `saavn_alb_${r.id}`,
				album: decodeHtmlEntities(r.title || "Album"),
				artist: decodeHtmlEntities(r.subtitle || "Various Artists"),
				coverUrl: img || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
				trackCount: parseInt(r.more_info?.song_count || "10", 10) || 10,
				year: r.year ? parseInt(r.year, 10) : undefined,
			};
		});
	} catch (err) {
		console.warn("JioSaavn album search failed:", err);
		return [];
	}
}

// Fetch Full JioSaavn Playlist Details with Decrypted 320kbps Streams
export async function getJioSaavnPlaylistDetails(listid: string): Promise<{
	playlist: {
		id: string;
		name: string;
		description: string;
		cover_key: string;
		createdAt: number;
		updatedAt: number;
		isFeatured: boolean;
	};
	tracks: Track[];
} | null> {
	try {
		const url = `https://www.jiosaavn.com/api.php?__call=playlist.getDetails&listid=${encodeURIComponent(listid)}&_format=json&_marker=0&ctx=web6dot0`;
		const res = await safeFetch(url, { headers: SAAVN_HEADERS }, 5500);
		if (!res.ok) return null;

		const data = await res.json() as any;
		const songs = data.songs || [];
		const artwork = (data.image || "")
			.replace("150x150", "500x500")
			.replace("50x50", "500x500")
			.replace("http://", "https://");

		const tracks: Track[] = [];
		for (let i = 0; i < songs.length; i++) {
			const s = songs[i];
			const streamUrl = decryptSaavnMediaUrl(s.encrypted_media_url || s.encrypted_drm_media_url || "");
			if (!streamUrl) continue;

			const dur = parseInt(s.duration, 10) || 180;
			const trackArt = (s.image || artwork)
				.replace("150x150", "500x500")
				.replace("50x50", "500x500")
				.replace("http://", "https://");

			tracks.push({
				id: `saavn_${s.id}`,
				title: decodeHtmlEntities(s.song || "Unknown Title"),
				artist: decodeHtmlEntities(s.primary_artists || s.singers || "Unknown Artist"),
				album: decodeHtmlEntities(s.album || data.listname || "Playlist"),
				genre: s.language || "Music",
				year: s.year ? parseInt(s.year, 10) : new Date().getFullYear(),
				track_number: i + 1,
				duration: dur,
				format: "AAC 320kbps",
				size: Math.round(dur * 40000),
				date_added: Date.now(),
				play_count: s.play_count ? parseInt(s.play_count, 10) : 50000 - i * 1000,
				stream_url: streamUrl,
				cover_url: trackArt,
			});
		}

		return {
			playlist: {
				id: `saavn_pl_${listid}`,
				name: decodeHtmlEntities(data.listname || "Playlist"),
				description: decodeHtmlEntities(data.header_desc || `${tracks.length} Songs`),
				cover_key: artwork || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
				createdAt: Math.floor(Date.now() / 1000),
				updatedAt: Math.floor(Date.now() / 1000),
				isFeatured: true,
			},
			tracks,
		};
	} catch (err) {
		console.warn("Failed to get JioSaavn playlist details:", err);
		return null;
	}
}

// Fetch Full JioSaavn Album Details with Decrypted 320kbps Streams
export async function getJioSaavnAlbumDetails(albumid: string): Promise<{
	album: {
		id: string;
		title: string;
		artist: string;
		coverUrl: string;
		year?: number;
	};
	tracks: Track[];
} | null> {
	try {
		const url = `https://www.jiosaavn.com/api.php?__call=content.getAlbumDetails&albumid=${encodeURIComponent(albumid)}&_format=json&_marker=0&ctx=web6dot0`;
		const res = await safeFetch(url, { headers: SAAVN_HEADERS }, 5500);
		if (!res.ok) return null;

		const data = await res.json() as any;
		const songs = data.songs || [];
		const artwork = (data.image || "")
			.replace("150x150", "500x500")
			.replace("50x50", "500x500")
			.replace("http://", "https://");

		const tracks: Track[] = [];
		for (let i = 0; i < songs.length; i++) {
			const s = songs[i];
			const streamUrl = decryptSaavnMediaUrl(s.encrypted_media_url || s.encrypted_drm_media_url || "");
			if (!streamUrl) continue;

			const dur = parseInt(s.duration, 10) || 180;
			const trackArt = (s.image || artwork)
				.replace("150x150", "500x500")
				.replace("50x50", "500x500")
				.replace("http://", "https://");

			tracks.push({
				id: `saavn_${s.id}`,
				title: decodeHtmlEntities(s.song || "Unknown Title"),
				artist: decodeHtmlEntities(s.primary_artists || data.primary_artists || "Unknown Artist"),
				album: decodeHtmlEntities(data.title || data.name || "Album"),
				genre: s.language || "Music",
				year: data.year ? parseInt(data.year, 10) : new Date().getFullYear(),
				track_number: i + 1,
				duration: dur,
				format: "AAC 320kbps",
				size: Math.round(dur * 40000),
				date_added: Date.now(),
				play_count: s.play_count ? parseInt(s.play_count, 10) : 50000 - i * 1000,
				stream_url: streamUrl,
				cover_url: trackArt,
			});
		}

		return {
			album: {
				id: `saavn_alb_${albumid}`,
				title: decodeHtmlEntities(data.title || data.name || "Album"),
				artist: decodeHtmlEntities(data.primary_artists || "Various Artists"),
				coverUrl: artwork,
				year: data.year ? parseInt(data.year, 10) : undefined,
			},
			tracks,
		};
	} catch (err) {
		console.warn("Failed to get JioSaavn album details:", err);
		return null;
	}
}

import {
	searchTidalTracks,
	searchTidalArtists,
	searchTidalAlbums,
	searchTidalPlaylists,
} from "./tidal";

// Unified Search: Returns tracks, artists, playlists, and albums in parallel like Spotify
export async function searchOnlineMusic(
	query: string,
	limit = 30
): Promise<OnlineSearchResult> {
	const trimmed = query.trim();
	if (!trimmed) {
		return { tracks: [], artists: [], playlists: [], albums: [], isFallback: false };
	}

	const cleaned = cleanSearchQuery(trimmed) || trimmed;

	const isRegionalIndian = /\b(bollywood|hindi|punjabi|tamil|telugu|kannada|malayalam|bhojpuri|marathi|bengali|gujarati|desi|sufi|ghazal)\b/i.test(trimmed);
	const lowerTrimmed = trimmed.toLowerCase();

	// If user is searching a generic regional term, expand for JioSaavn to return actual hit songs instead of word matches
	const saavnSearchQuery =
		lowerTrimmed === "bollywood" ? "bollywood top hits"
		: lowerTrimmed === "hindi" ? "hindi top hits"
		: lowerTrimmed === "punjabi" ? "punjabi top hits"
		: lowerTrimmed === "tamil" ? "tamil top hits"
		: lowerTrimmed === "telugu" ? "telugu top hits"
		: lowerTrimmed === "malayalam" ? "malayalam top hits"
		: lowerTrimmed === "kannada" ? "kannada top hits"
		: trimmed;

	// Query Tidal and JioSaavn concurrently
	const [
		tidalTracksRes,
		tidalArtistsRes,
		tidalAlbumsRes,
		tidalPlaylistsRes,
		saavnTracksRes,
		saavnArtistsRes,
		saavnPlaylistsRes,
		saavnAlbumsRes,
	] = await Promise.allSettled([
		searchTidalTracks(trimmed, limit),
		searchTidalArtists(cleaned, 10),
		searchTidalAlbums(cleaned, 10),
		searchTidalPlaylists(cleaned, 10),
		searchJioSaavnMusic(saavnSearchQuery, limit),
		searchJioSaavnArtists(cleaned, 10),
		searchJioSaavnPlaylists(saavnSearchQuery, 10),
		searchJioSaavnAlbums(cleaned, 10),
	]);

	const tidalTracks: Track[] = tidalTracksRes.status === "fulfilled" ? tidalTracksRes.value : [];
	const saavnTracks: Track[] = saavnTracksRes.status === "fulfilled" ? saavnTracksRes.value : [];

	// Merge tracks: Prioritize based on search intent (Indian regional -> Saavn first; Western / Global -> Tidal first)
	const trackMap = new Map<string, Track>();
	const primaryTracks = isRegionalIndian ? saavnTracks : tidalTracks;
	const secondaryTracks = isRegionalIndian ? tidalTracks : saavnTracks;

	for (const t of primaryTracks) {
		const key = `${t.title.toLowerCase().replace(/[^a-z0-9]/g, "")}_${(t.artist || "").split(/[,&/]/)[0].toLowerCase().trim()}`;
		trackMap.set(key, t);
	}
	for (const t of secondaryTracks) {
		// Filter out Western cafe/lounge false-positives for Indian searches
		if (isRegionalIndian && (t.artist || "").toLowerCase().includes("buddha") && !(t.title || "").toLowerCase().includes("buddha")) {
			continue;
		}
		const key = `${t.title.toLowerCase().replace(/[^a-z0-9]/g, "")}_${(t.artist || "").split(/[,&/]/)[0].toLowerCase().trim()}`;
		if (!trackMap.has(key)) {
			trackMap.set(key, t);
		} else {
			// Attach direct 320kbps Akamai CDN stream URL to track for instant playback
			const existing = trackMap.get(key)!;
			if (t.stream_url && t.stream_url.startsWith("http")) {
				existing.stream_url = t.stream_url;
			}
		}
	}

	let tracks: Track[] = Array.from(trackMap.values()).slice(0, limit);

	// Merge Artists
	const tidalArtists: SearchArtist[] = tidalArtistsRes.status === "fulfilled" ? tidalArtistsRes.value : [];
	const saavnArtists: SearchArtist[] = saavnArtistsRes.status === "fulfilled" ? saavnArtistsRes.value : [];
	const artistMap = new Map<string, SearchArtist>();
	const primaryArtists = isRegionalIndian ? saavnArtists : tidalArtists;
	const secondaryArtists = isRegionalIndian ? tidalArtists : saavnArtists;

	for (const a of primaryArtists) {
		artistMap.set(a.name.toLowerCase(), a);
	}
	for (const a of secondaryArtists) {
		if (!artistMap.has(a.name.toLowerCase())) {
			artistMap.set(a.name.toLowerCase(), a);
		}
	}

	// Dynamic artist extraction from matched tracks
	for (const t of tracks) {
		if (!t.artist) continue;
		const names = t.artist.split(/[,&/]|(?:feat\.?)|(?:ft\.?)/i).map((n) => n.trim()).filter((n) => n.length > 1);
		for (const name of names) {
			const key = name.toLowerCase();
			if (!artistMap.has(key)) {
				artistMap.set(key, {
					id: `art_${encodeURIComponent(name)}`,
					name,
					image: t.cover_url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
					role: "Artist",
					trackCount: 1,
					tracks: [t],
				});
			} else {
				const existing = artistMap.get(key)!;
				existing.trackCount = (existing.trackCount || 0) + 1;
				if (!existing.tracks) existing.tracks = [];
				if (!existing.tracks.some((x) => x.id === t.id)) existing.tracks.push(t);
			}
		}
	}
	let artists: SearchArtist[] = Array.from(artistMap.values()).slice(0, 15);

	// Merge Albums
	const tidalAlbums: SearchAlbum[] = tidalAlbumsRes.status === "fulfilled" ? tidalAlbumsRes.value : [];
	const saavnAlbums: SearchAlbum[] = saavnAlbumsRes.status === "fulfilled" ? saavnAlbumsRes.value : [];
	const albumMap = new Map<string, SearchAlbum>();
	for (const a of tidalAlbums) {
		albumMap.set(`${a.album}_${a.artist}`.toLowerCase(), a);
	}
	for (const a of saavnAlbums) {
		const key = `${a.album}_${a.artist}`.toLowerCase();
		if (!albumMap.has(key)) {
			albumMap.set(key, a);
		}
	}

	// Dynamic album extraction from matched tracks
	for (const t of tracks) {
		if (!t.album || t.album.toLowerCase() === "single") continue;
		const key = `${t.album}_${t.artist || ""}`.toLowerCase();
		if (!albumMap.has(key)) {
			albumMap.set(key, {
				id: `alb_${encodeURIComponent(t.album)}`,
				album: t.album,
				artist: t.artist || "Various Artists",
				coverUrl: t.cover_url || "",
				trackCount: 1,
				year: t.year || undefined,
				tracks: [t],
			});
		} else {
			const existing = albumMap.get(key)!;
			existing.trackCount = (existing.trackCount || 0) + 1;
			if (!existing.tracks) existing.tracks = [];
			if (!existing.tracks.some((x) => x.id === t.id)) existing.tracks.push(t);
		}
	}
	let albums: SearchAlbum[] = Array.from(albumMap.values()).slice(0, 15);

	// Merge Playlists
	const tidalPlaylists: SearchPlaylist[] = tidalPlaylistsRes.status === "fulfilled" ? tidalPlaylistsRes.value : [];
	const saavnPlaylists: SearchPlaylist[] = saavnPlaylistsRes.status === "fulfilled" ? saavnPlaylistsRes.value : [];
	const playlistMap = new Map<string, SearchPlaylist>();
	const primaryPlaylists = isRegionalIndian ? saavnPlaylists : tidalPlaylists;
	const secondaryPlaylists = isRegionalIndian ? tidalPlaylists : saavnPlaylists;

	for (const p of primaryPlaylists) {
		playlistMap.set(p.name.toLowerCase(), p);
	}
	for (const p of secondaryPlaylists) {
		if (!playlistMap.has(p.name.toLowerCase())) {
			playlistMap.set(p.name.toLowerCase(), p);
		}
	}
	let playlists: SearchPlaylist[] = Array.from(playlistMap.values()).slice(0, 15);

	// Contextual playlist generation if playlists are scarce:
	// Spotify generates "Artist Radio" or "This is Artist" for search queries
	if (playlists.length < 3 && tracks.length > 0) {
		const primaryArtist = tracks[0].artist?.split(/[,&/]|(?:feat)/i)[0]?.trim();
		if (primaryArtist) {
			const radioId = `radio_${encodeURIComponent(primaryArtist)}`;
			if (!playlists.some((p) => p.name.toLowerCase().includes(primaryArtist.toLowerCase()))) {
				playlists.unshift({
					id: radioId,
					name: `${primaryArtist} Radio`,
					description: `Personalized mix featuring ${primaryArtist} and similar artists`,
					coverUrl: tracks[0].cover_url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
					trackCount: tracks.length,
					isOnline: true,
					query: primaryArtist,
				});
			}
		}
	}

	return {
		tracks,
		artists,
		playlists: playlists.slice(0, 15),
		albums: albums.slice(0, 15),
		isFallback: false,
	};
}

// Full-length Trending Tracks: Uses JioSaavn top hits & charts
export async function getTrendingOnlineTracks(limit = 25): Promise<Track[]> {
	try {
		// 1. Try JioSaavn trending global & popular hits
		const trendingSaavn = await searchJioSaavnMusic("Top Global Hits", limit);
		if (trendingSaavn.length >= 5) {
			return trendingSaavn;
		}

		// 2. Try English Trending & Billboard hits
		const fallbackTrending = await searchJioSaavnMusic("Trending Songs", limit);
		if (fallbackTrending.length > 0) {
			return fallbackTrending;
		}
	} catch (err) {
		console.warn("Trending fetch failed:", err);
	}

	return [];
}

