<script lang="ts">
	import { untrack } from "svelte";
	import {
		playerSrc,
		playerPlaying,
		playerCurrentTrack,
		playerCurrentTime,
		playerDuration,
		playerVolume,
		playerMuted,
		playerShuffle,
		playerRepeat,
		playerCrossfade,
		playerAutoRadio,
		triggerAutoPlayRadio,
		playerShowQueue,
		playerShowLyrics,
		playerShowShortcuts,
		playerQueue,
		playerHasNext,
		playerHasPrevious,
		togglePlay,
		next,
		previous,
		toggleShuffle,
		toggleRepeat,
		toggleMute,
		streamUrl,
		coverUrl,
		formatDuration,
		seek,
		registerAudioSeekHandler,
	} from "$lib/stores/player.svelte";
	import { likedStore } from "$lib/stores/liked.svelte";
	import { equalizerStore } from "$lib/stores/equalizer.svelte";
	import { offlineStore } from "$lib/services/offline.svelte";
	import { shareTrack } from "$lib/utils/share";
	import { apiUrl, isServerStreamSrc } from "$lib/config";
	import { DEFAULT_ALBUM_COVER, handleImageError } from "$lib/utils/image";
	import { triggerHaptic } from "$lib/utils/haptics";
	import QueueDrawer from "$lib/components/QueueDrawer.svelte";
	import ShortcutsModal from "$lib/components/ShortcutsModal.svelte";
	import AddToPlaylistModal from "$lib/components/AddToPlaylistModal.svelte";
	import { initNativeMediaListeners, syncNativeMediaSession, stopNativeMediaSession } from "$lib/native-media";

	let audioEl: HTMLAudioElement | null = $state(null);
	let seekInput = $state(playerCurrentTime.value || 0);
	let isSeeking = $state(false);
	let showPlaylistModal = $state(false);
	let shareToast = $state(false);
	let shareToastTimer: ReturnType<typeof setTimeout> | null = null;
	let lastLoadedTrackId = "";
	let hasRestoredInitialPosition = false;

	function onTogglePlay() {
		triggerHaptic("medium");
		togglePlay();
	}

	function onNext() {
		triggerHaptic("light");
		next();
	}

	function onPrevious() {
		triggerHaptic("light");
		previous();
	}

	function onToggleShuffle() {
		triggerHaptic("light");
		toggleShuffle();
	}

	function onToggleRepeat() {
		triggerHaptic("light");
		toggleRepeat();
	}

	function handleToggleLike(e: MouseEvent) {
		e.stopPropagation();
		if (playerCurrentTrack.value) {
			triggerHaptic("success");
			likedStore.toggle(playerCurrentTrack.value);
		}
	}

	// Sleep timer state
	let sleepTimerMinutes = $state<number | null>(null);
	let sleepTimerId: ReturnType<typeof setTimeout> | null = null;

	function cycleSleepTimer() {
		if (sleepTimerId) {
			clearTimeout(sleepTimerId);
			sleepTimerId = null;
		}
		if (sleepTimerMinutes === null) sleepTimerMinutes = 15;
		else if (sleepTimerMinutes === 15) sleepTimerMinutes = 30;
		else if (sleepTimerMinutes === 30) sleepTimerMinutes = 45;
		else if (sleepTimerMinutes === 45) sleepTimerMinutes = 60;
		else sleepTimerMinutes = null;

		if (sleepTimerMinutes !== null) {
			sleepTimerId = setTimeout(() => {
				playerPlaying.value = false;
				sleepTimerMinutes = null;
			}, sleepTimerMinutes * 60 * 1000);
		}
	}

	const isCurrentLiked = $derived(playerCurrentTrack.value ? likedStore.isLiked(playerCurrentTrack.value.id) : false);

	async function handleEnded() {
		if (playerRepeat.value === "one") {
			if (audioEl) {
				audioEl.currentTime = 0;
				audioEl.play().catch(() => {});
			}
		} else if (playerHasNext.value || playerRepeat.value === "all") {
			next();
		} else if (playerAutoRadio.value) {
			const started = await triggerAutoPlayRadio();
			if (!started) {
				playerPlaying.value = false;
			}
		} else {
			playerPlaying.value = false;
		}
	}

	let lastSavedTime = 0;
	let isCrossfadingOut = false;

	function handleTimeUpdate() {
		if (!audioEl || isSeeking) return;
		playerCurrentTime.value = audioEl.currentTime;
		seekInput = audioEl.currentTime;

		const cf = playerCrossfade.value;
		const baseVol = playerMuted.value ? 0 : (playerVolume.value || 1.0);

		// Crossfade out near track completion if next track exists
		if (cf > 0 && audioEl.duration > 15 && (playerHasNext.value || playerRepeat.value === "all") && !isSeeking) {
			const remaining = audioEl.duration - audioEl.currentTime;
			if (remaining <= cf && remaining > 0.4) {
				const ratio = Math.max(0, remaining / cf);
				audioEl.volume = Math.max(0, baseVol * ratio);
			} else if (remaining <= 0.4 && !isCrossfadingOut) {
				isCrossfadingOut = true;
				next();
				setTimeout(() => {
					isCrossfadingOut = false;
				}, 1200);
			}
		} else if (!isCrossfadingOut) {
			audioEl.volume = baseVol;
		}

		if (Math.abs(audioEl.currentTime - lastSavedTime) > 2) {
			lastSavedTime = audioEl.currentTime;
			if (typeof window !== "undefined") {
				try {
					localStorage.setItem("mezzo_player_current_time", String(audioEl.currentTime));
				} catch {}
			}
		}
	}

	function handleLoadedMetadata() {
		if (!audioEl) return;
		playerDuration.value = audioEl.duration;
		if (!hasRestoredInitialPosition && playerCurrentTime.value > 0) {
			hasRestoredInitialPosition = true;
			if (Math.abs(audioEl.currentTime - playerCurrentTime.value) > 0.5) {
				audioEl.currentTime = playerCurrentTime.value;
			}
		} else {
			hasRestoredInitialPosition = true;
		}
	}

	function applyServerFallback() {
		const track = playerCurrentTrack.value;
		if (!audioEl || !track) return;
		const serverFallback = apiUrl(`/api/tracks/${track.id}/stream`);
		if (!isServerStreamSrc(audioEl.src, track.id)) {
			console.warn("Stream error on external URL, falling back to server stream:", audioEl.src);
			const savedTime = audioEl.currentTime || playerCurrentTime.value || 0;
			audioEl.src = serverFallback;
			audioEl.load();
			if (savedTime > 0) {
				audioEl.currentTime = savedTime;
			}
			if (playerPlaying.value) {
				equalizerStore.resumeAudioContext();
				try { audioEl.play(); } catch {}
			}
		}
	}

	function handleAudioError() {
		applyServerFallback();
	}

	let stallTimer: ReturnType<typeof setTimeout> | null = null;

	function watchStall() {
		if (stallTimer) clearTimeout(stallTimer);
		if (!audioEl) return;
		const cleaned = () => {
			if (stallTimer) {
				clearTimeout(stallTimer);
				stallTimer = null;
			}
		};
		audioEl.addEventListener("playing", cleaned, { once: true });
		audioEl.addEventListener("canplay", cleaned, { once: true });
		audioEl.addEventListener("error", cleaned, { once: true });
		stallTimer = setTimeout(() => {
			const track = playerCurrentTrack.value;
			// Only fall back if we got no playback data at all, not mid-song buffer
			if (track && !isServerStreamSrc(audioEl.src, track.id)) {
				console.warn("Stream stalled without data, forcing server re-resolution");
				applyServerFallback();
			} else {
				stallTimer = null;
			}
		}, 12000);
	}

	let currentLoadedSrc = "";

	let playRequestWasFired = false;

	$effect(() => {
		if (!audioEl) return;
		const shouldPlay = playerPlaying.value;
		if (shouldPlay && !playRequestWasFired && currentLoadedSrc) {
			audioEl.muted = playerMuted.value;
			audioEl.volume = playerMuted.value ? 0 : Math.max(0.1, playerVolume.value || 1.0);
			audioEl.play().catch(() => {});
		}
		playRequestWasFired = shouldPlay;
	});

	$effect(() => {
		const track = playerCurrentTrack.value;
		if (track && lastLoadedTrackId && track.id !== lastLoadedTrackId) {
			if (audioEl) {
				audioEl.pause();
				audioEl.currentTime = 0;
			}
			playerCurrentTime.value = 0;
			seekInput = 0;
			hasRestoredInitialPosition = true;
		}
	});

	$effect(() => {
		if (!audioEl) return;
		const track = playerCurrentTrack.value;
		const onlineSrc = playerSrc.value;
		if (!onlineSrc && !track) return;

		let active = true;
		(async () => {
			let finalSrc = onlineSrc;
			if (track && offlineStore.isTrackDownloaded(track.id)) {
				const offlineUrl = await offlineStore.getOfflineAudioUrl(track.id);
				if (offlineUrl && active) {
					finalSrc = offlineUrl;
				}
			}

			// If online stream is a relative endpoint or missing direct URL, resolve direct CDN link
			if (
				active &&
				track &&
				finalSrc &&
				!finalSrc.startsWith("blob:") &&
				(isServerStreamSrc(finalSrc, track.id) || !finalSrc.startsWith("http"))
			) {
				try {
					const res = await fetch(apiUrl(`/api/tracks/${encodeURIComponent(track.id)}/stream?format=json`));
					if (res.ok && active) {
						const data = (await res.json()) as any;
						if (data?.url) {
							finalSrc = data.url;
							track.stream_url = data.url;
							playerSrc.value = data.url;
						}
					}
				} catch (err) {
					console.warn("Direct stream resolution error:", err);
				}
			}

			if (!active || !finalSrc || !audioEl) return;

			// Normalize target URL to prevent relative vs absolute string comparison mismatch
			const targetUrl = finalSrc.startsWith("blob:")
				? finalSrc
				: (typeof window !== "undefined" ? new URL(finalSrc, window.location.href).href : finalSrc);

			if (currentLoadedSrc !== targetUrl) {
				const isSameTrack = track && track.id === lastLoadedTrackId;
				lastLoadedTrackId = track?.id || "";
				currentLoadedSrc = targetUrl;
				audioEl.src = finalSrc;
				audioEl.load();
				watchStall();

				// Restore position ONLY on cold boot of saved session track, NEVER for new songs!
				if (isSameTrack || (!hasRestoredInitialPosition && playerCurrentTime.value > 0)) {
					const targetTime = untrack(() => playerCurrentTime.value);
					if (targetTime > 0) {
						audioEl.currentTime = targetTime;
					}
					hasRestoredInitialPosition = true;
				} else {
					audioEl.currentTime = 0;
					playerCurrentTime.value = 0;
					seekInput = 0;
					hasRestoredInitialPosition = true;
				}

				if (untrack(() => playerPlaying.value)) {
					audioEl.muted = playerMuted.value;
					audioEl.volume = playerMuted.value ? 0 : Math.max(0.1, playerVolume.value || 1.0);
					audioEl.play().catch(() => {});
				}
			}
		})();

		return () => {
			active = false;
		};
	});

	$effect(() => {
		if (typeof window !== "undefined") {
			const onPageUnload = () => {
				if (audioEl) {
					try {
						localStorage.setItem("mezzo_player_current_time", String(audioEl.currentTime));
					} catch {}
				}
			};
			window.addEventListener("pagehide", onPageUnload);
			window.addEventListener("beforeunload", onPageUnload);
			return () => {
				window.removeEventListener("pagehide", onPageUnload);
				window.removeEventListener("beforeunload", onPageUnload);
			};
		}
	});

	$effect(() => {
		if (!audioEl) return;
		audioEl.muted = playerMuted.value;
		audioEl.volume = playerMuted.value ? 0 : Math.max(0.1, playerVolume.value || 1.0);
		if (!playerPlaying.value) {
			audioEl.pause();
		}
	});

	$effect(() => {
		if (!audioEl) return;
		audioEl.addEventListener("ended", handleEnded);
		audioEl.addEventListener("timeupdate", handleTimeUpdate);
		audioEl.addEventListener("loadedmetadata", handleLoadedMetadata);
		const unregisterSeek = registerAudioSeekHandler((t: number) => {
			if (audioEl) {
				audioEl.currentTime = t;
				playerCurrentTime.value = t;
				seekInput = t;
			}
		});
		return () => {
			audioEl?.removeEventListener("ended", handleEnded);
			audioEl?.removeEventListener("timeupdate", handleTimeUpdate);
			audioEl?.removeEventListener("loadedmetadata", handleLoadedMetadata);
			unregisterSeek();
		};
	});

	// OS Media Notification & Hardware Keys
	$effect(() => {
		if (typeof navigator !== "undefined" && "mediaSession" in navigator && playerCurrentTrack.value) {
			const tr = playerCurrentTrack.value;
			const artworkUrl = coverUrl(tr);
			navigator.mediaSession.metadata = new MediaMetadata({
				title: tr.title,
				artist: tr.artist ?? "Unknown Artist",
				album: tr.album ?? "Mezzo Music",
				artwork: [
					{ src: artworkUrl, sizes: "96x96", type: "image/jpeg" },
					{ src: artworkUrl, sizes: "256x256", type: "image/jpeg" },
					{ src: artworkUrl, sizes: "512x512", type: "image/jpeg" }
				]
			});
		}
	});

	$effect(() => {
		if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
			navigator.mediaSession.playbackState = playerPlaying.value ? "playing" : "paused";
		}
	});

	$effect(() => {
		if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
			try {
				navigator.mediaSession.setActionHandler("play", () => {
					playerPlaying.value = true;
				});
				navigator.mediaSession.setActionHandler("pause", () => {
					playerPlaying.value = false;
				});
				navigator.mediaSession.setActionHandler("previoustrack", () => {
					previous();
				});
				navigator.mediaSession.setActionHandler("nexttrack", () => {
					next();
				});
				navigator.mediaSession.setActionHandler("seekto", (details) => {
					if (details.seekTime !== undefined && audioEl) {
						audioEl.currentTime = details.seekTime;
						playerCurrentTime.value = details.seekTime;
					}
				});
			} catch {
				// Ignore unsupported action handler in some browsers
			}
		}
	});

	// Native Android media notification & lock screen controls
	$effect(() => {
		initNativeMediaListeners({
			onPlay: () => { playerPlaying.value = true; },
			onPause: () => { playerPlaying.value = false; },
			onNext: () => { next(); },
			onPrevious: () => { previous(); },
			onSeek: (pos: number) => {
				if (audioEl) {
					audioEl.currentTime = pos;
					playerCurrentTime.value = pos;
					seekInput = pos;
				}
			},
		});
	});

	// Sync native media session state whenever track or playback state changes
	$effect(() => {
		const tr = playerCurrentTrack.value;
		if (!tr) {
			stopNativeMediaSession();
			return;
		}
		const artworkUrl = coverUrl(tr);
		syncNativeMediaSession({
			title: tr.title,
			artist: tr.artist ?? "Unknown Artist",
			album: tr.album ?? "Mezzo Music",
			artwork: artworkUrl,
			isPlaying: playerPlaying.value,
			duration: playerDuration.value || 0,
			position: playerCurrentTime.value || 0,
		});
	});

	function handleSeekInput(e: Event) {
		const val = Number((e.target as HTMLInputElement).value);
		seekInput = val;
	}

	function handleSeekChange() {
		isSeeking = false;
		if (audioEl) {
			audioEl.currentTime = seekInput;
		}
		playerCurrentTime.value = seekInput;
		seek(seekInput);
	}

	function handleSeekStart() {
		isSeeking = true;
	}

	function handleVolumeChange(e: Event) {
		const val = Number((e.target as HTMLInputElement).value);
		playerVolume.value = val;
		if (playerMuted.value && val > 0) {
			playerMuted.value = false;
		}
	}

	let isDownloading = $state(false);

	async function handleShareTrack() {
		const track = playerCurrentTrack.value;
		if (!track) return;
		const res = await shareTrack(track);
		if (res.shared) {
			shareToast = true;
			if (shareToastTimer) clearTimeout(shareToastTimer);
			shareToastTimer = setTimeout(() => {
				shareToast = false;
			}, 2400);
		}
	}

	async function handleDownload() {
		const track = playerCurrentTrack.value;
		if (!track) return;
		const targetUrl = track.stream_url || streamUrl(track);
		if (!targetUrl) return;
		isDownloading = true;
		triggerHaptic("medium");
		try {
			// Save offline into CacheStorage
			await offlineStore.downloadTrack(track).catch(() => {});

			// Try to fetch audio blob
			const res = await fetch(targetUrl);
			if (!res.ok) throw new Error("Blob fetch failed");
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			const safeArtist = (track.artist || "Unknown").replace(/[/\\?%*:|"<>]/g, "");
			const safeTitle = (track.title || "Track").replace(/[/\\?%*:|"<>]/g, "");
			a.download = `${safeArtist} - ${safeTitle}.m4a`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			setTimeout(() => URL.revokeObjectURL(url), 2000);
			triggerHaptic("success");
		} catch {
			// Fallback direct link
			const a = document.createElement("a");
			a.href = targetUrl;
			a.target = "_blank";
			const safeArtist = (track.artist || "Unknown").replace(/[/\\?%*:|"<>]/g, "");
			const safeTitle = (track.title || "Track").replace(/[/\\?%*:|"<>]/g, "");
			a.download = `${safeArtist} - ${safeTitle}.m4a`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		} finally {
			isDownloading = false;
		}
	}

	// Global audio keyboard shortcuts
	function handleGlobalKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement | null;
		const activeEl = typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null;
		const isInputFocused =
			["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName?.toUpperCase() || "") ||
			["INPUT", "TEXTAREA", "SELECT"].includes(activeEl?.tagName?.toUpperCase() || "") ||
			Boolean(target?.isContentEditable) ||
			Boolean(activeEl?.isContentEditable) ||
			Boolean(target?.closest?.("input, textarea, select, [contenteditable]")) ||
			Boolean(activeEl?.closest?.("input, textarea, select, [contenteditable]"));

		if (isInputFocused) {
			return;
		}

		if (e.code === "Space") {
			e.preventDefault();
			togglePlay();
		} else if ((e.code === "ArrowRight" && e.shiftKey) || (e.code === "ArrowRight" && (e.ctrlKey || e.metaKey))) {
			e.preventDefault();
			next();
		} else if ((e.code === "ArrowLeft" && e.shiftKey) || (e.code === "ArrowLeft" && (e.ctrlKey || e.metaKey))) {
			e.preventDefault();
			previous();
		} else if (e.code === "ArrowRight") {
			e.preventDefault();
			seek(Math.min(playerDuration.value, playerCurrentTime.value + 5));
		} else if (e.code === "ArrowLeft") {
			e.preventDefault();
			seek(Math.max(0, playerCurrentTime.value - 5));
		} else if (e.code === "ArrowUp") {
			e.preventDefault();
			playerVolume.value = Math.min(1, playerVolume.value + 0.1);
		} else if (e.code === "ArrowDown") {
			e.preventDefault();
			playerVolume.value = Math.max(0, playerVolume.value - 0.1);
		} else if (e.code === "KeyM") {
			toggleMute();
		} else if (e.code === "KeyL") {
			e.preventDefault();
			playerShowLyrics.value = !playerShowLyrics.value;
		} else if (e.code === "KeyF") {
			e.preventDefault();
			playerShowLyrics.value = !playerShowLyrics.value;
		} else if (e.code === "KeyE") {
			e.preventDefault();
			equalizerStore.toggle();
		} else if (e.code === "KeyQ") {
			e.preventDefault();
			playerShowQueue.value = !playerShowQueue.value;
		} else if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
			e.preventDefault();
			playerShowShortcuts.value = !playerShowShortcuts.value;
		}
	}
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<audio
	bind:this={audioEl}
	preload="auto"
	crossOrigin="anonymous"
	onerror={handleAudioError}
></audio>

<footer
	class="now-playing-bar visible"
	aria-label="Audio Player"
>
	<!-- Spotify Mini Progress Line at Bottom of Floating Player -->
	<div
		class="mini-bottom-progress"
		style={`--progress-pct: ${playerDuration.value > 0 ? (playerCurrentTime.value / playerDuration.value) * 100 : 0}%`}
	></div>

	<!-- Left: Track Details -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="track-info" title="Expand Now Playing & Lyrics" onclick={() => (playerShowLyrics.value = true)}>
		{#if playerCurrentTrack.value}
			<div class="cover-wrapper">
				<img
					src={coverUrl(playerCurrentTrack.value) || DEFAULT_ALBUM_COVER}
					alt={playerCurrentTrack.value.title}
					onerror={handleImageError}
					class="cover"
				/>
			</div>

			<div class="details">
				<div class="title-line">
					<span class="title" title={playerCurrentTrack.value.title}>{playerCurrentTrack.value.title}</span>
				</div>
				<div class="album" title={playerCurrentTrack.value.album || playerCurrentTrack.value.title}>
					{playerCurrentTrack.value.album || `${playerCurrentTrack.value.title} - Single`}
				</div>
				<div class="artist" title={playerCurrentTrack.value.artist ?? "Unknown Artist"}>
					{playerCurrentTrack.value.artist ?? "Unknown Artist"}
				</div>
			</div>

			<!-- Desktop Like Button beside Track Details -->
			<button
				class="action-icon-btn track-like-btn desktop-only"
				class:liked={isCurrentLiked}
				onclick={handleToggleLike}
				aria-label={isCurrentLiked ? "Unlike track" : "Like track"}
				title={isCurrentLiked ? "Remove from Liked Songs" : "Save to Liked Songs"}
			>
				{#if isCurrentLiked}
					<svg viewBox="0 0 24 24" width="18" height="18" fill="#1ed760">
						<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
					</svg>
				{/if}
			</button>
		{:else}
			<div class="cover-wrapper">
				<img
					src={DEFAULT_ALBUM_COVER}
					alt="Mezzo Music"
					class="cover"
				/>
			</div>

			<div class="details">
				<div class="title">Select a song</div>
				<div class="album">Mezzo Music Stream</div>
				<div class="artist">Choose any song to begin</div>
			</div>
		{/if}
	</div>

	<!-- Center: Player Controls (Row 1 Buttons, Row 2 Progress) -->
	<div class="player-controls desktop-only">
		<!-- Buttons row (Top - Spotify standard) -->
		<div class="buttons">
			<button
				class="ctrl-icon-btn"
				class:active={playerShuffle.value}
				onclick={onToggleShuffle}
				aria-label="Shuffle"
				title="Shuffle"
			>
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
					<polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" />
				</svg>
			</button>

			<button
				class="ctrl-icon-btn"
				disabled={!playerHasPrevious.value}
				onclick={onPrevious}
				aria-label="Previous track"
				title="Previous (Shift+←)"
			>
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="4" y1="19" x2="4" y2="5" /><polyline points="20 5 10 12 20 19" />
				</svg>
			</button>

			<button
				class="play-pause-btn"
				onclick={onTogglePlay}
				aria-label={playerPlaying.value ? "Pause" : "Play"}
				title={playerPlaying.value ? "Pause (Space)" : "Play (Space)"}
			>
				{#if playerPlaying.value}
					<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
						<rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="transform: translateX(1px)">
						<polygon points="6 4 20 12 6 20 6 4" />
					</svg>
				{/if}
			</button>

			<button
				class="ctrl-icon-btn"
				disabled={!playerHasNext.value}
				onclick={onNext}
				aria-label="Next track"
				title="Next (Shift+→)"
			>
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="20" y1="5" x2="20" y2="19" /><polyline points="4 5 14 12 4 19" />
				</svg>
			</button>

			<button
				class="ctrl-icon-btn"
				class:active={playerRepeat.value !== "off"}
				onclick={onToggleRepeat}
				aria-label={`Repeat mode: ${playerRepeat.value}`}
				title={`Repeat: ${playerRepeat.value}`}
			>
				{#if playerRepeat.value === "one"}
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
						<text x="12" y="15" font-size="8" font-weight="900" fill="currentColor" text-anchor="middle">1</text>
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
					</svg>
				{/if}
			</button>
		</div>

		<!-- Progress row (Bottom - Spotify standard) -->
		<div class="progress-container">
			<span id="current-time">{formatDuration(playerCurrentTime.value)}</span>
			<div class="progress-bar-wrap">
				<input
					type="range"
					class="progress-slider"
					min="0"
					max={playerDuration.value || 0}
					step="0.1"
					value={seekInput}
					oninput={handleSeekInput}
					onchange={handleSeekChange}
					onmousedown={handleSeekStart}
					onmouseup={handleSeekChange}
					ontouchstart={handleSeekStart}
					ontouchend={handleSeekChange}
					aria-label="Playback position"
					style={`--progress-pct: ${playerDuration.value > 0 ? (seekInput / playerDuration.value) * 100 : 0}%`}
				/>
			</div>
			<span id="total-duration">{formatDuration(playerDuration.value)}</span>
		</div>
	</div>

	<!-- Right: Actions & Volume Controls -->
	<div class="volume-controls">
		<!-- Mobile-only Spotify-style quick action buttons -->
		<div class="mobile-controls-cluster mobile-only">
			<!-- Like / Heart Button -->
			<button
				class="mobile-icon-btn mobile-like-btn"
				class:liked={isCurrentLiked}
				onclick={handleToggleLike}
				aria-label={isCurrentLiked ? "Unlike track" : "Like track"}
				title={isCurrentLiked ? "Remove from Liked Songs" : "Save to Liked Songs"}
			>
				{#if isCurrentLiked}
					<svg viewBox="0 0 24 24" width="20" height="20" fill="#1ed760">
						<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
					</svg>
				{/if}
			</button>

			<!-- Mobile Download / Save Offline Button -->
			<button
				class="mobile-icon-btn mobile-download-btn"
				disabled={!playerCurrentTrack.value || isDownloading}
				onclick={(e) => { e.stopPropagation(); handleDownload(); }}
				title={isDownloading ? "Downloading..." : (playerCurrentTrack.value && offlineStore.isTrackDownloaded(playerCurrentTrack.value.id) ? "Saved Offline" : "Save Offline / Download")}
				aria-label="Download Track"
			>
				{#if isDownloading}
					<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" class="mini-spin">
						<circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
						<path d="M12 2a10 10 0 0 1 10 10" />
					</svg>
				{:else if playerCurrentTrack.value && offlineStore.isTrackDownloaded(playerCurrentTrack.value.id)}
					<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#1ed760" stroke-width="2.5">
						<path d="M20 6L9 17l-5-5" />
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
					</svg>
				{/if}
			</button>

			<!-- Previous Track Button -->
			<button
				class="mobile-icon-btn mobile-prev-btn"
				disabled={!playerHasPrevious.value}
				onclick={(e) => { e.stopPropagation(); onPrevious(); }}
				aria-label="Previous track"
				title="Previous track"
			>
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2">
					<line x1="5" y1="19" x2="5" y2="5" /><polyline points="19 5 9 12 19 19" />
				</svg>
			</button>

			<!-- Spotify Circular White Play/Pause Button -->
			<button
				class="mobile-play-btn"
				onclick={(e) => { e.stopPropagation(); onTogglePlay(); }}
				aria-label={playerPlaying.value ? "Pause" : "Play"}
				title={playerPlaying.value ? "Pause" : "Play"}
			>
				{#if playerPlaying.value}
					<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
						<rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="transform: translateX(1px)">
						<polygon points="6 4 20 12 6 20 6 4" />
					</svg>
				{/if}
			</button>

			<!-- Next Track Button -->
			<button
				class="mobile-icon-btn mobile-next-btn"
				disabled={!playerHasNext.value}
				onclick={(e) => { e.stopPropagation(); onNext(); }}
				aria-label="Next track"
				title="Next track"
			>
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2">
					<line x1="19" y1="5" x2="19" y2="19" /><polyline points="5 5 15 12 5 19" />
				</svg>
			</button>
		</div>

		<!-- Desktop Action buttons (Single row, clean and uncrowded) -->
		<button
			class="action-icon-btn desktop-only"
			class:active={playerShowLyrics.value}
			onclick={(e) => { e.stopPropagation(); playerShowLyrics.value = !playerShowLyrics.value; }}
			title="Lyrics (L)"
			aria-label="Lyrics"
		>
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
				<path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
			</svg>
		</button>

		<button
			class="action-icon-btn desktop-only"
			class:active={playerShowQueue.value}
			onclick={(e) => { e.stopPropagation(); playerShowQueue.value = !playerShowQueue.value; }}
			title="Queue (Q)"
			aria-label="Queue"
		>
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
				<line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
			</svg>
			{#if playerQueue.value.length > 0}
				<span class="queue-dot">{playerQueue.value.length}</span>
			{/if}
		</button>

		<button
			class="action-icon-btn desktop-only"
			disabled={!playerCurrentTrack.value}
			onclick={(e) => { e.stopPropagation(); showPlaylistModal = true; }}
			title="Add to Playlist"
			aria-label="Add to Playlist"
		>
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="16" y2="18" />
				<line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
				<line x1="19" y1="16" x2="19" y2="22" /><line x1="16" y1="19" x2="22" y2="19" />
			</svg>
		</button>

		<button
			class="action-icon-btn desktop-only"
			disabled={!playerCurrentTrack.value || isDownloading}
			onclick={(e) => { e.stopPropagation(); handleDownload(); }}
			title={isDownloading ? "Downloading..." : (playerCurrentTrack.value && offlineStore.isTrackDownloaded(playerCurrentTrack.value.id) ? "Saved Offline" : "Save Offline / Download")}
			aria-label="Download Track"
		>
			{#if isDownloading}
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" class="mini-spin">
					<circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
					<path d="M12 2a10 10 0 0 1 10 10" />
				</svg>
			{:else if playerCurrentTrack.value && offlineStore.isTrackDownloaded(playerCurrentTrack.value.id)}
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#1ed760" stroke-width="2.5">
					<path d="M20 6L9 17l-5-5" />
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
				</svg>
			{/if}
		</button>

		<button
			class="action-icon-btn desktop-only"
			disabled={!playerCurrentTrack.value}
			onclick={(e) => { e.stopPropagation(); handleShareTrack(); }}
			title="Share Track"
			aria-label="Share Track"
		>
			<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
				<line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
			</svg>
		</button>

		<button
			class="action-icon-btn desktop-only sleep-timer-btn"
			class:active={sleepTimerMinutes !== null}
			onclick={cycleSleepTimer}
			title={sleepTimerMinutes ? `Sleep timer: ${sleepTimerMinutes}m active` : "Set Sleep Timer"}
			aria-label="Sleep Timer"
		>
			<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
			</svg>
			{#if sleepTimerMinutes}
				<span class="sleep-badge">{sleepTimerMinutes}m</span>
			{/if}
		</button>

		<button
			class="action-icon-btn desktop-only"
			class:active={equalizerStore.isOpen || (equalizerStore.enabled && equalizerStore.currentPreset !== "Flat")}
			onclick={(e) => { e.stopPropagation(); equalizerStore.toggle(); }}
			title="Audio Equalizer (E)"
			aria-label="Audio Equalizer"
		>
			<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
				<line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
				<line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
				<line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
			</svg>
		</button>

		<button
			class="action-icon-btn desktop-only"
			onclick={(e) => { e.stopPropagation(); playerShowLyrics.value = true; }}
			title="Full Screen Mode (F)"
			aria-label="Full Screen Mode"
		>
			<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
			</svg>
		</button>

		<!-- Desktop Volume Controls -->
		<div class="volume-slider-row desktop-only">
			<button class="vol-btn" onclick={toggleMute} aria-label={playerMuted.value ? "Unmute" : "Mute"} title={playerMuted.value ? "Unmute (M)" : "Mute (M)"}>
				{#if playerMuted.value || playerVolume.value === 0}
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
						<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
					</svg>
				{:else if playerVolume.value < 0.5}
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
						<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
						<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
					</svg>
				{/if}
			</button>

			<div class="volume-slider-wrap">
				<input
					type="range"
					class="volume-slider"
					min="0"
					max="1"
					step="0.01"
					value={playerMuted.value ? 0 : playerVolume.value}
					oninput={handleVolumeChange}
					aria-label="Volume level"
					style={`--vol-pct: ${(playerMuted.value ? 0 : playerVolume.value) * 100}%`}
				/>
			</div>
		</div>

		{#if shareToast}
			<div class="player-share-toast">
				<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#1ed760" stroke-width="2.5">
					<polyline points="20 6 9 17 4 12" />
				</svg>
				<span>Track link ready to share!</span>
			</div>
		{/if}
	</div>
</footer>

<!-- Modals & Drawers -->
<QueueDrawer />
<ShortcutsModal />
{#if playerCurrentTrack.value}
	<AddToPlaylistModal bind:open={showPlaylistModal} track={playerCurrentTrack.value} />
{/if}

<style lang="scss">
	.now-playing-bar {
		flex-shrink: 0;
		width: 100%;
		height: 5.5rem;
		background: rgba(13, 14, 18, 0.88);
		backdrop-filter: blur(28px) saturate(190%);
		-webkit-backdrop-filter: blur(28px) saturate(190%);
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		display: grid;
		grid-template-columns: minmax(190px, 1.1fr) minmax(280px, 2fr) minmax(190px, 1.1fr);
		align-items: center;
		padding: 0 1.5rem;
		gap: 1rem;
		z-index: 2100;
		user-select: none;
		position: relative;
		box-sizing: border-box;
		box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);

		button, .ctrl-icon-btn, .action-icon-btn, .mobile-icon-btn, .play-pause-btn {
			-webkit-tap-highlight-color: transparent;
			&:active {
				transform: scale(0.92) !important;
				transition: transform 0.1s cubic-bezier(0.25, 1, 0.5, 1);
			}
		}

		.player-share-toast {
			position: absolute;
			top: -3.2rem;
			right: 2rem;
			display: flex;
			align-items: center;
			gap: 0.5rem;
			background: rgba(18, 22, 32, 0.95);
			border: 1px solid rgba(30, 215, 96, 0.4);
			color: #86efac;
			padding: 0.5rem 1rem;
			border-radius: 9999px;
			font-size: 0.82rem;
			font-weight: 500;
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
			animation: fadeIn 200ms ease;
			z-index: 2200;
			pointer-events: none;
		}

		.mini-bottom-progress {
			position: absolute;
			bottom: 0;
			left: 8px;
			right: 8px;
			height: 2.5px;
			background: rgba(255, 255, 255, 0.12);
			border-radius: 999px;
			overflow: hidden;
			pointer-events: none;

			&::after {
				content: "";
				display: block;
				height: 100%;
				width: var(--progress-pct, 0%);
				background: #ffffff;
				border-radius: 999px;
				transition: width 0.15s linear;
			}
		}

		.mobile-only {
			display: none;
		}

		@media screen and (min-width: 1025px) and (max-width: 1280px) {
			.sleep-timer-btn {
				display: none !important;
			}
			.action-icon-btn[aria-label="Download Track"] {
				display: none !important;
			}
		}

		@media screen and (min-width: 1025px) and (max-width: 1140px) {
			.action-icon-btn[aria-label="Add to Playlist"] {
				display: none !important;
			}
			.volume-slider-wrap .volume-slider {
				width: 60px !important;
			}
		}

		@media screen and (max-width: 1024px) {
			position: fixed !important;
			bottom: calc(3.1rem + env(safe-area-inset-bottom) + 6px) !important;
			left: 10px !important;
			right: 10px !important;
			transform: none !important;
			width: auto !important;
			display: flex !important;
			align-items: center !important;
			justify-content: space-between !important;
			padding: 0.4rem 0.75rem !important;
			height: 3.45rem !important;
			border-radius: 14px !important;
			background: rgba(22, 23, 29, 0.88) !important;
			backdrop-filter: blur(32px) saturate(190%) !important;
			-webkit-backdrop-filter: blur(32px) saturate(190%) !important;
			border: 1px solid rgba(255, 255, 255, 0.12) !important;
			box-shadow: 0 12px 32px rgba(0, 0, 0, 0.7), 0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
			z-index: 2150 !important;

			.mini-bottom-progress {
				left: 6px;
				right: 6px;
				bottom: 0;
			}

			.player-controls {
				display: none !important;
			}

			.desktop-only {
				display: none !important;
			}

			.volume-slider-row {
				display: none !important;
			}

			.mobile-only {
				display: flex !important;
			}

			.track-info {
				gap: 0.65rem;
				padding: 0;
				min-width: 0;
				flex: 1;

				.cover-wrapper {
					width: 42px;
					height: 42px;
					border-radius: 6px;
					box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
				}

				.details {
					flex: 1;
					min-width: 0;

					.album {
						display: none !important;
					}


					.title {
						font-size: 0.86rem;
						font-weight: 700;
					}

					.artist {
						font-size: 0.72rem;
						color: #a7a7a7;
					}
				}
			}

			.mobile-controls-cluster {
				display: flex !important;
				align-items: center;
				gap: 0.35rem;
				flex-shrink: 0;

				.mobile-icon-btn {
					background: transparent;
					border: none;
					color: rgba(255, 255, 255, 0.75);
					width: 32px;
					height: 32px;
					display: flex;
					align-items: center;
					justify-content: center;
					cursor: pointer;
					padding: 0;
					border-radius: 50%;
					transition: color 150ms ease, transform 120ms ease;

					&:hover {
						color: #ffffff;
					}

					&:active {
						transform: scale(0.9);
					}

					&:disabled {
						opacity: 0.25;
						cursor: default;
					}

					&.liked svg {
						fill: #1ed760;
					}
				}

				.mobile-play-btn {
					width: 36px;
					height: 36px;
					border-radius: 50%;
					background: #ffffff;
					color: #000000;
					border: none;
					display: flex;
					align-items: center;
					justify-content: center;
					cursor: pointer;
					flex-shrink: 0;
					box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
					transition: transform 140ms cubic-bezier(0.2, 1, 0.3, 1), background-color 140ms ease;

					&:hover {
						background: #f0f0f0;
						transform: scale(1.06);
					}

					&:active {
						transform: scale(0.93);
					}
				}

				@media screen and (max-width: 380px) {
					gap: 0.15rem;

					.mobile-prev-btn {
						display: none !important;
					}
				}
			}
		}
	}

	/* Left: Track Information */
	.track-info {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		min-width: 0;
		cursor: pointer;

		.cover-wrapper {
			width: 52px;
			height: 52px;
			border-radius: 6px;
			overflow: hidden;
			flex-shrink: 0;
			background: #191c24;
			border: 1px solid rgba(255, 255, 255, 0.08);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);

			.cover {
				width: 100%;
				height: 100%;
				object-fit: cover;
				display: block;
			}
		}

		.details {
			display: flex;
			flex-direction: column;
			gap: 0.15rem;
			min-width: 0;

			.title-line {
				display: flex;
				align-items: center;
				gap: 0.5rem;
				min-width: 0;


			}

			.title {
				font-size: 0.88rem;
				font-weight: 700;
				color: #ffffff;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.artist {
				font-size: 0.74rem;
				color: rgba(255, 255, 255, 0.5);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}

		.track-like-btn {
			margin-left: 0.4rem;
			flex-shrink: 0;
		}
	}

	/* Center: Player Controls */
	.player-controls {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		width: 100%;
		max-width: 600px;
		margin: 0 auto;

		@media screen and (max-width: 1024px) {
			display: none !important;
		}

		/* Row 1: Control Buttons (Top - Spotify standard) */
		.buttons {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 1.1rem;

			.ctrl-icon-btn {
				background: transparent;
				border: none;
				color: rgba(255, 255, 255, 0.65);
				width: 32px;
				height: 32px;
				border-radius: 50%;
				cursor: pointer;
				display: flex;
				align-items: center;
				justify-content: center;
				transition: all 0.15s ease;

				&:hover:not(:disabled) {
					color: #ffffff;
					background: rgba(255, 255, 255, 0.1);
					transform: scale(1.1);
				}

				&.active {
					color: #1ed760;
				}

				&:disabled {
					opacity: 0.25;
					cursor: default;
				}
			}

			.play-pause-btn {
				width: 38px;
				height: 38px;
				border-radius: 50%;
				background: #ffffff;
				color: #000000;
				border: none;
				cursor: pointer;
				display: flex;
				align-items: center;
				justify-content: center;
				box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
				transition: all 0.18s cubic-bezier(0.2, 1, 0.3, 1);

				&:hover {
					transform: scale(1.08);
					background: #f0f0f0;
				}

				&:active {
					transform: scale(0.95);
				}
			}
		}

		/* Row 2: Progress (Bottom - Spotify standard) */
		.progress-container {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			width: 100%;
			color: rgba(255, 255, 255, 0.5);
			font-size: 0.74rem;
			font-variant-numeric: tabular-nums;

			span {
				min-width: 32px;
				flex-shrink: 0;
			}

			#current-time {
				text-align: right;
			}

			.progress-bar-wrap {
				flex: 1;
				display: flex;
				align-items: center;
			}

			.progress-slider {
				-webkit-appearance: none;
				appearance: none;
				width: 100%;
				height: 4px;
				border-radius: 999px;
				background: linear-gradient(
					to right,
					#ffffff 0%,
					#ffffff var(--progress-pct, 0%),
					rgba(255, 255, 255, 0.2) var(--progress-pct, 0%),
					rgba(255, 255, 255, 0.2) 100%
				);
				outline: none;
				cursor: pointer;
				transition: height 0.15s ease;

				&:hover {
					height: 6px;
					background: linear-gradient(
						to right,
						#1ed760 0%,
						#1ed760 var(--progress-pct, 0%),
						rgba(255, 255, 255, 0.3) var(--progress-pct, 0%),
						rgba(255, 255, 255, 0.3) 100%
					);

					&::-webkit-slider-thumb {
						opacity: 1;
						transform: scale(1.1);
					}
				}

				&::-webkit-slider-thumb {
					-webkit-appearance: none;
					appearance: none;
					width: 12px;
					height: 12px;
					border-radius: 50%;
					background: #ffffff;
					box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
					opacity: 0;
					transition: all 0.15s ease;
				}
			}
		}
	}

	/* Right: Volume & Actions (Single row on desktop) */
	.volume-controls {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.65rem;

		.action-icon-btn {
			position: relative;
			background: transparent;
			border: none;
			color: rgba(255, 255, 255, 0.6);
			width: 32px;
			height: 32px;
			border-radius: 6px;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.15s ease;

			&:hover:not(:disabled) {
				color: #ffffff;
				background: rgba(255, 255, 255, 0.1);
			}

			&.active {
				color: #1ed760;
			}

			&:disabled {
				opacity: 0.3;
				cursor: not-allowed;
			}

			.queue-dot {
				position: absolute;
				top: -2px;
				right: -2px;
				font-size: 0.62rem;
				font-weight: 800;
				background: #1ed760;
				color: #000;
				padding: 0.05rem 0.3rem;
				border-radius: 999px;
			}

			.sleep-badge {
				position: absolute;
				bottom: -3px;
				right: -5px;
				font-size: 0.58rem;
				font-weight: 800;
				background: #1ed760;
				color: #000;
				padding: 0.05rem 0.25rem;
				border-radius: 4px;
			}
		}

		.volume-slider-row {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			margin-left: 0.25rem;
		}

		.vol-btn {
			background: transparent;
			border: none;
			color: rgba(255, 255, 255, 0.6);
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 50%;
			transition: color 0.15s ease;

			&:hover {
				color: #ffffff;
			}
		}

		.volume-slider-wrap {
			display: flex;
			align-items: center;
		}

		.volume-slider {
			-webkit-appearance: none;
			appearance: none;
			width: 90px;
			height: 4px;
			border-radius: 999px;
			background: linear-gradient(
				to right,
				#ffffff 0%,
				#ffffff var(--vol-pct, 100%),
				rgba(255, 255, 255, 0.2) var(--vol-pct, 100%),
				rgba(255, 255, 255, 0.2) 100%
			);
			outline: none;
			cursor: pointer;
			transition: height 0.15s ease;

			&:hover {
				height: 5px;
				background: linear-gradient(
					to right,
					#1ed760 0%,
					#1ed760 var(--vol-pct, 100%),
					rgba(255, 255, 255, 0.3) var(--vol-pct, 100%),
					rgba(255, 255, 255, 0.3) 100%
				);
			}

			&::-webkit-slider-thumb {
				-webkit-appearance: none;
				appearance: none;
				width: 10px;
				height: 10px;
				border-radius: 50%;
				background: #ffffff;
				box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
			}
		}

		.mini-spin {
			width: 14px;
			height: 14px;
			border: 2px solid rgba(255, 255, 255, 0.25);
			border-top-color: #1ed760;
			border-radius: 50%;
			animation: spin 0.8s linear infinite;
		}
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
