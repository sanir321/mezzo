/// <reference types="@sveltejs/kit" />
/// <reference types="svelte" />
/// <reference types="vite/client" />

declare namespace App {
  interface Locals {
    iOS: boolean;
    Android: boolean;
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
    } | null;
    session: {
      id: string;
      userId: string;
      expiresAt: number;
    } | null;
  }

  interface Platform {
    env: {
      DB: D1Database;
      BETTER_AUTH_SECRET?: string;
      BETTER_AUTH_URL?: string;
      GOOGLE_CLIENT_ID?: string;
      GOOGLE_CLIENT_SECRET?: string;
      GITHUB_CLIENT_ID?: string;
      GITHUB_CLIENT_SECRET?: string;
      TIDAL_CLIENT_ID?: string;
      TIDAL_CLIENT_SECRET?: string;
      HIFI_API_BASE_URL?: string;
    };
    context: {
      waitUntil(promise: Promise<unknown>): void;
    };
    caches: CacheStorage & { default: Cache };
  }
}
