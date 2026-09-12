import { toggleLikeTrack, getLikedTracks } from "$lib/api";
import type { Track } from "$lib/stores/player.svelte";

const STORAGE_KEY_TRACKS = "mezzo_liked_tracks";
const STORAGE_KEY_IDS = "mezzo_liked_ids";

let likedIdsSet = $state(new Set<string>());
let likedTracksList = $state<Track[]>([]);
let loaded = $state(false);

function loadFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const savedTracks = localStorage.getItem(STORAGE_KEY_TRACKS);
    const savedIds = localStorage.getItem(STORAGE_KEY_IDS);
    if (savedTracks) {
      const parsed = JSON.parse(savedTracks);
      if (Array.isArray(parsed)) {
        likedTracksList = parsed;
      }
    }
    if (savedIds) {
      const parsed = JSON.parse(savedIds);
      if (Array.isArray(parsed)) {
        likedIdsSet = new Set(parsed);
      }
    } else if (likedTracksList.length > 0) {
      likedIdsSet = new Set(likedTracksList.map((t) => t.id));
    }
    loaded = true;
  } catch {
    // Ignore local storage error
  }
}

function saveToStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_TRACKS, JSON.stringify(likedTracksList));
    localStorage.setItem(
      STORAGE_KEY_IDS,
      JSON.stringify(Array.from(likedIdsSet)),
    );
  } catch {
    // Ignore local storage quota error
  }
}

// Immediately load on startup
loadFromStorage();

export const likedStore = {
  get ids() {
    return likedIdsSet;
  },
  get tracks() {
    return likedTracksList;
  },
  get count() {
    return likedTracksList.length;
  },
  get isLoaded() {
    return loaded;
  },
  isLiked(trackId: string): boolean {
    return likedIdsSet.has(trackId);
  },
  async init() {
    loadFromStorage();
    try {
      const res = await getLikedTracks();
      if (res) {
        const existingIds = new Set<string>();
        const serverTracks = res.tracks ?? [];
        const mergedTracks: Track[] = [...serverTracks];
        for (const sTrack of serverTracks) {
          existingIds.add(sTrack.id);
        }

        // Also preserve and sync any tracks that were liked locally on this device
        for (const localTrack of likedTracksList) {
          if (!existingIds.has(localTrack.id)) {
            mergedTracks.push(localTrack);
            existingIds.add(localTrack.id);
            toggleLikeTrack(localTrack.id, localTrack).catch(() => {});
          }
        }

        if (Array.isArray(res.likedIds)) {
          for (const id of res.likedIds) {
            existingIds.add(id);
          }
        }
        likedTracksList = mergedTracks;
        likedIdsSet = existingIds;
        saveToStorage();
      }
      loaded = true;
    } catch {
      // keep local state intact
    }
  },
  async toggle(track: Track) {
    const wasLiked = likedIdsSet.has(track.id);
    const newSet = new Set(likedIdsSet);
    if (wasLiked) {
      newSet.delete(track.id);
      likedTracksList = likedTracksList.filter((t) => t.id !== track.id);
    } else {
      newSet.add(track.id);
      const trackCopy: Track = { ...track };
      likedTracksList = [
        trackCopy,
        ...likedTracksList.filter((t) => t.id !== track.id),
      ];
    }
    likedIdsSet = newSet;
    saveToStorage();

    // Sync with server in background with full track metadata
    try {
      await toggleLikeTrack(track.id, track);
    } catch {
      // Don't rollback local state - keep user's song liked
    }
  },
};
