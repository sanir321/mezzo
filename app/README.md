<p align="center">
  <img src="static/logo.svg" width="96px" height="96px" alt="Mezzo Logo" />
</p>

# Mezzo

**Mezzo** is a sleek, self-hosted personal music streaming web app powered entirely by Cloudflare's free stack (Cloudflare Pages, D1 SQL Database, and R2 Object Storage).

Upload your own lossless and lossy audio files, organize them into playlists, and stream your private music library seamlessly from anywhere.

---

## Features

- 🎵 **Multi-Format Audio Support**: Upload and stream MP3, FLAC, WAV, M4A, and AAC files.
- ⚡ **Cloudflare Serverless & Edge Storage**:
  - **Cloudflare Pages / Workers**: Fast global edge rendering with SvelteKit.
  - **Cloudflare D1 (SQLite)**: Serverless relational database for track metadata, user data, and playlists.
  - **Cloudflare R2**: S3-compatible, zero-egress fee object storage for audio files and album artwork.
- 🔍 **Instant Full-Text Search**: Powered by SQLite FTS5 virtual tables and automatic database triggers.
- 🔒 **Secure Authentication**: Built with [Better Auth](https://www.better-auth.com/) supporting email/password and OAuth (Google, GitHub).
- 🏷️ **Browser-Side Metadata Extraction**: Reads ID3/Vorbis/FLAC tags and embedded album art client-side via `music-metadata`.
- 🎧 **Svelte 5 Player**: Persistent audio player with queues, seeking, volume controls, keyboard support, and range-request audio streaming.
- 📋 **Playlists & Artist Views**: Organize your favorite songs into custom playlists and browse by artist or album.

---

## Tech Stack

- **Frontend**: Svelte 5 (Runes), SvelteKit 2, SCSS, TypeScript
- **Backend / API**: SvelteKit server routes + Cloudflare adapter (`@sveltejs/adapter-cloudflare`)
- **Database**: Cloudflare D1 (SQLite) with FTS5
- **Storage**: Cloudflare R2
- **Auth**: Better Auth (with D1 adapter)
- **Metadata**: `music-metadata`

---

## Getting Started

### 1. Prerequisites

- Node.js >= 20.x
- npm >= 10.x
- Cloudflare Wrangler CLI (`npm i -g wrangler` or via `npx wrangler`)

### 2. Installation

```bash
git clone https://github.com/samirkhadka/mezzo.git
cd mezzo/app
npm install
```

### 3. Local Development & Setup

1. **Initialize Cloudflare D1 Database**:

   ```bash
   npx wrangler d1 create mezzo_db
   ```

   Copy the output `database_id` and update `database_id` in `wrangler.toml`.

2. **Run Migrations on D1**:

   ```bash
   # Local D1 migration
   npx wrangler d1 execute mezzo_db --local --file=migrations/0001_init.sql

   # Remote D1 migration (for production)
   npx wrangler d1 execute mezzo_db --remote --file=migrations/0001_init.sql
   ```

3. **Create Cloudflare R2 Bucket**:

   ```bash
   npx wrangler r2 bucket create mezzo-audio
   ```

4. **Environment Variables**:
   Create a `.env` file in the `app` directory:

   ```env
   BETTER_AUTH_SECRET=your_random_auth_secret_here
   BETTER_AUTH_URL=http://localhost:5173
   # Optional OAuth credentials:
   # GOOGLE_CLIENT_ID=
   # GOOGLE_CLIENT_SECRET=
   # GITHUB_CLIENT_ID=
   # GITHUB_CLIENT_SECRET=
   ```

5. **Start Dev Server**:
   ```bash
   npm run dev
   ```

---

## Scripts

- `npm run dev`: Start local development server
- `npm run check`: Run SvelteKit sync and TypeScript / Svelte 5 type checks
- `npm test`: Run Vitest unit tests
- `npm run build`: Build production output with `@sveltejs/adapter-cloudflare`
- `npm run cfw:deploy`: Deploy worker/pages via Wrangler

---

## License

This project is open source and available under the [AGPL-3.0 License](LICENSE).
