// Tracks whether the SPA is currently on a top-level "home" screen. In the
// Capacitor app, pressing the hardware back button on a top-level screen
// should exit the app (like a real native app) instead of popping WebView
// history that never visually changes.
const ROOT_PATHS = new Set(["/", "/login", "/signup", "/search", "/playlists"]);

export const nativeRoot = $state({ value: false });

export function syncNativeRoot(pathname: string) {
  nativeRoot.value = ROOT_PATHS.has(pathname);
}