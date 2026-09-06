import { Hono } from "hono";
import type { Bindings } from "../env";
import { searchSaavn, resolveSaavnTrack, type UniversalTrack } from "../lib/providers/saavn";
import { searchYouTube, resolveYouTubeStream } from "../lib/providers/youtube";
import { searchDeezer } from "../lib/providers/deezer";

const app = new Hono<{ Bindings: Bindings }>({ strict: false });

export async function resolveAnyStream(params: {
  id?: string;
  title?: string;
  artist?: string;
  query?: string;
}): Promise<{ url: string; quality: string; source: string } | null> {
  const { id = "", title = "", artist = "", query = "" } = params;

  // 1. Check ID-specific resolution
  if (id.startsWith("saavn_")) {
    const stream = await resolveSaavnTrack(title || id.replace(/^saavn_/, ""), artist);
    if (stream) return { url: stream, quality: "320kbps CD-Quality", source: "saavn" };
  } else if (id.startsWith("yt_")) {
    const stream = await resolveYouTubeStream(id);
    if (stream) return { url: stream, quality: "Opus 160kbps", source: "youtube" };
  }

  // 2. Multi-tier resolution by Title + Artist or Query
  const searchPhrase = (title && artist ? `${title} ${artist}` : query || title).trim();
  if (!searchPhrase) return null;

  // Tier 1: JioSaavn Akamai 320kbps CDN (Ultra fast & CD quality)
  try {
    const saavnUrl = await resolveSaavnTrack(title || searchPhrase, artist);
    if (saavnUrl) {
      return { url: saavnUrl, quality: "320kbps CD-Quality", source: "saavn" };
    }
  } catch {}

  // Tier 2: YouTube Audio (Piped/Invidious audio streams)
  try {
    const ytUrl = await resolveYouTubeStream(searchPhrase);
    if (ytUrl) {
      return { url: ytUrl, quality: "Opus 160kbps", source: "youtube" };
    }
  } catch {}

  // Tier 3: Deezer 320kbps/preview
  try {
    const deezerTracks = await searchDeezer(searchPhrase, 3);
    if (deezerTracks.length > 0 && deezerTracks[0].streamUrl) {
      return { url: deezerTracks[0].streamUrl, quality: "AAC 320kbps", source: "deezer" };
    }
  } catch {}

  return null;
}

// Unified /stream endpoint
app.get("/stream", async (c) => {
  const searchParams = new URL(c.req.url).searchParams;
  const id = searchParams.get("id") || "";
  const title = searchParams.get("title") || "";
  const artist = searchParams.get("artist") || "";
  const query = searchParams.get("query") || searchParams.get("q") || "";
  const format = searchParams.get("format") || "redirect";

  const result = await resolveAnyStream({ id, title, artist, query });
  if (!result) {
    return c.json({ ok: false, error: "Track stream not found" }, 404);
  }

  if (format === "json") {
    return c.json({
      ok: true,
      url: result.url,
      quality: result.quality,
      source: result.source,
    });
  }

  return c.redirect(result.url, 302);
});

// Unified /search/universal endpoint
app.get("/search/universal", async (c) => {
  const searchParams = new URL(c.req.url).searchParams;
  const query = (searchParams.get("q") || searchParams.get("query") || "").trim();
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);

  if (!query) {
    return c.json({ ok: false, error: "Missing query parameter 'q'" }, 400);
  }

  // Fetch concurrently from Saavn + Deezer + YouTube
  const [saavnRes, deezerRes, ytRes] = await Promise.allSettled([
    searchSaavn(query, limit),
    searchDeezer(query, Math.floor(limit / 2)),
    searchYouTube(query, Math.floor(limit / 2)),
  ]);

  const saavnTracks = saavnRes.status === "fulfilled" ? saavnRes.value : [];
  const deezerTracks = deezerRes.status === "fulfilled" ? deezerRes.value : [];
  const ytTracks = ytRes.status === "fulfilled" ? ytRes.value : [];

  // Merge with title deduping
  const seen = new Set<string>();
  const merged: UniversalTrack[] = [];

  for (const track of [...saavnTracks, ...deezerTracks, ...ytTracks]) {
    const key = `${track.title.toLowerCase()} - ${track.artist.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(track);
    }
  }

  return c.json({
    ok: true,
    query,
    count: merged.length,
    tracks: merged,
  });
});

export default app;
