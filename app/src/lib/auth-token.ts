const TOKEN_KEY = "mezzo_auth_token";

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
	} catch {}
}

export function clearAuthToken(): void {
	setAuthToken(null);
}