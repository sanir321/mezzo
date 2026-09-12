# Mezzo Music Platform — Session Summary

## Deployment URLs
- **Frontend (Cloudflare Pages):** https://mezzo-music.pages.dev
- **Worker API (Cloudflare Workers):** https://mezzo-hifi-api.zenosayz05.workers.dev
- **D1 Database:** afc4ec33-a262-4fbd-95bc-2dd6625ccd99

## Recent Fixes Applied

### 9. Tidal Stream Resolution (Rewired)
- **Problem:** `/api/tracks/[id]/stream` returned 404 for Tidal tracks because `resolveTidalTrackStream` in worker-api had broken Saavn search logic — `primary_artists` was `None` at top level of Saavn search results, and `encrypted_media_url` was nested in `more_info`, not at top level
- **Fix:** Deleted `worker-api/src/lib/providers/tidal.ts` and wired `universal.ts` to the env-based `tidalJsonRequest` client; Tidal branch fetches metadata from the Tidal API then resolves the stream via `resolveSaavnTrack`, falling back to Saavn/YouTube/Deezer. Removed hardcoded Tidal credentials from `app/src/lib/server/tidal.ts` (now read from env/bindings) and replaced hardcoded `localhost:8787` worker URLs with configurable `HIFI_API_BASE_URL`.
- **Result:** `/stream?id=tidal_xxx` still returns `{"ok":true,"url":"https://...","source":"tidal"}`; no hardcoded secrets remain in the repo.

### 1. Service Worker Removal (Critical)
- **Problem:** Old service worker (`sw.js`, `sw-decrypter.js`) was cached in browser, causing `ERR_INSUFFICIENT_RESOURCES` errors and infinite re-registration loops
- **Fix:** Deleted `static/sw.js` and `static/sw-decrypter.js`, removed `registerDecryptionServiceWorker()` and `prewarmTurnstile()` from all code, added **auto-unregister** of old service workers in `+layout.svelte` using `navigator.serviceWorker.getRegistrations()` → `reg.unregister()`
- **Result:** Users no longer need to manually clear service workers from Chrome DevTools

### 2. Decryption Stream Endpoint (Removed)
- **Problem:** `flac-stream.ts` checked `navigator.serviceWorker?.controller` and returned `null` if service worker wasn't controlling, breaking FLAC audio playback
- **Fix:** Removed the entire legacy FLAC/Turnstile path. `flac-stream.ts`, `sw.js`, `sw-decrypter.js`, `/api/decrypt-stream` (frontend), and `/decrypt-stream` (worker-api, incl. `crypto-js` DES) were all deleted. Streaming now uses server-resolved direct URLs.

### 3. Effect Update Depth Exceeded
- **Problem:** Infinite `$effect` loop from `sessionAtom.subscribe` inside `$effect` in `+layout.svelte`
- **Fix:** Moved subscription outside `$effect` to direct setup call with cleanup

### 4. Permissions-Policy Header
- **Problem:** `document-domain` feature in `permissions-policy` header caused `[Violation] Permissions-Policy: Unrecognized feature: 'document-domain'`
- **Fix:** Removed `document-domain` from `hooks.server.ts`

### 5. Preload Tag
- **Problem:** `<link rel="preload">` missing `as` attribute
- **Fix:** Added `as="image"` to preload tag in `app.html`

### 6. Mobile PWA Meta Tags
- **Problem:** `apple-mobile-web-app-capable` deprecated
- **Fix:** Replaced with `mobile-web-app-capable` in `app.html`

### 7. Login Page CSS Warning
- **Problem:** `error-banner` div was outside `auth-form` causing CSS selector warning
- **Fix:** Moved `error-banner` inside `auth-form` in `login/+page.svelte`

### 8. Playwright MCP Setup
- Installed `@browsermcp/mcp` and `@playwright/mcp` for browser automation
- Server running on port 9009 and 8082 respectively

## Build Status
- `npm run check` → 0 errors, 0 warnings
- `npm test` → 15/15 passed
- `npm run build` → succeeds
- `npx tsc --noEmit` (worker-api) → pass
- `svelte-check` → 0 errors, 0 warnings

## Key Files Modified
- `src/routes/+layout.svelte` — Auto-unregister old service workers, fixed subscription pattern
- `src/lib/flac-stream.ts` — **Deleted** (legacy FLAC/Turnstile path)
- `src/routes/api/decrypt-stream/+server.ts` — **Deleted** (proxy route removed)
- `src/hooks.server.ts` — Removed `document-domain` from permissions-policy
- `src/app.html` — Fixed meta tags
- `src/routes/login/+page.svelte` — Fixed error-banner placement
- `src/lib/server/tidal.ts` — Tidal creds now read from env; `HIFI_API_BASE_URL` replaces `localhost:8787`
- `src/routes/api/tracks/[id]/stream/+server.ts` — `HIFI_API_BASE_URL` replaces `localhost:8787`
- `worker-api/src/lib/providers/tidal.ts` — **Deleted**; `worker-api/src/routes/universal.ts` rewired to env-based `tidalJsonRequest`, `/decrypt-stream` route removed
- `README.md`, `SESSION.md`, `SESSION_SUMMARY.md` — Deploy URLs reconciled to `mezzo-music.pages.dev`
