/**
 * In-App Version & Auto-Update Service for Mezzo
 */
export const CURRENT_APP_VERSION = "1.0.3";
const GITHUB_REPO = "sanir321/mezzo";
const FALLBACK_APK_URL = "https://mezzo-music.pages.dev/Mezzo-1.0.apk";

export interface ReleaseInfo {
	version: string;
	name: string;
	notes: string;
	apkUrl: string;
	publishedAt: string;
	htmlUrl: string;
}

function parseSemver(v: string): number[] {
	const cleaned = v.replace(/^v/i, "").trim();
	return cleaned.split(".").map((n) => parseInt(n, 10) || 0);
}

function isNewerVersion(remoteVer: string, currentVer: string): boolean {
	const remote = parseSemver(remoteVer);
	const current = parseSemver(currentVer);

	for (let i = 0; i < Math.max(remote.length, current.length); i++) {
		const r = remote[i] || 0;
		const c = current[i] || 0;
		if (r > c) return true;
		if (r < c) return false;
	}
	return false;
}

class UpdateService {
	currentVersion = CURRENT_APP_VERSION;
	isChecking = $state(false);
	updateAvailable = $state(false);
	showModal = $state(false);
	latestRelease = $state<ReleaseInfo | null>(null);
	statusMessage = $state<string | null>(null);
	private _hasCheckedThisSession = false;

	async checkForUpdate(isManual = false): Promise<boolean> {
		if (this.isChecking) return this.updateAvailable;

		this.isChecking = true;
		this.statusMessage = null;

		try {
			const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
				headers: {
					Accept: "application/vnd.github.v3+json"
				}
			});

			if (!res.ok) {
				throw new Error(`GitHub API returned HTTP ${res.status}`);
			}

			const data = await res.json();
			const remoteTag = data.tag_name || "";
			const remoteVer = remoteTag.replace(/^v/i, "");

			// Find APK asset download URL if available
			let apkUrl = FALLBACK_APK_URL;
			if (Array.isArray(data.assets) && data.assets.length > 0) {
				const apkAsset = data.assets.find(
					(a: any) => typeof a.name === "string" && a.name.toLowerCase().endsWith(".apk")
				);
				if (apkAsset?.browser_download_url) {
					apkUrl = apkAsset.browser_download_url;
				}
			}

			const release: ReleaseInfo = {
				version: remoteVer,
				name: data.name || `Mezzo v${remoteVer}`,
				notes: data.body || "Performance improvements and bug fixes.",
				apkUrl: apkUrl,
				publishedAt: data.published_at || new Date().toISOString(),
				htmlUrl: data.html_url || `https://github.com/${GITHUB_REPO}/releases/latest`
			};

			this.latestRelease = release;

			if (isNewerVersion(remoteVer, CURRENT_APP_VERSION)) {
				this.updateAvailable = true;
				this.showModal = true;
				this.statusMessage = `New update v${remoteVer} is available!`;
				return true;
			} else {
				this.updateAvailable = false;
				if (isManual) {
					this.statusMessage = `You're on the latest version (v${CURRENT_APP_VERSION}).`;
				}
				return false;
			}
		} catch (err: any) {
			console.warn("[UpdateService] Could not check for updates:", err?.message || err);
			if (isManual) {
				this.statusMessage = `Unable to connect to update server. Check your connection.`;
			}
			return false;
		} finally {
			this.isChecking = false;
			this._hasCheckedThisSession = true;
		}
	}

	checkSilentlyOnLaunch() {
		if (this._hasCheckedThisSession || typeof window === "undefined") return;
		// Delay check slightly so it doesn't block initial page render
		setTimeout(() => {
			this.checkForUpdate(false);
		}, 3000);
	}

	dismissModal() {
		this.showModal = false;
	}

	openUpdateModal() {
		if (this.latestRelease) {
			this.showModal = true;
		} else {
			this.checkForUpdate(true).then((hasUpdate) => {
				if (hasUpdate) this.showModal = true;
			});
		}
	}
}

export const updateService = new UpdateService();
