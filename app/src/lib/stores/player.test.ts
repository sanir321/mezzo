import { describe, it, expect } from "vitest";
import { formatDuration, streamUrl, coverUrl } from "./player.svelte";

describe("player store helpers", () => {
  it("formats duration correctly for various inputs", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(null)).toBe("0:00");
    expect(formatDuration(undefined)).toBe("0:00");
    expect(formatDuration(-10)).toBe("0:00");
    expect(formatDuration(NaN)).toBe("0:00");
    expect(formatDuration(Infinity)).toBe("0:00");
    expect(formatDuration(45)).toBe("0:45");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(600)).toBe("10:00");
    expect(formatDuration(3672)).toBe("61:12");
  });

  it("streamUrl returns empty string for local tracks", () => {
    expect(streamUrl("t-123")).toBe("");
  });
  it("streamUrl returns stream_url for tracks with it", () => {
    expect(streamUrl({ id: "t-123", stream_url: "https://example.com/audio.mp3" } as any)).toBe("https://example.com/audio.mp3");
  });

  it("coverUrl returns cover_url for tracks with it", () => {
    expect(coverUrl({ id: "t-123", cover_url: "https://example.com/cover.jpg" } as any)).toBe("https://example.com/cover.jpg");
  });
  it("coverUrl returns endpoint for tracks without cover_url", () => {
    expect(coverUrl("t-123")).toBe("/api/tracks/t-123/cover");
  });
});

describe("likedStore", () => {
  it("allows toggling likes with instant persistence", async () => {
    const { likedStore } = await import("./liked.svelte");
    const testTrack = {
      id: "track-persistent-test",
      title: "Test Song",
      artist: "Test Artist",
      album: "Test Album",
      duration: 210,
      format: "flac",
      size: 1024,
      date_added: Date.now(),
      play_count: 0
    };

    expect(likedStore.isLiked("track-persistent-test")).toBe(false);
    await likedStore.toggle(testTrack as any);
    expect(likedStore.isLiked("track-persistent-test")).toBe(true);
    expect(likedStore.tracks.some((t) => t.id === "track-persistent-test")).toBe(true);

    // Toggle off
    await likedStore.toggle(testTrack as any);
    expect(likedStore.isLiked("track-persistent-test")).toBe(false);
  });
});
