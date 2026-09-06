import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createAuth } from "$lib/server/auth";
import { getPlaylist } from "$lib/server/db";
import { getFeaturedPlaylistById } from "$lib/featured-playlists";
import {
  searchOnlineMusic,
  getJioSaavnPlaylistDetails,
  getJioSaavnAlbumDetails,
} from "$lib/server/music";
import {
  getTidalAlbumDetails,
  getTidalArtistTopTracks,
} from "$lib/server/tidal";

export const GET: RequestHandler = async ({
  params,
  request,
  url,
  platform,
}) => {
  const pid = params.id;

  // 1. Check if it is a featured playlist (no auth required)
  const featured = getFeaturedPlaylistById(pid);
  if (featured) {
    const result = await searchOnlineMusic(featured.query, 30);
    return json({
      playlist: {
        id: featured.id,
        name: featured.name,
        description: featured.description,
        cover_key: featured.cover,
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000),
        isFeatured: true,
      },
      tracks: result.tracks,
    });
  }

  // 2. Online JioSaavn Playlist (no auth required)
  if (pid.startsWith("saavn_pl_") || pid.startsWith("online_pl_")) {
    const listId = pid.replace("saavn_pl_", "").replace("online_pl_", "");
    const plData = await getJioSaavnPlaylistDetails(listId);
    if (plData) {
      return json(plData);
    }
  }

  // 3. Online JioSaavn Album (no auth required)
  if (pid.startsWith("saavn_alb_") || pid.startsWith("online_alb_")) {
    const albId = pid.replace("saavn_alb_", "").replace("online_alb_", "");
    const albData = await getJioSaavnAlbumDetails(albId);
    if (albData) {
      return json({
        playlist: {
          id: pid,
          name: albData.album.title,
          description: `Album by ${albData.album.artist}${albData.album.year ? ` • ${albData.album.year}` : ""}`,
          cover_key: albData.album.coverUrl,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
          isFeatured: true,
        },
        tracks: albData.tracks,
      });
    }
  }

  // 3b. Online Tidal Album (no auth required)
  if (pid.startsWith("tidal_alb_")) {
    const albData = await getTidalAlbumDetails(pid);
    if (albData) {
      return json({
        playlist: {
          id: pid,
          name: albData.album.album,
          description: `Album by ${albData.album.artist}${albData.album.year ? ` • ${albData.album.year}` : ""}`,
          cover_key: albData.album.coverUrl,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
          isFeatured: true,
        },
        tracks: albData.tracks,
      });
    }
  }

  // 3c. Online Tidal Artist Top Tracks (no auth required)
  if (pid.startsWith("tidal_art_")) {
    const artData = await getTidalArtistTopTracks(pid);
    if (artData) {
      return json({
        playlist: {
          id: pid,
          name: `${artData.artist.name} Top Tracks`,
          description: `Most popular songs by ${artData.artist.name}`,
          cover_key: artData.artist.image,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
          isFeatured: true,
        },
        tracks: artData.tracks,
      });
    }
  }

  // 4. Dynamic Artist Radio or Mix (no auth required)
  if (pid.startsWith("radio_") || pid.startsWith("mix_")) {
    const term = decodeURIComponent(pid.replace(/^(radio|mix)_/, ""));
    const result = await searchOnlineMusic(term, 30);
    return json({
      playlist: {
        id: pid,
        name: `${term} Radio`,
        description: `Personalized mix inspired by ${term}`,
        cover_key:
          result.tracks[0]?.cover_url ||
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000),
        isFeatured: true,
      },
      tracks: result.tracks,
    });
  }

  if (!platform) throw error(500, "No platform bindings");
  const auth = createAuth(platform, url.origin);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw error(401, "Not authenticated");
  const data = await getPlaylist(platform.env.DB, session.user.id, params.id);
  if (!data) throw error(404, "Playlist not found");
  return json(data);
};

export const PATCH: RequestHandler = async ({
  params,
  request,
  url,
  platform,
}) => {
  if (!platform) throw error(500, "No platform bindings");
  const auth = createAuth(platform, url.origin);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw error(401, "Not authenticated");

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
  };
  const now = Math.floor(Date.now() / 1000);

  if (body.name !== undefined) {
    await platform.env.DB.prepare(
      "UPDATE playlists SET name = ?1, updatedAt = ?2 WHERE id = ?3 AND user_id = ?4",
    )
      .bind(body.name.trim() || null, now, params.id, session.user.id)
      .run();
  }
  if (body.description !== undefined) {
    await platform.env.DB.prepare(
      "UPDATE playlists SET description = ?1, updatedAt = ?2 WHERE id = ?3 AND user_id = ?4",
    )
      .bind(body.description, now, params.id, session.user.id)
      .run();
  }
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

  const res = await platform.env.DB.prepare(
    "DELETE FROM playlists WHERE id = ?1 AND user_id = ?2",
  )
    .bind(params.id, session.user.id)
    .run();
  if (!res.meta.changes) throw error(404, "Playlist not found");
  return json({ ok: true });
};
