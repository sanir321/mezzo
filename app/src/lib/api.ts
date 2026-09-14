import type { Playlist, Track } from "$lib/stores/player.svelte";
import { apiUrl } from "$lib/config";
import { getAuthToken } from "$lib/auth-token";

export { apiUrl };

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7500);
  try {
    return await fetch(apiUrl(path), { ...init, headers, signal: init?.signal || controller.signal });
  } catch (err: any) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      throw new Error("You are offline. Connect to the internet to access online features.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function getLibrary(): Promise<{
  tracks: Track[];
  sorted: Track[];
  playlists: Playlist[];
}> {
  return j(await apiFetch("/api/library"));
}

export async function getTracks(): Promise<{ tracks: Track[] }> {
  return j(await apiFetch("/api/tracks"));
}

export async function getPlaylists(): Promise<{ playlists: Playlist[] }> {
  return j(await apiFetch("/api/playlists"));
}

export async function getPlaylist(
  id: string,
): Promise<{ playlist: Playlist; tracks: Track[] }> {
  return j(await apiFetch(`/api/playlists/${id}`));
}

export async function createPlaylist(
  name: string,
  description?: string,
): Promise<{ id: string }> {
  return j(
    await apiFetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    }),
  );
}

export async function deletePlaylist(id: string): Promise<{ ok: boolean }> {
  return j(await apiFetch(`/api/playlists/${id}`, { method: "DELETE" }));
}

export async function addTrackToPlaylist(
  playlistId: string,
  trackOrId: string | Track,
): Promise<{ ok: boolean }> {
  const payload =
    typeof trackOrId === "string"
      ? { trackId: trackOrId }
      : { trackId: trackOrId.id, track: trackOrId };
  return j(
    await apiFetch(`/api/playlists/${playlistId}/tracks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

export async function removeTrackFromPlaylist(
  playlistId: string,
  trackId: string,
): Promise<{ ok: boolean }> {
  return j(
    await apiFetch(
      `/api/playlists/${playlistId}/tracks?trackId=${encodeURIComponent(trackId)}`,
      { method: "DELETE" },
    ),
  );
}

export async function deleteTrack(id: string): Promise<{ ok: boolean }> {
  return j(await apiFetch(`/api/tracks/${id}`, { method: "DELETE" }));
}

export async function toggleLikeTrack(
  id: string,
  track?: Track,
): Promise<{ liked: boolean }> {
  return j(
    await apiFetch(`/api/tracks/${id}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(track ? { track } : {}),
    }),
  );
}

export async function getLikedTracks(): Promise<{
  tracks: Track[];
  likedIds: string[];
}> {
  return j(await apiFetch("/api/library/liked"));
}

export async function updateTrack(
  id: string,
  data: {
    title?: string;
    artist?: string | null;
    album?: string | null;
    genre?: string | null;
    year?: number | null;
  },
): Promise<{ ok: boolean }> {
  return j(
    await apiFetch(`/api/tracks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  );
}

export async function getOnlineTrending(
  limit = 25,
): Promise<{ tracks: Track[] }> {
  // Try high quality 320kbps server trending endpoint
  try {
    const res = await apiFetch(`/api/online/trending?limit=${limit}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.tracks) && data.tracks.length > 0) {
        return { tracks: data.tracks };
      }
    }
  } catch {}

  return { tracks: [] };
}

export interface SearchArtistOnline {
  id: string;
  name: string;
  image: string;
  role?: string;
  trackCount?: number;
  tracks?: Track[];
}

export interface SearchPlaylistOnline {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  trackCount?: number;
  isOnline?: boolean;
  query?: string;
}

export interface SearchAlbumOnline {
  id: string;
  album: string;
  artist: string;
  coverUrl: string;
  trackCount: number;
  year?: number;
  tracks?: Track[];
}

export interface OnlineSearchResultClient {
  tracks: Track[];
  artists: SearchArtistOnline[];
  playlists: SearchPlaylistOnline[];
  albums: SearchAlbumOnline[];
  isFallback?: boolean;
}

export async function searchOnlineMusic(
  query: string,
  limit = 30,
): Promise<OnlineSearchResultClient> {
  const trimmed = query.trim();
  if (!trimmed)
    return {
      tracks: [],
      artists: [],
      playlists: [],
      albums: [],
      isFallback: false,
    };

  // 1. Server search (resolves full-length 320kbps JioSaavn tracks, artists, playlists, and albums)
  try {
    const res = await apiFetch(
      `/api/online/search?q=${encodeURIComponent(trimmed)}&limit=${limit}`,
    );
    if (res.ok) {
      const data = await res.json();
      const hasContent =
        (Array.isArray(data.tracks) && data.tracks.length > 0) ||
        (Array.isArray(data.artists) && data.artists.length > 0) ||
        (Array.isArray(data.playlists) && data.playlists.length > 0) ||
        (Array.isArray(data.albums) && data.albums.length > 0);

      if (hasContent) {
        return {
          tracks: Array.isArray(data.tracks) ? data.tracks : [],
          artists: Array.isArray(data.artists) ? data.artists : [],
          playlists: Array.isArray(data.playlists) ? data.playlists : [],
          albums: Array.isArray(data.albums) ? data.albums : [],
          isFallback: data.isFallback ?? false,
        };
      }
    }
  } catch {}

  // 2. No matches found
  return {
    tracks: [],
    artists: [],
    playlists: [],
    albums: [],
    isFallback: false,
  };
}

export async function getOnlineArtist(name: string): Promise<{
  artist: SearchArtistOnline | null;
  tracks: Track[];
  bio?: string;
  followers?: string;
}> {
  const trimmed = name.trim();
  if (!trimmed) return { artist: null, tracks: [] };
  try {
    const res = await apiFetch(
      `/api/online/artist?name=${encodeURIComponent(trimmed)}`,
    );
    if (res.ok) {
      const data = await res.json();
      return {
        artist: data.artist || null,
        tracks: Array.isArray(data.tracks) ? data.tracks : [],
        bio: data.bio || "",
        followers: data.followers || "",
      };
    }
  } catch {}
  return { artist: null, tracks: [] };
}

export async function getSearchSuggestions(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  try {
    const res = await apiFetch(
      `/api/online/suggestions?q=${encodeURIComponent(trimmed)}`,
    );
    if (res.ok) {
      const data = (await res.json()) as { suggestions?: string[] };
      return Array.isArray(data.suggestions) ? data.suggestions : [];
    }
  } catch {}
  return [];
}
