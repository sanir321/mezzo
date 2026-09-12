import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createAuth } from "$lib/server/auth";

export const POST: RequestHandler = async ({
  params,
  request,
  url,
  platform,
}) => {
  if (!platform) throw error(500, "No platform bindings");
  const auth = createAuth(platform, url.origin);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw error(401, "Not authenticated");

  let body: { trackId?: string; track?: any };
  try {
    body = await request.json();
  } catch {
    throw error(400, "Invalid JSON");
  }
  const trackId = body.trackId || body.track?.id;
  if (!trackId) throw error(400, "trackId or track required");

  const db = platform.env.DB;
  const ownsPlaylist = await db
    .prepare("SELECT 1 FROM playlists WHERE id = ?1 AND user_id = ?2")
    .bind(params.id, session.user.id)
    .first();
  if (!ownsPlaylist) throw error(404, "Playlist not found");

  const existingTrack = await db
    .prepare("SELECT id FROM tracks WHERE id = ?1")
    .bind(trackId)
    .first();

  if (!existingTrack && body.track) {
    const t = body.track;
    await db
      .prepare(
        `INSERT OR IGNORE INTO tracks (
          id, user_id, title, artist, album, genre, year, track_number, duration, format, size, object_key, cover_key, date_added, play_count
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, 0)`,
      )
      .bind(
        trackId,
        session.user.id,
        t.title || "Unknown Title",
        t.artist || null,
        t.album || null,
        t.genre || null,
        t.year || null,
        t.track_number || null,
        t.duration || null,
        t.format || "mp3",
        t.size || 0,
        t.stream_url || t.object_key || "",
        t.cover_url || t.cover_key || null,
        Math.floor(Date.now() / 1000),
      )
      .run();
  } else if (!existingTrack) {
    throw error(404, "Track not found");
  }

  const existing = await db
    .prepare(
      "SELECT MAX(position) AS m FROM playlist_tracks WHERE playlist_id = ?1",
    )
    .bind(params.id)
    .first<{ m: number | null }>();
  const position = (existing?.m ?? -1) + 1;

  await db
    .prepare(
      "INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?1, ?2, ?3)",
    )
    .bind(params.id, trackId, position)
    .run();

  await db
    .prepare("UPDATE playlists SET updatedAt = ?1 WHERE id = ?2")
    .bind(Math.floor(Date.now() / 1000), params.id)
    .run();

  return json({ ok: true });
};

export const DELETE: RequestHandler = async ({
  params,
  request,
  url,
  platform,
}) => {
  if (!platform) throw error(500, "No platform bindings");
  const auth = createAuth(platform, url.origin);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw error(401, "Not authenticated");

  const trackId = url.searchParams.get("trackId");
  if (!trackId) throw error(400, "trackId query param required");

  const db = platform.env.DB;
  const ownsPlaylist = await db
    .prepare("SELECT 1 FROM playlists WHERE id = ?1 AND user_id = ?2")
    .bind(params.id, session.user.id)
    .first();
  if (!ownsPlaylist) throw error(404, "Playlist not found");

  await db
    .prepare(
      "DELETE FROM playlist_tracks WHERE playlist_id = ?1 AND track_id = ?2",
    )
    .bind(params.id, trackId)
    .run();

  await db
    .prepare("UPDATE playlists SET updatedAt = ?1 WHERE id = ?2")
    .bind(Math.floor(Date.now() / 1000), params.id)
    .run();

  return json({ ok: true });
};
