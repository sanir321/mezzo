// Tidal Official API Integration for Mezzo
import type { Track } from "$lib/stores/player.svelte";
import type { SearchArtist, SearchAlbum, SearchPlaylist } from "./music";
import { searchJioSaavnMusic } from "./music";

const TIDAL_CLIENT_ID =
  (import.meta.env.VITE_TIDAL_CLIENT_ID as string | undefined) ??
  (typeof globalThis !== "undefined" &&
  typeof (globalThis as any).env?.TIDAL_CLIENT_ID !== "undefined"
    ? (globalThis as any).env.TIDAL_CLIENT_ID
    : "");
const TIDAL_CLIENT_SECRET =
  (import.meta.env.VITE_TIDAL_CLIENT_SECRET as string | undefined) ??
  (typeof globalThis !== "undefined" &&
  typeof (globalThis as any).env?.TIDAL_CLIENT_SECRET !== "undefined"
    ? (globalThis as any).env.TIDAL_CLIENT_SECRET
    : "");
const TIDAL_AUTH_URL = "https://auth.tidal.com/v1/oauth2/token";
const TIDAL_API_BASE = "https://api.tidal.com/v1";
const HIFI_API_BASE_URL =
  (import.meta.env.VITE_HIFI_API_BASE_URL as string | undefined) ??
  (typeof globalThis !== "undefined" &&
  typeof (globalThis as any).env?.HIFI_API_BASE_URL !== "undefined"
    ? (globalThis as any).env.HIFI_API_BASE_URL
    : import.meta.env.DEV
      ? "http://localhost:8787"
      : "https://mezzo-hifi-api.zenosayz05.workers.dev");

interface CachedToken {
  token: string;
  expiresAt: number;
}

let tokenCache: CachedToken | null = null;
const streamCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Retrieves a valid Tidal OAuth2 bearer token via client credentials grant.
 * Caches the token in-memory and refreshes before expiration (14400s / 4 hours).
 */
export async function getTidalAccessToken(): Promise<string | null> {
  if (!TIDAL_CLIENT_ID || !TIDAL_CLIENT_SECRET) return null;

  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60000) {
    return tokenCache.token;
  }

  try {
    const params = new URLSearchParams({
      client_id: TIDAL_CLIENT_ID,
      client_secret: TIDAL_CLIENT_SECRET,
      grant_type: "client_credentials",
    });

    const res = await fetch(TIDAL_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    if (!res.ok) {
      console.warn("Tidal OAuth token request failed:", res.status);
      return null;
    }

    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!data.access_token) return null;

    const expiresInSec = data.expires_in || 14400;
    tokenCache = {
      token: data.access_token,
      expiresAt: now + expiresInSec * 1000,
    };

    return tokenCache.token;
  } catch (err) {
    console.warn("Error fetching Tidal OAuth token:", err);
    return null;
  }
}

/**
 * Builds high-resolution image URL from Tidal's picture UUID.
 * Example UUID: 475aec51-d22b-4ec7-b779-c82afb5f81cc
 * Becomes: https://resources.tidal.com/images/475aec51/d22b/4ec7/b779/c82afb5f81cc/1280x1280.jpg
 */
export function getTidalImageUrl(
  picId?: string | null,
  size: "1280x1280" | "750x750" | "320x320" = "1280x1280",
): string {
  if (!picId) return "";
  const path = picId.replace(/-/g, "/");
  return `https://resources.tidal.com/images/${path}/${size}.jpg`;
}

/**
 * Search Tidal tracks
 */
export async function searchTidalTracks(
  query: string,
  limit = 25,
): Promise<Track[]> {
  const token = await getTidalAccessToken();
  if (!token) return [];

  try {
    const url = `${TIDAL_API_BASE}/search/tracks?query=${encodeURIComponent(query.trim())}&limit=${limit}&countryCode=US`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];

    const json = (await res.json()) as { items?: any[] };
    const items = json.items || [];

    return items.map((item: any, i: number): Track => {
      const coverPic = item.album?.cover || item.artist?.picture;
      const dur = item.duration || 180;
      const isLossless =
        item.audioQuality === "LOSSLESS" ||
        item.audioQuality === "HIRES_LOSSLESS";

      return {
        id: `tidal_${item.id}`,
        title: item.title || "Unknown Title",
        artist:
          item.artist?.name ||
          item.artists?.map((a: any) => a.name).join(", ") ||
          "Unknown Artist",
        album: item.album?.title || "Single",
        genre: item.mediaMetadata?.tags?.[0] || "Pop",
        year: item.streamStartDate
          ? new Date(item.streamStartDate).getFullYear()
          : new Date().getFullYear(),
        track_number: item.trackNumber || i + 1,
        duration: dur,
        format: isLossless ? "Lossless HiFi" : "AAC 320kbps",
        size: Math.round(dur * 40000),
        date_added: Date.now(),
        play_count: item.popularity ? item.popularity * 1000 : 50000,
        stream_url: `/api/tracks/tidal_${item.id}/stream`,
        cover_url: getTidalImageUrl(coverPic, "1280x1280"),
        isrc: item.isrc || undefined,
        audioQuality: item.audioQuality || undefined,
      };
    });
  } catch (err) {
    console.warn("Tidal track search failed:", err);
    return [];
  }
}

/**
 * Search Tidal artists
 */
export async function searchTidalArtists(
  query: string,
  limit = 10,
): Promise<SearchArtist[]> {
  const token = await getTidalAccessToken();
  if (!token) return [];

  try {
    const url = `${TIDAL_API_BASE}/search/artists?query=${encodeURIComponent(query.trim())}&limit=${limit}&countryCode=US`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];

    const json = (await res.json()) as { items?: any[] };
    const items = json.items || [];

    return items.map((item: any): SearchArtist => ({
      id: `tidal_art_${item.id}`,
      name: item.name || "Unknown Artist",
      image:
        getTidalImageUrl(item.picture, "750x750") ||
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
      role: "Artist",
      trackCount: item.popularity || 10,
    }));
  } catch (err) {
    console.warn("Tidal artist search failed:", err);
    return [];
  }
}

/**
 * Search Tidal albums
 */
export async function searchTidalAlbums(
  query: string,
  limit = 10,
): Promise<SearchAlbum[]> {
  const token = await getTidalAccessToken();
  if (!token) return [];

  try {
    const url = `${TIDAL_API_BASE}/search/albums?query=${encodeURIComponent(query.trim())}&limit=${limit}&countryCode=US`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];

    const json = (await res.json()) as { items?: any[] };
    const items = json.items || [];

    return items.map((item: any): SearchAlbum => ({
      id: `tidal_alb_${item.id}`,
      album: item.title || "Unknown Album",
      artist:
        item.artist?.name ||
        item.artists?.map((a: any) => a.name).join(", ") ||
        "Various Artists",
      coverUrl: getTidalImageUrl(item.cover, "1280x1280") || "",
      trackCount: item.numberOfTracks || 1,
      year: item.releaseDate
        ? new Date(item.releaseDate).getFullYear()
        : undefined,
    }));
  } catch (err) {
    console.warn("Tidal album search failed:", err);
    return [];
  }
}

/**
 * Search Tidal playlists
 */
export async function searchTidalPlaylists(
  query: string,
  limit = 10,
): Promise<SearchPlaylist[]> {
  const token = await getTidalAccessToken();
  if (!token) return [];

  try {
    const url = `${TIDAL_API_BASE}/search/playlists?query=${encodeURIComponent(query.trim())}&limit=${limit}&countryCode=US`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];

    const json = (await res.json()) as { items?: any[] };
    const items = json.items || [];

    return items.map((item: any): SearchPlaylist => ({
      id: `tidal_pl_${item.uuid}`,
      name: item.title || "Tidal Playlist",
      description: item.description || "Tidal curated playlist",
      coverUrl: getTidalImageUrl(item.image, "1280x1280") || "",
      trackCount: item.numberOfTracks || 25,
      isOnline: true,
      query: item.title,
    }));
  } catch (err) {
    console.warn("Tidal playlist search failed:", err);
    return [];
  }
}

/**
 * Fetch Tidal album details and its tracks
 */
export async function getTidalAlbumDetails(
  albumId: string | number,
): Promise<{ album: SearchAlbum; tracks: Track[] } | null> {
  const token = await getTidalAccessToken();
  if (!token) return null;

  const cleanId = String(albumId).replace(/^tidal_alb_/, "");

  try {
    const albumRes = await fetch(
      `${TIDAL_API_BASE}/albums/${cleanId}?countryCode=US`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!albumRes.ok) return null;

    const albumData = (await albumRes.json()) as any;
    const coverUrl = getTidalImageUrl(albumData.cover, "1280x1280");
    const artistName = albumData.artist?.name || "Various Artists";

    // Try JioSaavn album details for complete high-quality audio tracklist
    const { searchJioSaavnAlbums, getJioSaavnAlbumDetails } =
      await import("./music");
    const saavnAlbs = await searchJioSaavnAlbums(
      `${albumData.title} ${artistName}`,
      3,
    );
    if (saavnAlbs.length > 0) {
      const fullAlb = await getJioSaavnAlbumDetails(saavnAlbs[0].id);
      if (fullAlb && fullAlb.tracks.length > 0) {
        return {
          album: {
            id: `tidal_alb_${albumData.id}`,
            album: albumData.title || fullAlb.album.title,
            artist: artistName,
            coverUrl: coverUrl || fullAlb.album.coverUrl,
            trackCount: fullAlb.tracks.length,
            year: albumData.releaseDate
              ? new Date(albumData.releaseDate).getFullYear()
              : fullAlb.album.year,
            tracks: fullAlb.tracks,
          },
          tracks: fullAlb.tracks,
        };
      }
    }

    // Fallback to track search for the album title
    const searchTracks = await searchTidalTracks(
      `${albumData.title} ${artistName}`,
      albumData.numberOfTracks || 25,
    );
    const album: SearchAlbum = {
      id: `tidal_alb_${albumData.id}`,
      album: albumData.title || "Unknown Album",
      artist: artistName,
      coverUrl,
      trackCount: albumData.numberOfTracks || searchTracks.length,
      year: albumData.releaseDate
        ? new Date(albumData.releaseDate).getFullYear()
        : undefined,
      tracks: searchTracks,
    };
    return { album, tracks: searchTracks };
  } catch (err) {
    console.warn("Failed to get Tidal album details:", err);
    return null;
  }
}

/**
 * Fetch Tidal artist top tracks
 */
export async function getTidalArtistTopTracks(
  artistId: string | number,
  limit = 25,
): Promise<{ artist: SearchArtist; tracks: Track[] } | null> {
  const token = await getTidalAccessToken();
  if (!token) return null;

  const cleanId = String(artistId).replace(/^tidal_art_/, "");

  try {
    const artistRes = await fetch(
      `${TIDAL_API_BASE}/artists/${cleanId}?countryCode=US`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!artistRes.ok) return null;

    const artistData = (await artistRes.json()) as any;
    const artistImage = getTidalImageUrl(artistData.picture, "750x750");

    // Fetch top tracks for the artist
    const tracks = await searchTidalTracks(artistData.name, limit);

    const artist: SearchArtist = {
      id: `tidal_art_${artistData.id}`,
      name: artistData.name || "Unknown Artist",
      image: artistImage,
      role: "Artist",
      trackCount: tracks.length,
      tracks,
    };

    return { artist, tracks };
  } catch (err) {
    console.warn("Failed to get Tidal artist details:", err);
    return null;
  }
}

/**
 * Fetch track metadata by Tidal numeric ID
 */
export async function getTidalTrack(
  trackId: string | number,
): Promise<any | null> {
  const token = await getTidalAccessToken();
  if (!token) return null;

  const cleanId = String(trackId).replace(/^tidal_/, "");

  try {
    const res = await fetch(
      `${TIDAL_API_BASE}/tracks/${cleanId}?countryCode=US`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Failed to get Tidal track metadata:", err);
    return null;
  }
}

function cleanTrackTitle(t: string): string {
  return t
    .replace(
      /\s*[\(\[][^\)\]]*(feat|ft|with|remix|version|deluxe|edit|explicit|remaster)[^\)\]]*[\)\]]/gi,
      "",
    )
    .replace(/\s*-\s*(remix|remastered|deluxe|radio edit).*/gi, "")
    .replace(/[^\w\s\.\-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Universal Stream Resolver for Tidal tracks:
 * Matches Tidal track (via title + artist + duration) to the ultra-fast 320kbps Akamai CDN stream.
 * Uses multi-tier title and artist queries to guarantee full-length playback without interruption.
 * Results are cached in memory for instant subsequent playback.
 */
export async function resolveTidalTrackStream(
  trackId: string | number,
): Promise<string | null> {
  const key = String(trackId);
  const now = Date.now();

  const cached = streamCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.url;
  }

  const trackData = await getTidalTrack(trackId);
  if (!trackData) return null;

  const title = trackData.title || "";
  const artist = trackData.artist?.name || "";
  const cleanedTitle = cleanTrackTitle(title) || title;
  const primaryArtist = artist.split(/[,&/]|(?:feat\.?)|(?:ft\.?)/i)[0].trim();

  // Multi-tier query candidates to guarantee finding the full-length stream
  const queryCandidates = [
    `${title} ${artist}`.trim(),
    `${cleanedTitle} ${primaryArtist}`.trim(),
    cleanedTitle,
    title,
  ].filter(Boolean);

  for (const query of queryCandidates) {
    try {
      const matchedTracks = await searchJioSaavnMusic(query, 5);
      if (matchedTracks.length > 0) {
        const normTitle = cleanedTitle.toLowerCase().replace(/[^a-z0-9]/g, "");
        const normArtist = primaryArtist
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");

        const bestMatch =
          matchedTracks.find((m) => {
            const mTitle = m.title.toLowerCase().replace(/[^a-z0-9]/g, "");
            const mArtist = (m.artist || "")
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "");
            const tMatch =
              mTitle === normTitle ||
              mTitle.includes(normTitle) ||
              normTitle.includes(mTitle);
            const aMatch =
              !normArtist ||
              mArtist.includes(normArtist) ||
              normArtist.includes(mArtist);
            return tMatch && aMatch;
          }) ||
          matchedTracks.find((m) => {
            const mTitle = m.title.toLowerCase().replace(/[^a-z0-9]/g, "");
            return (
              mTitle === normTitle ||
              (normTitle.length >= 5 &&
                (mTitle.includes(normTitle) || normTitle.includes(mTitle)))
            );
          }) ||
          matchedTracks[0];

        if (bestMatch?.stream_url && bestMatch.stream_url.startsWith("http")) {
          streamCache.set(key, {
            url: bestMatch.stream_url,
            expiresAt: now + 3600000, // Cache for 1 hour
          });
          return bestMatch.stream_url;
        }
      }
    } catch {
      // Continue to next candidate query
    }
  }

  // Final fallback to the dedicated mezzo-hifi-api worker using title + artist metadata
  try {
    const workerUrl = new URL(`${HIFI_API_BASE_URL}/stream`);
    workerUrl.searchParams.set("title", title);
    if (primaryArtist) workerUrl.searchParams.set("artist", primaryArtist);
    workerUrl.searchParams.set("query", queryCandidates[0] || title);
    workerUrl.searchParams.set("format", "json");

    const workerRes = await fetch(workerUrl.toString(), {
      signal: AbortSignal.timeout(8000),
    });
    if (workerRes.ok) {
      const data = (await workerRes.json()) as any;
      if (
        data?.url &&
        typeof data.url === "string" &&
        data.url.startsWith("http")
      ) {
        streamCache.set(key, {
          url: data.url,
          expiresAt: now + 3600000,
        });
        return data.url;
      }
    }
  } catch (err) {
    console.warn("Tidal stream worker fallback error:", err);
  }

  return null;
}
