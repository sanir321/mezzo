// Native-only diagnostic ring, surfaced as a fixed overlay div so it can be
// read on-device via `uiautomator dump` + `adb pull`. No-ops on the web and on
// the server. Deliberately writes to the DOM as late as possible and never
// throws, so instrumentation can never break the app.
export function nativeLog(...parts: unknown[]): void {
	if (typeof window === "undefined") return;
	try {
		const cap = (window as any).Capacitor;
		if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return;
		const line = parts
			.map((p) => (typeof p === "string" ? p : safeJson(p)))
			.join(" ");
		const ring: string[] = (window as any).__mezzoDbg ?? ((window as any).__mezzoDbg = []);
		ring.push(`[${Date.now() % 100000}] ${line}`);
		if (ring.length > 60) ring.splice(0, ring.length - 60);
		let el = document.getElementById("mezzo-dbg") as HTMLDivElement | null;
		if (!el) {
			el = document.createElement("div");
			el.id = "mezzo-dbg";
			el.style.cssText =
				"position:fixed;top:0;left:0;right:0;max-height:46%;overflow:hidden;" +
				"z-index:2147483000;background:rgba(8,8,8,.94);color:#4f4;font-family:monospace;" +
				"font-size:9px;line-height:1.3;padding:4px 5px;pointer-events:none;" +
				"white-space:pre-wrap;word-break:break-all;border-bottom:1px solid #333;";
			(document.documentElement || document.body)?.appendChild(el);
		}
		el.textContent = ring.join("\n");
	} catch {
		/* never break the app */
	}
}

function safeJson(p: unknown): string {
	try {
		return JSON.stringify(p);
	} catch {
		return String(p);
	}
}