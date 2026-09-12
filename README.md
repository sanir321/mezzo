<p align="center">
  <img src="static/logo.svg" width="96px" height="96px" alt="Mezzo Logo" />
</p>

# Mezzo

**Mezzo** is a sleek, self-hosted personal music streaming platform powered entirely by Cloudflare's free stack. It consists of two projects working together:

- **Mezzo Frontend** (`/app/`) — A SvelteKit 5 web app with a persistent audio player, library management, playlists, and equalizer.
- **Mezzo HIFI API** (`/worker-api/`) — A Cloudflare Workers-based proxy that aggregates music streaming from multiple providers (Tidal, JioSaavn, Deezer, YouTube) with a unified API.

---

## Features

### 🎵 Mezzo Frontend
- 🎧 **Svelte 5 Runes Player** — Persistent audio player with queues, seeking, volume, keyboard shortcuts, and equalizer.
- 📚 **Music Library** — Upload and manage audio files (MP3, WAV, M4A, AAC) with Cloudflare R2 storage.
- 📋 **Playlists & Favorites** — Create playlists, like tracks, and organize your library.
- 🎨 **Equalizer** — 5-band biquad filter with 8 presets (Flat, Bass Boost, Vocal Booster, Electronic, Rock, Acoustic, Lo-Fi, Classical), limiter, and analyser.
- 🔍 **Full-Text Search** — SQLite FTS5-powered search across titles and artists.
- 📝 **Lyrics** — Fetched from lrclib.net with LRC parsing and synced display.
- 📴 **Offline Mode** — Cache-based offline downloads via the Cache Storage API.
- 🔒 **Secure Auth** — Better Auth with email/password and OAuth (Google, GitHub).
- 🎨 **Dark/Light Theme** — Auto-detect and persistent theme preference.
- 📱 **PWA Ready** — Mobile-optimized with Apple meta tags, manifest, and theme-color.
- 🎨 **18 UI Components** — Landing page, nav, player bar, queue drawer, equalizer, lyrics, spotify integration, and more.

### 🌐 Mezzo HIFI API (Cloudflare Workers)
- 🌍 **Multi-Source Streaming** — Aggregates from Tidal, JioSaavn, Deezer, and YouTube (via Piped).
- 🔑 **Tidal as Primary** — Full Tidal API proxy with OAuth2 token refresh, rate-limit handling, and multi-credential support.
- 🔄 **Automatic Fallback** — When Tidal credentials are unavailable, falls back to JioSaavn and Deezer transparently.
- 🎬 **Videos** — Tidal video browsing and playback info.
- 🎤 **Artists & Albums** — Similar artists/albums, album tracks, mix pages, playlists, and cover art.
- 🔍 **Universal Search & Stream** — Unified `/search/universal` and `/stream` endpoints with multi-provider merging.
- 🛡️ **Widevine DRM** — DRM license/certificate proxy for Tidal's protected content.

---

## Tech Stack

### Frontend (`/app/`)
| Layer | Technology |
|-------|-----------|
| Framework | Svelte 5 (Runes), SvelteKit 2 |
| Styling | SCSS |
| Language | TypeScript |
| Database | Cloudflare D1 (SQLite) with FTS5 |
| Storage | Cloudflare R2 |
| Auth | Better Auth (D1 adapter, OAuth via Google/GitHub) |
| Metadata | `music-metadata` (client-side ID3/Vorbis/FLAC tags) |
| Build | `@sveltejs/adapter-cloudflare` |
| Testing | Vitest |
| Linting | Prettier, ESLint, `svelte-check` |

### HIFI API (`/worker-api/`)
| Layer | Technology |
|-------|-----------|
| Framework | Hono (Cloudflare Workers) |
| Language | TypeScript |
| Runtime | Cloudflare Workers |
| API Sources | Tidal, JioSaavn, Deezer, YouTube (Piped) |
| Config | `wrangler.toml` with KV bindings |
| Secrets | TOKEN_JSON, CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN |

---

## Project Structure

```
mezzo/
├── app/                          # SvelteKit frontend
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/       # 18 UI components
│   │   │   ├── stores/           # player, preferences, liked, auth-modal, equalizer
│   │   │   ├── server/           # auth, db, music, apple, tidal modules
│   │   │   ├── services/         # lyrics, offline download
│   │   │   ├── auth-client.ts    # Better Auth Svelte client
│   │   │   ├── session.svelte.ts # Shared session cache
│   │   │   └── featured-playlists.ts
│   │   ├── routes/               # All page + API routes
│   │   ├── app.html              # PWA-ready HTML shell
│   │   └── app.d.ts              # Platform type declarations
│   ├── wrangler.toml             # Cloudflare Pages config + D1 binding
│   ├── package.json              # Dependencies & scripts
│   └── migrations/0001_init.sql  # D1 database schema
│
├── worker-api/                   # HIFI API Cloudflare Workers
│   ├── src/
│   │   ├── routes/               # root, search, tracks, artists, collections, videos, universal
│   │   ├── lib/
│   │   │   ├── tidal/            # client, helpers, url
│   │   │   ├── providers/        # saavn, deezer, youtube
│   │   │   ├── errors.ts, query.ts, concurrency.ts
│   │   │   └── env.ts            # Credentials & bindings
│   │   ├── constants.ts
│   │   └── index.ts              # Worker entry point
│   ├── wrangler.toml             # Workers config
│   └── package.json
```

---

## Routes

### Frontend (`/app/src/routes/`)
| Route | Description |
|-------|-------------|
| `/` | Landing page with featured playlists |
| `/login` | Authentication (Better Auth) |
| `/playlists` | Playlist management |
| `/artist/[name]` | Artist browse & discography |
| `/search` | Full-text search (FTS5) |
| `/settings` | User settings & preferences |
| `/library` | Personal music library |
| `/player` | Audio player interface |
| `/api/library` | Library data API |
| `/api/playlists` | Playlist CRUD API |
| `/api/tracks` | Track management API |

### HIFI API (`/worker-api/src/routes/`)
| Route | Description |
|-------|-------------|
| `/` | Root info (version, repo URL) |
| `/search` | Track/artist/album/video/playlist search (Tidal → Saavn → Deezer) |
| `/tracks/info` | Track info by Tidal ID |
| `/tracks/track` | Playback info by Tidal ID |
| `/tracks/trackManifests` | Adaptive manifest generation |
| `/tracks/lyrics` | Track lyrics |
| `/tracks/recommendations` | Track recommendations |
| `/tracks/widevine` | DRM license proxy |
| `/artist` | Artist details & albums |
| `/artist/similar` | Similar artists |
| `/artist/album/similar` | Similar albums |
| `/album` | Album with paginated items |
| `/mix` | Tidal mix page |
| `/playlist` | Playlist with items |
| `/cover` | Track/album cover art |
| `/videos/topvideos` | Video recommendations |
| `/video` | Video playback info |
| `/stream` | Unified stream endpoint (Tidal → Saavn → YouTube → Deezer) |
| `/search/universal` | Multi-provider search |

> **Note**: Tidal stream resolution requires `?countryCode=US` in the Tidal API. The worker-api `/stream?id=tidal_xxx` now works because `resolveTidalTrackStream` delegates to `resolveSaavnTrack` which correctly handles `encrypted_media_url` from `more_info`.

---

## Live Deployments

| Project | URL |
|---------|-----|
| Frontend (Cloudflare Pages) | https://mezzo-music.pages.dev |
| HIFI API (Cloudflare Workers) | https://mezzo-hifi-api.zenosayz05.workers.dev |

## Getting Started

### Prerequisites
- Node.js >= 20.x, npm >= 10.x
- Cloudflare Wrangler CLI (`npm i -g wrangler` or `npx wrangler`)

### Frontend Setup

1. **Create D1 Database**:
   ```bash
   npx wrangler d1 create mezzo_db
   ```
   Copy the `database_id` into `app/wrangler.toml`.

2. **Run Migrations**:
   ```bash
   npx wrangler d1 execute mezzo_db --local --file=app/migrations/0001_init.sql
   npx wrangler d1 execute mezzo_db --remote --file=app/migrations/0001_init.sql
   ```

3. **Create R2 Bucket**:
   ```bash
   npx wrangler r2 bucket create mezzo-audio
   ```

4. **Environment Variables** (`.env` in `app/`):
   ```env
   BETTER_AUTH_SECRET=your_random_auth_secret_here
   BETTER_AUTH_URL=http://localhost:5173
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   GITHUB_CLIENT_ID=
   GITHUB_CLIENT_SECRET=
   TIDAL_CLIENT_ID=
   TIDAL_CLIENT_SECRET=
   HIFI_API_BASE_URL=
   ```
   In dev the app reads `VITE_`-prefixed names (`VITE_TIDAL_CLIENT_ID`, `VITE_HIFI_API_BASE_URL`); in production it reads the non-prefixed names from Cloudflare bindings.

5. **Install & Dev**:
   ```bash
   cd app
   npm install
   npm run dev
   ```

### HIFI API Setup

1. **Create KV Namespace**:
   ```bash
   npx wrangler kv namespace create mezzo_cache
   ```

2. **Set Secrets**:
   ```bash
   npx wrangler secret put TOKEN_JSON
   npx wrangler secret put CLIENT_ID
   npx wrangler secret put CLIENT_SECRET
   npx wrangler secret put REFRESH_TOKEN
   npx wrangler secret put COUNTRY_CODE
   ```

3. **Dev**:
   ```bash
   cd worker-api
   npm install
   npm run dev
   ```

---

## Verification Status

| Check | Status |
|-------|--------|
| `npm run check` (svelte-check) | ✅ 0 errors, 0 warnings |
| `npm test` (Vitest) | ✅ 15/15 passed |
| `npm run build` | ✅ Success |
| `tsc --noEmit` (worker-api) | ✅ Pass |

## Mobile PWA Fix

### Issue
Music playback would hang/freeze on Chrome Android when installed as a PWA shortcut.

### Root Cause
1. **Old service worker (`sw.js`)** was cached in browser and re-registered on every page load, causing `ERR_INSUFFICIENT_RESOURCES` connection pool exhaustion
2. **`prewarmTurnstile()` at module scope** — Tried to register `/sw.js` service worker and trigger Cloudflare Turnstile verification, blocking initialization
3. **`audioEl.play()` inside async `$effect`** — The stream resolution `$effect` wrapped `audioEl.play()` in an async IIFE, breaking the user gesture chain required by mobile browsers

### Fix Applied
1. **Deleted `static/sw.js` and `static/sw-decrypter.js`** — Service worker files removed from server
2. **Added auto-unregister of old service workers** in `+layout.svelte` — `navigator.serviceWorker.getRegistrations()` → `reg.unregister()` on every page load
3. Removed `prewarmTurnstile()`, `registerDecryptionServiceWorker()` from `player.svelte`, `flac-stream.ts`, `+layout.svelte`
4. **Removed the legacy FLAC/Turnstile decryption path entirely** — `flac-stream.ts`, `/api/decrypt-stream` (frontend), and `/decrypt-stream` (worker-api incl. `crypto-js` DES) were deleted. Lossless playback now streams server-resolved URLs directly.
5. Kept `audioEl.play()` inside the async `$effect` where the async chain started by the user gesture preserves the context through Promise resolution

### Other Fixes Applied
- **`effect_update_depth_exceeded`**: Moved `sessionAtom.subscribe` out of `$effect` in `+layout.svelte`
- **`document-domain` removed** from `permissions-policy` header in `hooks.server.ts`
- **`preload as="image"`** added to `app.html`
- **`mobile-web-app-capable`** replaces deprecated `apple-mobile-web-app-capable`
- **`error-banner`** moved inside `auth-form` in `login/+page.svelte`

---

## Scripts

### Frontend (`/app/`)
- `npm run dev` — Start local dev server
- `npm run check` — SvelteKit sync + TypeScript/Svelte 5 type checks
- `npm test` — Run Vitest unit tests
- `npm run build` — Build for Cloudflare Pages
- `npm run cfw:deploy` — Deploy via Wrangler

### HIFI API (`/worker-api/`)
- `npm run dev` — Start local Workers dev server
- `npm run check` — TypeScript type check (`tsc --noEmit`)
- `npm run deploy` — Deploy to Cloudflare Workers

---

## License

This project is open source and available under the [AGPL-3.0 License](LICENSE).
