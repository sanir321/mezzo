import { browser } from "$app/environment";
import { isNativeApp } from "./native";
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
		App.addListener("backButton", ({ canGoBack }) => {
			const overlay = currentOverlay();
			if (overlay) {
				overlay.close();
				return;
			}
			if (canGoBack) {
				window.history.back();
				return;
			}
			void App.exitApp();
		});
	} catch {
		// back integration unavailable; WebView default (history) applies
	}
}