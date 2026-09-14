// Tracks whether the SPA is currently on a top-level "home" root screen.
const ROOT_PATHS = new Set(["/", "/login", "/signup", "/landing"]);

export const nativeRoot = $state({ value: false });

export function syncNativeRoot(pathname: string) {
  nativeRoot.value = ROOT_PATHS.has(pathname);
}