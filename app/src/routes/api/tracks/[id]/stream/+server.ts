import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { resolveTidalTrackStream } from "$lib/server/tidal";
import { resolveSaavnTrackStream } from "$lib/server/music";

const HIFI_API_BASE_URL =
	(import.meta.env.VITE_HIFI_API_BASE_URL as string | undefined) ??
	(typeof globalThis !== "undefined" && typeof (globalThis as any).env?.HIFI_API_BASE_URL !== "undefined"
		? (globalThis as any).env.HIFI_API_BASE_URL
		: import.meta.env.DEV
			? "http://localhost:8787"
			: "https://mezzo-hifi-api.zenosayz05.workers.dev");

export const GET: RequestHandler = async ({ params, url, request, platform }) => {
	const trackId = params.id;
	if (!trackId) throw error(400, "Missing track ID");

	const wantsJson =
		url.searchParams.get("format") === "json" ||
		Boolean(request.headers.get("accept")?.includes("application/json"));

	let streamUrl: string | null = null;

	// 1. Check D1 cache first for ultra-fast response
	if (platform?.env?.DB) {
		try {
			const row = await platform.env.DB.prepare(
				"SELECT object_key FROM tracks WHERE id = ?1 LIMIT 1"
			)
				.bind(trackId)
				.first<{ object_key: string }>();

			if (row?.object_key && row.object_key.startsWith("http")) {
				streamUrl = row.object_key;
			}
		} catch {}
	}

	// 2. Resolve Tidal or Saavn stream if not cached in DB
	if (!streamUrl) {
		if (trackId.startsWith("tidal_")) {
			streamUrl = await resolveTidalTrackStream(trackId);
		} else if (trackId.startsWith("saavn_")) {
			streamUrl = await resolveSaavnTrackStream(trackId);
		}
	}

	// 3. Multi-tier fallback to dedicated mezzo-hifi-api worker
	if (!streamUrl) {
		try {
			const query = trackId.replace(/^tidal_/, "").replace(/^saavn_/, "");
			const workerUrl = new URL(`${HIFI_API_BASE_URL}/stream`);
			workerUrl.searchParams.set("id", trackId);
			workerUrl.searchParams.set("query", query);
			workerUrl.searchParams.set("format", "json");

			const workerRes = await fetch(workerUrl.toString());
			if (workerRes.ok) {
				const data = (await workerRes.json()) as any;
				if (data && data.url) {
					streamUrl = data.url;
				}
			}
		} catch (e) {
			console.warn("Worker stream fallback error:", e);
		}
	}

	if (!streamUrl) {
		throw error(404, "Stream not found");
	}

	// 4. Cache direct stream URL into D1 if available for instant future queries
	if (platform?.env?.DB && streamUrl.startsWith("http")) {
		platform.env.DB.prepare(
			"UPDATE tracks SET object_key = ?1 WHERE id = ?2 AND (object_key IS NULL OR object_key NOT LIKE 'http%')"
		)
			.bind(streamUrl, trackId)
			.run()
			.catch(() => {});
	}

	// 5. If JSON requested, return direct stream URL immediately so client connects directly to CDN
	if (wantsJson) {
		return json({
			url: streamUrl,
			format: "AAC 320kbps",
			id: trackId,
		}, {
			headers: {
				"Cache-Control": "public, max-age=3600",
				"Access-Control-Allow-Origin": "*",
			},
		});
	}

	// 6. If byte-range request from media element, proxy upstream directly with 206 Partial Content
	// This prevents the browser from getting stuck in 302 redirect loops on every chunk
	const range = request.headers.get("range");
	if (range) {
		try {
			const upstream = await fetch(streamUrl, {
				headers: {
					range,
					"User-Agent": request.headers.get("user-agent") || "Mezzo/1.0",
				},
			});

			const resHeaders = new Headers();
			resHeaders.set("Content-Type", upstream.headers.get("Content-Type") || "audio/mp4");
			resHeaders.set("Accept-Ranges", "bytes");
			resHeaders.set("Access-Control-Allow-Origin", "*");
			resHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
			resHeaders.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");
			resHeaders.set("Cache-Control", "public, max-age=3600");

			const contentRange = upstream.headers.get("Content-Range");
			if (contentRange) resHeaders.set("Content-Range", contentRange);

			const contentLength = upstream.headers.get("Content-Length");
			if (contentLength) resHeaders.set("Content-Length", contentLength);

			return new Response(upstream.body, {
				status: upstream.status,
				headers: resHeaders,
			});
		} catch (e) {
			console.warn("Range proxy failed, falling back to 302 redirect:", e);
		}
	}

	// 7. Fallback standard 302 redirect with CORS headers
	return new Response(null, {
		status: 302,
		headers: {
			Location: streamUrl,
			"Cache-Control": "public, max-age=3600",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
			"Access-Control-Allow-Headers": "*",
			"Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
		},
	});
};

