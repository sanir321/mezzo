import { authClient } from "$lib/auth-client";

let sharedSession: ReturnType<typeof authClient.useSession> | null = null;

/**
 * Shared session subscription. `authClient.useSession()` creates a fresh
 * nanostore atom (and a fresh /api/auth/get-session request) on every call,
 * so 17 components calling it = 17 network round-trips on every load.
 *
 * By caching the atom here, every component subscribes to the SAME store and
 * exactly one session fetch happens per page load.
 */
export function useSharedSession() {
	if (typeof window === "undefined") {
		return {
			subscribe: () => () => {},
			get: () => null,
		} as unknown as ReturnType<typeof authClient.useSession>;
	}
	if (!sharedSession) {
		sharedSession = authClient.useSession();
	}
	return sharedSession;
}