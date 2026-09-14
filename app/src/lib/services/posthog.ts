import posthog from "posthog-js";

// Default PostHog configuration for Mezzo
const POSTHOG_KEY =
	(typeof process !== "undefined" && process.env?.PUBLIC_POSTHOG_KEY) ||
	(typeof import.meta !== "undefined" && import.meta.env?.PUBLIC_POSTHOG_KEY) ||
	"phc_BHxo2tydzMWQcyMjNLZzuMXBHdn4kb8Hd4THV7pVNqG9";

const POSTHOG_HOST =
	(typeof process !== "undefined" && process.env?.PUBLIC_POSTHOG_HOST) ||
	(typeof import.meta !== "undefined" && import.meta.env?.PUBLIC_POSTHOG_HOST) ||
	"https://us.i.posthog.com";

let isInitialized = false;

/**
 * Initializes PostHog for analytics, session replay, and error tracking.
 */
export function initPostHog(customKey?: string, customHost?: string) {
	if (typeof window === "undefined" || isInitialized) return;

	const key = customKey || POSTHOG_KEY || (typeof localStorage !== "undefined" ? localStorage.getItem("mezzo_posthog_key") : null);
	const host = customHost || POSTHOG_HOST;

	if (!key) {
		// Log ready state without crashing if key is not yet configured
		return;
	}

	try {
		posthog.init(key, {
			api_host: host,
			person_profiles: "identified_only",
			capture_pageview: false, // Handled dynamically in SvelteKit router
			capture_pageleave: true,
			autocapture: true,
			disable_session_recording: false,
			session_recording: {
				maskAllInputs: false,
				maskInputOptions: {
					password: true
				}
			},
			loaded: (ph) => {
				isInitialized = true;
				if (import.meta.env?.DEV) {
					// ph.debug();
				}
			}
		});
		isInitialized = true;
	} catch (e) {
		console.warn("[PostHog] Initialization error:", e);
	}
}

/**
 * Captures custom events (e.g. track played, playlist created, search executed).
 */
export function captureEvent(eventName: string, properties?: Record<string, any>) {
	if (typeof window === "undefined" || !isInitialized) return;
	try {
		posthog.capture(eventName, properties);
	} catch (e) {
		console.warn("[PostHog] Capture error:", e);
	}
}

/**
 * Tracks page views on route transitions in SvelteKit.
 */
export function capturePageView(pathname: string) {
	if (typeof window === "undefined" || !isInitialized) return;
	try {
		posthog.capture("$pageview", {
			$current_url: window.location.href,
			pathname
		});
	} catch (e) {
		console.warn("[PostHog] Pageview error:", e);
	}
}

/**
 * Identifies logged-in user in PostHog.
 */
export function identifyUser(userId: string, userProperties?: Record<string, any>) {
	if (typeof window === "undefined" || !isInitialized) return;
	try {
		posthog.identify(userId, userProperties);
	} catch (e) {
		console.warn("[PostHog] Identify error:", e);
	}
}

/**
 * Resets user session on logout.
 */
export function resetUser() {
	if (typeof window === "undefined" || !isInitialized) return;
	try {
		posthog.reset();
	} catch (e) {
		console.warn("[PostHog] Reset error:", e);
	}
}

export { posthog };
