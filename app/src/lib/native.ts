export function isNativeApp(): boolean {
	if (typeof window === "undefined") return false;
	const cap = (window as Window & { Capacitor?: { getPlatform?: () => string; isNativePlatform?: () => boolean } }).Capacitor;
	if (!cap) return false;
	return cap.getPlatform?.() !== "web" || cap.isNativePlatform?.() === true;
}

export const isNative = () => isNativeApp();