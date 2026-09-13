import { signIn } from "$lib/auth-client";
import { isNativeApp } from "$lib/native";

/**
 * Initiates social sign-in (Google / GitHub) seamlessly across Web and Native APK.
 * - On Web: performs standard browser OAuth redirection (100% untouched).
 * - On Android APK: opens a Chrome Custom Tab so the device's logged-in Google
 *   accounts appear automatically in the account chooser with 0 manual typing.
 */
export async function startSocialAuth(provider: "google" | "github"): Promise<void> {
	if (isNativeApp()) {
		const { Browser } = await import("@capacitor/browser");
		const r = await signIn.social({
			provider,
			callbackURL: "https://mezzo-music.pages.dev/oauth/google-callback?native=1",
			disableRedirect: true,
		});
		if (r.error) {
			throw new Error(r.error.message ?? `${provider} sign in failed`);
		}
		if (r.data?.url) {
			await Browser.open({
				url: r.data.url,
				windowName: "_blank",
				toolbarColor: "#0f0f0f",
			});
		} else {
			throw new Error(`Unable to obtain ${provider} authentication URL`);
		}
	} else {
		const r = await signIn.social({
			provider,
		});
		if (r.error) {
			throw new Error(r.error.message ?? `${provider} sign in failed`);
		}
	}
}
