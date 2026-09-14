<script module lang="ts">
	import { authModal } from "$lib/stores/auth-modal.svelte";
	import { apiUrl, isServerStreamSrc } from "$lib/config";

	export interface Track {
		id: string;
		title: string;
		artist: string | null;
		album: string | null;
		genre: string | null;
		year: number | null;
		track_number: number | null;
		duration: number | null;
		format: string;
		size: number;
		date_added: number;
		play_count: number;
		stream_url?: string;
		cover_url?: string;
		isrc?: string;
		audioQuality?: string;
	}

	export interface Playlist {
		id: string;
		name: string;
		description?: string | null;
		cover_key?: string | null;
		cover_url?: string | null;
		trackCount?: number;
		createdAt?: number;
		updatedAt?: number;
	}

export function streamUrl(idOrTrack: string | Track): string {
	if (typeof idOrTrack !== "string") {
		if (idOrTrack.stream_url) return idOrTrack.stream_url;
		if ((idOrTrack as any).object_key?.startsWith("http")) return (idOrTrack as any).object_key;
		if (idOrTrack.id?.startsWith("tidal_") || idOrTrack.id?.startsWith("saavn_")) {
			return apiUrl(`/api/tracks/${idOrTrack.id}/stream`);
		}
		return "";
	}
	if (idOrTrack.startsWith("http://") || idOrTrack.startsWith("https://")) {
		return idOrTrack;
	}
	if (idOrTrack.startsWith("/")) {
		return apiUrl(idOrTrack);
	}
	if (idOrTrack.startsWith("tidal_") || idOrTrack.startsWith("saavn_")) {
		return apiUrl(`/api/tracks/${idOrTrack}/stream`);
	}
	return "";
}

	export function coverUrl(idOrTrack: string | Track): string {
		if (typeof idOrTrack !== "string") {
			if ((idOrTrack as any).offline_cover) return (idOrTrack as any).offline_cover;
			if (idOrTrack.cover_url && (idOrTrack.cover_url.startsWith("data:") || idOrTrack.cover_url.startsWith("blob:"))) {
				return idOrTrack.cover_url;
			}
			if (typeof window !== "undefined" && idOrTrack.id) {
				try {
					const offlineRaw = localStorage.getItem("mezzo_offline_tracks_meta");
					if (offlineRaw) {
						const offlineList = JSON.parse(offlineRaw);
						const match = Array.isArray(offlineList) ? offlineList.find((t: any) => t.id === idOrTrack.id) : null;
						if (match && (match.offline_cover || match.cover_url?.startsWith("data:"))) {
							return match.offline_cover || match.cover_url;
						}
					}
				} catch {}
			}
			if (idOrTrack.cover_url) return idOrTrack.cover_url;
			if ((idOrTrack as any).cover_key?.startsWith("http")) return (idOrTrack as any).cover_key;
			return apiUrl(`/api/tracks/${idOrTrack.id}/cover`);
		}
		if (idOrTrack.startsWith("data:") || idOrTrack.startsWith("blob:") || idOrTrack.startsWith("http://") || idOrTrack.startsWith("https://")) {
			return idOrTrack;
		}
		if (idOrTrack.startsWith("/")) {
			return apiUrl(idOrTrack);
		}
		if (typeof window !== "undefined") {
			try {
				const offlineRaw = localStorage.getItem("mezzo_offline_tracks_meta");
				if (offlineRaw) {
					const offlineList = JSON.parse(offlineRaw);
					const match = Array.isArray(offlineList) ? offlineList.find((t: any) => t.id === idOrTrack) : null;
					if (match && (match.offline_cover || match.cover_url?.startsWith("data:"))) {
						return match.offline_cover || match.cover_url;
					}
				}
			} catch {}
		}
		return apiUrl(`/api/tracks/${idOrTrack}/cover`);
	}

	export function formatDuration(sec: number | null | undefined): string {
		if (!sec || !isFinite(sec) || sec < 0) return "0:00";
		const s = Math.floor(sec);
		const m = Math.floor(s / 60);
		const r = s % 60;
		return `${m}:${r.toString().padStart(2, "0")}`;
	}

	export function formatBytes(bytes: number): string {
		if (!bytes || bytes <= 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
	}

	export type RepeatMode = "off" | "all" | "one";

	const STORAGE_KEY_QUEUE = "mezzo_player_queue";
	const STORAGE_KEY_POSITION = "mezzo_player_position";
	const STORAGE_KEY_TIME = "mezzo_player_current_time";
	const STORAGE_KEY_SHUFFLE = "mezzo_player_shuffle";
	const STORAGE_KEY_REPEAT = "mezzo_player_repeat";
	const STORAGE_KEY_RECENT = "mezzo_recently_played";
	const STORAGE_KEY_CROSSFADE = "mezzo_crossfade";
	const STORAGE_KEY_AUTORADIO = "mezzo_auto_radio";

	let initialQueue: Track[] = [];
	let initialRecent: Track[] = [];
	let initialPosition = -1;
	let initialTime = 0;
	let initialDuration = 0;
	let initialSrc = "";
	let initialVolume = 1.0;
	let initialShuffle = false;
	let initialRepeat: RepeatMode = "off";
	let initialCrossfade = 3;
	let initialAutoRadio = true;

	// Restore state from localStorage if available
	if (typeof window !== "undefined") {
		const savedCrossfade = localStorage.getItem(STORAGE_KEY_CROSSFADE);
		if (savedCrossfade !== null) {
			const cf = parseInt(savedCrossfade, 10);
			if (!isNaN(cf) && cf >= 0 && cf <= 12) initialCrossfade = cf;
		}
		const savedVol = localStorage.getItem("mezzo_volume");
		if (savedVol !== null) {
			const v = parseFloat(savedVol);
			if (!isNaN(v) && v >= 0.2 && v <= 1) initialVolume = v;
			else initialVolume = 1.0;
		}
		const savedAutoRadio = localStorage.getItem(STORAGE_KEY_AUTORADIO);
		if (savedAutoRadio !== null) {
			initialAutoRadio = savedAutoRadio === "true";
		}

		try {
			const savedRecent = localStorage.getItem(STORAGE_KEY_RECENT);
			if (savedRecent) {
				const parsedR = JSON.parse(savedRecent);
				if (Array.isArray(parsedR)) initialRecent = parsedR;
			}
		} catch {}

		try {
			const savedQueue = localStorage.getItem(STORAGE_KEY_QUEUE);
			const savedPos = localStorage.getItem(STORAGE_KEY_POSITION);
			const savedTime = localStorage.getItem(STORAGE_KEY_TIME);
			const savedShuffle = localStorage.getItem(STORAGE_KEY_SHUFFLE);
			const savedRepeat = localStorage.getItem(STORAGE_KEY_REPEAT);

			if (savedQueue) {
				const parsedQ = JSON.parse(savedQueue);
				if (Array.isArray(parsedQ) && parsedQ.length > 0) {
					// Never trust cached external stream URLs from a previous session:
					// CDN links (Tidal/JioSaavn) can expire, leaving playback spinning
					// forever on a dead URL. Always re-resolve on load.
					initialQueue = parsedQ.map((t: Track) => ({
						...t,
						stream_url: undefined,
					}));
					const p = savedPos ? parseInt(savedPos, 10) : 0;
					if (!isNaN(p) && p >= 0 && p < initialQueue.length) {
						initialPosition = p;
					} else {
						initialPosition = 0;
					}
					if (initialQueue[initialPosition]) {
						initialSrc = streamUrl(initialQueue[initialPosition]);
						initialDuration = initialQueue[initialPosition].duration || 0;
					}
				}
			}

			if (savedTime) {
				const t = parseFloat(savedTime);
				if (!isNaN(t) && t >= 0) {
					initialTime = t;
				}
			}

			if (savedShuffle !== null) {
				initialShuffle = JSON.parse(savedShuffle) === true;
			}

			if (savedRepeat === "off" || savedRepeat === "all" || savedRepeat === "one") {
				initialRepeat = savedRepeat as RepeatMode;
			}
		} catch {
			// ignore storage parse errors
		}
	}

	let queue: Track[] = $state(initialQueue);
	let recentlyPlayed: Track[] = $state(initialRecent);
	let position: number = $state(initialPosition);
	let currentTime: number = $state(initialTime);
	let duration: number = $state(initialDuration);
	let playing: boolean = $state(false);
	let src: string = $state(initialSrc);
	let volume: number = $state(initialVolume);
	let isMuted: boolean = $state(false);
	let shuffle: boolean = $state(initialShuffle);
	let repeat: RepeatMode = $state(initialRepeat);
	let showQueue: boolean = $state(false);
	let showLyrics: boolean = $state(false);
	let showVisualizer: boolean = $state(false);
	let showShortcuts: boolean = $state(false);
	let crossfade: number = $state(initialCrossfade);
	let autoRadio: boolean = $state(initialAutoRadio);

	function savePlayerState() {
		if (typeof window === "undefined") return;
		try {
			localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queue));
			localStorage.setItem(STORAGE_KEY_POSITION, String(position));
			localStorage.setItem(STORAGE_KEY_TIME, String(currentTime));
			localStorage.setItem(STORAGE_KEY_SHUFFLE, JSON.stringify(shuffle));
			localStorage.setItem(STORAGE_KEY_REPEAT, repeat);
		} catch {
			// ignore storage quota error
		}
	}

	export function savePlayerTime(t: number) {
		currentTime = t;
		if (typeof window === "undefined") return;
		try {
			localStorage.setItem(STORAGE_KEY_TIME, String(t));
		} catch {
			// ignore
		}
	}

	export const playerQueue = {
		get value() {
			return queue;
		},
	};

	export const playerPosition = {
		get value() {
			return position;
		},
	};

	export const playerCurrentTime = {
		get value() {
			return currentTime;
		},
		set value(nv: number) {
			currentTime = nv;
		},
	};

	export const playerDuration = {
		get value() {
			return duration;
		},
		set value(nv: number) {
			duration = nv;
		},
	};

	export const playerPlaying = {
		get value() {
			return playing;
		},
		set value(nv: boolean) {
			playing = nv;
		},
	};

	export const playerSrc = {
		get value() {
			return src;
		},
		set value(nv: string) {
			src = nv;
		},
	};

	export const playerVolume = {
		get value() {
			return volume;
		},
		set value(nv: number) {
			volume = Math.max(0, Math.min(1, nv));
			if (typeof window !== "undefined") {
				localStorage.setItem("mezzo_volume", String(volume));
			}
		},
	};

	export const playerMuted = {
		get value() {
			return isMuted;
		},
		set value(nv: boolean) {
			isMuted = nv;
		},
	};

	export const playerShuffle = {
		get value() {
			return shuffle;
		},
		set value(nv: boolean) {
			shuffle = nv;
			savePlayerState();
		},
	};

	export const playerRepeat = {
		get value() {
			return repeat;
		},
		set value(nv: RepeatMode) {
			repeat = nv;
			savePlayerState();
		},
	};

	export const playerShowQueue = {
		get value() {
			return showQueue;
		},
		set value(nv: boolean) {
			showQueue = nv;
		},
	};

	export const playerShowLyrics = {
		get value() {
			return showLyrics;
		},
		set value(nv: boolean) {
			showLyrics = nv;
		},
	};

	export const playerShowVisualizer = {
		get value() {
			return showVisualizer;
		},
		set value(nv: boolean) {
			showVisualizer = nv;
		},
	};

	export const playerShowShortcuts = {
		get value() {
			return showShortcuts;
		},
		set value(nv: boolean) {
			showShortcuts = nv;
		},
	};

	export const playerCrossfade = {
		get value() {
			return crossfade;
		},
		set value(nv: number) {
			crossfade = Math.max(0, Math.min(12, nv));
			if (typeof window !== "undefined") {
				try {
					localStorage.setItem(STORAGE_KEY_CROSSFADE, String(crossfade));
				} catch {}
			}
		},
	};

	export const playerAutoRadio = {
		get value() {
			return autoRadio;
		},
		set value(nv: boolean) {
			autoRadio = nv;
			if (typeof window !== "undefined") {
				try {
					localStorage.setItem(STORAGE_KEY_AUTORADIO, String(autoRadio));
				} catch {}
			}
		},
	};

	export function toggleAutoRadio() {
		playerAutoRadio.value = !playerAutoRadio.value;
	}

	export const playerCurrentTrack: { value: Track | null } = {
		get value() {
			return position >= 0 && position < queue.length ? queue[position] : null;
		},
	};

	export const playerHasNext: { value: boolean } = {
		get value() {
			if (repeat === "all" || repeat === "one" || autoRadio) return queue.length > 0;
			return queue.length > 0 && position < queue.length - 1;
		},
	};

	export const playerHasPrevious: { value: boolean } = {
		get value() {
			if (repeat === "all" || repeat === "one") return queue.length > 0;
			return queue.length > 0;
		},
	};

	let isUserAuthenticated = $state(false);

	export function setPlayerAuth(authenticated: boolean) {
		isUserAuthenticated = authenticated;
	}

	export function getPlayerAuth(): boolean {
		return isUserAuthenticated;
	}

	export function recordRecentlyPlayed(track: Track) {
		if (!track || !track.id) return;
		const filtered = recentlyPlayed.filter((t) => t.id !== track.id);
		recentlyPlayed = [track, ...filtered].slice(0, 24);
		if (typeof window !== "undefined") {
			try {
				localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(recentlyPlayed));
			} catch {}
		}
	}

	export const playerRecentlyPlayed = {
		get value() {
			return recentlyPlayed;
		},
	};

	function preloadNextTrack(nextIndex: number) {
		if (nextIndex >= 0 && nextIndex < queue.length && typeof window !== "undefined") {
			const nextTrack = queue[nextIndex];
			if (nextTrack && (!nextTrack.stream_url || isServerStreamSrc(nextTrack.stream_url, nextTrack.id))) {
				fetch(apiUrl(`/api/tracks/${encodeURIComponent(nextTrack.id)}/stream?format=json`))
					.then((r) => r.json())
					.then((data: any) => {
						if (data?.url) {
							nextTrack.stream_url = data.url;
							savePlayerState();
						}
					})
					.catch(() => {});
			}
		}
	}

	function gotoIndex(i: number) {
		if (i < 0 || i >= queue.length) return;
		if (!isUserAuthenticated) {
			authModal.open("login");
			return;
		}
		position = i;
		currentTime = 0;
		duration = queue[position].duration || 0;
		const targetTrack = queue[position];
		const initialStream = targetTrack.stream_url || streamUrl(targetTrack);
		src = initialStream;
		playerSrc.value = initialStream;
		playerCurrentTime.value = 0;
		playerDuration.value = queue[position].duration || 0;
		playerPlaying.value = true;
		recordRecentlyPlayed(queue[position]);
		savePlayerState();

		// Preload next track in queue so subsequent songs start with zero delay
		preloadNextTrack(i + 1);
	}

	export function playTracks(tracks: Track[], startIndex = 0) {
		if (tracks.length === 0) return;
		if (!isUserAuthenticated) {
			authModal.open("login");
			return;
		}
		queue = [...tracks];
		gotoIndex(Math.max(0, Math.min(startIndex, tracks.length - 1)));
		savePlayerState();
	}

	export function playTrack(track: Track) {
		if (!isUserAuthenticated) {
			authModal.open("login");
			return;
		}
		const existingIdx = queue.findIndex((t) => t.id === track.id);
		if (existingIdx !== -1) {
			gotoIndex(existingIdx);
		} else {
			queue = [...queue, track];
			gotoIndex(queue.length - 1);
		}
		savePlayerState();
	}

	export function addToQueue(track: Track) {
		const exists = queue.some((t) => t.id === track.id);
		if (!exists) {
			queue = [...queue, track];
		}
		if (position === -1 && queue.length > 0) {
			gotoIndex(0);
		}
		savePlayerState();
	}

	export function playNext(track: Track) {
		if (position === -1) {
			playTrack(track);
			return;
		}
		const newQueue = [...queue];
		const currentId = newQueue[position]?.id;
		const filtered = newQueue.filter((t, idx) => idx === position || t.id !== track.id);
		const newPos = filtered.findIndex((t) => t.id === currentId);
		filtered.splice(newPos + 1, 0, track);
		queue = filtered;
		position = newPos;
		savePlayerState();
	}

	export function removeFromQueue(index: number) {
		if (index < 0 || index >= queue.length) return;
		if (index === position) {
			if (queue.length === 1) {
				clear();
				return;
			}
			if (position < queue.length - 1) {
				const nextPos = position;
				queue = queue.filter((_, i) => i !== index);
				gotoIndex(nextPos);
			} else {
				queue = queue.filter((_, i) => i !== index);
				gotoIndex(queue.length - 1);
			}
		} else {
			const currentId = queue[position]?.id;
			queue = queue.filter((_, i) => i !== index);
			position = queue.findIndex((t) => t.id === currentId);
		}
		savePlayerState();
	}

	export function reorderQueue(fromIndex: number, toIndex: number) {
		if (fromIndex < 0 || fromIndex >= queue.length || toIndex < 0 || toIndex >= queue.length) return;
		const currentId = queue[position]?.id;
		const item = queue.splice(fromIndex, 1)[0];
		queue.splice(toIndex, 0, item);
		position = queue.findIndex((t) => t.id === currentId);
		savePlayerState();
	}

	export function moveQueueItemUp(index: number) {
		if (index <= 0 || index >= queue.length) return;
		reorderQueue(index, index - 1);
	}

	export function moveQueueItemDown(index: number) {
		if (index < 0 || index >= queue.length - 1) return;
		reorderQueue(index, index + 1);
	}

	export function clearUpcomingQueue() {
		if (queue.length === 0) return;
		if (position >= 0 && position < queue.length) {
			queue = [queue[position]];
			position = 0;
		} else {
			queue = [];
			position = -1;
		}
		savePlayerState();
	}

	export function clearRecentlyPlayed() {
		recentlyPlayed = [];
		if (typeof window !== "undefined") {
			try {
				localStorage.removeItem(STORAGE_KEY_RECENT);
			} catch {}
		}
	}

	let isRadioFetching = false;
	export async function triggerAutoPlayRadio(): Promise<boolean> {
		if (!autoRadio || isRadioFetching) return false;
		const currentTrack = position >= 0 && position < queue.length ? queue[position] : null;
		if (!currentTrack) return false;

		isRadioFetching = true;
		try {
			const existingIds = new Set(queue.map((t) => t.id));
			const artist = currentTrack.artist || "";
			const queryList = [
				artist ? `${artist} radio` : "",
				artist ? `${artist} hits` : "",
				currentTrack.genre ? `${currentTrack.genre} hits` : "",
				"Popular Trending Hits"
			].filter(Boolean);

			let foundTracks: Track[] = [];
			for (const q of queryList) {
				const res = await fetch(apiUrl(`/api/online/search?q=${encodeURIComponent(q)}&limit=12`)).catch(() => null);
				if (res && res.ok) {
					const data = await res.json().catch(() => null);
					if (Array.isArray(data?.tracks)) {
						const fresh = data.tracks.filter((t: Track) => !existingIds.has(t.id));
						if (fresh.length > 0) {
							foundTracks = fresh;
							break;
						}
					}
				}
			}

			if (foundTracks.length > 0) {
				const toAdd = foundTracks.slice(0, 6);
				queue = [...queue, ...toAdd];
				savePlayerState();
				if (position < queue.length - 1) {
					gotoIndex(position + 1);
					return true;
				}
			}
		} catch (e) {
			console.warn("Auto radio fetch error:", e);
		} finally {
			isRadioFetching = false;
		}
		return false;
	}

	export function togglePlay() {
		if (queue.length === 0 || position < 0) return;
		if (!isUserAuthenticated) {
			authModal.open("login");
			return;
		}
		playing = !playing;
		playerPlaying.value = playing;
		if (!src && queue[position]) {
			src = streamUrl(queue[position]);
			playerSrc.value = src;
		}
	}

	export function next() {
		if (queue.length === 0) return;
		if (repeat === "one") {
			gotoIndex(position);
			return;
		}
		if (shuffle && queue.length > 1) {
			let rand = Math.floor(Math.random() * queue.length);
			if (rand === position) rand = (position + 1) % queue.length;
			gotoIndex(rand);
			return;
		}
		if (position < queue.length - 1) {
			gotoIndex(position + 1);
		} else if (repeat === "all") {
			gotoIndex(0);
		} else if (autoRadio) {
			triggerAutoPlayRadio();
		}
	}

	export function previous() {
		if (queue.length === 0) return;
		if (currentTime > 3) {
			seek(0);
			return;
		}
		if (position > 0) {
			gotoIndex(position - 1);
		} else if (repeat === "all") {
			gotoIndex(queue.length - 1);
		} else {
			seek(0);
		}
	}

	export function toggleShuffle() {
		shuffle = !shuffle;
		playerShuffle.value = shuffle;
		savePlayerState();
	}

	export function toggleRepeat() {
		if (repeat === "off") repeat = "all";
		else if (repeat === "all") repeat = "one";
		else repeat = "off";
		playerRepeat.value = repeat;
		savePlayerState();
	}

	export function toggleMute() {
		isMuted = !isMuted;
		playerMuted.value = isMuted;
	}

	export function clear() {
		queue = [];
		position = -1;
		currentTime = 0;
		duration = 0;
		playing = false;
		src = "";
		playerCurrentTime.value = 0;
		playerDuration.value = 0;
		playerPlaying.value = false;
		playerSrc.value = "";
		savePlayerState();
	}

	let seekHandler: ((time: number) => void) | null = null;

	export function registerAudioSeekHandler(fn: (time: number) => void) {
		seekHandler = fn;
		return () => {
			if (seekHandler === fn) {
				seekHandler = null;
			}
		};
	}

	export function seek(t: number) {
		currentTime = t;
		playerCurrentTime.value = t;
		savePlayerTime(t);
		if (seekHandler) {
			try {
				seekHandler(t);
			} catch {}
		}
	}
</script>
