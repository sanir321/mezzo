import { isNativeApp } from "./native";
import { registerPlugin } from "@capacitor/core";

export interface MediaStatePayload {
	title: string;
	artist: string;
	album: string;
	artwork: string;
	isPlaying: boolean;
	duration: number;
	position: number;
}

export interface MediaSessionPluginInterface {
	updateState(options: MediaStatePayload): Promise<void>;
	stop(): Promise<void>;
	addListener(
		eventName: "mediaAction",
		listenerFunc: (info: { action: "play" | "pause" | "next" | "previous" | "seek"; position?: number }) => void
	): Promise<{ remove: () => Promise<void> }>;
}

const MediaSession = registerPlugin<MediaSessionPluginInterface>("MediaSession");

let isInitialized = false;

export function initNativeMediaListeners(callbacks: {
	onPlay: () => void;
	onPause: () => void;
	onNext: () => void;
	onPrevious: () => void;
	onSeek: (position: number) => void;
}) {
	if (typeof window === "undefined" || !isNativeApp() || isInitialized) return;
	isInitialized = true;

	try {
		MediaSession.addListener("mediaAction", (data) => {
			if (data.action === "play") {
				callbacks.onPlay();
			} else if (data.action === "pause") {
				callbacks.onPause();
			} else if (data.action === "next") {
				callbacks.onNext();
			} else if (data.action === "previous") {
				callbacks.onPrevious();
			} else if (data.action === "seek" && typeof data.position === "number") {
				callbacks.onSeek(data.position);
			}
		}).catch(() => {});
	} catch (e) {
		console.warn("Failed to attach native MediaSession listeners:", e);
	}
}

export async function syncNativeMediaSession(state: MediaStatePayload) {
	if (typeof window === "undefined" || !isNativeApp()) return;
	try {
		await MediaSession.updateState(state);
	} catch {
		// ignore
	}
}

export async function stopNativeMediaSession() {
	if (typeof window === "undefined" || !isNativeApp()) return;
	try {
		await MediaSession.stop();
	} catch {
		// ignore
	}
}
