import { browser } from "$app/environment";
import { isNativeApp } from "./native";
import { nativeRoot } from "$lib/stores/native-back.svelte";
import { playerShowQueue, playerShowLyrics, playerShowVisualizer } from "$lib/stores/player.svelte";

type NativeOverlay =
	| { key: "queue"; close: () => void }
	| { key: "lyrics"; close: () => void }
	| { key: "visualizer"; close: () => void };

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
	if (playerShowQueue.value) return { key: "queue", close: () => (playerShowQueue.value = false) };
	if (playerShowLyrics.value) return { key: "lyrics", close: () => (playerShowLyrics.value = false) };
	if (playerShowVisualizer.value)
		return { key: "visualizer", close: () => (playerShowVisualizer.value = false) };
	return null;
}

async function setupBackButton() {
	try {
		const { App } = await import("@capacitor/app");
		App.addListener("backButton", async ({ canGoBack }) => {
			const overlay = currentOverlay();
			if (overlay) {
				overlay.close();
				return;
			}

			// Top-level screen: exit straight away, like a native app.
			if (nativeRoot.value) {
				await App.exitApp();
				return;
			}

			// Deeper page: pop SPA history. WebView history can be stale/looping,
			// so if the route does not actually change within a short window,
			// fall back to exiting instead of leaving the user stuck.
			if (canGoBack) {
				const before = window.location.pathname + window.location.search;
				window.history.back();
				window.setTimeout(() => {
					if (currentOverlay()) return;
					const now = window.location.pathname + window.location.search;
					if (now === before) void App.exitApp();
				}, 220);
				return;
			}

			await App.exitApp();
		});
	} catch {
		// back integration unavailable; WebView default (history) applies
	}
}

async function setupDeepLinks() {
	try {
		const { App } = await import("@capacitor/app");
		const { Browser } = await import("@capacitor/browser");
		const { setAuthToken } = await import("$lib/auth-client");
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