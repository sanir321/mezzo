import type { UniversalTrack } from "./saavn";

const PIPED_INSTANCES = [
  "https://api.piped.private.coffee",
  "https://pipedapi.kavin.rocks",
  "https://piped-api.lunar.icu",
];

async function fetchFromPiped(endpoint: string, timeoutMs = 4500): Promise<any> {
  for (const base of PIPED_INSTANCES) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${base}${endpoint}`, {
        headers: { "User-Agent": "Mezzo/1.0" },
        signal: controller.signal,
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Try next mirror
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

export async function searchYouTube(query: string, limit = 15): Promise<UniversalTrack[]> {
  try {
    const data = await fetchFromPiped(`/search?q=${encodeURIComponent(query)}&filter=music_songs`);
    const items = data?.items || [];

    return items
      .slice(0, limit)
      .map((item: any): UniversalTrack | null => {
        const videoId = (item.url || "").replace(/^\/watch\?v=/, "");
        if (!videoId) return null;

        return {
          id: `yt_${videoId}`,
          title: item.title || "",
          artist: item.uploaderName || "Unknown Artist",
          album: "YouTube Music",
          duration: Number(item.duration) || 0,
          coverUrl: item.thumbnail || "",
          streamUrl: "", // Resolved on demand
          source: "youtube",
          quality: "High Quality Opus 160kbps",
        };
      })
      .filter((t: UniversalTrack | null): t is UniversalTrack => Boolean(t && t.title));
  } catch {
    return [];
  }
}

export async function resolveYouTubeStream(videoIdOrQuery: string): Promise<string | null> {
  try {
    let videoId = videoIdOrQuery.replace(/^yt_/, "");
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      // It's a search query
      const tracks = await searchYouTube(videoIdOrQuery, 3);
      if (tracks.length === 0) return null;
      videoId = tracks[0].id.replace(/^yt_/, "");
    }

    const data = await fetchFromPiped(`/streams/${videoId}`);
    if (!data || !Array.isArray(data.audioStreams)) return null;

    // Filter audio streams and sort by bitrate descending
    const audioStreams = data.audioStreams.filter(
      (s: any) => s && typeof s.url === "string" && s.url
    );

    audioStreams.sort((a: any, b: any) => (Number(b.bitrate) || 0) - (Number(a.bitrate) || 0));

    if (audioStreams.length > 0) {
      return audioStreams[0].url;
    }
    return null;
  } catch {
    return null;
  }
}
