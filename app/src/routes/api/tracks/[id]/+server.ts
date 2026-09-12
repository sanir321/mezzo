import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createAuth } from "$lib/server/auth";

export const DELETE: RequestHandler = async ({
  request,
  params,
  url,
  platform,
}) => {
  if (!platform) throw error(500, "No platform bindings");
  const auth = createAuth(platform, url.origin);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw error(401, "Not authenticated");

  await platform.env.DB.prepare("DELETE FROM tracks WHERE id = ?1")
    .bind(params.id)
    .run();

  return json({ ok: true });
};

export const PATCH: RequestHandler = async ({
  request,
  params,
  url,
  platform,
}) => {
  if (!platform) throw error(500, "No platform bindings");
  const auth = createAuth(platform, url.origin);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw error(401, "Not authenticated");

  const body = await request.json().catch(() => ({}));
  const { title, artist, album, genre, year } = body;

  const { updateTrackMetadata } = await import("$lib/server/db");
  const success = await updateTrackMetadata(
    platform.env.DB,
    session.user.id,
    params.id,
    {
      title,
      artist,
      album,
      genre,
      year,
    },
  );

  if (!success) throw error(404, "Track not found or no changes made");
  return json({ ok: true });
};
