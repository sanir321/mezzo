const TOKEN_KEY = "mezzo_auth_token";
const USER_KEY = "mezzo_cached_user";

export function getAuthToken(): string | null {
	if (typeof window === "undefined") return null;
	try {
		return window.localStorage.getItem(TOKEN_KEY);
	} catch {
		return null;
	}
}

export function setAuthToken(token: string | null | undefined): void {
	if (typeof window === "undefined") return;
	try {
		if (token) {
			window.localStorage.setItem(TOKEN_KEY, token);
		} else {
			window.localStorage.removeItem(TOKEN_KEY);
		}
		window.dispatchEvent(new CustomEvent("mezzo:auth-changed", { detail: { token } }));
	} catch {}
}

export function getCachedUser(): any | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(USER_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

export function setCachedUser(user: any | null | undefined): void {
	if (typeof window === "undefined") return;
	try {
		if (user) {
			window.localStorage.setItem(USER_KEY, JSON.stringify(user));
		} else {
			window.localStorage.removeItem(USER_KEY);
		}
		window.dispatchEvent(new CustomEvent("mezzo:auth-changed", { detail: { user } }));
	} catch {}
}

export function clearAuthToken(): void {
	setAuthToken(null);
	setCachedUser(null);
	if (typeof window !== "undefined") {
		window.dispatchEvent(new CustomEvent("mezzo:auth-changed", { detail: { token: null, user: null } }));
	}
}