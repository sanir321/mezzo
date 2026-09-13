import type { Track } from "$lib/stores/player.svelte";

const CACHE_NAME = "mezzo-offline-v1";
const STORAGE_KEY_OFFLINE_TRACKS = "mezzo_offline_tracks_meta";

class OfflineStore {
  downloadedTracks = $state<Track[]>([]);
  downloadingIds = $state<string[]>([]);
  isOffline = $state(false);

  constructor() {
    if (typeof window !== "undefined") {
      this.isOffline = !navigator.onLine;
      window.addEventListener("online", () => (this.isOffline = false));
      window.addEventListener("offline", () => (this.isOffline = true));
      this.loadSavedTracks();
    }
  }

  loadSavedTracks() {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OFFLINE_TRACKS);
      if (saved) {
        this.downloadedTracks = JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to parse offline tracks:", e);
    }
  }

  private saveMetadata() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        STORAGE_KEY_OFFLINE_TRACKS,
        JSON.stringify(this.downloadedTracks),
      );
    } catch (e) {
      console.warn("Failed to persist offline track metadata:", e);
    }
  }

  isTrackDownloaded(trackId: string): boolean {
    return this.downloadedTracks.some((t) => t.id === trackId);
  }

  isDownloading(trackId: string): boolean {
    return this.downloadingIds.includes(trackId);
  }

  async downloadTrack(track: Track): Promise<boolean> {
    if (typeof window === "undefined" || !("caches" in window)) {
      console.warn("CacheStorage not supported in this browser");
      return false;
    }
    if (this.isTrackDownloaded(track.id)) return true;
    if (this.isDownloading(track.id)) return false;

    const audioUrl = track.stream_url;
    if (!audioUrl) {
      console.warn("Cannot download track without stream_url:", track.title);
      return false;
    }

    this.downloadingIds = [...this.downloadingIds, track.id];

    try {
      const cache = await caches.open(CACHE_NAME);

      // 1. Fetch & cache audio stream
      const audioReq = new Request(audioUrl, { mode: "no-cors" });
      const audioRes = await fetch(audioReq);
      if (!audioRes.ok && audioRes.status !== 0) {
        throw new Error(
          `Failed to fetch audio stream: status ${audioRes.status}`,
        );
      }
      await cache.put(`offline-audio-${track.id}`, audioRes.clone());

      // 2. Fetch & cache cover if present
      if (track.cover_url) {
        try {
          const coverRes = await fetch(track.cover_url, { mode: "no-cors" });
          await cache.put(`offline-cover-${track.id}`, coverRes);
        } catch {
          // Non-fatal if cover fails
        }
      }

      // 3. Save track metadata
      this.downloadedTracks = [
        track,
        ...this.downloadedTracks.filter((t) => t.id !== track.id),
      ];
      this.saveMetadata();
      return true;
    } catch (err) {
      console.error("Failed to download track offline:", err);
      return false;
    } finally {
      this.downloadingIds = this.downloadingIds.filter((id) => id !== track.id);
    }
  }

  async removeDownloadedTrack(trackId: string): Promise<boolean> {
    if (typeof window === "undefined" || !("caches" in window)) return false;

    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(`offline-audio-${trackId}`);
      await cache.delete(`offline-cover-${trackId}`);

      this.downloadedTracks = this.downloadedTracks.filter(
        (t) => t.id !== trackId,
      );
      this.saveMetadata();
      return true;
    } catch (err) {
      console.error("Failed to remove downloaded track:", err);
      return false;
    }
  }

  async getOfflineAudioUrl(trackId: string): Promise<string | null> {
    if (typeof window === "undefined" || !("caches" in window)) return null;
    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedRes = await cache.match(`offline-audio-${trackId}`);
      if (cachedRes) {
        const blob = await cachedRes.blob();
        return URL.createObjectURL(blob);
      }
    } catch (e) {
      console.warn("Failed to retrieve offline audio from cache:", e);
    }
    return null;
  }

  async clearAllOfflineData(): Promise<void> {
    if (typeof window === "undefined" || !("caches" in window)) return;
    try {
      await caches.delete(CACHE_NAME);
      this.downloadedTracks = [];
      this.saveMetadata();
    } catch (e) {
      console.warn("Failed to clear offline cache:", e);
    }
  }
}

export const offlineStore = new OfflineStore();
