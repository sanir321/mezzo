/**
 * Utility for native mobile sharing with Web Share API and clipboard fallback
 */

export interface ShareResult {
	shared: boolean;
	method?: "native" | "clipboard";
	cancelled?: boolean;
}

export async function shareTrack(track: {
	id: string;
	title: string;
	artist?: string | null;
	album?: string | null;
}): Promise<ShareResult> {
	if (typeof window === "undefined") return { shared: false };

	const url = `${window.location.origin}/?track=${encodeURIComponent(track.id)}`;
	const title = track.title;
	const text = `Listen to "${track.title}" by ${track.artist || "Unknown Artist"} on Mezzo`;

	if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
		try {
			await navigator.share({
				title,
				text,
				url,
			});
			return { shared: true, method: "native" };
		} catch (err: any) {
			if (err.name === "AbortError") {
				return { shared: false, cancelled: true };
			}
			// Fallback to clipboard on error
		}
	}

	if (typeof navigator !== "undefined" && navigator.clipboard) {
		try {
			await navigator.clipboard.writeText(url);
			return { shared: true, method: "clipboard" };
		} catch {
			// Fallback manual prompt
		}
	}

	return { shared: false };
}
