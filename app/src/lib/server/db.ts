// D1Database is a global ambient type (see src/lib/cloudflare.d.ts).

export interface TrackRow {
  id: string;
  user_id: string;
  title: string;
  artist: string | null;
  artist_id: string | null;
  album: string | null;
  album_id: string | null;
  genre: string | null;
  year: number | null;
  track_number: number | null;
  duration: number | null;
  format: string;
  size: number;
  object_key: string;
  cover_key: string | null;
  date_added: number;
  play_count: number;
}

export interface PlaylistRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_key: string | null;
  createdAt: number;
  updatedAt: number;
}

export function isAuthed(db: D1Database, userId: string): Promise<boolean> {
  return db
    .prepare("SELECT 1 FROM user WHERE id = ?1")
    .bind(userId)
    .first()
    .then(Boolean);
}

export async function listTracks(
  db: D1Database,
  userId: string,
): Promise<TrackRow[]> {
  const { results } = await db
    .prepare(
      `SELECT * FROM tracks
			 WHERE user_id = ?1
			 ORDER BY date_added DESC, title ASC`,
    )
    .bind(userId)
    .all();
  return (results as unknown as TrackRow[]).map((t: any) => ({
    ...t,
    stream_url: t.object_key?.startsWith("http") ? t.object_key : `/api/tracks/${t.id}/stream`,
    cover_url: t.cover_key?.startsWith("http") ? t.cover_key : `/api/tracks/${t.id}/cover`,
  }));
}

export async function listTracksByArtist(
  db: D1Database,
  userId: string,
): Promise<TrackRow[]> {
  const { results } = await db
    .prepare(
      `SELECT * FROM tracks
			 WHERE user_id = ?1
			 ORDER BY artist ASC, album ASC, track_number ASC`,
    )
    .bind(userId)
    .all();
  return (results as unknown as TrackRow[]).map((t: any) => ({
    ...t,
    stream_url: t.object_key?.startsWith("http") ? t.object_key : `/api/tracks/${t.id}/stream`,
    cover_url: t.cover_key?.startsWith("http") ? t.cover_key : `/api/tracks/${t.id}/cover`,
  }));
}

export async function getTrack(
  db: D1Database,
  userId: string,
  id: string,
): Promise<TrackRow | null> {
  return (await db
    .prepare("SELECT * FROM tracks WHERE id = ?1 AND user_id = ?2")
    .bind(id, userId)
    .first()) as unknown as TrackRow | null;
}

export async function searchTracks(
  db: D1Database,
  userId: string,
  query: string,
): Promise<TrackRow[]> {
  const { results } = await db
    .prepare(
      `SELECT t.* FROM tracks_fts f
			 JOIN tracks t ON t.rowid = f.rowid
			 WHERE tracks_fts MATCH ?1 AND t.user_id = ?2
			 ORDER BY bm25(tracks_fts) LIMIT 100`,
    )
    .bind(`${query}*`, userId)
    .all();
  return results as unknown as TrackRow[];
}

export async function listPlaylists(
  db: D1Database,
  userId: string,
): Promise<PlaylistRow[]> {
  const { results } = await db
    .prepare(
      `SELECT * FROM playlists
			 WHERE user_id = ?1
			 ORDER BY updatedAt DESC`,
    )
    .bind(userId)
    .all();
  return results as unknown as PlaylistRow[];
}

export async function getPlaylist(db: D1Database, userId: string, id: string) {
  const playlist = (await db
    .prepare("SELECT * FROM playlists WHERE id = ?1 AND user_id = ?2")
    .bind(id, userId)
    .first()) as unknown as PlaylistRow | null;
  if (!playlist) return null;
  const { results: rawTracks } = await db
    .prepare(
      `SELECT t.* FROM playlist_tracks pt
			 JOIN tracks t ON t.id = pt.track_id
			 WHERE pt.playlist_id = ?1
			 ORDER BY pt.position ASC`,
    )
    .bind(id)
    .all();
  const tracks = (rawTracks as unknown as TrackRow[]).map((t) => ({
    ...t,
    stream_url: t.object_key?.startsWith("http") ? t.object_key : undefined,
    cover_url: t.cover_key?.startsWith("http") ? t.cover_key : undefined,
  }));
  return { playlist, tracks };
}

export async function incrementPlayCount(
  db: D1Database,
  trackId: string,
): Promise<void> {
  await db
    .prepare("UPDATE tracks SET play_count = play_count + 1 WHERE id = ?1")
    .bind(trackId)
    .run();
}

export async function toggleLikeTrack(
  db: D1Database,
  userId: string,
  trackId: string,
  trackData?: any,
): Promise<{ liked: boolean }> {
  try {
    const existing = await db
      .prepare("SELECT 1 FROM liked_tracks WHERE user_id = ?1 AND track_id = ?2")
      .bind(userId, trackId)
      .first();

    if (existing) {
      await db
        .prepare("DELETE FROM liked_tracks WHERE user_id = ?1 AND track_id = ?2")
        .bind(userId, trackId)
        .run();
      return { liked: false };
    } else {
      if (trackData) {
        await db
          .prepare(
            `INSERT OR IGNORE INTO tracks (
              id, user_id, title, artist, album, genre, year, track_number, duration, format, size, object_key, cover_key, date_added, play_count
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, 0)`
          )
          .bind(
            trackId,
            userId,
            trackData.title || "Unknown Title",
            trackData.artist || null,
            trackData.album || null,
            trackData.genre || null,
            trackData.year || null,
            trackData.track_number || null,
            trackData.duration || null,
            trackData.format || "mp3",
            trackData.size || 0,
            trackData.stream_url || trackData.object_key || "",
            trackData.cover_url || trackData.cover_key || null,
            Math.floor(Date.now() / 1000)
          )
          .run();
      }
      await db
        .prepare("INSERT OR REPLACE INTO liked_tracks (user_id, track_id) VALUES (?1, ?2)")
        .bind(userId, trackId)
        .run();
      return { liked: true };
    }
  } catch (err) {
    console.error("toggleLikeTrack error:", err);
    return { liked: true };
  }
}

export async function getLikedTrackIds(
  db: D1Database,
  userId: string,
): Promise<string[]> {
  const { results } = await db
    .prepare("SELECT track_id FROM liked_tracks WHERE user_id = ?1 ORDER BY createdAt DESC")
    .bind(userId)
    .all();
  return (results as unknown as { track_id: string }[]).map((r) => r.track_id);
}

export async function listLikedTracks(
  db: D1Database,
  userId: string,
): Promise<TrackRow[]> {
  const { results } = await db
    .prepare(
      `SELECT t.*, lt.track_id as liked_track_id FROM liked_tracks lt
       LEFT JOIN tracks t ON t.id = lt.track_id
       WHERE lt.user_id = ?1
       ORDER BY lt.createdAt DESC`
    )
    .bind(userId)
    .all();
  return (results as unknown as any[]).map((t) => {
    const id = t.id || t.liked_track_id;
    return {
      id,
      user_id: t.user_id || userId,
      artist_id: t.artist_id || null,
      album_id: t.album_id || null,
      title: t.title || "Liked Song",
      artist: t.artist || "Unknown Artist",
      album: t.album || "Unknown Album",
      genre: t.genre || null,
      year: t.year || null,
      track_number: t.track_number || null,
      duration: t.duration || 0,
      format: t.format || "Lossless HiFi",
      size: t.size || 0,
      object_key: t.object_key || "",
      cover_key: t.cover_key || null,
      date_added: t.date_added || Math.floor(Date.now() / 1000),
      play_count: t.play_count || 0,
      stream_url: t.object_key?.startsWith("http") ? t.object_key : `/api/tracks/${id}/stream`,
      cover_url: t.cover_key?.startsWith("http") ? t.cover_key : undefined,
    };
  });
}

export async function updateTrackMetadata(
  db: D1Database,
  userId: string,
  id: string,
  data: {
    title?: string;
    artist?: string | null;
    album?: string | null;
    genre?: string | null;
    year?: number | null;
  }
): Promise<boolean> {
  const fields: string[] = [];
  const bindings: any[] = [];
  let idx = 1;

  if (data.title !== undefined) {
    fields.push(`title = ?${idx++}`);
    bindings.push(data.title);
  }
  if (data.artist !== undefined) {
    fields.push(`artist = ?${idx++}`);
    bindings.push(data.artist);
  }
  if (data.album !== undefined) {
    fields.push(`album = ?${idx++}`);
    bindings.push(data.album);
  }
  if (data.genre !== undefined) {
    fields.push(`genre = ?${idx++}`);
    bindings.push(data.genre);
  }
  if (data.year !== undefined) {
    fields.push(`year = ?${idx++}`);
    bindings.push(data.year);
  }

  if (fields.length === 0) return true;

  bindings.push(id, userId);
  const query = `UPDATE tracks SET ${fields.join(", ")} WHERE id = ?${idx++} AND user_id = ?${idx++}`;
  const res = await db.prepare(query).bind(...bindings).run();
  return (res.meta.changes ?? 0) > 0;
}

