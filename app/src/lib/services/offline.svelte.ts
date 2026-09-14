import { streamUrl, type Track } from "$lib/stores/player.svelte";
import { apiUrl } from "$lib/config";

const DB_NAME = "mezzo_offline_v2";
const DB_VERSION = 1;
const STORE_AUDIO = "audio_blobs";
const STORE_COVERS = "cover_blobs";
const STORE_TRACKS = "tracks_meta";
const STORAGE_KEY_OFFLINE_TRACKS = "mezzo_offline_tracks_meta";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB is not supported"));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_AUDIO)) {
        db.createObjectStore(STORE_AUDIO);
      }
      if (!db.objectStoreNames.contains(STORE_COVERS)) {
        db.createObjectStore(STORE_COVERS);
      }
      if (!db.objectStoreNames.contains(STORE_TRACKS)) {
        db.createObjectStore(STORE_TRACKS, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

class OfflineStore {
  downloadedTracks = $state<Track[]>([]);
  downloadingIds = $state<string[]>([]);
  isOffline = $state(false);
  private objectUrls = new Map<string, string>();

  constructor() {
    if (typeof window !== "undefined") {
      this.isOffline = !navigator.onLine;
      window.addEventListener("online", () => (this.isOffline = false));
      window.addEventListener("offline", () => (this.isOffline = true));
      this.loadSavedTracks();
    }
  }

  async loadSavedTracks() {
    if (typeof window === "undefined") return;

    // 1. First load from localStorage for instant synchronous reactivity
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OFFLINE_TRACKS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.downloadedTracks = parsed;
        }
      }
    } catch {}

    // 2. Then sync from IndexedDB
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_TRACKS, "readonly");
      const store = tx.objectStore(STORE_TRACKS);
      const req = store.getAll();
      req.onsuccess = () => {
        const tracks = req.result;
        if (Array.isArray(tracks) && tracks.length > 0) {
          this.downloadedTracks = tracks;
          this.saveMetadata();
        }
      };
    } catch (e) {
      console.warn("OfflineStore: Failed to load from IndexedDB:", e);
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
      console.warn("OfflineStore: Failed to persist metadata to localStorage:", e);
    }
  }

  isTrackDownloaded(trackId: string): boolean {
    return this.downloadedTracks.some((t) => t.id === trackId);
  }

  isDownloading(trackId: string): boolean {
    return this.downloadingIds.includes(trackId);
  }

  async downloadTrack(track: Track): Promise<boolean> {
    if (typeof window === "undefined") return false;
    if (this.isTrackDownloaded(track.id)) return true;
    if (this.isDownloading(track.id)) return false;

    this.downloadingIds = [...this.downloadingIds, track.id];

    try {
      // 1. Resolve direct audio stream URL
      let targetAudioUrl = track.stream_url;
      if (!targetAudioUrl || !targetAudioUrl.startsWith("http") || targetAudioUrl.includes("/api/tracks/")) {
        try {
          const streamJsonRes = await fetch(apiUrl(`/api/tracks/${encodeURIComponent(track.id)}/stream?format=json`));
          if (streamJsonRes.ok) {
            const data = (await streamJsonRes.json()) as any;
            if (data?.url) {
              targetAudioUrl = data.url;
            }
          }
        } catch {}
      }

      if (!targetAudioUrl) {
        targetAudioUrl = streamUrl(track);
      }

      if (!targetAudioUrl) {
        throw new Error("No playable audio stream URL available for download");
      }

      // 2. Fetch the audio as Blob
      const audioRes = await fetch(targetAudioUrl);
      if (!audioRes.ok) throw new Error(`Audio download failed: HTTP ${audioRes.status}`);
      const audioBlob = await audioRes.blob();

      // 3. Fetch the cover artwork as Blob and convert to Base64 Data URL
      let coverBlob: Blob | null = null;
      const downloadTrackObj: Track = { ...track };
      if (track.cover_url && track.cover_url.startsWith("http")) {
        try {
          const coverRes = await fetch(track.cover_url);
          if (coverRes.ok) {
            coverBlob = await coverRes.blob();
            const reader = new FileReader();
            const dataUrlPromise = new Promise<string>((resolve) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(coverBlob!);
            });
            const dataUrl = await dataUrlPromise;
            if (dataUrl) {
              downloadTrackObj.cover_url = dataUrl;
              (downloadTrackObj as any).offline_cover = dataUrl;
            }
          }
        } catch {}
      }

      // 4. Store in IndexedDB
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([STORE_AUDIO, STORE_COVERS, STORE_TRACKS], "readwrite");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);

        tx.objectStore(STORE_AUDIO).put(audioBlob, track.id);
        if (coverBlob) {
          tx.objectStore(STORE_COVERS).put(coverBlob, track.id);
        }
        tx.objectStore(STORE_TRACKS).put(downloadTrackObj);
      });

      // 5. Update in-memory and local storage state
      this.downloadedTracks = [
        downloadTrackObj,
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
    if (typeof window === "undefined") return false;

    try {
      if (this.objectUrls.has(trackId)) {
        URL.revokeObjectURL(this.objectUrls.get(trackId)!);
        this.objectUrls.delete(trackId);
      }

      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([STORE_AUDIO, STORE_COVERS, STORE_TRACKS], "readwrite");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);

        tx.objectStore(STORE_AUDIO).delete(trackId);
        tx.objectStore(STORE_COVERS).delete(trackId);
        tx.objectStore(STORE_TRACKS).delete(trackId);
      });

      this.downloadedTracks = this.downloadedTracks.filter((t) => t.id !== trackId);
      this.saveMetadata();
      return true;
    } catch (err) {
      console.error("Failed to remove downloaded track:", err);
      return false;
    }
  }

  async getOfflineAudioBlob(trackId: string): Promise<Blob | null> {
    if (typeof window === "undefined") return null;
    try {
      const db = await openDB();
      return new Promise<Blob | null>((resolve) => {
        const tx = db.transaction(STORE_AUDIO, "readonly");
        const req = tx.objectStore(STORE_AUDIO).get(trackId);
        req.onsuccess = () => resolve(req.result instanceof Blob ? req.result : null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async getOfflineAudioUrl(trackId: string): Promise<string | null> {
    if (typeof window === "undefined") return null;
    try {
      const blob = await this.getOfflineAudioBlob(trackId);
      if (blob) {
        if (this.objectUrls.has(trackId)) {
          URL.revokeObjectURL(this.objectUrls.get(trackId)!);
        }
        const url = URL.createObjectURL(blob);
        this.objectUrls.set(trackId, url);
        return url;
      }
    } catch (e) {
      console.warn("Failed to retrieve offline audio from IndexedDB:", e);
    }
    return null;
  }

  async getOfflineCoverUrl(trackId: string): Promise<string | null> {
    if (typeof window === "undefined") return null;
    try {
      const db = await openDB();
      return new Promise<string | null>((resolve) => {
        const tx = db.transaction(STORE_COVERS, "readonly");
        const req = tx.objectStore(STORE_COVERS).get(trackId);
        req.onsuccess = () => {
          if (req.result instanceof Blob) {
            resolve(URL.createObjectURL(req.result));
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async clearAllOfflineData(): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      for (const url of this.objectUrls.values()) {
        URL.revokeObjectURL(url);
      }
      this.objectUrls.clear();

      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([STORE_AUDIO, STORE_COVERS, STORE_TRACKS], "readwrite");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.objectStore(STORE_AUDIO).clear();
        tx.objectStore(STORE_COVERS).clear();
        tx.objectStore(STORE_TRACKS).clear();
      });

      this.downloadedTracks = [];
      this.saveMetadata();
    } catch (e) {
      console.warn("Failed to clear offline storage:", e);
    }
  }
}

export const offlineStore = new OfflineStore();
