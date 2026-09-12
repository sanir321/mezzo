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

const UA = "Mezzo/1.0 (https://mezzo-music.pages.dev)";

// Qualifiers that describe the format/version of a recording, not its identity.
const QUALIFIER_TOKEN_RE =
  /\b(?:official\s*(?:video|audio|lyric|lyric\s*video|music\s*video)|with\s*lyrics|\blyrics?\b|\bhd\b|\bhq\b|\b4k?\b|\bscreen(?:\s*version)?\b|visualizer|full\s*song|karaoke|instrumental|live|\bslowed(?:\s*&\s*reverb)?|\bsped(?:\s*[- ]*up)?|\bnightcore\b|\b8d\b|cover|remix|remaster(?:ed)?|\blofi\b|low[- ]?fi|chill|mix|\bedit\b|radio\s*edit|acoustic|extended|bonus\s*track|\bdemo\b|\bsingle\b|\bversion\b)\b/g;

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

function stripQualifiers(input: string): string {
  return input
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(QUALIFIER_TOKEN_RE, " ")
    .replace(/[-–—|:;,_./]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(input: string): string[] {
  const cleaned = stripQualifiers(input).toLowerCase();
  return cleaned.split(" ").filter((t) => t.length > 1);
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const aSet = new Set(a);
  let intersect = 0;
  for (const x of b) if (aSet.has(x)) intersect++;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersect / union;
}

function stripFeat(artist: string): string {
  return (artist || "")
    .split(",")[0]
    .replace(/\s*(?:ft\.?|feat\.?|featuring)\s+.+$/i, "")
    .trim();
}

interface LrcHit {
  trackName?: string;
  artistName?: string;
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
  instrumental?: boolean;
}

function scoreHit(hit: LrcHit, trackQ: string, artistQ: string): number {
  const matcher = tokenSet(stripQualifiers(trackQ));
  const artistMatcher = artistQ ? tokenSet(stripFeat(artistQ)) : [];
  const tScore = jaccard(tokenSet(hit.trackName || ""), matcher);
  const aScore = artistQ
    ? jaccard(tokenSet(stripFeat(hit.artistName || "")), artistMatcher)
    : 0;
  let score = tScore * 0.7 + aScore * 0.3;
  if (hit.syncedLyrics) score += 0.15;
  if (hit.instrumental) score -= 0.2;
  return score;
}

function toLyricsData(hit: LrcHit): LyricsData {
  const synced = hit.syncedLyrics ? parseLrc(hit.syncedLyrics) : [];
  return {
    synced,
    plain: hit.plainLyrics || "",
    instrumental: Boolean(hit.instrumental),
    hasSynced: synced.length > 0,
  };
}

export async function fetchLyrics(
  trackName: string,
  artistName: string,
  _duration?: number,
): Promise<LyricsData | null> {
  if (!trackName) return null;
  const cleanArtist = stripFeat(artistName);
  const cacheKey = `${stripQualifiers(trackName).toLowerCase()}___${stripQualifiers(cleanArtist).toLowerCase()}`;

  if (lyricsCache.has(cacheKey)) {
    return lyricsCache.get(cacheKey) || null;
  }

  try {
    // 1) Search first: returns 200 always (empty array when no lyrics) — no console 404s
    const primaryUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(trackName)}${
      cleanArtist ? `&artist_name=${encodeURIComponent(cleanArtist)}` : ""
    }`;
    const sRes = await fetch(primaryUrl, { headers: { "User-Agent": UA } });
    if (sRes.ok) {
      const hits = await sRes.json();
      if (Array.isArray(hits) && hits.length > 0) {
        const best = pickBestHit(hits, trackName, cleanArtist);
        if (best) {
          const result = toLyricsData(best);
          lyricsCache.set(cacheKey, result);
          return result;
        }
      }
    }

    // 2) Retry search by track name only (artist tags are often unreliable)
    const trackOnlyUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(trackName)}`;
    const tRes = await fetch(trackOnlyUrl, { headers: { "User-Agent": UA } });
    if (tRes.ok) {
      const hits = await tRes.json();
      if (Array.isArray(hits) && hits.length > 0) {
        const best = pickBestHit(hits, trackName, cleanArtist);
        if (best) {
          const result = toLyricsData(best);
          lyricsCache.set(cacheKey, result);
          return result;
        }
      }
    }

    lyricsCache.set(cacheKey, null);
    return null;
  } catch (err) {
    console.warn("Failed to fetch lyrics:", err);
    lyricsCache.set(cacheKey, null);
    return null;
  }
}

function pickBestHit(
  hits: unknown[],
  trackName: string,
  cleanArtist: string,
): LrcHit | null {
  let best: LrcHit | null = null;
  let bestScore = 0.45; // threshold: decent token overlap
  for (const raw of hits) {
    const hit = raw as LrcHit;
    const score = scoreHit(hit, trackName, cleanArtist);
    if (score > bestScore) {
      bestScore = score;
      best = hit;
    }
  }
  return best;
}
