// Unified High-Res & Lossless FLAC Stream Resolver for Mezzo
import type { Track } from "$lib/stores/player.svelte";

const API_BASE_URL = "https://mezzo-hifi-api.zenosayz05.workers.dev";
const API_TOKEN = "amp_29b2lIr4mze4tK-P8QDOxfMZ9anCgJ9_uGTUks3nIyo";
const TURNSTILE_SITE_KEY = "0x4AAAAAADgxqF6QVMm0GLHH";
const TURNSTILE_JWT_KEY = "mezzo_turnstile_jwt";
const TURNSTILE_EXPIRY_KEY = "mezzo_turnstile_expiry";

export interface FlacStreamResult {
	url: string;
	format: string;
	bitDepth?: number;
	sampleRate?: number;
	codec?: string;
	source?: string;
}

const resolvedFlacCache = new Map<string, FlacStreamResult>();
let turnstileLoadPromise: Promise<any> | null = null;
let turnstileJwtPromise: Promise<string | null> | null = null;

/**
 * Loads Cloudflare Turnstile explicit script in browser
 */
export async function loadTurnstileScript(): Promise<any> {
	if (typeof window === "undefined" || typeof document === "undefined") {
		return null;
	}
	if ((window as any).turnstile) return (window as any).turnstile;
	if (turnstileLoadPromise) return turnstileLoadPromise;

	turnstileLoadPromise = new Promise((resolve, reject) => {
		const existing = document.querySelector("script[data-mezzo-turnstile]");
		if (existing) {
			existing.addEventListener("load", () => resolve((window as any).turnstile), { once: true });
			existing.addEventListener("error", () => reject(new Error("Failed to load Turnstile")), { once: true });
			return;
		}

		const script = document.createElement("script");
		script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
		script.async = true;
		script.defer = true;
		script.dataset.mezzoTurnstile = "true";
		script.onload = () => resolve((window as any).turnstile);
		script.onerror = () => reject(new Error("Failed to load Turnstile"));
		document.head.appendChild(script);
	}).finally(() => {
		turnstileLoadPromise = null;
	});

	return turnstileLoadPromise;
}

/**
 * Returns container element for Turnstile widget
 */
function getTurnstileContainer(): HTMLElement | null {
	if (typeof document === "undefined") return null;
	let panel = document.getElementById("mezzo-turnstile-panel");
	if (!panel) {
		panel = document.createElement("div");
		panel.id = "mezzo-turnstile-panel";
		panel.style.position = "fixed";
		panel.style.right = "16px";
		panel.style.bottom = "84px";
		panel.style.zIndex = "99999";
		panel.style.padding = "10px 14px";
		panel.style.borderRadius = "8px";
		panel.style.background = "#181818";
		panel.style.border = "1px solid rgba(255,255,255,0.15)";
		panel.style.color = "#ffffff";
		panel.style.boxShadow = "0 12px 32px rgba(0,0,0,0.6)";
		panel.style.display = "none";
		panel.innerHTML = `
			<div style="font-size: 0.75rem; font-weight: 600; margin-bottom: 6px; color: #1ed760;">Lossless Audio Verification</div>
			<div id="mezzo-turnstile-widget"></div>
		`;
		document.body.appendChild(panel);
	}
	return panel.querySelector("#mezzo-turnstile-widget");
}

/**
 * Decodes JWT expiry unix timestamp
 */
function getJwtExpiry(token: string): number {
	try {
		const encoded = token.split(".")[1];
		const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
		const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
		return Number(JSON.parse(atob(padded)).exp || 0);
	} catch {
		return 0;
	}
}

/**
 * Gets currently cached Turnstile JWT if still valid
 */
export function getCachedTurnstileJwt(): string | null {
	if (typeof window === "undefined" || typeof localStorage === "undefined") return null;
	try {
		const jwt = localStorage.getItem(TURNSTILE_JWT_KEY);
		const expiry = Number(localStorage.getItem(TURNSTILE_EXPIRY_KEY) || 0);
		const nowSec = Math.floor(Date.now() / 1000);
		if (!jwt || expiry <= nowSec + 15) {
			localStorage.removeItem(TURNSTILE_JWT_KEY);
			localStorage.removeItem(TURNSTILE_EXPIRY_KEY);
			return null;
		}
		return jwt;
	} catch {
		return null;
	}
}

/**
 * Renders Turnstile widget and obtains a Cloudflare verification token
 */
async function executeTurnstile(): Promise<string> {
	const turnstile = await loadTurnstileScript();
	if (!turnstile) throw new Error("Turnstile unavailable");

	const container = getTurnstileContainer();
	const panel = document.getElementById("mezzo-turnstile-panel");
	if (!container) throw new Error("Turnstile container missing");
	container.innerHTML = "";

	return await new Promise<string>((resolve, reject) => {
		let widgetId: any = null;
		let settled = false;
		let timeoutId: any = null;

		const finish = (err: Error | null, token: string | null = null) => {
			if (settled) return;
			settled = true;
			clearTimeout(timeoutId);
			if (widgetId !== null && turnstile.remove) {
				try {
					turnstile.remove(widgetId);
				} catch {}
			}
			if (panel) panel.style.display = "none";
			if (err) reject(err);
			else resolve(token || "");
		};

		timeoutId = setTimeout(() => finish(new Error("Turnstile challenge timed out")), 20000);

		try {
			widgetId = turnstile.render(container, {
				sitekey: TURNSTILE_SITE_KEY,
				action: "auth",
				execution: "execute",
				appearance: "interaction-only",
				theme: "dark",
				"before-interactive-callback": () => {
					if (panel) panel.style.display = "block";
				},
				callback: (token: string) => finish(null, token),
				"error-callback": () => finish(new Error("Turnstile error")),
				"expired-callback": () => finish(new Error("Turnstile expired")),
			});
			turnstile.execute(widgetId);
		} catch (err) {
			finish(err instanceof Error ? err : new Error(String(err)));
		}
	});
}

/**
 * Exchanges Turnstile verification token for JWT session token
 */
export async function getTurnstileJwt(forceRefresh = false): Promise<string | null> {
	if (!forceRefresh) {
		const cached = getCachedTurnstileJwt();
		if (cached) return cached;
		if (turnstileJwtPromise) return turnstileJwtPromise;
	}

	turnstileJwtPromise = (async () => {
		try {
			const turnstileToken = await executeTurnstile();
			if (!turnstileToken) return null;

			const res = await fetch(`${API_BASE_URL}/api/auth/turnstile`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${API_TOKEN}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					turnstile_token: turnstileToken,
					cf_turnstile_response: turnstileToken,
				}),
			});

			if (!res.ok) {
				console.warn("Turnstile exchange returned status:", res.status);
				return null;
			}

			const data = (await res.json()) as any;
			const jwt = String(data.access_token || data.jwt || data.token || "").trim();
			if (!jwt) return null;

			const expiry = getJwtExpiry(jwt) || Math.floor(Date.now() / 1000) + 3600;
			try {
				localStorage.setItem(TURNSTILE_JWT_KEY, jwt);
				localStorage.setItem(TURNSTILE_EXPIRY_KEY, String(expiry));
			} catch {}

			return jwt;
		} catch (err) {
			console.warn("Error acquiring Turnstile JWT:", err);
			return null;
		}
	})().finally(() => {
		turnstileJwtPromise = null;
	});

	return turnstileJwtPromise;
}

/**
 * Registers the Service Worker responsible for on-the-fly AES-CTR FLAC stream decryption
 */
export function registerDecryptionServiceWorker(): void {
	if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
	navigator.serviceWorker
		.register("/sw.js", { scope: "/" })
		.then(async (reg) => {
			if (reg.waiting) {
				reg.waiting.postMessage({ type: "SKIP_WAITING" });
			}
			console.log("[Mezzo SW] Decrypter Service Worker registered successfully");
		})
		.catch((err) => {
			console.warn("[Mezzo SW] Decrypter Service Worker registration failed:", err);
		});
}

/**
 * Prewarms Turnstile & Service Worker in background on app load so lossless audio is available immediately
 */
export function prewarmTurnstile(): void {
	if (typeof window === "undefined") return;
	registerDecryptionServiceWorker();
	const cached = getCachedTurnstileJwt();
	if (!cached) {
		// Delay slightly so page initialization finishes smoothly
		setTimeout(() => {
			getTurnstileJwt().catch(() => {});
		}, 1000);
	}
}

/**
 * Resolves a high-resolution or CD-quality lossless FLAC stream URL for a track
 */
export async function resolveFlacStream(track: Track, timeoutMs = 2800): Promise<FlacStreamResult | null> {
	if (!track || !track.title) return null;

	// Check in-memory cache first
	const cacheKey = `${track.id || ""}_${track.title}_${track.artist || ""}`;
	const cached = resolvedFlacCache.get(cacheKey);
	if (cached) return cached;

	// Check if we have Turnstile JWT
	let jwt = getCachedTurnstileJwt();
	if (!jwt) {
		// Trigger background prewarm for upcoming tracks
		getTurnstileJwt().catch(() => {});
		return null;
	}

	const params = new URLSearchParams({
		track: track.title,
		quality: "HI_RES_LOSSLESS",
		intent: "stream",
	});

	if (track.artist) params.set("artist", track.artist);
	if (track.album) params.set("album", track.album);
	if (track.isrc) params.set("isrc", track.isrc);
	if (track.duration && track.duration > 0) {
		params.set("duration", String(Math.round(track.duration)));
	}

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const res = await fetch(`${API_BASE_URL}/api/v2/track/?${params.toString()}`, {
			headers: {
				Accept: "application/json",
				Authorization: `Bearer ${API_TOKEN}`,
				"X-Turnstile-JWT": jwt,
			},
			signal: controller.signal,
		});

		if (res.status === 401 || res.status === 428) {
			// JWT expired or rejected; clear cache and trigger refresh
			try {
				localStorage.removeItem(TURNSTILE_JWT_KEY);
				localStorage.removeItem(TURNSTILE_EXPIRY_KEY);
			} catch {}
			getTurnstileJwt(true).catch(() => {});
			return null;
		}

		if (!res.ok) return null;

		const data = (await res.json()) as any;
		if (!Array.isArray(data?.playback) || data.playback.length === 0) {
			return null;
		}

		// Find direct FLAC / audio stream
		const resource = data.playback.find(
			(r: any) =>
				r &&
				typeof r.url === "string" &&
				r.url &&
				(r.kind === "audio" || !r.kind) &&
				(r.delivery === "direct" || !r.delivery || r.source === "mono" || r.source === "monochrome")
		);

		if (!resource || !resource.url) return null;

		const rawUrl = resource.sourceUrl || resource.url;
		const decryptionKey =
			resource.decryption_key ||
			resource.decryptionKey ||
			resource.encryption?.key?.value ||
			resource.decryption?.key?.value ||
			resource.decryption?.key ||
			resource.drm?.decryption_key ||
			resource.drm?.decryptionKey ||
			null;

		let finalUrl = rawUrl;
		if (decryptionKey && typeof window !== "undefined") {
			if (navigator.serviceWorker?.controller) {
				const codec = (resource.codec || "flac").toLowerCase() === "opus" ? "opus" : "flac";
				finalUrl = `/api/decrypt-stream?url=${encodeURIComponent(rawUrl)}&key=${encodeURIComponent(decryptionKey)}&codec=${encodeURIComponent(codec)}`;
			} else {
				// Service worker not controlling yet; do not pass a URL that would 404
				return null;
			}
		}

		const bitDepth = Number(resource.bit_depth || resource.bitDepth) || 16;
		const sampleRate = Number(resource.sample_rate_hz || resource.sampleRateHz || resource.sample_rate) || 44100;
		const isHiRes = bitDepth >= 24 || sampleRate > 48000;

		const format = isHiRes
			? `Hi-Res FLAC ${bitDepth}-bit`
			: "Lossless FLAC 16-bit";

		const result: FlacStreamResult = {
			url: finalUrl,
			format,
			bitDepth,
			sampleRate,
			codec: resource.codec || "flac",
			source: resource.source || "lossless",
		};

		resolvedFlacCache.set(cacheKey, result);
		if (track.id) {
			resolvedFlacCache.set(track.id, result);
		}

		return result;
	} catch {
		return null;
	} finally {
		clearTimeout(timer);
	}
}
