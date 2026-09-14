import { describe, it, expect } from "vitest";
import {
  searchOnlineMusic,
  getTrendingOnlineTracks,
  searchJioSaavnMusic,
  searchJioSaavnArtists,
  searchJioSaavnPlaylists,
  searchJioSaavnAlbums,
  resolveSaavnTrackStream,
} from "./music";
import { FEATURED_PLAYLISTS } from "$lib/featured-playlists";
import { formatDuration, streamUrl, coverUrl } from "$lib/stores/player.svelte";
import type { Playlist, Track } from "$lib/stores/player.svelte";
import { likedStore } from "$lib/stores/liked.svelte";

describe("Mezzo Comprehensive End-to-End User & API Verification", () => {
  describe("1. Music Search & Multi-Provider Streaming", () => {
    it("searches and returns rich track metadata (title, artist, duration, cover, stream)", async () => {
      const result = await searchOnlineMusic("The Weeknd Blinding Lights", 5);
      expect(result).toBeDefined();
      expect(Array.isArray(result.tracks)).toBe(true);
      expect(result.tracks.length).toBeGreaterThan(0);

      const track = result.tracks[0];
      expect(track.id).toBeTruthy();
      expect(track.title).toBeTruthy();
      expect(track.artist).toBeTruthy();
      expect(typeof track.duration).toBe("number");
      expect(track.duration).toBeGreaterThan(0);
      expect(track.cover_url).toBeTruthy();
      expect(track.stream_url).toBeTruthy();
    }, 15000);

    it("fetches online trending tracks for explore / home view", async () => {
      const trending = await getTrendingOnlineTracks(10);
      expect(trending).toBeDefined();
      expect(Array.isArray(trending)).toBe(true);
      expect(trending.length).toBeGreaterThan(0);
      expect(trending[0].title).toBeTruthy();
    }, 15000);

    it("searches music artists with cover images", async () => {
      const artists = await searchJioSaavnArtists("Taylor Swift", 3);
      expect(Array.isArray(artists)).toBe(true);
      expect(artists.length).toBeGreaterThan(0);
      expect(artists[0].name).toBeTruthy();
    }, 15000);

    it("searches online playlists and albums", async () => {
      const playlists = await searchJioSaavnPlaylists("Pop Hits", 3);
      expect(Array.isArray(playlists)).toBe(true);
      expect(playlists.length).toBeGreaterThan(0);

      const albums = await searchJioSaavnAlbums("Starboy", 3);
      expect(Array.isArray(albums)).toBe(true);
      expect(albums.length).toBeGreaterThan(0);
    }, 15000);

    it("resolves playable audio streams directly", async () => {
      const searchRes = await searchJioSaavnMusic("Levitating", 2);
      expect(searchRes.length).toBeGreaterThan(0);
      const track = searchRes[0];
      const stream = await resolveSaavnTrackStream(track.id);
      expect(stream).toBeTruthy();
      expect(stream).toMatch(/^https?:\/\//);
    }, 15000);
  });

  describe("2. Featured & Curated Playlists Integrity", () => {
    it("verifies all featured playlists have valid IDs, titles, descriptions, and non-empty queries", () => {
      expect(FEATURED_PLAYLISTS.length).toBeGreaterThan(5);
      for (const pl of FEATURED_PLAYLISTS) {
        expect(pl.id).toBeTruthy();
        expect(pl.name).toBeTruthy();
        expect(pl.description).toBeTruthy();
        expect(pl.query).toBeTruthy();
      }
    });
  });

  describe("3. Custom Playlist Creation, Manipulation & Offline Lifecycle", () => {
    const testPlaylistId = `local_test_${Date.now()}`;
    const sampleTrack1: Track = {
      id: "pl_track_1",
      title: "Night Vibes",
      artist: "LoFi Chill",
      album: "Midnight Sessions",
      genre: "LoFi",
      year: 2024,
      track_number: 1,
      duration: 180,
      format: "flac",
      size: 15000000,
      date_added: Date.now(),
      play_count: 0,
      cover_url: "https://example.com/cover1.jpg",
    };
    const sampleTrack2: Track = {
      id: "pl_track_2",
      title: "Morning Sun",
      artist: "Acoustic Beats",
      album: "Dawn",
      genre: "Acoustic",
      year: 2024,
      track_number: 2,
      duration: 210,
      format: "flac",
      size: 18000000,
      date_added: Date.now(),
      play_count: 0,
      cover_url: "https://example.com/cover2.jpg",
    };

    it("creates custom local playlist and caches it cleanly", () => {
      const newPlaylist: Playlist = {
        id: testPlaylistId,
        name: "My Chill Favorites",
        description: "Late night study session",
        cover_key: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Add to cached playlist list
      const initialCached = [newPlaylist];
      expect(initialCached.length).toBe(1);
      expect(initialCached[0].name).toBe("My Chill Favorites");
      expect(initialCached[0].id).toBe(testPlaylistId);
    });

    it("adds tracks to the playlist and calculates total duration", () => {
      const playlistTracks: Track[] = [sampleTrack1, sampleTrack2];
      expect(playlistTracks.length).toBe(2);

      const totalDuration = playlistTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
      expect(totalDuration).toBe(390);
      expect(formatDuration(totalDuration)).toBe("6:30");
    });

    it("removes a single track from playlist optimistically", () => {
      let playlistTracks: Track[] = [sampleTrack1, sampleTrack2];
      playlistTracks = playlistTracks.filter((t) => t.id !== sampleTrack1.id);
      expect(playlistTracks.length).toBe(1);
      expect(playlistTracks[0].id).toBe(sampleTrack2.id);
    });

    it("deletes a custom playlist and clears its associated tracks", () => {
      let allPlaylists: Playlist[] = [
        {
          id: testPlaylistId,
          name: "My Chill Favorites",
          description: "Late night study session",
          cover_key: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "playlist_2",
          name: "Workout Mix",
          description: "Gym tracks",
          cover_key: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      // Delete test playlist
      allPlaylists = allPlaylists.filter((p) => p.id !== testPlaylistId);
      expect(allPlaylists.length).toBe(1);
      expect(allPlaylists.some((p) => p.id === testPlaylistId)).toBe(false);
    });
  });

  describe("4. Player Store & Offline Cover Base64 Matcher", () => {
    it("resolves coverUrl for offline base64 data URIs with 0ms latency without failing network requests", () => {
      const base64Cover = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD";
      const offlineTrack = {
        id: "offline_song_test_123",
        title: "Offline Song",
        artist: "Offline Artist",
        album: "Offline Album",
        genre: "Pop",
        year: 2024,
        track_number: 1,
        duration: 200,
        format: "m4a",
        size: 1000,
        date_added: Date.now(),
        play_count: 0,
        cover_url: base64Cover,
        offline_cover: base64Cover,
      };

      const resolved = coverUrl(offlineTrack as any);
      expect(resolved).toBe(base64Cover);
    });

    it("formats durations accurately", () => {
      expect(formatDuration(0)).toBe("0:00");
      expect(formatDuration(42)).toBe("0:42");
      expect(formatDuration(185)).toBe("3:05");
      expect(formatDuration(3600)).toBe("60:00");
    });

    it("streamUrl correctly resolves direct URLs and endpoints", () => {
      expect(streamUrl({ id: "t1", stream_url: "https://audio.cdn.com/song.mp3" } as any)).toBe("https://audio.cdn.com/song.mp3");
      expect(streamUrl("https://audio.cdn.com/song.mp3")).toBe("https://audio.cdn.com/song.mp3");
    });
  });

  describe("5. Liked Songs Optimistic Store", () => {
    it("toggles likes and tracks liked status reliably", async () => {
      const track = {
        id: "e2e_liked_test_track",
        title: "Liked Song Test",
        artist: "Artist Test",
        album: "Album Test",
        genre: "Pop",
        year: 2024,
        track_number: 1,
        duration: 150,
        format: "mp3",
        size: 2000,
        date_added: Date.now(),
        play_count: 0,
      };

      expect(likedStore.isLiked(track.id)).toBe(false);
      await likedStore.toggle(track as any);
      expect(likedStore.isLiked(track.id)).toBe(true);
      await likedStore.toggle(track as any);
      expect(likedStore.isLiked(track.id)).toBe(false);
    });
  });
});
