/// <reference lib="webworker" />

import { build, files, prerendered, version, base } from "$service-worker";

const sw = self as unknown as ServiceWorkerGlobalScope;

// Shell cache is versioned; a new deploy installs a fresh cache automatically.
// The app-managed downloaded-track cache ("mezzo-offline-v1", written by
// offline.svelte.ts) is deliberately never evicted by this worker.
const SHELL_CACHE = `mezzo-shell-${version}`;

const ASSETS = [...new Set([...build, ...files, ...prerendered])];

sw.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => sw.skipWaiting()),
  );
});

sw.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(
            (name) =>
              name.startsWith("mezzo-shell-") &&
              name !== SHELL_CACHE,
          )
          .map((name) => caches.delete(name)),
      );
      await sw.clients.claim();
    })(),
  );
});

const isAudioResponse = (res: Response) =>
  (res.headers.get("content-type") ?? "").includes("audio");

async function handleNavigate(request: Request): Promise<Response> {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok && (fresh.headers.get("content-type") ?? "").includes("text/html")) {
      try {
        await cache.put(request, fresh.clone());
      } catch {}
    }
    return fresh;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const shell = await cache.match(`${base}/`);
    if (shell) return shell;
    return Response.error();
  }
}

async function cacheFirst(request: Request): Promise<Response> {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh && fresh.ok) {
    try {
      await cache.put(request, fresh.clone());
    } catch {}
  }
  return fresh;
}

async function networkFirst(request: Request): Promise<Response> {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      try {
        await cache.put(request, fresh.clone());
      } catch {}
    }
    return fresh;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error("offline");
  }
}

async function apiNetworkFirst(request: Request): Promise<Response> {
  // Never buffer audio streams through the shell cache — play them straight.
  const cache = await caches.open(SHELL_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) {
      try {
        if (!isAudioResponse(fresh)) {
          await cache.put(request, fresh.clone());
        }
      } catch {}
    }
    return fresh;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error("offline");
  }
}

sw.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin !== sw.location.origin) return;

  // Auth/session endpoints carry per-user data — never cache them.
  if (url.pathname.includes(`${base}/api/auth`)) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigate(request).catch(() => Response.error()));
    return;
  }

  if (url.pathname.startsWith(`${base}/_app/`)) {
    event.respondWith(cacheFirst(request).catch(() => Response.error()));
    return;
  }

  if (url.pathname.startsWith(`${base}/api/`)) {
    event.respondWith(apiNetworkFirst(request).catch(() => Response.error()));
    return;
  }

  event.respondWith(networkFirst(request).catch(() => Response.error()));
});

sw.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") void sw.skipWaiting();
});