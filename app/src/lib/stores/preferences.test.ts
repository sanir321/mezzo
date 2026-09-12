import { describe, it, expect, beforeEach } from "vitest";
import {
  userPreferences,
  POPULAR_LANGUAGES,
  POPULAR_ARTISTS,
} from "./preferences.svelte";

describe("User Preferences Store", () => {
  beforeEach(() => {
    userPreferences.resetPreferences();
  });

  it("initializes with default languages and empty artist list", () => {
    expect(userPreferences.languages).toContain("English");
    expect(userPreferences.favoriteArtists).toEqual([]);
    expect(userPreferences.onboardingCompleted).toBe(false);
  });

  it("toggles preferred languages properly without removing last language", () => {
    userPreferences.toggleLanguage("Spanish");
    expect(userPreferences.hasLanguage("Spanish")).toBe(true);
    expect(userPreferences.languages).toContain("Spanish");

    userPreferences.toggleLanguage("Spanish");
    expect(userPreferences.hasLanguage("Spanish")).toBe(false);

    // Trying to remove the last language does not leave empty list
    userPreferences.toggleLanguage("English");
    expect(userPreferences.languages.length).toBeGreaterThanOrEqual(1);
  });

  it("adds and removes favorite artists correctly", () => {
    userPreferences.toggleArtist("The Weeknd");
    expect(userPreferences.hasArtist("The Weeknd")).toBe(true);
    expect(userPreferences.favoriteArtists).toContain("The Weeknd");

    userPreferences.toggleArtist("Daft Punk");
    expect(userPreferences.favoriteArtists).toHaveLength(2);

    userPreferences.toggleArtist("The Weeknd");
    expect(userPreferences.hasArtist("The Weeknd")).toBe(false);
    expect(userPreferences.favoriteArtists).toEqual(["Daft Punk"]);
  });

  it("marks onboarding as completed", () => {
    expect(userPreferences.onboardingCompleted).toBe(false);
    userPreferences.completeOnboarding();
    expect(userPreferences.onboardingCompleted).toBe(true);
  });

  it("provides valid seed constants for languages and popular artists", () => {
    expect(POPULAR_LANGUAGES.length).toBeGreaterThan(5);
    expect(POPULAR_ARTISTS.length).toBeGreaterThan(10);
    expect(POPULAR_ARTISTS.some((a) => a.name === "Taylor Swift")).toBe(true);
    expect(POPULAR_LANGUAGES.some((l) => l.name === "English")).toBe(true);
  });
});
