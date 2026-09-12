# Mezzo — Session Document

## Overview

Mezzo is a personal music streaming platform consisting of two interconnected projects:
1. **Frontend** (`/app/`) — SvelteKit 5 web app with player, library, playlists, equalizer
2. **HIFI API** (`/worker-api/`) — Hono-based Cloudflare Workers proxy aggregating Tidal, JioSaavn, Deezer, YouTube

---

## PRD Alignment & Implementation Status

### Frontend (`/app/`)

| Feature | Status | Implementation |
|---------|--------|---------------|
| Authentication | ✅ Complete | Better Auth with D1 adapter, OAuth (Google/GitHub), session sharing via `session.svelte.ts` |
| Music Library | ✅ Complete | D1 + R2, upload, metadata extraction via `music-metadata`, FTS5 search |
| Playlists | ✅ Complete | CRUD operations, `playlist_tracks` junction table, add-to-playlist modal |
| Player | ✅ Complete | Svelte 5 Runes store, audio element, range requests, queue management |
| Equalizer | ✅ Complete | 5-band biquad filters, 8 presets, limiter, analyser, localStorage persistence |
| Search | ✅ Complete | SQLite FTS5 with triggers, `tracks_fts` virtual table |
| Lyrics | ✅ Complete | lrclib.net API, LRC parser, cached in-memory |
| Offline Mode | ✅ Complete | Cache Storage API, download/remove/offline playback |
| Artist Views | ✅ Complete | Dynamic `[name]` route, artist browse |
| Settings | ✅ Complete | Preferences store, theme toggle, language |
| Featured Playlists | ✅ Complete | 10 curated playlists with gradient covers |
| Spotify Integration | ✅ Complete | Sidebar, top bar, login footer components |
| Audio Visualizer | ✅ Complete | Canvas-based visualizer component |
| Keyboard Shortcuts | ✅ Complete | Shortcuts modal component |
| Onboarding | ✅ Complete | Onboarding modal component |
| Auth Modal | ✅ Complete | Login/signup modal store (`auth-modal.svelte.ts`) |
| Queue Drawer | ✅ Complete | `QueueDrawer.svelte` component |
| Nav | ✅ Complete | `Nav.svelte` component |
| Track Row | ✅ Complete | `TrackRow.svelte` component |
| Zen Visualizer | ✅ Complete | `ZenVisualizer.svelte` component |
| Edit Track Modal | ✅ Complete | `EditTrackModal.svelte` component |
| Language Modal | ✅ Complete | `LanguageModal.svelte` component |
| Streaming | ✅ Complete | Server-resolved direct stream URLs (Tidal → Saavn → HIFI worker fallback) |
| Session Optimization | ✅ Complete | Shared session caching prevents 17 redundant network requests |

### HIFI API (`/worker-api/`)

| Feature | Status | Implementation |
|---------|--------|---------------|
| Tidal API Proxy | ✅ Complete | OAuth2 token refresh, rate limiting, multi-credential support |
| Search | ✅ Complete | Tidal → Saavn → Deezer fallback chain |
| Track Info | ✅ Complete | `/tracks/info`, `/tracks/track`, `/tracks/trackManifests` |
| Lyrics | ✅ Complete | `/tracks/lyrics` |
| Recommendations | ✅ Complete | `/tracks/recommendations` |
| Widevine DRM | ✅ Complete | `/tracks/widevine` proxy |
| Artist | ✅ Complete | `/artist`, `/artist/similar`, `/artist/album/similar` |
| Album | ✅ Complete | `/album` with paginated items |
| Mix | ✅ Complete | `/mix` page |
| Playlist | ✅ Complete | `/playlist` with items |
| Cover Art | ✅ Complete | `/cover` endpoint |
| Videos | ✅ Complete | `/videos/topvideos`, `/video` |
| Universal Search | ✅ Complete | `/search/universal` — Saavn + Deezer + YouTube merge |
| Universal Stream | ✅ Complete | `/stream` — tiered fallback (Saavn → YouTube → Deezer) |
| Root | ✅ Complete | `/` — version info |
| Providers | ✅ Complete | JioSaavn (DES decryption), Deezer, YouTube (Piped instances) |

---

## Architecture

### Frontend Architecture

```
app/
├── src/
│   ├── lib/
│   │   ├── stores/
│   │   │   ├── player.svelte          # Audio player state, queue, current track
│   │   │   ├── preferences.svelte.ts  # User preferences (theme, volume, etc.)
│   │   │   ├── liked.svelte.ts        # Liked tracks store
│   │   │   ├── auth-modal.svelte.ts   # Auth modal open/mode state
│   │   │   └── equalizer.svelte.ts    # 5-band EQ with presets, limiter, analyser
│   │   ├── services/
│   │   │   ├── lyrics.ts              # LRC parser + lrclib.net fetch
│   │   │   └── offline.svelte.ts      # CacheStorage-based offline downloads
│   │   ├── server/
│   │   │   ├── auth.ts                # Better Auth server setup
│   │   │   ├── db.ts                  # D1 database operations
│   │   │   ├── music.ts               # Music file handling
│   │   │   ├── apple.ts               # Apple Music integration
│   │   │   └── tidal.ts               # Tidal API integration
│   │   ├── components/                # 18 Svelte components
│   │   ├── auth-client.ts             # Better Auth Svelte client
│   │   ├── session.svelte.ts          # Shared session subscription cache
│   │   └── featured-playlists.ts      # 10 featured playlist definitions
│   ├── routes/                        # All page and API routes
│   ├── app.html                       # PWA-ready HTML shell
│   └── app.d.ts                       # Platform type declarations
├── wrangler.toml                      # Pages config + D1 + R2 bindings
└── migrations/0001_init.sql           # Full D1 schema (users, tracks, playlists, FTS5)
```

### HIFI API Architecture

```
worker-api/
├── src/
│   ├── routes/
│   │   ├── index.ts                   # Worker entry point
│   │   ├── root.ts                    # GET / — version info
│   │   ├── search.ts                  # Multi-provider search
│   │   ├── tracks.ts                  # Track info, playback, manifests, lyrics, recommendations, widevine
│   │   ├── artists.ts                 # Artist details, similar, albums
│   │   ├── collections.ts             # Album, mix, playlist, cover
│   │   ├── videos.ts                  # Video recommendations and playback
│   │   └── universal.ts               # Unified stream & search endpoints
│   ├── lib/
│   │   ├── tidal/
│   │   │   ├── client.ts              # OAuth2, token refresh, rate limiting (295 lines)
│   │   │   ├── helpers.ts             # Image URL builder, UUID extraction
│   │   │   └── url.ts                 # URL builder utility
│   │   ├── providers/
│   │   │   ├── saavn.ts               # JioSaavn search with DES decryption
│   │   │   ├── deezer.ts              # Deezer search
│   │   │   └── youtube.ts             # YouTube via Piped instances
│   │   ├── errors.ts                  # ApiError class
│   │   ├── query.ts                   # Query parameter helpers
│   │   ├── concurrency.ts             # mapLimit utility
│   │   └── env.ts                     # Bindings, credentials loading
│   ├── constants.ts                   # API_VERSION, DEFAULTS
│   └── index.ts                       # Worker export
└── wrangler.toml                      # Workers config
```

### Data Flow

**Frontend → D1/R2:**
- User uploads audio → R2 storage, metadata extracted client-side → metadata stored in D1
- Search queries → FTS5 virtual table in D1
- Auth → Better Auth manages user/session tables in D1

**Frontend → HIFI API:**
- Player streams tracks → HIFI API routes → Tidal/JioSaavn/Deezer/YouTube
- Search → HIFI `/search` → Tidal primary → Saavn/Deezer fallback
- Stream → HIFI `/stream` → tiered resolution

**HIFI API → External APIs:**
- Tidal → OAuth2 token management, rate-limit retry with exponential backoff
- JioSaavn → DES-decrypted media URLs, Akamai CDN
- Deezer → Direct API calls
- YouTube → Piped/Invidious instances (3 mirrors with failover)

---

## Database Schema (D1/SQLite)

Key tables in `migrations/0001_init.sql`:
- `user` — Better Auth core table
- `session` — Better Auth session management
- `account` — OAuth account linking
- `verification` — Email verification tokens
- `artists` — Artist registry
- `albums` — Album metadata with artist FK
- `tracks` — Track metadata with user FK, R2 object_key, FTS5 sync
- `playlists` — User playlists
- `playlist_tracks` — Junction table
- `liked_tracks` — User likes
- `tracks_fts` — FTS5 virtual table with triggers

---

## Component Reference (18 Components)

| Component | Purpose |
|-----------|---------|
| `Nav.svelte` | Main navigation |
| `PlayerBar.svelte` | Persistent audio player bar |
| `QueueDrawer.svelte` | Slide-out queue drawer |
| `EqualizerModal.svelte` | Equalizer control panel |
| `LyricsModal.svelte` | Lyrics display |
| `AuthModal.svelte` | Login/signup modal |
| `LandingPage.svelte` | Homepage with featured playlists |
| `TrackRow.svelte` | Individual track row |
| `AudioVisualizer.svelte` | Audio visualization canvas |
| `ZenVisualizer.svelte` | Zen visualizer mode |
| `AddToPlaylistModal.svelte` | Add track to playlist |
| `EditTrackModal.svelte` | Edit track metadata |
| `OnboardingModal.svelte` | First-run onboarding |
| `ShortcutsModal.svelte` | Keyboard shortcuts reference |
| `LanguageModal.svelte` | Language selection |
| `SpotifySidebar.svelte` | Spotify sidebar integration |
| `SpotifyTopBar.svelte` | Spotify top bar |
| `SpotifyLoginFooter.svelte` | Spotify login prompt |

---

## Store Reference (5 Stores)

| Store | Type | State |
|-------|------|-------|
| `player.svelte` | Svelte store | currentTrack, queue, isPlaying, volume, progress |
| `preferences.svelte.ts` | Svelte store | theme, language, playback settings |
| `liked.svelte.ts` | Svelte store | liked track IDs |
| `auth-modal.svelte.ts` | Class-based | isOpen, mode (login/signup) |
| `equalizer.svelte.ts` | Class-based | bands, presets, enabled, audioCtx, filters, limiter, analyser |

---

## Deployments

| Project | URL |
|---------|-----|
| Frontend (Cloudflare Pages) | https://mezzo-music.pages.dev |
| HIFI API (Cloudflare Workers) | https://mezzo-hifi-api.zenosayz05.workers.dev |

## Mobile PWA Fix

### Issue
Music playback hung/froze on Chrome Android when installed as a PWA shortcut.

### Root Cause
1. `prewarmTurnstile()` at module scope in `player.svelte` tried to register `/sw.js` and trigger Turnstile verification on every page load
2. The service worker it registered (`sw-decrypter.js`) could intercept audio stream requests and cause playback failures

### Fix
Removed `prewarmTurnstile()` and its import from `player.svelte`. Deleted `static/sw.js`, `static/sw-decrypter.js`, `flac-stream.ts` and the `/api/decrypt-stream`, `/decrypt-stream` routes (frontend + worker). Kept `audioEl.play()` inside the async `$effect` where Chrome's user gesture context is preserved through Promise chains.

---

## Verification Results

| Check | Result |
|-------|--------|
| `npm run check` | 0 errors, 0 warnings |
| `npm test` | 15/15 passed |
| `npm run build` | ✅ Success |
| `tsc --noEmit` (worker-api) | ✅ Pass |
| Frontend Deploy | ✅ Cloudflare Pages |
| Worker API Deploy | ✅ Cloudflare Workers |

---

## Key Technical Details

### Equalizer System
- 5-band biquad filter: lowshelf, peaking, peaking, peaking, highshelf
- Frequency bands: 60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz
- Gain range: -12dB to +12dB
- 8 presets: Flat, Bass Boost, Vocal Booster, Electronic, Rock, Acoustic, Lo-Fi, Classical
- DynamicsCompressorNode limiter prevents clipping
- AnalyserNode with fftSize=64 for visualization
- AudioContext unlocked on pointerdown/keydown/touchstart

### Session Optimization
- `session.svelte.ts` caches `authClient.useSession()` atom
- Prevents 17 redundant network requests per page load
- Server-side returns null session to avoid hydration mismatch

### Offline Downloads
- Uses Cache Storage API (`caches.open`, `cache.put`, `cache.match`)
- Stores audio streams and cover art separately
- Metadata persisted to localStorage
- Supports `URL.createObjectURL()` for cached audio playback

### Tidal API Client
- OAuth2 refresh token flow with automatic token management
- Rate limiting: 3 retries with exponential backoff (1s–10s)
- Multi-credential rotation (TOKEN_JSON, CLIENT_ID/SECRET + REFRESH_TOKEN)
- 401 auto-refresh, 404 credential fallback, 429 rate-limit handling
- 12s request timeout, 8s token timeout
