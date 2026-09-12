import { Hono } from "hono";
import type { Bindings } from "../env";
import { searchSaavn, resolveSaavnTrack, type UniversalTrack } from "../lib/providers/saavn";
import { searchYouTube, resolveYouTubeStream } from "../lib/providers/youtube";
import { searchDeezer } from "../lib/providers/deezer";
import { tidalJsonRequest } from "../lib/tidal/client";

const app = new Hono<{ Bindings: Bindings }>({ strict: false });

export async function resolveAnyStream(
  env: Bindings,
  params: {
    id?: string;
    title?: string;
    artist?: string;
    query?: string;
  },
): Promise<{ url: string; quality: string; source: string } | null> {
  const { id = "", title = "", artist = "", query = "" } = params;

  if (id.startsWith("saavn_")) {
    const stream = await resolveSaavnTrack(title || id.replace(/^saavn_/, ""), artist);
    if (stream) return { url: stream, quality: "320kbps CD-Quality", source: "saavn" };
  } else if (id.startsWith("yt_")) {
    const stream = await resolveYouTubeStream(id);
    if (stream) return { url: stream, quality: "Opus 160kbps", source: "youtube" };
  } else if (id.startsWith("deezer_")) {
    const deezerId = id.replace(/^deezer_/, "");
    try {
      const res = await fetch(`https://api.deezer.com/track/${deezerId}`, {
        headers: { "User-Agent": "Mezzo/1.0" },
      });
      if (res.ok) {
        const info = (await res.json()) as any;
        // Deezer only serves 30s previews; use the track identity to find a
        // full-length stream from Saavn/YouTube instead of playing a preview.
        const deezerTitle = info?.title ?? title;
        const deezerArtist = info?.artist?.name ?? artist;
        const phrase =
          (deezerTitle && deezerArtist ? `${deezerTitle} ${deezerArtist}` : query || deezerTitle).trim();
        if (phrase) {
          const full = await resolveFromGenericCascade(phrase);
          if (full) return full;
        }
      }
    } catch {
      // fall through to universal search
    }
  } else if (id.startsWith("tidal_")) {
    try {
      const trackId = id.replace(/^tidal_/, "");
      const { data } = await tidalJsonRequest({
        env,
        url: `https://api.tidal.com/v1/tracks/${trackId}/`,
        params: { countryCode: "US" },
      });
      const trackTitle = data?.title ?? title;
      const trackArtist = data?.artist?.name ?? artist;
      const searchPhrase = (trackTitle && trackArtist ? `${trackTitle} ${trackArtist}` : query || trackTitle).trim();
      const stream = await resolveSaavnTrack(trackTitle || searchPhrase, trackArtist);
      if (stream) return { url: stream, quality: "320kbps CD-Quality", source: "tidal" };
      if (searchPhrase) {
        const fallback = await resolveFromGenericCascade(searchPhrase);
        if (fallback) return fallback;
      }
    } catch (e) {
      console.warn("Tidal stream resolution failed:", e);
    }
  }

  const searchPhrase = (title && artist ? `${title} ${artist}` : query || title).trim();
  if (!searchPhrase) return null;

  const fallback = await resolveFromGenericCascade(searchPhrase);
  return fallback;
}

async function resolveFromGenericCascade(
  searchPhrase: string,
): Promise<{ url: string; quality: string; source: string } | null> {
  try {
    const saavnUrl = await resolveSaavnTrack(searchPhrase, "");
    if (saavnUrl) {
      return { url: saavnUrl, quality: "320kbps CD-Quality", source: "saavn" };
    }
  } catch {}

  try {
    const ytUrl = await resolveYouTubeStream(searchPhrase);
    if (ytUrl) {
      return { url: ytUrl, quality: "Opus 160kbps", source: "youtube" };
    }
  } catch {}

  // No full-length stream found. Never serve a 30-second preview.
  return null;
}

app.get("/stream", async (c) => {
  const searchParams = new URL(c.req.url).searchParams;
  const id = searchParams.get("id") || "";
  const title = searchParams.get("title") || "";
  const artist = searchParams.get("artist") || "";
  const query = searchParams.get("query") || searchParams.get("q") || "";
  const format = searchParams.get("format") || "redirect";

  const result = await resolveAnyStream(c.env, { id, title, artist, query });
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

app.get("/search/universal", async (c) => {
  const searchParams = new URL(c.req.url).searchParams;
  const query = (searchParams.get("q") || searchParams.get("query") || "").trim();
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);

  if (!query) {
    return c.json({ ok: false, error: "Missing query parameter 'q'" }, 400);
  }

  const [saavnRes, deezerRes, ytRes] = await Promise.allSettled([
    searchSaavn(query, limit),
    searchDeezer(query, Math.floor(limit / 2)),
    searchYouTube(query, Math.floor(limit / 2)),
  ]);

  const saavnTracks = saavnRes.status === "fulfilled" ? saavnRes.value : [];
  const deezerTracks = deezerRes.status === "fulfilled" ? deezerRes.value : [];
  const ytTracks = ytRes.status === "fulfilled" ? ytRes.value : [];

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
