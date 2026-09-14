import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createAuth } from "$lib/server/auth";
import { listPlaylists } from "$lib/server/db";

function generateId(): string {
  return crypto.randomUUID();
}

export const GET: RequestHandler = async ({ request, url, platform }) => {
  if (!platform?.env?.DB) return json({ playlists: [] });
  try {
    const auth = createAuth(platform, url.origin);
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return json({ playlists: [] });
    }
    const playlists = await listPlaylists(platform.env.DB, session.user.id);
    return json({ playlists: playlists || [] });
  } catch (err: any) {
    console.warn("[/api/playlists] Database error, fallback to empty list:", err?.message || err);
    return json({ playlists: [] });
  }
};

export const POST: RequestHandler = async ({ request, url, platform }) => {
  if (!platform) throw error(500, "No platform bindings");
  const auth = createAuth(platform, url.origin);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw error(401, "Not authenticated");

  let body: { name?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    throw error(400, "Invalid JSON");
  }
  if (!body.name?.trim()) throw error(400, "name is required");

  const id = generateId();
  const now = Math.floor(Date.now() / 1000);
  await platform.env.DB.prepare(
    "INSERT INTO playlists (id, user_id, name, description, createdAt, updatedAt) VALUES (?1, ?2, ?3, ?4, ?5, ?5)",
  )
    .bind(id, session.user.id, body.name.trim(), body.description ?? null, now)
    .run();

  return json({ id });
};
