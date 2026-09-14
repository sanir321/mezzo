import { browser } from "$app/environment";
import { isNativeApp } from "./native";
import { nativeRoot } from "$lib/stores/native-back.svelte";
import { playerShowQueue, playerShowLyrics, playerShowVisualizer, playerPlaying } from "$lib/stores/player.svelte";
import { equalizerStore } from "$lib/stores/equalizer.svelte";
import { authModal } from "$lib/stores/auth-modal.svelte";

type NativeOverlay =
	| { key: "lyrics"; close: () => void }
	| { key: "visualizer"; close: () => void }
	| { key: "equalizer"; close: () => void }
	| { key: "queue"; close: () => void }
	| { key: "auth"; close: () => void };

let registered = false;

export function initNativeIntegration(opts?: {
	statusBar?: { enabled?: boolean; lightIcons?: boolean; backgroundColor?: string };
}) {
	if (!browser || !isNativeApp() || registered) return;
	registered = true;

	void setupStatusBar(opts?.statusBar);
	void setupBackButton();
	void setupDeepLinks();
}

async function setupStatusBar(opts?: { lightIcons?: boolean; backgroundColor?: string }) {
	try {
		const { StatusBar, Style } = await import("@capacitor/status-bar");
		await StatusBar.setOverlaysWebView({ overlay: true });
		await StatusBar.setStyle({ style: opts?.lightIcons === false ? Style.Light : Style.Dark });
		if (opts?.backgroundColor) {
			await StatusBar.setBackgroundColor({ color: opts.backgroundColor });
		}
	} catch {
		// status-bar integration unavailable; theme is already dark via styles.xml
	}
}

function currentOverlay(): NativeOverlay | null {
	if (playerShowLyrics.value) return { key: "lyrics", close: () => (playerShowLyrics.value = false) };
	if (playerShowVisualizer.value)
		return { key: "visualizer", close: () => (playerShowVisualizer.value = false) };
	if (equalizerStore.isOpen) return { key: "equalizer", close: () => equalizerStore.close() };
	if (playerShowQueue.value) return { key: "queue", close: () => (playerShowQueue.value = false) };
	if (authModal.isOpen) return { key: "auth", close: () => authModal.close() };
	return null;
}

async function setupBackButton() {
	try {
		const { App } = await import("@capacitor/app");
		App.addListener("backButton", async ({ canGoBack }) => {
			// 1. If any modal/overlay is open, close it first
			const overlay = currentOverlay();
			if (overlay) {
				overlay.close();
				return;
			}

			// 2. If user is on a subpage (e.g. /settings, /playlists/..., /artist/...), navigate back smoothly
			if (!nativeRoot.value) {
				if (canGoBack && typeof window !== "undefined" && window.history.length > 1) {
					window.history.back();
				} else {
					const { goto } = await import("$app/navigation");
					goto("/");
				}
				return;
			}

			// 3. Top-level screen (e.g. Home):
			// Minimize the app so background audio playback continues seamlessly without killing the process
			try {
				if (typeof (App as any).minimizeApp === "function") {
					await (App as any).minimizeApp();
					return;
				}
			} catch {}

			// Fallback: If not playing, exit; otherwise keep audio playing
			if (!playerPlaying.value) {
				await App.exitApp();
			}
		});
	} catch {
		// back integration unavailable; WebView default (history) applies
	}
}

async function setupDeepLinks() {
	try {
		const { App } = await import("@capacitor/app");
		const { Browser } = await import("@capacitor/browser");
		const { setAuthToken, setCachedUser } = await import("$lib/auth-client");
		const { goto } = await import("$app/navigation");

		async function handleUrl(rawUrl: string) {
			if (!rawUrl) return;
			if (rawUrl.startsWith("mezzo://") || rawUrl.startsWith("com.mezzo.music://")) {
				try {
					const parsed = new URL(rawUrl);
					if (parsed.host === "oauth-success" || parsed.pathname.includes("oauth-success")) {
						const token = parsed.searchParams.get("token");
						if (token) {
							setAuthToken(token);
						}
						const userParam = parsed.searchParams.get("user");
						if (userParam) {
							try {
								const userObj = JSON.parse(userParam);
								if (userObj?.id || userObj?.email) {
									setCachedUser(userObj);
								}
							} catch {}
						}
						try {
							await Browser.close();
						} catch {
							// Browser was already closed
						}
						await goto("/", { replaceState: true });
					}
				} catch {
					// Invalid URL format
				}
			}
		}

		App.addListener("appUrlOpen", (event) => {
			void handleUrl(event.url);
		});

		const launchUrl = await App.getLaunchUrl();
		if (launchUrl?.url) {
			void handleUrl(launchUrl.url);
		}
	} catch {
		// Deep links unavailable
	}
}