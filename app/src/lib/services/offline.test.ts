import { describe, it, expect } from "vitest";
import { getFeaturedPlaylistById, FEATURED_PLAYLISTS } from "$lib/featured-playlists";

describe("Featured Playlists System", () => {
  it("contains curated featured playlists", () => {
    expect(FEATURED_PLAYLISTS.length).toBeGreaterThan(0);
    const topHits = getFeaturedPlaylistById("todays-top-hits");
    expect(topHits).toBeDefined();
    expect(topHits?.name).toBe("Today's Top Hits");
  });

  it("returns undefined for unknown featured playlist IDs", () => {
    expect(getFeaturedPlaylistById("non_existent_pl")).toBeUndefined();
  });
});

describe("Offline Storage & Playback Metadata", () => {
  it("correctly records and filters downloaded tracks", async () => {
    const { offlineStore } = await import("$lib/services/offline.svelte");
    const testTrack = {
      id: "saavn_test_track_1",
      title: "Test Track Offline",
      artist: "Test Artist",
      album: "Test Album",
      duration: 180,
      format: "m4a",
      size: 5000000,
      date_added: Date.now(),
      play_count: 0,
      stream_url: "https://example.com/audio.m4a",
    };

    expect(offlineStore.isTrackDownloaded(testTrack.id)).toBe(false);

    // Add track to downloaded list
    offlineStore.downloadedTracks = [testTrack as any];
    expect(offlineStore.isTrackDownloaded(testTrack.id)).toBe(true);

    // Remove track
    offlineStore.downloadedTracks = [];
    expect(offlineStore.isTrackDownloaded(testTrack.id)).toBe(false);
  });
});
