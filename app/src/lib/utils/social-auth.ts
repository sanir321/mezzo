import { signIn } from "$lib/auth-client";
import { isNativeApp } from "$lib/native";
import { API_BASE } from "$lib/config";

/**
 * Initiates social sign-in (Google / GitHub) seamlessly across Web and Native APK.
 * - On Web: performs standard browser OAuth redirection (100% untouched).
 * - On Android APK: opens a Chrome Custom Tab directly to the server's social-login
 *   endpoint. This eliminates all CORS preflight and cookie isolation issues,
 *   prompting Google's native account chooser with 0 manual typing.
 */
export async function startSocialAuth(provider: "google" | "github"): Promise<void> {
	if (isNativeApp()) {
		const { Browser } = await import("@capacitor/browser");
		const base = API_BASE || "https://mezzo-music.pages.dev";
		const startUrl = `${base}/api/social-login?provider=${provider}&native=1`;
		await Browser.open({
			url: startUrl,
			windowName: "_blank",
			toolbarColor: "#0f0f0f",
		});
	} else {
		const r = await signIn.social({
			provider,
		});
		if (r.error) {
			throw new Error(r.error.message ?? `${provider} sign in failed`);
		}
	}
}
