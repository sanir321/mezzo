export interface LyricLine {
	time: number; // in seconds
	text: string;
}

export interface LyricsData {
	synced: LyricLine[];
	plain: string;
	instrumental: boolean;
	hasSynced: boolean;
}

const lyricsCache = new Map<string, LyricsData | null>();

export function parseLrc(lrcText: string): LyricLine[] {
	if (!lrcText) return [];
	const lines = lrcText.split("\n");
	const result: LyricLine[] = [];
	const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

	for (const line of lines) {
		const matches = [...line.matchAll(timeRegex)];
		if (matches.length === 0) continue;

		const text = line.replace(timeRegex, "").trim();
		if (!text) continue;

		for (const match of matches) {
			const minutes = parseInt(match[1], 10);
			const seconds = parseInt(match[2], 10);
			const millisStr = match[3] || "0";
			const millis = parseInt(millisStr.padEnd(3, "0").slice(0, 3), 10);
			const totalSeconds = minutes * 60 + seconds + millis / 1000;

			result.push({
				time: totalSeconds,
				text,
			});
		}
	}

	return result.sort((a, b) => a.time - b.time);
}

export async function fetchLyrics(
	trackName: string,
	artistName: string,
	duration?: number
): Promise<LyricsData | null> {
	const cleanTrack = trackName
		.replace(/\(.*?\)/g, "")
		.replace(/\[.*?\]/g, "")
		.replace(/- Live.*$/i, "")
		.trim();
	const cleanArtist = (artistName || "").split(/[,&]/)[0].trim();
	const cacheKey = `${cleanTrack.toLowerCase()}___${cleanArtist.toLowerCase()}`;

	if (lyricsCache.has(cacheKey)) {
		return lyricsCache.get(cacheKey) || null;
	}

	try {
		const durParam = duration ? `&duration=${Math.round(duration)}` : "";
		const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTrack)}&artist_name=${encodeURIComponent(cleanArtist)}${durParam}`;
		
		const res = await fetch(url, {
			headers: {
				"User-Agent": "Mezzo/1.0 (https://mezzo-music.pages.dev)",
			},
		});

		if (res.status === 404) {
			const searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTrack)}&artist_name=${encodeURIComponent(cleanArtist)}`;
			const sRes = await fetch(searchUrl, {
				headers: {
					"User-Agent": "Mezzo/1.0 (https://mezzo-music.pages.dev)",
				},
			});
			if (sRes.ok) {
				const hits = await sRes.json();
				if (Array.isArray(hits) && hits.length > 0) {
					const best = hits[0];
					const synced = best.syncedLyrics ? parseLrc(best.syncedLyrics) : [];
					const data: LyricsData = {
						synced,
						plain: best.plainLyrics || "",
						instrumental: Boolean(best.instrumental),
						hasSynced: synced.length > 0,
					};
					lyricsCache.set(cacheKey, data);
					return data;
				}
			}
			lyricsCache.set(cacheKey, null);
			return null;
		}

		if (!res.ok) {
			lyricsCache.set(cacheKey, null);
			return null;
		}

		const data = await res.json();
		const synced = data.syncedLyrics ? parseLrc(data.syncedLyrics) : [];
		const result: LyricsData = {
			synced,
			plain: data.plainLyrics || "",
			instrumental: Boolean(data.instrumental),
			hasSynced: synced.length > 0,
		};

		lyricsCache.set(cacheKey, result);
		return result;
	} catch (err) {
		console.warn("Failed to fetch lyrics:", err);
		lyricsCache.set(cacheKey, null);
		return null;
	}
}
