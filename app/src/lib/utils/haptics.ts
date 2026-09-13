export type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning";

export function isHapticsEnabled(): boolean {
	if (typeof localStorage === "undefined") return true;
	return localStorage.getItem("mezzo_haptics_pref") !== "false";
}

export function setHapticsEnabled(enabled: boolean) {
	if (typeof localStorage !== "undefined") {
		localStorage.setItem("mezzo_haptics_pref", String(enabled));
	}
}

/**
 * Trigger subtle, native-feeling haptic feedback on mobile devices.
 * Safely handles unsupported devices, desktop browsers, or blocked vibration APIs.
 */
export function triggerHaptic(style: HapticStyle = "light") {
	if (typeof window === "undefined" || typeof navigator === "undefined" || !("vibrate" in navigator)) {
		return;
	}
	if (!isHapticsEnabled()) return;
	try {
		switch (style) {
			case "light":
				navigator.vibrate(10);
				break;
			case "medium":
				navigator.vibrate(22);
				break;
			case "heavy":
				navigator.vibrate(35);
				break;
			case "success":
				navigator.vibrate([12, 40, 15]);
				break;
			case "warning":
				navigator.vibrate([25, 50, 25]);
				break;
		}
	} catch {
		// Ignore vibrating permission errors or unsupported devices
	}
}
