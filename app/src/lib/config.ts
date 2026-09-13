// Vite only inlines *prefixed* process-env vars into `import.meta.env`; the
// default prefix is `VITE_`. Prefer it, but keep `PUBLIC_API_BASE` as a
// fallback for local `.env` files / IDE-based tooling.
const RAW_API_BASE = (
	import.meta.env.VITE_PUBLIC_API_BASE ??
	import.meta.env.PUBLIC_API_BASE ??
	""
) as string | undefined;

export const API_BASE = (RAW_API_BASE ?? "").replace(/\/+$/, "");

export function apiUrl(path: string): string {
	if (!API_BASE) return path;
	const p = path.startsWith("/") ? path : `/${path}`;
	try {
		return new URL(p, `${API_BASE}/`).href;
	} catch {
		return `${API_BASE}${p}`;
	}
}

export function urlPathname(url: string): string {
	try {
		return new URL(url, typeof window !== "undefined" ? window.location.href : undefined).pathname;
	} catch {
		return url;
	}
}

export function isServerStreamSrc(url: string, trackId: string): boolean {
	const pathname = urlPathname(url);
	if (pathname.endsWith("/")) return isServerStreamSrc(pathname.slice(0, -1), trackId);
	if (pathname.includes("?") || pathname.includes("#")) {
		return isServerStreamSrc(url.split(/[?#]/)[0], trackId);
	}
	return pathname === `/api/tracks/${encodeURIComponent(trackId)}/stream`;
}